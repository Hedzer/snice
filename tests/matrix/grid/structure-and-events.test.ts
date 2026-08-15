/**
 * snice-grid matrix — structure, custom properties and events.
 *
 * Documented surface:
 *   · CSS part `base` — "The inner container element", and the note "Inner
 *     container has `role="list"`";
 *   · `--grid-gap` "(set via `gap` property)" and `--grid-transition-duration`
 *     "(set via `transition-duration` property)";
 *   · "FOUC prevented via `[ready]` attribute gating transitions";
 *   · `stagger` — "ms delay between each item transition";
 *   · `draggable` — "enable drag-to-reorder with snap-to-grid", and the drag
 *     classes `.grid-dragging` / `.grid-positioning`;
 *   · `grid-layout-complete` → `{ items: HTMLElement[] }` and
 *     `grid-drag-item-positioned` → `{ item, col, row }`.
 *
 * 24 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  cleanupGrid, gapPixels, makeGrid, wait,
  type GridOptions, type ItemSpec, type MountedGrid,
} from './grid-matrix-utils';

const BASE: GridOptions = { columnWidth: 100, rowHeight: 100, gap: '10px' };

const THREE: ItemSpec[] = [
  { name: 'a', col: 0, row: 0 },
  { name: 'b', col: 1, row: 0 },
  { name: 'c', col: 2, row: 0 },
];

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

function base(grid: any): HTMLElement {
  return grid.shadowRoot.querySelector('[part~="base"]');
}

describe('grid matrix: structure', () => {
  it('exposes part="base" as the inner container, with role="list"', async () => {
    mounted = await makeGrid(BASE, THREE);
    const container = base(mounted.grid);
    expect(container, 'part="base" missing').toBeTruthy();
    expect(container.getAttribute('role')).toBe('list');
  });

  it('gives every item a list-item role', async () => {
    mounted = await makeGrid(BASE, THREE);
    expect(mounted.items().map(item => item.getAttribute('role')))
      .toEqual(['listitem', 'listitem', 'listitem']);
  });

  it('does not overwrite an authored role', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0, role: 'button' },
      { name: 'b', col: 1, row: 0 },
    ]);
    expect(mounted.item('a').getAttribute('role')).toBe('button');
    expect(mounted.item('b').getAttribute('role')).toBe('listitem');
  });

  it('leaves an <li> as a list item in its own right', async () => {
    mounted = await makeGrid(BASE, [{ name: 'a', col: 0, row: 0, tag: 'li' }]);
    expect(mounted.item('a').getAttribute('role')).toBeNull();
  });

  it('flags itself [ready] once the first layout has been committed', async () => {
    mounted = await makeGrid(BASE, THREE);
    await wait(60);
    expect(mounted.grid.hasAttribute('ready'), '[ready] never set — transitions stay gated')
      .toBe(true);
  });

  it('renders the drop placeholder the drag interaction uses', async () => {
    mounted = await makeGrid({ ...BASE, draggable: true }, THREE);
    expect(mounted.grid.shadowRoot.querySelector('.grid-drop-placeholder')).toBeTruthy();
  });

  it('reflects draggable as an attribute, both ways', async () => {
    mounted = await makeGrid({ ...BASE, draggable: true }, THREE);
    expect(mounted.grid.hasAttribute('draggable')).toBe(true);
    mounted.grid.draggable = false;
    await wait(30);
    expect(mounted.grid.hasAttribute('draggable')).toBe(false);
    mounted.grid.draggable = true;
    await wait(30);
    expect(mounted.grid.hasAttribute('draggable')).toBe(true);
  });
});

describe('grid matrix: custom properties', () => {
  for (const gap of ['0px', '8px', '1rem', '24px']) {
    it(`gap="${gap}" is published as --grid-gap and used for the geometry`, async () => {
      const opts: GridOptions = { ...BASE, gap };
      mounted = await makeGrid(opts, THREE);
      expect(mounted.grid.style.getPropertyValue('--grid-gap')).toBe(gap);
      // …and the same value drives the box, so the two cannot drift apart.
      expect(mounted.item('b').style.transform)
        .toBe(`translate(${100 + gapPixels(gap)}px, 0px)`);
    });
  }

  for (const duration of ['0.4s', '0s', '250ms']) {
    it(`transition-duration="${duration}" is published as --grid-transition-duration`, async () => {
      mounted = await makeGrid({ ...BASE, transitionDuration: duration }, THREE);
      expect(mounted.grid.style.getPropertyValue('--grid-transition-duration')).toBe(duration);
    });
  }

  it('a later gap change republishes the custom property and re-lays out', async () => {
    mounted = await makeGrid(BASE, THREE);
    mounted.grid.gap = '30px';
    await wait(60);
    expect(mounted.grid.style.getPropertyValue('--grid-gap')).toBe('30px');
    expect(mounted.item('b').style.transform).toBe('translate(130px, 0px)');
  });
});

describe('grid matrix: stagger', () => {
  for (const stagger of [0, 25, 100]) {
    it(`stagger=${stagger} delays each item's transition by ${stagger}ms more than the last`, async () => {
      mounted = await makeGrid({ ...BASE, stagger }, THREE);
      const delays = mounted.items().map(item => item.style.transitionDelay);
      // "ms delay between each item transition": the first item waits for
      // nothing (an unset transition-delay IS zero), each later one waits one
      // more `stagger` than the item before it.
      const expected = stagger > 0
        ? ['', `${stagger}ms`, `${2 * stagger}ms`]
        : ['', '', ''];
      expect(delays).toEqual(expected);
    });
  }
});

describe('grid matrix: events', () => {
  it('grid-layout-complete carries the items that were laid out', async () => {
    mounted = await makeGrid(BASE, THREE);
    const seen: any[] = [];
    mounted.grid.addEventListener('grid-layout-complete', (event: any) => seen.push(event.detail));
    mounted.grid.layout();
    await wait(30);

    expect(seen, 'no grid-layout-complete on an explicit layout()').toHaveLength(1);
    expect(seen[0].items.map((item: HTMLElement) => item.getAttribute('name')))
      .toEqual(['a', 'b', 'c']);
  });

  it('grid-layout-complete crosses the shadow boundary', async () => {
    mounted = await makeGrid(BASE, THREE);
    const seen: any[] = [];
    document.addEventListener('grid-layout-complete', (event: any) => seen.push(event.detail));
    mounted.grid.layout();
    await wait(30);
    expect(seen.length).toBeGreaterThan(0);
  });

  it('every documented mutation entry point reports a completed layout', async () => {
    mounted = await makeGrid(BASE, THREE);
    const seen: string[] = [];
    mounted.grid.addEventListener('grid-layout-complete', () => seen.push('layout'));

    mounted.grid.fit(mounted.item('a'), 0, 1);
    await wait(30);
    mounted.grid.setLayout({ a: { col: 0, row: 0, colspan: 1, rowspan: 1, order: 0 } });
    await wait(30);
    mounted.grid.reloadItems();
    await wait(40);

    expect(seen.length, 'fit/setLayout/reloadItems did not all report a layout')
      .toBeGreaterThanOrEqual(3);
  });

  it('the items reported are the live item elements', async () => {
    mounted = await makeGrid(BASE, THREE);
    let detail: any;
    mounted.grid.addEventListener('grid-layout-complete', (event: any) => { detail = event.detail; });
    mounted.grid.layout();
    await wait(30);
    expect(detail.items[0]).toBe(mounted.item('a'));
  });
});
