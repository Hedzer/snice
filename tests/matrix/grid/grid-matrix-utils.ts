// Shared harness + oracle for the snice-grid feature-combination matrix.
//
// The oracle is derived from docs/ai/components/grid.md, not from observed
// output. Two documented rules do all the work:
//
//   * "Items sized automatically from columnWidth/rowHeight + colspan/rowspan"
//     and "items get `position: absolute` + `transform`" — so an item at
//     (col, row) spanning (colspan, rowspan) has a KNOWN box:
//         width  = colspan * columnWidth + (colspan - 1) * gap
//         height = rowspan * rowHeight   + (rowspan - 1) * gap
//         x      = col * (columnWidth + gap)
//         y      = row * (rowHeight    + gap)
//     with `origin-left`/`origin-top` false measuring from the opposite edge:
//         x = clientWidth  - x - width
//         y = clientHeight - y - height
//
//   * The container is `columns` (or the widest occupied column) cells wide and
//     `rows` (or the tallest occupied row) cells tall, gaps included.
//
// That makes every non-colliding placement exactly predictable, which is what
// lets this matrix cross gap x cell size x origin x span without hand-writing
// an expectation per combo. Collision resolution is documented as a THREE-RULE
// algorithm (swap, push-right-then-down, column clamping) and is asserted from
// hand-derived scenarios in collision.test.ts rather than by re-implementing
// the resolver here — an oracle that mirrors the implementation proves nothing.
//
// happy-dom performs no layout, but this component does not need it to: every
// number above is computed by the component from its own properties and written
// to inline styles. The one exception is `clientWidth`/`clientHeight`, which the
// origin flips read from the real box; `stubHostBox` pins those so the flipped
// formula has meaningful operands.
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/grid/snice-grid';

export { wait };

export interface GridOptions {
  columnWidth?: number;
  rowHeight?: number;
  gap?: string;
  columns?: number;
  rows?: number;
  originLeft?: boolean;
  originTop?: boolean;
  stagger?: number;
  draggable?: boolean;
  resize?: boolean;
  transitionDuration?: string;
}

export interface ItemSpec {
  name: string;
  col?: number;
  row?: number;
  colspan?: number;
  rowspan?: number;
  hidden?: boolean;
  /** Authored role, to prove the component does not overwrite one. */
  role?: string;
  tag?: string;
}

export interface Placement {
  col: number;
  row: number;
  colspan?: number;
  rowspan?: number;
}

export const DEFAULTS = {
  columnWidth: 80,
  rowHeight: 80,
  gap: '1rem',
  columns: 0,
  rows: 0,
} as const;

/** The documented root font size the rem conversion is measured against. */
export function rootFontSize(): number {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * The documented gap→pixels conversion, for the two unit families the matrix
 * uses. `px` is its own value; `rem` is relative to the root font size. Other
 * units are measured by the component against a probe element, which is not a
 * documented number, so the matrix stays out of them.
 */
export function gapPixels(gap: string): number {
  if (gap.endsWith('px')) return parseFloat(gap);
  if (gap.endsWith('rem')) return parseFloat(gap) * rootFontSize();
  throw new Error(`gapPixels: "${gap}" is not a documented-computable gap unit`);
}

const attrFor: Record<string, string> = {
  columnWidth: 'column-width',
  rowHeight: 'row-height',
  originLeft: 'origin-left',
  originTop: 'origin-top',
  transitionDuration: 'transition-duration',
  dragThrottle: 'drag-throttle',
};

function markup(items: ItemSpec[]): string {
  return items.map(item => {
    const tag = item.tag ?? 'div';
    const attrs = [
      `name="${item.name}"`,
      `grid-col="${item.col ?? 0}"`,
      `grid-row="${item.row ?? 0}"`,
      item.colspan != null ? `grid-colspan="${item.colspan}"` : '',
      item.rowspan != null ? `grid-rowspan="${item.rowspan}"` : '',
      item.hidden ? 'hidden' : '',
      item.role ? `role="${item.role}"` : '',
    ].filter(Boolean).join(' ');
    return `<${tag} ${attrs}>${item.name}</${tag}>`;
  }).join('');
}

export interface MountedGrid {
  grid: any;
  host: HTMLElement;
  /** Items in DOM order at mount time, by name. */
  item(name: string): HTMLElement;
  items(): HTMLElement[];
  /** Names in current DOM order. */
  order(): string[];
  settle(): Promise<void>;
}

/**
 * Mount a grid with the given options and items and let its layout settle.
 * The grid is created from markup so the items are present at the first
 * `@ready()` collectItems() — the documented mount path.
 */
export async function makeGrid(opts: GridOptions, items: ItemSpec[]): Promise<MountedGrid> {
  const host = document.createElement('div');
  const attrs = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${attrFor[k] ?? k}="${v}"`)
    .join(' ');
  host.innerHTML = `<snice-grid ${attrs}>${markup(items)}</snice-grid>`;
  document.body.appendChild(host);
  const grid: any = host.querySelector('snice-grid');
  await grid.ready;
  await wait(40);

  const mounted: MountedGrid = {
    grid,
    host,
    item: (name: string) => grid.querySelector(`[name="${name}"]`) as HTMLElement,
    items: () => [...grid.children] as HTMLElement[],
    order: () => [...grid.children].map(c => c.getAttribute('name') ?? '(unnamed)'),
    settle: async () => { await wait(40); },
  };
  return mounted;
}

export function cleanupGrid(mounted?: MountedGrid) {
  mounted?.host.remove();
}

/**
 * Pin the host's content box. The origin flips are the only part of the
 * documented formula that reads the live box, and happy-dom reports 0 for it.
 */
export function stubHostBox(grid: HTMLElement, width: number, height: number) {
  Object.defineProperty(grid, 'clientWidth', { value: width, configurable: true });
  Object.defineProperty(grid, 'clientHeight', { value: height, configurable: true });
}

export interface ExpectedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The documented box of an item at a resolved grid position. */
export function expectedBox(
  opts: GridOptions,
  placement: Placement,
  hostBox: { width: number; height: number } = { width: 0, height: 0 },
): ExpectedBox {
  const cw = opts.columnWidth ?? DEFAULTS.columnWidth;
  const rh = opts.rowHeight ?? DEFAULTS.rowHeight;
  const gap = gapPixels(opts.gap ?? DEFAULTS.gap);
  const colspan = placement.colspan ?? 1;
  const rowspan = placement.rowspan ?? 1;

  const width = colspan * cw + (colspan - 1) * gap;
  const height = rowspan * rh + (rowspan - 1) * gap;
  let x = placement.col * (cw + gap);
  let y = placement.row * (rh + gap);
  if (opts.originLeft === false) x = hostBox.width - x - width;
  if (opts.originTop === false) y = hostBox.height - y - height;
  return { x, y, width, height };
}

/** The documented container box for a resolved layout. */
export function expectedContainerSize(
  opts: GridOptions,
  placements: Placement[],
): { width: string; height: string } {
  const cw = opts.columnWidth ?? DEFAULTS.columnWidth;
  const rh = opts.rowHeight ?? DEFAULTS.rowHeight;
  const gap = gapPixels(opts.gap ?? DEFAULTS.gap);
  const maxCol = placements.reduce((m, p) => Math.max(m, p.col + (p.colspan ?? 1)), 0);
  const maxRow = placements.reduce((m, p) => Math.max(m, p.row + (p.rowspan ?? 1)), 0);
  const cols = (opts.columns ?? 0) > 0 ? opts.columns! : maxCol;
  const rows = (opts.rows ?? 0) > 0 ? opts.rows! : maxRow;
  return {
    width: cols > 0 ? `${cols * cw + (cols - 1) * gap}px` : '',
    height: rows > 0 ? `${rows * rh + (rows - 1) * gap}px` : '',
  };
}

/** Rendered transform of an item, as the component writes it. */
export function transformOf(el: HTMLElement): string {
  return el.style.transform;
}

export function transformFor(box: ExpectedBox): string {
  return `translate(${box.x}px, ${box.y}px)`;
}

/**
 * THE ORACLE. Every named item must sit at its expected grid coordinate with
 * the documented box, and must carry the grid-col/grid-row the resolver settled
 * on. Reports every mismatch at once.
 */
export function expectPlacements(
  mounted: MountedGrid,
  opts: GridOptions,
  expected: Record<string, Placement>,
  hostBox: { width: number; height: number } = { width: 0, height: 0 },
) {
  const problems: string[] = [];
  for (const [name, placement] of Object.entries(expected)) {
    const el = mounted.item(name);
    if (!el) { problems.push(`item "${name}" is not in the grid`); continue; }
    const box = expectedBox(opts, placement, hostBox);

    const transform = transformOf(el);
    if (transform !== transformFor(box)) {
      problems.push(`"${name}" transform "${transform}" != "${transformFor(box)}"`);
    }
    if (el.style.width !== `${box.width}px`) {
      problems.push(`"${name}" width "${el.style.width}" != "${box.width}px"`);
    }
    if (el.style.height !== `${box.height}px`) {
      problems.push(`"${name}" height "${el.style.height}" != "${box.height}px"`);
    }
    const col = el.getAttribute('grid-col');
    const row = el.getAttribute('grid-row');
    if (Number(col) !== placement.col || Number(row) !== placement.row) {
      problems.push(`"${name}" resolved to (${col}, ${row}), expected (${placement.col}, ${placement.row})`);
    }
  }
  expect(problems).toEqual([]);
}

/** The container element the grid sizes to its content. */
export function container(mounted: MountedGrid): HTMLElement {
  return mounted.grid.shadowRoot.querySelector('.grid') as HTMLElement;
}

export function expectContainer(mounted: MountedGrid, opts: GridOptions, placements: Placement[]) {
  const el = container(mounted);
  const want = expectedContainerSize(opts, placements);
  expect({ width: el.style.width, height: el.style.height }).toEqual(want);
}

/** A hidden item is out of the layout: no box is written for it at all. */
export function expectUnplaced(mounted: MountedGrid, name: string) {
  const el = mounted.item(name);
  expect(el, `item "${name}" is missing`).toBeTruthy();
  expect(el.style.transform, `hidden item "${name}" was positioned`).toBe('');
}
