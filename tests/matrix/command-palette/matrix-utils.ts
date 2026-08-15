/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-command-palette feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The pattern is `tests/matrix/table/matrix-utils.ts`: every combo is
 * judged by ONE oracle that derives its expectation from the DOCUMENTED contract
 * (`docs/ai/components/command-palette.md` plus
 * `snice-command-palette.types.ts`), and a combo reports EVERY violation at once
 * rather than dying on the first.
 *
 * What the docs promise, and therefore what this module encodes:
 *
 *   · `commands` is an ORDERED list; the palette renders one `part="item"` per
 *     surviving command, in that order, grouped under a `part="category"` header
 *     per distinct `category`.
 *   · A CommandItem's optional fields each gate exactly one rendered part:
 *     `icon`/`iconImage` -> `item-icon` (+ `item-icon-image` for the image
 *     form), `description` -> `item-description`, `shortcut` ->
 *     `item-shortcut`. An absent field must remove its part, not blank it.
 *   · Search matches `label`, `description` OR `category`, case-insensitively
 *     unless `case-sensitive` is set, and the surviving list is capped at
 *     `max-results`.
 *   · `no-results-text` is shown in `part="empty"` exactly when nothing survives.
 *   · Closed means NOTHING rendered: no container, no input, no results.
 *   · Events: `command-palette-open` / `command-palette-close` on the open
 *     transitions, `command-search` when the search changes, `command-select`
 *     when a command is HIGHLIGHTED, `command-execute` when one is executed.
 *
 * Numbers the docs do not specify — the palette's own geometry, the transition,
 * the exact icon markup — are asserted STRUCTURALLY (present / absent / ordered)
 * and never pinned to an observed literal.
 *
 * `.ai/fuzzing.md` is binding: nothing here offers a way to weaken an assertion.
 * A combo that diverges is a FINDING — the assertion stays and the test is
 * declared `it.fails` with a `MATRIX-command-palette-N` id.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/command-palette/snice-command-palette';
import type {
  CommandItem,
  SniceCommandPaletteElement,
} from '../../../packages/components/src/command-palette/snice-command-palette.types';

export { wait, createComponent };
export type { CommandItem, SniceCommandPaletteElement };

/**
 * Settle window. The palette re-renders from `@property` invalidation plus a
 * `@watch('open')` reaction that itself schedules work; 40ms clears both.
 */
export const SETTLE = 40;

/**
 * The recent-command list is persisted in `localStorage` under a FIXED key, so
 * one test's execution leaks into the next file's first mount. Every mount goes
 * through `makePalette`, which clears it — the matrix must measure the
 * documented default state, not the residue of the combo before it.
 */
export const RECENT_KEY = 'snice-command-palette-recent';

export function clearRecent(): void {
  try { localStorage.removeItem(RECENT_KEY); } catch { /* happy-dom without storage */ }
}

/** Seed the persisted recent list, for the combos that document its effect. */
export function seedRecent(ids: string[]): void {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

export interface PaletteOptions {
  open?: boolean;
  commands?: CommandItem[];
  placeholder?: string;
  noResultsText?: string;
  maxResults?: number;
  showRecentCommands?: boolean;
  recentCommandsLimit?: number;
  caseSensitive?: boolean;
  /** Recent-command ids to persist BEFORE the element boots (`@ready` reads them). */
  recent?: string[];
}

/**
 * Mount a palette for one combo.
 *
 * Scalars cross the ATTRIBUTE channel (`max-results="2"`, `case-sensitive`),
 * because that is the documented public surface; `commands` has no attribute
 * form and is assigned as a property, exactly as the doc's own example does.
 *
 * `open` is applied AFTER the element is ready when it is requested, because
 * `@watch('open', { immediate: false })` is what dispatches
 * `command-palette-open` and refreshes the filtered list — booting with the
 * attribute already present would skip the documented transition.
 */
export async function makePalette(opts: PaletteOptions = {}): Promise<SniceCommandPaletteElement> {
  clearRecent();
  if (opts.recent) seedRecent(opts.recent);

  const attrs: Record<string, any> = {};
  if (opts.placeholder !== undefined) attrs.placeholder = opts.placeholder;
  if (opts.noResultsText !== undefined) attrs['no-results-text'] = opts.noResultsText;
  if (opts.maxResults !== undefined) attrs['max-results'] = opts.maxResults;
  if (opts.showRecentCommands !== undefined) attrs['show-recent-commands'] = opts.showRecentCommands;
  if (opts.recentCommandsLimit !== undefined) attrs['recent-commands-limit'] = opts.recentCommandsLimit;
  if (opts.caseSensitive) attrs['case-sensitive'] = true;

  const el = await createComponent<SniceCommandPaletteElement>('snice-command-palette', attrs);
  if (opts.commands) el.commands = opts.commands;
  await wait(SETTLE);
  if (opts.open) {
    el.open = true;
    await wait(SETTLE);
  }
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceCommandPaletteElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-command-palette has no shadow root');
  return root;
}

/**
 * Every node exposing EXACTLY the named CSS part, in document order.
 *
 * The obvious `[part~="item"]` is not used, and must not be: happy-dom's
 * attribute-word matcher also returns `part="item-icon"`, `part="item-label"`
 * and every other hyphenated sibling, so `partsOf(el, 'item')` would report
 * five nodes per command and quietly turn every count assertion in this
 * directory into noise. The part attribute is split by hand instead, which is
 * what a browser's `~=` actually means.
 */
export function partsIn<T extends Element = HTMLElement>(root: ParentNode, name: string): T[] {
  return [...root.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as unknown as T[];
}

export function part<T extends Element = HTMLElement>(
  el: SniceCommandPaletteElement, name: string,
): T | null {
  return partsIn<T>(sr(el), name)[0] ?? null;
}

export function partsOf<T extends Element = HTMLElement>(
  el: SniceCommandPaletteElement, name: string,
): T[] {
  return partsIn<T>(sr(el), name);
}

export function itemEls(el: SniceCommandPaletteElement): HTMLElement[] {
  return partsOf<HTMLElement>(el, 'item');
}

export function inputEl(el: SniceCommandPaletteElement): HTMLInputElement | null {
  return part<HTMLInputElement>(el, 'input');
}

export function text(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The labels the palette is currently showing, in rendered order. */
export function renderedLabels(el: SniceCommandPaletteElement): string[] {
  return itemEls(el).map(item => text(partsIn(item, 'item-label')[0]));
}

/** The category headers the palette is currently showing, in rendered order. */
export function renderedCategories(el: SniceCommandPaletteElement): string[] {
  return partsOf(el, 'category').map(node => text(node));
}

/**
 * Type into the search box the way a user does: set the value, then dispatch
 * `input`. The component's `@input` handler is the only path that updates the
 * query, so poking `searchQuery` would test a private field instead of the
 * documented one.
 */
export async function typeSearch(el: SniceCommandPaletteElement, query: string): Promise<void> {
  const input = inputEl(el);
  if (!input) throw new Error('cannot type: palette rendered no part="input" (is it open?)');
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await wait(SETTLE);
}

/** A keydown on the host — the element the documented shortcuts are bound to. */
export async function press(
  target: EventTarget, key: string, init: KeyboardEventInit = {},
): Promise<void> {
  target.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true, ...init,
  }));
  await wait(SETTLE);
}

export async function clickItem(el: SniceCommandPaletteElement, index: number): Promise<void> {
  const item = itemEls(el)[index];
  if (!item) throw new Error(`no item at index ${index}`);
  item.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  await wait(SETTLE);
}

export interface Captured { type: string; detail: any }

/** Record the named events in DISPATCH ORDER — order is part of the contract. */
export function captureEvents(el: SniceCommandPaletteElement, types: string[]): Captured[] {
  const seen: Captured[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The documented filter, computed from the command list alone.
 *
 * Doc: "Search matches label, description or category"; `case-sensitive`
 * switches the comparison; `max-results` caps the surviving list. With an empty
 * query the palette lists the commands themselves (capped), which is what the
 * doc's Basic Usage promises — `show-recent-commands` may PRIORITISE the
 * recently used, but the doc never says it replaces the list with only them.
 */
export function expectedResults(
  commands: CommandItem[],
  query: string,
  opts: { caseSensitive?: boolean; maxResults?: number } = {},
): CommandItem[] {
  const max = opts.maxResults ?? 50;
  if (!query.trim()) return commands.slice(0, max);
  const needle = opts.caseSensitive ? query : query.toLowerCase();
  const fold = (value: string) => (opts.caseSensitive ? value : value.toLowerCase());
  return commands
    .filter((command) => {
      if (command.disabled) return false;
      return fold(command.label).includes(needle)
        || fold(command.description ?? '').includes(needle)
        || fold(command.category ?? '').includes(needle);
    })
    .slice(0, max);
}

/**
 * The documented render order: commands grouped by `category`, each group
 * preceded by a `part="category"` header, groups in first-appearance order and
 * items in list order inside a group. Commands with no category form an
 * unheaded group.
 */
export function expectedRenderOrder(results: CommandItem[]): {
  labels: string[];
  categories: string[];
} {
  const groups = new Map<string, CommandItem[]>();
  for (const command of results) {
    const category = command.category ?? '';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(command);
  }
  const labels: string[] = [];
  const categories: string[] = [];
  for (const [category, commands] of groups) {
    if (category) categories.push(category);
    for (const command of commands) labels.push(command.label);
  }
  return { labels, categories };
}

/**
 * The CORE oracle. Assert the whole rendered palette against the documented
 * expectation for a combo, collecting every violation so one run tells the
 * whole story.
 */
export function expectPaletteMatches(
  el: SniceCommandPaletteElement,
  spec: {
    commands: CommandItem[];
    query?: string;
    caseSensitive?: boolean;
    maxResults?: number;
    noResultsText?: string;
  },
): void {
  const problems: string[] = [];
  const results = expectedResults(spec.commands, spec.query ?? '', spec);
  const order = expectedRenderOrder(results);

  // ── The results list ──────────────────────────────────────────────────────
  const labels = renderedLabels(el);
  if (JSON.stringify(labels) !== JSON.stringify(order.labels)) {
    problems.push(`items ${JSON.stringify(labels)} != ${JSON.stringify(order.labels)}`);
  }

  const categories = renderedCategories(el);
  if (JSON.stringify(categories) !== JSON.stringify(order.categories)) {
    problems.push(`categories ${JSON.stringify(categories)} != ${JSON.stringify(order.categories)}`);
  }

  // ── The empty state: shown exactly when nothing survived ───────────────────
  const empty = part(el, 'empty');
  if (results.length === 0) {
    if (!empty) problems.push('no results, but no part="empty" rendered');
    else if (text(empty) !== (spec.noResultsText ?? 'No results found')) {
      problems.push(`empty text "${text(empty)}" != "${spec.noResultsText ?? 'No results found'}"`);
    }
  } else if (empty) {
    problems.push(`${results.length} results, but part="empty" ("${text(empty)}") rendered too`);
  }

  // ── Per-item optional parts, each gated by its own documented field ────────
  const items = itemEls(el);
  results.forEach((command, i) => {
    const item = items[i];
    if (!item) return; // already reported by the list comparison above
    const partIn = (name: string) => partsIn(item, name)[0] ?? null;
    const has = (name: string) => partsIn(item, name).length > 0;

    if (!!(command.icon || command.iconImage) !== has('item-icon')) {
      problems.push(`item ${i} (${command.label}): item-icon ${has('item-icon')}, `
        + `expected ${!!(command.icon || command.iconImage)}`);
    }
    if (!!command.iconImage !== has('item-icon-image')) {
      problems.push(`item ${i} (${command.label}): item-icon-image ${has('item-icon-image')}, `
        + `expected ${!!command.iconImage}`);
    }
    if (!!command.description !== has('item-description')) {
      problems.push(`item ${i} (${command.label}): item-description ${has('item-description')}, `
        + `expected ${!!command.description}`);
    } else if (command.description
      && text(partIn('item-description')) !== command.description) {
      problems.push(`item ${i}: description "${text(partIn('item-description'))}"`
        + ` != "${command.description}"`);
    }
    if (!!command.shortcut !== has('item-shortcut')) {
      problems.push(`item ${i} (${command.label}): item-shortcut ${has('item-shortcut')}, `
        + `expected ${!!command.shortcut}`);
    } else if (command.shortcut
      && text(partIn('item-shortcut')) !== command.shortcut) {
      problems.push(`item ${i}: shortcut "${text(partIn('item-shortcut'))}"`
        + ` != "${command.shortcut}"`);
    }
    if (!!command.disabled !== item.classList.contains('command-palette__item--disabled')) {
      problems.push(`item ${i} (${command.label}): disabled styling `
        + `${item.classList.contains('command-palette__item--disabled')}, expected ${!!command.disabled}`);
    }
  });

  expect(problems, `palette combo (query=${JSON.stringify(spec.query ?? '')})`).toEqual([]);
}

/**
 * The documented open-state chrome: a `role="dialog" aria-modal="true"`
 * container, a `role="combobox"` input wired to a `role="listbox"` results
 * region, and the placeholder the author asked for.
 */
export function expectOpenChrome(
  el: SniceCommandPaletteElement, placeholder = 'Type a command or search...',
): void {
  const problems: string[] = [];
  const container = part(el, 'container');
  if (!container) problems.push('open palette rendered no part="container"');
  else {
    if (container.getAttribute('role') !== 'dialog') {
      problems.push(`container role "${container.getAttribute('role')}", expected dialog`);
    }
    if (container.getAttribute('aria-modal') !== 'true') {
      problems.push(`container aria-modal "${container.getAttribute('aria-modal')}"`);
    }
  }
  const input = inputEl(el);
  if (!input) problems.push('open palette rendered no part="input"');
  else {
    if (input.getAttribute('role') !== 'combobox') {
      problems.push(`input role "${input.getAttribute('role')}", expected combobox`);
    }
    if (input.getAttribute('placeholder') !== placeholder) {
      problems.push(`placeholder "${input.getAttribute('placeholder')}" != "${placeholder}"`);
    }
    const controls = input.getAttribute('aria-controls');
    const results = part(el, 'results');
    if (!results) problems.push('open palette rendered no part="results"');
    else if (controls !== results.id) {
      problems.push(`input aria-controls "${controls}" does not name the results list "${results.id}"`);
    } else if (results.getAttribute('role') !== 'listbox') {
      problems.push(`results role "${results.getAttribute('role')}", expected listbox`);
    }
  }
  expect(problems, 'open palette chrome').toEqual([]);
}

/** Doc: closed means nothing rendered — no container, no input, no results. */
export function expectClosed(el: SniceCommandPaletteElement): void {
  const problems: string[] = [];
  for (const name of ['container', 'search', 'input', 'results', 'empty', 'item']) {
    if (part(el, name)) problems.push(`closed palette still renders part="${name}"`);
  }
  expect(problems, 'closed palette').toEqual([]);
}

/** The index the palette is currently highlighting, per its documented class. */
export function activeIndex(el: SniceCommandPaletteElement): number {
  return itemEls(el).findIndex(item => item.classList.contains('command-palette__item--active'));
}

// ── Fixtures ────────────────────────────────────────────────────────────────

/**
 * The canonical command set: the doc's own File/Save pair extended so that
 * every optional field, every category grouping and a disabled entry are all
 * represented — and so that the three searchable fields (label, description,
 * category) can each be matched by a query that matches NOTHING else.
 */
export const CANONICAL: CommandItem[] = [
  { id: 'new', label: 'New File', icon: '📄', shortcut: '⌘N', category: 'File' },
  { id: 'save', label: 'Save', icon: '💾', shortcut: '⌘S', category: 'File',
    description: 'Persist the current buffer' },
  { id: 'open', label: 'Open Folder', iconImage: '/icons/folder.png', category: 'File' },
  { id: 'theme', label: 'Toggle Theme', category: 'Preferences', description: 'Light or dark' },
  { id: 'keys', label: 'Keyboard Shortcuts', shortcut: '⌘K ⌘S', category: 'Preferences' },
  { id: 'quit', label: 'Quit', disabled: true },
  { id: 'about', label: 'About' },
];

/** Every optional-field permutation of a single item, for the render cross. */
export function itemWith(shape: {
  icon?: boolean; iconImage?: boolean; description?: boolean;
  shortcut?: boolean; category?: boolean; disabled?: boolean;
}, id = 'combo'): CommandItem {
  const command: CommandItem = { id, label: 'Combo Command' };
  if (shape.icon) command.icon = '⭐';
  if (shape.iconImage) command.iconImage = '/icons/combo.png';
  if (shape.description) command.description = 'A combo description';
  if (shape.shortcut) command.shortcut = '⌘X';
  if (shape.category) command.category = 'Combos';
  if (shape.disabled) command.disabled = true;
  return command;
}

/** N generated commands, for the `max-results` cap. */
export function manyCommands(count: number, prefix = 'Item'): CommandItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    label: `${prefix} ${i}`,
  }));
}

/**
 * The title of a test pinned to a known divergence from the docs.
 *
 * Policy (`.ai/fuzzing.md`): the assertion is NOT weakened and the component is
 * NOT changed. The test keeps asserting the documented behaviour under
 * `it.fails`, so it starts failing the day the component is fixed.
 */
export function finding(id: string, description: string): string {
  return `${id}: ${description}`;
}
