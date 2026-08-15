/**
 * snice-command-palette matrix — the public API and event cross.
 *
 * Doc "Methods" lists eight entry points and doc "Events" five events. Both
 * lists are crossed here rather than spot-checked because they SHARE ONE
 * implementation path: every activation route (click, Enter, `executeCommand`)
 * funnels into the same select-then-close sequence, so the matrix asks the same
 * question of each route — same events, same order, same detail shape, same
 * resulting open state — and a route that quietly skips a step is named by the
 * route, not by a generic "an event was missing".
 *
 *   activation route {click, Enter, executeCommand()}
 *     x command kind {plain, sync action, async action, disabled}
 *   = 12 combos, plus the mutation and search-event contracts.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, expectPaletteMatches, expectClosed, typeSearch, press, clickItem,
  captureEvents, itemEls, renderedLabels, inputEl, part, text,
  clearRecent, CANONICAL, wait, SETTLE,
  type CommandItem, type SniceCommandPaletteElement,
} from './matrix-utils';

type Route = 'click' | 'enter' | 'api';
type Kind = 'plain' | 'sync' | 'async' | 'disabled';

const ROUTES: Route[] = ['click', 'enter', 'api'];
const KINDS: Kind[] = ['plain', 'sync', 'async', 'disabled'];

function commandOfKind(kind: Kind, ran: string[]): CommandItem {
  const base: CommandItem = { id: 'target', label: 'Target Command' };
  if (kind === 'sync') base.action = () => { ran.push('sync'); };
  if (kind === 'async') base.action = async () => { ran.push('async'); };
  if (kind === 'disabled') { base.disabled = true; base.action = () => { ran.push('never'); }; }
  return base;
}

describe('snice-command-palette matrix: activation routes', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const route of ROUTES) {
    for (const kind of KINDS) {
      it(`activation via ${route} on a ${kind} command`, async () => {
        const ran: string[] = [];
        const commands = [commandOfKind(kind, ran)];
        el = await makePalette({ open: true, commands, showRecentCommands: false });
        const seen = captureEvents(el, ['command-execute', 'command-palette-close']);

        if (route === 'click') await clickItem(el, 0);
        if (route === 'enter') await press(el, 'Enter');
        if (route === 'api') { el.executeCommand('target'); await wait(SETTLE); }
        // An async action resolves a microtask later; the documented contract is
        // that `command-execute` waits for it.
        await wait(SETTLE);

        const problems: string[] = [];
        if (kind === 'disabled') {
          // Doc CommandItem `disabled?: boolean`: a disabled command is inert on
          // EVERY route, and the palette stays open.
          if (ran.length) problems.push(`disabled command ran its action (${ran})`);
          if (seen.length) problems.push(`disabled command emitted ${seen.map(e => e.type)}`);
          if (el.open !== true) problems.push('disabled activation closed the palette');
        } else {
          // Doc Events: `command-execute -> { command, palette }`, then the
          // palette closes (`command-palette-close`).
          const executes = seen.filter(event => event.type === 'command-execute');
          if (executes.length !== 1) {
            problems.push(`${executes.length} command-execute events, expected 1`);
          } else {
            if (executes[0].detail.command?.id !== 'target') {
              problems.push(`command-execute carried "${executes[0].detail.command?.id}"`);
            }
            if (executes[0].detail.palette !== el) {
              problems.push('command-execute detail.palette is not the palette');
            }
          }
          if (kind !== 'plain' && ran.length !== 1) {
            problems.push(`action ran ${ran.length} times (${ran})`);
          }
          if (!seen.some(event => event.type === 'command-palette-close')) {
            problems.push('activation emitted no command-palette-close');
          }
          if (el.open !== false) problems.push('palette stayed open after activation');
        }

        expect(problems, `${route}/${kind}`).toEqual([]);
      });
    }
  }
});

describe('snice-command-palette matrix: open/close events', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc Events: `command-palette-open` / `command-palette-close`, each carrying
  // `{ palette }`. They mark TRANSITIONS, so a redundant assignment emits
  // nothing.
  it('emits open/close once per transition and never for a no-op', async () => {
    el = await makePalette({ commands: CANONICAL, showRecentCommands: false });
    const seen = captureEvents(el, ['command-palette-open', 'command-palette-close']);

    el.show(); await wait(SETTLE);
    el.show(); await wait(SETTLE);      // already open — a no-op
    el.close(); await wait(SETTLE);
    el.close(); await wait(SETTLE);     // already closed — a no-op
    el.toggle(); await wait(SETTLE);

    expect(seen.map(event => event.type)).toEqual([
      'command-palette-open', 'command-palette-close', 'command-palette-open',
    ]);
    expect(seen.every(event => event.detail.palette === el)).toBe(true);
  });

  // Doc Methods `close()`, and the overlay shape of the component: clicking the
  // backdrop dismisses the palette. Clicking INSIDE the container must not.
  it('a backdrop click closes; a container click does not', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const container = part(el, 'container')!;
    container.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.open, 'a click inside the container closed the palette').toBe(true);

    const backdrop = el.shadowRoot!.querySelector('.command-palette__backdrop') as HTMLElement;
    expect(backdrop, 'open palette rendered no backdrop').not.toBeNull();
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);
    expect(el.open).toBe(false);
    expectClosed(el);
  });

  // Doc `@watch('open')`-side contract: closing resets the search, so the next
  // open starts from the documented default state rather than the last query.
  it('closing clears the query so the next open starts fresh', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, 'Save');
    expect(renderedLabels(el)).toEqual(['Save']);

    el.close(); await wait(SETTLE);
    el.show(); await wait(SETTLE);

    expect(inputEl(el)!.value).toBe('');
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });
});

describe('snice-command-palette matrix: list mutation and search API', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc Methods: `addCommand(command)` / `removeCommand(id)`.
  it('addCommand and removeCommand re-render the list immediately', async () => {
    const start: CommandItem[] = [{ id: 'a', label: 'Alpha' }];
    el = await makePalette({ open: true, commands: start, showRecentCommands: false });
    expect(renderedLabels(el)).toEqual(['Alpha']);

    el.addCommand({ id: 'b', label: 'Beta' });
    await wait(SETTLE);
    expect(renderedLabels(el)).toEqual(['Alpha', 'Beta']);

    el.removeCommand('a');
    await wait(SETTLE);
    expect(renderedLabels(el)).toEqual(['Beta']);

    // Removing the last command falls back to the documented empty state.
    el.removeCommand('b');
    await wait(SETTLE);
    expectPaletteMatches(el, { commands: [], query: '' });
  });

  // Doc Methods: `executeCommand(id)`. An id that is not in the list is not a
  // command, so nothing runs and nothing is emitted.
  it('executeCommand with an unknown id is inert', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const seen = captureEvents(el, ['command-execute', 'command-palette-close']);
    el.executeCommand('does-not-exist');
    await wait(SETTLE);
    expect(seen).toEqual([]);
    expect(el.open).toBe(true);
  });

  // Doc Methods: `clearSearch()` - "Clear search input". Both the input's own
  // value and the filtered list must return to the no-query state.
  it('clearSearch resets the input and the results', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, 'Save');
    expect(renderedLabels(el)).toEqual(['Save']);

    el.clearSearch();
    await wait(SETTLE);

    expect(inputEl(el)!.value).toBe('');
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });

  // Doc Events: `command-search -> { query, results, palette }`. The detail must
  // describe the search that just happened — the query as typed and the exact
  // result list that is now rendered.
  it('command-search carries the query and the rendered result set', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const seen = captureEvents(el, ['command-search']);

    await typeSearch(el, 'preferences');

    const last = seen[seen.length - 1];
    expect(last, 'typing emitted no command-search').toBeDefined();
    expect(last.detail.query).toBe('preferences');
    expect(last.detail.results.map((command: CommandItem) => command.id))
      .toEqual(['theme', 'keys']);
    expect(last.detail.results.map((command: CommandItem) => command.label))
      .toEqual(renderedLabels(el));
    expect(last.detail.palette).toBe(el);
  });

  // Doc Methods: `focus()` - "Focus search input". The palette overrides
  // HTMLElement.focus, so focusing the host must land on the input rather than
  // the host itself.
  it('focus() moves focus into the search input', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    el.focus();
    await wait(SETTLE);
    const active = el.shadowRoot!.activeElement ?? document.activeElement;
    expect(active === inputEl(el) || el.contains(active as Node),
      `focus() left focus on <${(active as Element)?.tagName?.toLowerCase()}>`).toBe(true);
  });

  // Doc CSS parts: `empty` is the "Empty state message". It must not linger
  // once a search starts matching again.
  it('the empty state appears and disappears with the result count', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    expect(part(el, 'empty')).toBeNull();
    await typeSearch(el, 'zzzz');
    expect(text(part(el, 'empty'))).toBe('No results found');
    await typeSearch(el, 'Save');
    expect(part(el, 'empty')).toBeNull();
    expect(itemEls(el)).toHaveLength(1);
  });
});
