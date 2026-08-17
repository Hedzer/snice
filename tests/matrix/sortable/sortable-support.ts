/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-sortable feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every assertion in `tests/matrix/sortable/` routes through this module so no
 * test can claim less than `docs/ai/components/sortable.md` +
 * `snice-sortable.types.ts` promise. The documented surface is small and
 * entirely about a drag gesture, so the oracle has three jobs:
 *
 *   · SHELL — "CSS Parts: `base` — Outer sortable container" and
 *     "Slots: (default) — Items to be sortable (auto set `draggable`)". Every
 *     combo must expose `part="base"`, project its light-DOM children through
 *     the default slot, and leave every projected child draggable.
 *   · GESTURE — the three documented events and their detail shapes:
 *       `sort-start`  → { index, item }
 *       `sort-end`    → { oldIndex, newIndex, item }
 *       `sort-change` → { oldIndex, newIndex, item }
 *     plus the documented switches that suppress the gesture (`disabled`) or
 *     narrow its entry point (`handle`), and the axis `direction` chooses.
 *   · CLASSES — "`.sortable-dragging` / `.sortable-ghost` classes during drag".
 *
 * ── Two environment compensations, and why they are not cheats ──────────────
 *
 * happy-dom performs no layout and does not implement the `draggable` IDL
 * attribute's reflection. Both are properties of the ENVIRONMENT, not of the
 * component, and a matrix that silently accepted either would assert nothing:
 *
 *   1. `layout()` gives each projected item the box a browser would have laid
 *      out for it. `onDragOver` compares the pointer against the midpoint of
 *      `getBoundingClientRect()`; with every rect reading 0x0 the midpoint is
 *      0 for both axes, so `direction` would be untestable and every drop
 *      would land on the same side. The stub is the only thing that makes the
 *      documented vertical/horizontal distinction observable here — the visual
 *      tier measures the real thing.
 *   2. `reflectDraggable()` writes the `draggable="true"` content attribute
 *      that a real browser writes when the component assigns
 *      `item.draggable = true`. The component's own handle path resolves an
 *      item with `closest('[draggable]')`, which in a real browser matches and
 *      in happy-dom cannot. Without the shim the handle combos would measure
 *      happy-dom.
 *
 * Neither touches an expectation. Every `expect*` below still states what the
 * doc says, and a divergence stays a divergence (`.ai/fuzzing.md`).
 */
import { Problems, expectClean, part, wait } from '../matrix-kit';
import { mount, removeComponent } from '../matrix-utils';
import { hasPart } from '../part-exact';
import '../../../packages/components/src/sortable/snice-sortable';
import type { SniceSortableElement } from '../../../packages/components/src/sortable/snice-sortable.types';

export { Problems, expectClean, removeComponent, wait };
export type Sortable = SniceSortableElement & { shadowRoot: ShadowRoot };

/** Settle window: the component renders on a microtask plus a queued task. */
export const SETTLE = 20;

// ── Documented dimensions ───────────────────────────────────────────────────
// `direction: 'vertical'|'horizontal' = 'vertical'`
export const DIRECTIONS = ['vertical', 'horizontal'] as const;
// `handle: string = ''` — CSS selector for drag handle. '' is "the whole item".
export const HANDLES = ['', '.grip'] as const;
// `group: string = ''` — group name for cross-container sorting.
export const GROUPS = ['', 'tasks'] as const;
/** Which side of the target item the pointer is on when the drop lands. */
export const SIDES = ['before', 'after'] as const;

export type Direction = typeof DIRECTIONS[number];
export type Handle = typeof HANDLES[number];
export type Side = typeof SIDES[number];

export interface SortableVector {
  direction: Direction;
  handle: Handle;
  disabled: boolean;
  group: string;
}

export const DEFAULTS: SortableVector = {
  direction: 'vertical',
  handle: '',
  disabled: false,
  group: '',
};

/** Stable id for a vector — the string a failing combo is named by. */
export function vectorId(vector: SortableVector): string {
  return [
    vector.direction,
    vector.handle ? 'handle' : 'whole-item',
    vector.disabled ? 'disabled' : 'enabled',
    vector.group ? `group=${vector.group}` : 'ungrouped',
  ].join('/');
}

/** The three items every combo sorts, named A/B/C so an order reads as a word. */
export const ITEM_IDS = ['a', 'b', 'c'] as const;

/**
 * Light-DOM markup for one combo. The doc's own two examples: a bare item per
 * row, and an item whose first child is the drag handle.
 */
export function itemsHtml(handle: Handle): string {
  return ITEM_IDS.map(id => (handle
    ? `<div id="${id}"><span class="grip">☰</span> Item ${id.toUpperCase()}</div>`
    : `<div id="${id}">Item ${id.toUpperCase()}</div>`)).join('');
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount one combo the way the doc's markup authors it: attributes and the
 * light-DOM items are both in place before the element connects, because
 * `@ready init()` reads the assigned nodes to decide which children are items.
 */
export async function makeSortable(vector: Partial<SortableVector> = {}): Promise<Sortable> {
  const full = { ...DEFAULTS, ...vector };
  const attrs: Record<string, any> = { direction: full.direction };
  if (full.handle) attrs.handle = full.handle;
  if (full.disabled) attrs.disabled = true;
  if (full.group) attrs.group = full.group;

  const el = await mount<Sortable>('snice-sortable', attrs, itemsHtml(full.handle));
  await wait(SETTLE);
  layout(el, full.direction);
  reflectDraggable(el);
  return el;
}

/** The projected items, in document order. */
export function items(el: Sortable): HTMLElement[] {
  return [...el.children] as HTMLElement[];
}

/** Current order as ids — `['a','b','c']`. */
export function order(el: Sortable): string[] {
  return items(el).map(item => item.id);
}

/** The drag entry point for an item under this vector: the handle, or the item. */
export function grabPoint(item: HTMLElement, handle: Handle): HTMLElement {
  return handle ? (item.querySelector(handle) as HTMLElement) ?? item : item;
}

// ── Environment compensation (see the module header) ────────────────────────

/** Per-item box size the stub lays out along the sort axis. */
const STEP = 40;
const CROSS = 200;

/**
 * Give every projected item the box a browser would lay out, along the axis
 * `direction` names. Re-callable: the component reorders the light DOM during
 * a drag, and the boxes belong to POSITIONS, not to items, so they are
 * re-assigned by index after every move.
 */
export function layout(el: Sortable, direction: Direction): void {
  items(el).forEach((item, index) => {
    const vertical = direction === 'vertical';
    const rect = {
      left: vertical ? 0 : index * STEP,
      top: vertical ? index * STEP : 0,
      width: vertical ? CROSS : STEP,
      height: vertical ? STEP : CROSS,
    };
    const box = {
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON() { return this; },
    } as DOMRect;
    item.getBoundingClientRect = () => box;
  });
}

/**
 * Write the `draggable="true"` content attribute a real browser reflects from
 * the IDL property the component assigns. happy-dom sets the property only.
 */
export function reflectDraggable(el: Sortable): void {
  for (const item of items(el)) {
    if (item.draggable && !item.hasAttribute('draggable')) item.setAttribute('draggable', 'true');
  }
}

/** The point inside item `index` that lands on `side` of its midpoint. */
export function pointerFor(index: number, direction: Direction, side: Side): { clientX: number; clientY: number } {
  const along = index * STEP + (side === 'before' ? STEP * 0.25 : STEP * 0.75);
  return direction === 'vertical'
    ? { clientX: CROSS / 2, clientY: along }
    : { clientX: along, clientY: CROSS / 2 };
}

// ── The gesture ─────────────────────────────────────────────────────────────

/** A drag event with the `dataTransfer` a real drag carries. */
function dragEvent(type: string, init: { clientX?: number; clientY?: number } = {}): Event {
  const event = new MouseEvent(type, {
    bubbles: true, composed: true, cancelable: true, ...init,
  });
  const transfer = { effectAllowed: '', dropEffect: '', data: new Map<string, string>(),
    setData(key: string, value: string) { this.data.set(key, value); },
    getData(key: string) { return this.data.get(key) ?? ''; } };
  Object.defineProperty(event, 'dataTransfer', { value: transfer, configurable: true });
  return event;
}

/** Begin a drag on item `index` (through its handle when the vector has one). */
export function dragStart(el: Sortable, index: number, vector: SortableVector): void {
  const source = grabPoint(items(el)[index], vector.handle);
  source.dispatchEvent(dragEvent('dragstart'));
}

/** Move the pointer over item `index`, on the named side of its midpoint. */
export function dragOver(el: Sortable, index: number, vector: SortableVector, side: Side): void {
  const target = grabPoint(items(el)[index], vector.handle);
  target.dispatchEvent(dragEvent('dragover', pointerFor(index, vector.direction, side)));
  // The component re-reads its item list after every move; the boxes belong to
  // positions, so they follow.
  layout(el, vector.direction);
}

/** Release the drag. The component compares indices here and emits end/change. */
export function dragEnd(el: Sortable): void {
  el.dispatchEvent(dragEvent('dragend'));
}

/** The whole documented gesture: grab `from`, hover `to`, release. */
export function drag(el: Sortable, from: number, to: number, vector: SortableVector, side: Side): void {
  dragStart(el, from, vector);
  dragOver(el, to, vector, side);
  dragEnd(el);
}

// ── Event capture ───────────────────────────────────────────────────────────

export interface Seen { type: string; detail: any }

/** Record the three documented events in dispatch order. */
export function captureSort(el: Sortable): Seen[] {
  const seen: Seen[] = [];
  for (const type of ['sort-start', 'sort-end', 'sort-change']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The documented SHELL, for any combo.
 *
 * doc: "CSS Parts — `base`: Outer sortable container"
 * doc: "Slots — (default): Items to be sortable (auto set `draggable`)"
 */
export function checkShell(problems: Problems, el: Sortable, vector: SortableVector): void {
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no element exposes part="base"')) return;
  problems.check(hasPart(base, 'base'), 'the base element does not carry the exact part token "base"');

  const slot = el.shadowRoot.querySelector('slot');
  if (!problems.check(!!slot, 'the outer container renders no default slot')) return;
  problems.check(base!.contains(slot!), 'the default slot is not inside part="base"');

  const assigned = (slot as HTMLSlotElement).assignedElements() as HTMLElement[];
  problems.equal(assigned.map(node => node.id).join(','), ITEM_IDS.join(','),
    'the default slot does not project the authored items');

  for (const item of assigned) {
    problems.check(item.draggable === true, `item #${item.id} was not made draggable`);
  }

  // The two documented attribute-driven switches must survive the attribute
  // channel the doc's markup uses.
  problems.equal(el.direction, vector.direction, 'direction');
  problems.equal(el.disabled, vector.disabled, 'disabled');
  problems.equal(el.handle, vector.handle, 'handle');
  problems.equal(el.group, vector.group, 'group');
}

/**
 * The documented GESTURE outcome for one drag.
 *
 * doc: `sort-start` → `{ index, item }`; `sort-end` / `sort-change` →
 * `{ oldIndex, newIndex, item }`. A `disabled` container sorts nothing, so it
 * emits nothing and keeps its order.
 */
export function checkGesture(
  problems: Problems,
  el: Sortable,
  seen: Seen[],
  vector: SortableVector,
  expected: { from: number; to: number; order: string[] },
): void {
  problems.equal(order(el).join(','), expected.order.join(','), 'rendered order after the drop');

  if (vector.disabled) {
    problems.equal(seen.map(e => e.type).join(','), '', 'a disabled container emitted sort events');
    return;
  }

  const moved = expected.from !== expected.to;
  const types = moved ? ['sort-start', 'sort-end', 'sort-change'] : ['sort-start'];
  if (!problems.equal(seen.map(e => e.type).join(','), types.join(','), 'dispatched event sequence')) return;

  const start = seen[0].detail;
  problems.equal(start.index, expected.from, 'sort-start detail.index');
  problems.equal(start.item?.id, ITEM_IDS[expected.from], 'sort-start detail.item');

  for (const event of seen.slice(1)) {
    problems.equal(event.detail.oldIndex, expected.from, `${event.type} detail.oldIndex`);
    problems.equal(event.detail.newIndex, expected.to, `${event.type} detail.newIndex`);
    problems.equal(event.detail.item?.id, ITEM_IDS[expected.from], `${event.type} detail.item`);
  }
}

/**
 * Where the documented insertion rule puts the dragged item.
 *
 * `onDragOver` inserts BEFORE the hovered item when the pointer is past its
 * near edge and short of its midpoint, and AFTER it otherwise — measured on
 * the axis `direction` names. This function is the doc's rule, applied to a
 * list of ids, so a combo's expectation is derived rather than observed.
 */
export function expectedOrder(from: number, to: number, side: Side): string[] {
  const list = [...ITEM_IDS] as string[];
  const [moving] = list.splice(from, 1);
  const anchor = list.indexOf(ITEM_IDS[to]);
  list.splice(side === 'before' ? anchor : anchor + 1, 0, moving);
  return list;
}
