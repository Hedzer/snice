/**
 * Smoke slice of the snice-binpack matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/binpack/, 92 combos across
 * packing.test.ts and layout-api.test.ts) is excluded from the default Vitest
 * include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracles (`expectNoOverlap`, `expectWithinBounds`,
 * `expectOnGrid`), so it cannot claim less than the suite it stands in for.
 *
 * The marquee combos: one per documented packing axis (vertical, horizontal,
 * grid-snapped), the layout round-trip that a saved dashboard depends on, and
 * the completion event.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeBinpack, placements, byName, expectNoOverlap, expectWithinBounds, expectOnGrid,
  MIXED, UNIFORM, DEFAULT_CONTAINER_WIDTH, DEFAULT_CONTAINER_HEIGHT, wait,
} from './binpack-matrix-utils';

let host: any = null;
afterEach(() => { host?.remove(); host = null; });

describe('binpack matrix smoke', () => {
  it('the default vertical pack places every item, without overlap, inside the width', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;

    const placed = placements(built.host, MIXED);
    expect(placed.map(p => p.name)).toEqual(MIXED.map(s => s.name));
    expectNoOverlap(placed);
    expectWithinBounds(placed, {
      horizontal: false,
      width: DEFAULT_CONTAINER_WIDTH,
      height: DEFAULT_CONTAINER_HEIGHT,
    });
  });

  it('horizontal mode packs inside the container HEIGHT instead', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px', horizontal: '' } });
    host = built.host;

    const placed = placements(built.host, MIXED);
    expectNoOverlap(placed);
    expectWithinBounds(placed, {
      horizontal: true,
      width: DEFAULT_CONTAINER_WIDTH,
      height: DEFAULT_CONTAINER_HEIGHT,
    });
  });

  it('column-width / row-height really snap every item to the grid', async () => {
    const built = await makeBinpack({
      items: UNIFORM,
      attrs: { gap: '10px', 'column-width': '100', 'row-height': '50' },
    });
    host = built.host;

    const placed = placements(built.host, UNIFORM);
    expectNoOverlap(placed);
    expectOnGrid(placed, { columnWidth: 100, rowHeight: 50, gap: 10 });
  });

  it('getLayout / setLayout round-trips order and visibility', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;

    const layout = built.host.getLayout();
    expect(Object.keys(layout).sort()).toEqual(MIXED.map(s => s.name).sort());

    // Reverse the documented `order` field and hide one item — the two things
    // `setLayout(layout)` is documented to apply ("reorder, hide/show").
    const reversed: any = {};
    const names = MIXED.map(s => s.name);
    names.forEach((name, i) => {
      reversed[name] = { ...layout[name], order: names.length - 1 - i };
    });
    reversed[names[0]] = { ...reversed[names[0]], hidden: true };

    built.host.setLayout(reversed);
    await wait(0);

    const order = [...built.host.children].map((child: any) => child.getAttribute('name'));
    expect(order).toEqual([...names].reverse());
    expect((built.host.children[order.indexOf(names[0])] as HTMLElement).hasAttribute('hidden'))
      .toBe(true);
  });

  it('binpack-layout-complete reports the items it packed', async () => {
    const seen: HTMLElement[][] = [];
    const built = await makeBinpack({ items: UNIFORM, attrs: { gap: '10px' } });
    host = built.host;
    built.host.addEventListener('binpack-layout-complete', (e: Event) => {
      seen.push((e as CustomEvent).detail.items);
    });

    built.host.layout();
    await wait(0);

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1].map(item => item.getAttribute('name')))
      .toEqual(UNIFORM.map(s => s.name));
  });

  it('a hidden item is skipped, and the rest still pack cleanly', async () => {
    const specs = MIXED.map((spec, i) => (i === 1 ? { ...spec, hidden: true } : spec));
    const built = await makeBinpack({ items: specs, attrs: { gap: '10px' } });
    host = built.host;

    const placed = placements(built.host, specs);
    const byId = byName(placed);
    expect(byId[specs[1].name]).toBeUndefined();
    expectNoOverlap(placed);
  });
});
