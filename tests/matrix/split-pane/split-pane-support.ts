/**
 * snice-split-pane matrix — the oracle.
 *
 * Source of every expectation: docs/ai/components/split-pane.md and
 * packages/components/src/split-pane/snice-split-pane.types.ts. Nothing here is
 * read off the component's output.
 *
 * The documented surface:
 *
 *   · `direction: 'horizontal'|'vertical' = 'horizontal'`  — attr `direction`
 *   · `primarySize: number = 50`        — attr `primary-size`, percentage
 *   · `minPrimarySize: number = 10`     — attr `min-primary-size`, percentage
 *   · `minSecondarySize: number = 10`   — attr `min-secondary-size`, percentage
 *   · `snapSize: number = 0`            — attr `snap-size`, percentage, 0 = no snap
 *   · `disabled: boolean = false`
 *   · methods `getPrimarySize()` / `getSecondarySize()` / `setPrimarySize(size)` / `reset()`
 *   · event `pane-resize` -> `{ primarySize, secondarySize, splitPane }`
 *   · slots `primary` (left or top) and `secondary` (right or bottom)
 *   · CSS parts `primary`, `divider`, `handle`, `secondary`
 *   · a11y: "Divider keyboard-accessible with arrow keys",
 *     "Mouse, touch, and keyboard input supported"
 *
 * SIMULATION BOUNDARY. A split pane is a flex row/column whose primary child
 * carries a percentage size; happy-dom performs no layout, so the DOM tier owns
 * the CONTRACT the stylesheet consumes — the percentage the component writes
 * onto the primary pane, and the `direction` ATTRIBUTE the
 * `:host([direction="…"])` rules key off — plus everything that is not layout:
 * structure, parts, slot names, divider semantics, clamping arithmetic, the
 * event payload, and the keyboard paths. Whether those percentages become real
 * pixel boxes on either side of a real divider is the visual tier's job
 * (tests/live/matrix/split-pane/split-pane-visual.spec.ts).
 */
import { Problems, SETTLE, all, captureEvents, mount, part, press, sr, text, wait } from '../matrix-kit';
import '../../../packages/components/src/split-pane/snice-split-pane';

export { Problems, captureEvents, mount, part, press, sr, text, wait, SETTLE };

/** The documented defaults, from the properties block of the doc. */
export const DEFAULTS = {
  direction: 'horizontal' as Direction,
  primarySize: 50,
  minPrimarySize: 10,
  minSecondarySize: 10,
  snapSize: 0,
  disabled: false,
};

export type Direction = 'horizontal' | 'vertical';

export interface Vector {
  direction: Direction;
  primarySize: number;
  minPrimarySize: number;
  minSecondarySize: number;
  snapSize: number;
  disabled: boolean;
}

export interface ResizeDetail {
  primarySize: number;
  secondarySize: number;
  splitPane: HTMLElement;
}

/** The documented declarative form: two slotted panes. */
export const PANES_HTML =
  '<div slot="primary">Primary content</div><div slot="secondary">Secondary content</div>';

/**
 * Mount one combo through the ATTRIBUTE channel — the form every documented
 * example uses (`<snice-split-pane direction="vertical" primary-size="30"
 * snap-size="10">`), and the only channel the `:host([direction="…"])` layout
 * rules can see.
 */
export async function mountSplitPane(vector: Vector): Promise<HTMLElement> {
  const attrs: Record<string, string | boolean> = {
    direction: vector.direction,
    'primary-size': String(vector.primarySize),
    'min-primary-size': String(vector.minPrimarySize),
    'min-secondary-size': String(vector.minSecondarySize),
    'snap-size': String(vector.snapSize),
  };
  if (vector.disabled) attrs.disabled = true;
  return mount('snice-split-pane', attrs as Record<string, string>, {}, { html: PANES_HTML });
}

/** Mount the same combo through the PROPERTY channel instead. */
export async function mountSplitPaneByProperty(vector: Vector): Promise<HTMLElement> {
  return mount('snice-split-pane', {}, {
    direction: vector.direction,
    primarySize: vector.primarySize,
    minPrimarySize: vector.minPrimarySize,
    minSecondarySize: vector.minSecondarySize,
    snapSize: vector.snapSize,
    disabled: vector.disabled,
  }, { html: PANES_HTML });
}

/** The bare documented form: `<snice-split-pane>` with two slotted panes. */
export async function mountDefaults(): Promise<HTMLElement> {
  return mount('snice-split-pane', {}, {}, { html: PANES_HTML });
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Structure: the four documented CSS parts, in the documented order (primary is
 * "left or top", secondary is "right or bottom", so the divider sits between
 * them), each pane holding its own named slot.
 */
export function checkStructure(problems: Problems, el: HTMLElement): void {
  const primary = part(el, 'primary');
  const divider = part(el, 'divider');
  const handle = part(el, 'handle');
  const secondary = part(el, 'secondary');

  if (!problems.check(!!primary, 'no [part~="primary"] pane')) return;
  if (!problems.check(!!divider, 'no [part~="divider"] bar')) return;
  problems.check(!!handle, 'no [part~="handle"] inside the divider');
  if (!problems.check(!!secondary, 'no [part~="secondary"] pane')) return;

  problems.check(
    divider!.contains(handle!),
    'the handle is documented as the "visual handle inside divider" but is not inside it',
  );

  // Documented order: primary (left/top), divider, secondary (right/bottom).
  const order = all(el, '[part~="primary"], [part~="divider"], [part~="secondary"]')
    .map(node => node.getAttribute('part')!.split(/\s+/)[0]);
  problems.equal(order, ['primary', 'divider', 'secondary'], 'pane order');

  // Two named slots, one per documented slot name, each inside its own pane.
  const slots = all<HTMLSlotElement>(el, 'slot');
  problems.equal(slots.map(slot => slot.name), ['primary', 'secondary'], 'slot names');
  problems.check(
    !!primary!.querySelector('slot[name="primary"]'),
    'the primary pane does not hold the "primary" slot',
  );
  problems.check(
    !!secondary!.querySelector('slot[name="secondary"]'),
    'the secondary pane does not hold the "secondary" slot',
  );
}

/**
 * The documented percentage reaches the layout.
 *
 * `primarySize` is "primary pane percentage", and `direction` decides which
 * axis it sizes: horizontal splits left/right (a width), vertical splits
 * top/bottom (a height). The inline size on the primary pane is the only
 * observable consequence in an environment without layout, and the `direction`
 * attribute is what the `:host([direction="…"])` flex-direction rules select on
 * — a split pane whose direction never reaches the attribute lays out along the
 * wrong axis in every browser.
 */
export function checkSizing(problems: Problems, el: HTMLElement, vector: Vector): void {
  const primary = part(el, 'primary');
  if (!problems.check(!!primary, 'no [part~="primary"] pane')) return;

  const axis = vector.direction === 'horizontal' ? 'width' : 'height';
  const other = vector.direction === 'horizontal' ? 'height' : 'width';
  problems.equal(primary!.style[axis], `${vector.primarySize}%`, `primary pane ${axis}`);
  problems.equal(primary!.style[other], '',
    `primary pane ${other} (only the split axis is sized; the cross axis is the stylesheet's)`);

  // The secondary pane takes the remainder — documented as the complement of
  // the primary percentage — and must never be given a hard size of its own.
  const secondary = part(el, 'secondary');
  problems.equal(secondary?.style.width, '', 'secondary pane width');
  problems.equal(secondary?.style.height, '', 'secondary pane height');
}

/**
 * `direction` reaches the ATTRIBUTE.
 *
 * Split into its own oracle because it is the one part of the documented
 * surface that has a standing finding (MATRIX-split-pane-3), and because it is
 * the load-bearing one: the stylesheet expresses the ENTIRE documented
 * difference between the two directions through `:host([direction="…"])` —
 * `flex-direction`, the divider's width/height and resize cursor, and the
 * handle's dimensions. A split pane whose direction is not on the host is a
 * split pane whose divider has no size in any browser.
 */
export function checkDirectionAttribute(problems: Problems, el: HTMLElement, direction: Direction): void {
  problems.equal(el.getAttribute('direction'), direction,
    'direction attribute (the :host([direction="…"]) rules that size the divider select on it)');
}

/**
 * The divider is the documented resize control: an ARIA separator oriented
 * across the split, reporting the current primary percentage, and reachable by
 * keyboard — unless `disabled`, which the docs define as the state where the
 * pane cannot be resized at all.
 */
export function checkDivider(problems: Problems, el: HTMLElement, vector: Vector): void {
  const divider = part(el, 'divider');
  if (!problems.check(!!divider, 'no [part~="divider"] bar')) return;

  problems.equal(divider!.getAttribute('role'), 'separator', 'divider role');
  // A horizontal split is divided by a VERTICAL separator, and vice versa.
  const orientation = vector.direction === 'horizontal' ? 'vertical' : 'horizontal';
  problems.equal(divider!.getAttribute('aria-orientation'), orientation,
    'divider aria-orientation');
  problems.equal(divider!.getAttribute('aria-valuenow'), String(Math.round(vector.primarySize)),
    'divider aria-valuenow');
  problems.check(!!divider!.getAttribute('aria-label'), 'divider has no aria-label');

  // "Divider keyboard-accessible with arrow keys" — so it is a tab stop while
  // the pane is resizable, and is removed from the tab order when it is not.
  const tabindex = divider!.getAttribute('tabindex');
  if (vector.disabled) {
    problems.equal(tabindex, '-1', 'disabled divider tabindex');
  } else {
    problems.equal(tabindex, '0', 'divider tabindex');
  }
}

/** The documented getters agree with the documented properties. */
export function checkGetters(problems: Problems, el: HTMLElement, vector: Vector): void {
  const pane = el as any;
  problems.equal(pane.getPrimarySize(), vector.primarySize, 'getPrimarySize()');
  problems.equal(pane.getSecondarySize(), 100 - vector.primarySize, 'getSecondarySize()');
  problems.equal(pane.getPrimarySize() + pane.getSecondarySize(), 100,
    'the two panes are documented as percentages of one container');
}

/** Slotted content is projected, never rewritten. */
export function checkSlotted(problems: Problems, el: HTMLElement): void {
  const slotted = [...el.children] as HTMLElement[];
  problems.equal(slotted.map(child => child.getAttribute('slot')), ['primary', 'secondary'],
    'slotted children');
  problems.equal(slotted.map(child => text(child)), ['Primary content', 'Secondary content'],
    'slotted text');
}

// ── Documented arithmetic ───────────────────────────────────────────────────

/**
 * `setPrimarySize(size)` sets the primary percentage, and the two documented
 * minimums are what bound it: the primary may not go below `minPrimarySize`,
 * and the secondary may not go below `minSecondarySize` (so the primary may not
 * exceed `100 - minSecondarySize`).
 */
export function clampedSize(size: number, minPrimary: number, minSecondary: number): number {
  return Math.max(minPrimary, Math.min(100 - minSecondary, size));
}

/**
 * `snapSize` — "percentage, 0 = no snap". A non-zero snap size makes the
 * resulting primary size land on a multiple of it, and the documented input
 * methods are all three of "Mouse, touch, and keyboard".
 */
export function snapped(size: number, snapSize: number): number {
  if (snapSize <= 0) return size;
  return Math.round(size / snapSize) * snapSize;
}

/** The event a resize is documented to emit. */
export function checkResizeEvent(
  problems: Problems,
  events: ResizeDetail[],
  el: HTMLElement,
  expectedPrimary: number,
  what: string,
): void {
  if (!problems.check(events.length > 0, `${what}: no pane-resize event`)) return;
  const last = events[events.length - 1];
  problems.equal(last.primarySize, expectedPrimary, `${what}: detail.primarySize`);
  problems.equal(last.secondarySize, 100 - expectedPrimary, `${what}: detail.secondarySize`);
  problems.check(last.splitPane === el, `${what}: detail.splitPane is not the element`);
}

/** The arrow key that shrinks the primary pane, for a given direction. */
export const decreaseKey = (direction: Direction) =>
  (direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp');

/** The arrow key that grows the primary pane, for a given direction. */
export const increaseKey = (direction: Direction) =>
  (direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown');

/** The two arrow keys that lie ACROSS the split, and so must move nothing. */
export const crossAxisKeys = (direction: Direction) =>
  (direction === 'horizontal' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']);

/** Press a key on the divider and let the render settle. */
export async function pressDivider(el: HTMLElement, key: string): Promise<void> {
  press(part(el, 'divider'), key);
  await wait(SETTLE);
}

/**
 * Press the same key `times` in a row, settling once at the end.
 *
 * The keyboard handler updates `primarySize` synchronously, so the intermediate
 * renders carry no information a bound check needs — and settling between every
 * one of a few hundred presses would cost more wall clock than the rest of this
 * component's matrix put together.
 */
export async function pressDividerMany(el: HTMLElement, key: string, times: number): Promise<void> {
  const divider = part(el, 'divider');
  for (let i = 0; i < times; i++) press(divider, key);
  await wait(SETTLE);
}
