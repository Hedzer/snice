// Shared oracle for the snice-binpack feature-combination matrix.
//
// SIMULATION BOUNDARY (state it up front, the way height-fill-support does):
// happy-dom performs no layout, so `offsetWidth`, `offsetHeight`,
// `clientWidth` and `clientHeight` all read 0 and the packer would place every
// item at (0,0) forever. `stubBoxes` supplies exactly those four measurements —
// nothing else about the component is touched — so the documented layout rules
// become observable in a unit environment.
//
// What that means for the assertions below: this tier pins the RULES the docs
// state (items are absolutely positioned via `transform: translate()`, packed
// without overlap inside the container's constrained axis, snapped to
// `column-width`/`row-height` multiples, mirrored by `origin-left`/`origin-top`,
// delayed by `stagger`, skipped when `hidden`, flowed around when stamped) and
// NOT the browser's own box arithmetic. Real measured boxes are the visual
// tier's job: tests/live/matrix/binpack-visual.spec.ts.
//
// docs/ai/components/binpack.md is the source of every expectation here.
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/binpack/snice-binpack';

export { wait };

export interface ItemSpec {
  /** `name` attribute — the key getLayout()/setLayout() address items by. */
  name: string;
  width: number;
  height: number;
  hidden?: boolean;
}

export interface Placement {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pin the boxes the packer measures.
 *
 * `performLayout()` reads `this.clientWidth`/`this.clientHeight` for the
 * container and `item.offsetWidth`/`item.offsetHeight` per item; `getLayout()`
 * and the stamp path additionally read `getBoundingClientRect()`. Every one of
 * those is defined here from the SAME numbers, so a reader can never be misled
 * by a box that is declared in one place and measured in another.
 */
export function stubBox(el: HTMLElement, width: number, height: number, originX = 0, originY = 0) {
  for (const [prop, value] of [
    ['offsetWidth', width], ['offsetHeight', height],
    ['clientWidth', width], ['clientHeight', height],
  ] as const) {
    Object.defineProperty(el, prop, { get: () => value, configurable: true });
  }
  // The rect follows the element's own transform so stamped/fitted items report
  // where the packer actually put them, not a frozen origin.
  el.getBoundingClientRect = (() => {
    const t = parseTransform(el);
    const left = originX + (t?.x ?? 0);
    const top = originY + (t?.y ?? 0);
    return {
      x: left, y: top, left, top,
      right: left + width, bottom: top + height,
      width, height, toJSON: () => ({}),
    } as DOMRect;
  }) as any;
}

/** `translate(<x>px, <y>px)` on an item, or null when it was never placed. */
export function parseTransform(el: HTMLElement): { x: number; y: number } | null {
  const match = el.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

export interface MakeOpts {
  items: ItemSpec[];
  containerWidth?: number;
  containerHeight?: number;
  attrs?: Record<string, string>;
  /** Assigned as properties AFTER upgrade (numbers/booleans that have attributes too). */
  props?: Record<string, any>;
}

export const DEFAULT_CONTAINER_WIDTH = 400;
export const DEFAULT_CONTAINER_HEIGHT = 300;

/**
 * Build a binpack with slotted, box-stubbed children.
 *
 * Children are appended BEFORE the host is connected, because `@ready()` runs
 * `collectItems()` + `layout()` and a child added afterwards would only be
 * picked up by the async slotchange path — which would make every combo race.
 */
export async function makeBinpack(opts: MakeOpts) {
  const host = document.createElement('snice-binpack') as any;
  const width = opts.containerWidth ?? DEFAULT_CONTAINER_WIDTH;
  const height = opts.containerHeight ?? DEFAULT_CONTAINER_HEIGHT;

  for (const [key, value] of Object.entries(opts.attrs ?? {})) {
    host.setAttribute(key, value);
  }

  for (const spec of opts.items) {
    const child = document.createElement('div');
    child.setAttribute('name', spec.name);
    if (spec.hidden) child.setAttribute('hidden', '');
    child.textContent = spec.name;
    host.appendChild(child);
  }

  stubBox(host, width, height);
  document.body.appendChild(host);
  await host.ready;

  // Stub the children only after upgrade: the host's rect is the origin every
  // child rect is expressed against, so both must agree on (0, 0).
  const children = [...host.children] as HTMLElement[];
  children.forEach((child, i) => stubBox(child, opts.items[i].width, opts.items[i].height));

  for (const [key, value] of Object.entries(opts.props ?? {})) host[key] = value;

  host.layout();
  await wait(0);
  return { host, children, width, height };
}

/** Every item's placement, in DOM order, skipping items that were never placed. */
export function placements(host: any, specs: ItemSpec[]): Placement[] {
  const out: Placement[] = [];
  const children = [...host.children] as HTMLElement[];
  children.forEach((child, i) => {
    const t = parseTransform(child);
    if (!t) return;
    out.push({ name: specs[i].name, x: t.x, y: t.y, width: specs[i].width, height: specs[i].height });
  });
  return out;
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * "JS-driven bin-packing layout using the maximal rectangles algorithm.
 *  Absolute positioning with transform-based transitions." — docs, line 3.
 *
 * A bin PACKING, by definition, does not overlap its items. Assert that
 * directly rather than re-deriving the component's own placement arithmetic:
 * an oracle that recomputed the packer would only prove the packer equals
 * itself. Reports every overlapping pair at once.
 */
export function expectNoOverlap(items: Placement[]) {
  const problems: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const overlaps =
        a.x < b.x + b.width && a.x + a.width > b.x &&
        a.y < b.y + b.height && a.y + a.height > b.y;
      if (overlaps) {
        problems.push(
          `${a.name}(${a.x},${a.y} ${a.width}x${a.height}) overlaps `
          + `${b.name}(${b.x},${b.y} ${b.width}x${b.height})`,
        );
      }
    }
  }
  expect(problems).toEqual([]);
}

/**
 * The packer is "constrained by container width, infinite height" in vertical
 * mode and the mirror in horizontal mode (docs: "pack horizontally instead of
 * vertically"). So the CONSTRAINED axis must contain every item; the free axis
 * is unbounded by design.
 */
export function expectWithinBounds(items: Placement[], opts: {
  horizontal: boolean; width: number; height: number;
}) {
  const problems: string[] = [];
  for (const item of items) {
    if (item.x < -1) problems.push(`${item.name}: x ${item.x} < 0`);
    if (item.y < -1) problems.push(`${item.name}: y ${item.y} < 0`);
    if (!opts.horizontal && item.x + item.width > opts.width + 1) {
      problems.push(`${item.name}: right edge ${item.x + item.width} exceeds container width ${opts.width}`);
    }
    if (opts.horizontal && item.y + item.height > opts.height + 1) {
      problems.push(`${item.name}: bottom edge ${item.y + item.height} exceeds container height ${opts.height}`);
    }
  }
  expect(problems).toEqual([]);
}

/**
 * "columnWidth: grid snap width (0 = no grid)" / "rowHeight: grid snap height".
 *
 * A grid snap that does not land items on the grid is not a grid snap. With a
 * gutter of `gap`, cell k starts at k * (cell + gap) — which is exactly the
 * arithmetic `getLayout()` inverts to report `col`/`row`, so this assertion and
 * the documented layout round-trip are the same claim.
 */
export function expectOnGrid(items: Placement[], opts: {
  columnWidth: number; rowHeight: number; gap: number;
}) {
  const problems: string[] = [];
  for (const item of items) {
    if (opts.columnWidth > 0) {
      const pitch = opts.columnWidth + opts.gap;
      const k = item.x / pitch;
      if (Math.abs(k - Math.round(k)) > 0.001) {
        problems.push(`${item.name}: x ${item.x} is not a multiple of column pitch ${pitch}`);
      }
    }
    if (opts.rowHeight > 0) {
      const pitch = opts.rowHeight + opts.gap;
      const k = item.y / pitch;
      if (Math.abs(k - Math.round(k)) > 0.001) {
        problems.push(`${item.name}: y ${item.y} is not a multiple of row pitch ${pitch}`);
      }
    }
  }
  expect(problems).toEqual([]);
}

/** Placements keyed by name, for relational (mirror / stability) assertions. */
export function byName(items: Placement[]): Record<string, Placement> {
  return Object.fromEntries(items.map(i => [i.name, i]));
}

// ── Item sets ───────────────────────────────────────────────────────────────
//
// Three shapes, chosen so the packer has something to do in every combo:
// UNIFORM cannot hide a mis-sorted free list (every item is interchangeable),
// MIXED forces the maximal-rectangles split to produce more than one usable
// strip, and WIDE forces at least one wrap on a 400px container.

export const UNIFORM: ItemSpec[] = [
  { name: 'a', width: 100, height: 100 },
  { name: 'b', width: 100, height: 100 },
  { name: 'c', width: 100, height: 100 },
  { name: 'd', width: 100, height: 100 },
];

export const MIXED: ItemSpec[] = [
  { name: 'a', width: 100, height: 100 },
  { name: 'b', width: 150, height: 80 },
  { name: 'c', width: 80, height: 120 },
  { name: 'd', width: 100, height: 60 },
  { name: 'e', width: 60, height: 60 },
];

export const WIDE: ItemSpec[] = [
  { name: 'a', width: 300, height: 90 },
  { name: 'b', width: 200, height: 90 },
  { name: 'c', width: 180, height: 50 },
];

export const ITEM_SETS: Record<string, ItemSpec[]> = { UNIFORM, MIXED, WIDE };
