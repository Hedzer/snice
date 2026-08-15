// Shared oracle for the snice-virtual-scroller feature-combination matrix.
//
// SIMULATION BOUNDARY: happy-dom performs no layout, so the component's
// `this.offsetHeight || 400` fallback would silently decide every expectation.
// `makeScroller` pins `offsetHeight` explicitly, so "the viewport is 400px
// tall" is a stated premise of each combo rather than an accident of the
// environment. Nothing else is stubbed: the spacer height, the viewport
// transform, and the rendered window are all the component's own output.
//
// Every expectation below comes from docs/ai/components/virtual-scroller.md.
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/virtual-scroller/snice-virtual-scroller';

export { wait };

export interface Item { id: string | number; data: any; height?: number }

export const VIEWPORT_HEIGHT = 400;

/** N items whose data is a stable, index-derived string. */
export function items(count: number, height?: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    data: `Item ${i + 1}`,
    ...(height === undefined ? {} : { height }),
  }));
}

export async function makeScroller(opts: {
  items: Item[];
  itemHeight?: number;
  bufferSize?: number;
  estimatedItemHeight?: number;
  renderItem?: (item: Item, index: number) => string | HTMLElement;
  viewportHeight?: number;
}) {
  const el = document.createElement('snice-virtual-scroller') as any;
  if (opts.itemHeight !== undefined) el.setAttribute('item-height', String(opts.itemHeight));
  if (opts.bufferSize !== undefined) el.setAttribute('buffer-size', String(opts.bufferSize));
  if (opts.estimatedItemHeight !== undefined) {
    el.setAttribute('estimated-item-height', String(opts.estimatedItemHeight));
  }
  Object.defineProperty(el, 'offsetHeight', {
    get: () => opts.viewportHeight ?? VIEWPORT_HEIGHT,
    configurable: true,
  });
  document.body.appendChild(el);
  await el.ready;

  if (opts.renderItem) el.renderItem = opts.renderItem;
  el.items = opts.items;
  el.refresh();
  await wait(0);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function scrollerEl(el: any): HTMLElement {
  return el.shadowRoot.querySelector('.scroller');
}

export function spacerHeight(el: any): number {
  const spacer = el.shadowRoot.querySelector('.scroller__spacer') as HTMLElement;
  return parseFloat(spacer.style.height);
}

export function viewportOffset(el: any): number {
  const viewport = el.shadowRoot.querySelector('.scroller__viewport') as HTMLElement;
  const match = viewport.style.transform.match(/translateY\((-?[\d.]+)px\)/);
  return match ? parseFloat(match[1]) : NaN;
}

export function renderedItems(el: any): HTMLElement[] {
  return [...el.shadowRoot.querySelectorAll('.scroller__item')] as HTMLElement[];
}

export function renderedIndices(el: any): number[] {
  return renderedItems(el).map(node => Number(node.getAttribute('data-index')));
}

/** Absolute top of a rendered item = viewport offset + its own `top`. */
export function absoluteTops(el: any): number[] {
  const offset = viewportOffset(el);
  return renderedItems(el).map(node => offset + parseFloat(node.style.top));
}

export function itemHeights(el: any): number[] {
  return renderedItems(el).map(node => parseFloat(node.style.height));
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * "Efficiently renders large lists by only displaying visible items" +
 * `bufferSize` (docs).
 *
 * Three claims, all of them the docs' own, none of them a copy of the
 * component's arithmetic:
 *
 *  1. COVERAGE — every item whose box intersects the viewport is rendered.
 *     A virtual scroller that misses one shows a hole.
 *  2. BUFFER — at least `bufferSize` further items are rendered on each side,
 *     clamped by the ends of the list. That is what `bufferSize` buys.
 *  3. THRIFT — no more than viewport-worth + 2 x buffer items exist in the DOM.
 *     Without this the first two are satisfiable by rendering everything, which
 *     is the one thing the component exists not to do.
 *
 * `scrollTop` is always a whole number of items here, because `scrollToIndex()`
 * — the documented way to move — always produces `index * itemHeight`.
 */
export function expectWindow(el: any, opts: {
  total: number; itemHeight: number; bufferSize: number;
  scrollTop: number; viewportHeight?: number;
}) {
  const viewport = opts.viewportHeight ?? VIEWPORT_HEIGHT;
  const firstVisible = Math.floor(opts.scrollTop / opts.itemHeight);
  const lastVisible = Math.min(
    opts.total - 1,
    Math.floor((opts.scrollTop + viewport - 1) / opts.itemHeight),
  );
  const viewportCount = Math.ceil(viewport / opts.itemHeight);

  const range = el.getVisibleRange();
  const indices = renderedIndices(el);
  const problems: string[] = [];

  // getVisibleRange() is the documented accessor; the DOM must agree with it.
  const expectedIndices = Array.from(
    { length: Math.max(0, range.end - range.start) },
    (_, i) => range.start + i,
  );
  if (JSON.stringify(indices) !== JSON.stringify(expectedIndices)) {
    problems.push(`DOM indices ${JSON.stringify(indices)} != getVisibleRange ${JSON.stringify(expectedIndices)}`);
  }

  // 1. coverage
  if (range.start > firstVisible) {
    problems.push(`start ${range.start} skips visible item ${firstVisible}`);
  }
  if (range.end <= lastVisible) {
    problems.push(`end ${range.end} skips visible item ${lastVisible}`);
  }

  // 2. buffer, clamped at the list edges
  const wantStart = Math.max(0, firstVisible - opts.bufferSize);
  const wantEnd = Math.min(opts.total, lastVisible + 1 + opts.bufferSize);
  if (range.start > wantStart) problems.push(`start ${range.start} > buffered start ${wantStart}`);
  if (range.end < wantEnd) problems.push(`end ${range.end} < buffered end ${wantEnd}`);

  // 3. thrift
  const budget = Math.min(opts.total, viewportCount + 2 * opts.bufferSize);
  if (indices.length > budget) {
    problems.push(`rendered ${indices.length} items, budget ${budget}`);
  }

  // The spacer is what gives the scrollbar its extent; the viewport is offset
  // so the rendered window lands where those items belong.
  if (spacerHeight(el) !== opts.total * opts.itemHeight) {
    problems.push(`spacer ${spacerHeight(el)} != ${opts.total * opts.itemHeight}`);
  }
  if (viewportOffset(el) !== range.start * opts.itemHeight) {
    problems.push(`viewport offset ${viewportOffset(el)} != ${range.start * opts.itemHeight}`);
  }

  expect(problems).toEqual([]);
}
