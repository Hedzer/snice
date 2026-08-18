/**
 * snice-command-palette matrix — the KEYBOARD cross.
 *
 * Doc "Keyboard Navigation":
 *   Cmd+K / Ctrl+K  toggle the palette
 *   Escape          close it
 *   ArrowUp/Down    navigate commands
 *   Enter           execute the active command
 *
 * The cross is list length x key sequence, because navigation is CLAMPED at
 * both ends and clamping is a length-dependent arithmetic:
 *
 *   length {1, 3, 7}  x  sequence {∅, ↓, ↓↓, ↓↓↓↓↓↓↓↓↓↓, ↑, ↓↑, ↓↓↑}  = 21
 *
 * A one-item list is included deliberately: it is the length where `min(i+1,
 * n-1)` and `max(i-1, 0)` collapse onto the same index, and where an
 * off-by-one produces an active index of -1 (nothing highlighted) rather than
 * an obvious crash.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, press, activeIndex, itemEls, captureEvents, expectClosed,
  clearRecent, manyCommands, CANONICAL, finding,
  type CommandItem, type SniceCommandPaletteElement,
} from './matrix-utils';

const LENGTHS = [1, 3, 7] as const;

/** Each sequence with the documented active index it must leave behind. */
const SEQUENCES: Array<{ id: string; keys: string[]; expected: (n: number) => number }> = [
  { id: '∅', keys: [], expected: () => 0 },
  { id: '↓', keys: ['ArrowDown'], expected: n => Math.min(1, n - 1) },
  { id: '↓↓', keys: ['ArrowDown', 'ArrowDown'], expected: n => Math.min(2, n - 1) },
  { id: '↓x10', keys: Array(10).fill('ArrowDown'), expected: n => n - 1 },
  { id: '↑', keys: ['ArrowUp'], expected: () => 0 },
  { id: '↓↑', keys: ['ArrowDown', 'ArrowUp'], expected: () => 0 },
  { id: '↓↓↑', keys: ['ArrowDown', 'ArrowDown', 'ArrowUp'], expected: n => Math.min(1, n - 1) },
];

describe('snice-command-palette matrix: arrow navigation cross', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const length of LENGTHS) {
    for (const sequence of SEQUENCES) {
      it(`highlights the documented command: n=${length}/${sequence.id}`, async () => {
        const commands = manyCommands(length);
        el = await makePalette({ open: true, commands, showRecentCommands: false });
        expect(itemEls(el)).toHaveLength(length);

        for (const key of sequence.keys) await press(el, key);

        expect(activeIndex(el), `n=${length}/${sequence.id}`)
          .toBe(sequence.expected(length));
      });
    }
  }
});

describe('snice-command-palette matrix: keyboard activation', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: "Enter - Execute active command".
  it('Enter executes the highlighted command and closes the palette', async () => {
    const ran: string[] = [];
    const commands: CommandItem[] = [
      { id: 'a', label: 'Alpha', action: () => { ran.push('a'); } },
      { id: 'b', label: 'Beta', action: () => { ran.push('b'); } },
      { id: 'c', label: 'Gamma', action: () => { ran.push('c'); } },
    ];
    el = await makePalette({ open: true, commands, showRecentCommands: false });
    const seen = captureEvents(el, ['command-execute']);

    await press(el, 'ArrowDown');
    await press(el, 'Enter');

    expect(ran).toEqual(['b']);
    expect(seen.map(event => event.detail.command.id)).toEqual(['b']);
    expect(el.open).toBe(false);
    expectClosed(el);
  });

  // Doc CommandItem: `disabled?: boolean`. Enter on a disabled command must not
  // execute it — and must not close the palette out from under the user.
  it('Enter on a disabled command executes nothing', async () => {
    const ran: string[] = [];
    const commands: CommandItem[] = [
      { id: 'ok', label: 'Runnable', action: () => { ran.push('ok'); } },
      { id: 'no', label: 'Blocked', disabled: true, action: () => { ran.push('no'); } },
    ];
    el = await makePalette({ open: true, commands, showRecentCommands: false });
    const seen = captureEvents(el, ['command-execute']);

    await press(el, 'ArrowDown');
    expect(activeIndex(el)).toBe(1);
    await press(el, 'Enter');

    expect(ran).toEqual([]);
    expect(seen).toEqual([]);
    expect(el.open).toBe(true);
  });

  // Doc: "Escape - Close palette".
  it('Escape closes an open palette', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await press(el, 'Escape');
    expect(el.open).toBe(false);
    expectClosed(el);
  });

  // Doc: "Cmd+K / Ctrl+K - Toggle palette", with the palette open, closes it.
  it('Meta+K and Ctrl+K toggle a palette that already has focus', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await press(el, 'k', { metaKey: true });
    expect(el.open, 'Meta+K did not close an open palette').toBe(false);
    await press(el, 'k', { ctrlKey: true });
    expect(el.open, 'Ctrl+K did not reopen a closed palette').toBe(true);
  });

  // ── FINDING (fixed) ────────────────────────────────────────────────────────
  // Doc "Keyboard Navigation" opens with "Cmd+K / Ctrl+K - Toggle palette" for a
  // component whose one-line description is "Searchable command palette overlay
  // (Cmd+K / Ctrl+K) for quick command access" — a GLOBAL shortcut, which is the
  // only reading that makes sense: while the palette is closed it renders no
  // shadow content, so there is nothing inside it that can hold focus and no way
  // for the user to deliver a keydown to it.
  //
  // `connectedCallback` used to bind the handler to `this` rather than to the
  // document, so the shortcut only fired when the event's path already included
  // the palette. The listener now lives on the document (and is removed on
  // disconnect); a keydown aimed at an editable element the PAGE owns is left
  // alone.
  it(finding(
    'MATRIX-command-palette-1 (fixed)',
    'Cmd+K on the document opens the palette — the documented global shortcut',
  ), async () => {
    el = await makePalette({ commands: CANONICAL, showRecentCommands: false });
    expect(el.open).toBe(false);

    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', metaKey: true, bubbles: true, composed: true, cancelable: true,
    }));
    await new Promise(resolve => setTimeout(resolve, 40));

    expect(el.open, 'Meta+K on the document did not open the palette').toBe(true);
  });

  // ── FINDING (fixed) ────────────────────────────────────────────────────────
  // Doc Events: "`command-select` -> { command, palette } - Command highlighted".
  // Highlighting is what ArrowUp/ArrowDown do; the event is the only way an
  // application can follow the highlight (to preview the command, to scroll a
  // side panel). The component used to fire `command-select` only from
  // `selectCommand`, i.e. on EXECUTION. Arrow navigation now announces the
  // newly highlighted command.
  it(finding(
    'MATRIX-command-palette-2 (fixed)',
    'command-select fires for the command each arrow key highlights',
  ), async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const seen = captureEvents(el, ['command-select']);

    await press(el, 'ArrowDown');
    await press(el, 'ArrowDown');

    expect(seen.map(event => event.detail.command.id),
      'arrow navigation emitted no command-select').toEqual([
      CANONICAL[1].id, CANONICAL[2].id,
    ]);
  });
});

describe('snice-command-palette matrix: listbox a11y', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // ── FINDING (fixed) ────────────────────────────────────────────────────────
  // Doc "Accessibility": "ARIA labels and roles" and "Screen reader
  // announcements", on a widget the component itself builds as a
  // `role="combobox"` input wired by `aria-controls` to a `role="listbox"`.
  // That pairing has exactly one documented meaning: the options carry
  // `role="option"` and the input names the highlighted one with
  // `aria-activedescendant`. The component used to render bare `<button>`s
  // inside the listbox and never set `aria-activedescendant`; both are in
  // place now.
  it(finding(
    'MATRIX-command-palette-3 (fixed)',
    'the results listbox exposes role="option" items and the combobox tracks '
    + 'the highlight with aria-activedescendant',
  ), async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const problems: string[] = [];

    const items = itemEls(el);
    items.forEach((item, i) => {
      if (item.getAttribute('role') !== 'option') {
        problems.push(`item ${i}: role "${item.getAttribute('role')}", expected option`);
      }
    });

    await press(el, 'ArrowDown');
    const input = el.shadowRoot!.querySelector('[part="input"]')!;
    const active = input.getAttribute('aria-activedescendant');
    const highlighted = itemEls(el)[activeIndex(el)];
    if (!active) problems.push('input has no aria-activedescendant after ArrowDown');
    else if (active !== highlighted?.id) {
      problems.push(`aria-activedescendant "${active}" does not name the highlighted item`);
    }

    expect(problems).toEqual([]);
  });
});
