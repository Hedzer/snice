// snice-binpack matrix — the documented API surface crossed with the packing
// dimensions: getLayout/setLayout round-trips, stamp/unstamp, fit, hidden
// items, stagger, the three events, and the documented DOM contract
// (role=list/listitem, `[ready]` gating, the two CSS custom properties).
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeBinpack, placements, byName, parseTransform, expectNoOverlap,
  ITEM_SETS, MIXED, UNIFORM, wait,
} from './binpack-matrix-utils';

let host: any = null;
afterEach(() => { host?.remove(); host = null; });

const SETS = ['UNIFORM', 'MIXED', 'WIDE'] as const;
const GRIDS = [
  { id: 'none', columnWidth: 0, rowHeight: 0 },
  { id: 'colrow', columnWidth: 100, rowHeight: 50 },
] as const;

// ── getLayout / setLayout ───────────────────────────────────────────────────

describe('binpack matrix / getLayout', () => {
  // "getLayout() - Returns BinpackLayout with item positions/order"
  for (const setName of SETS) {
    for (const grid of GRIDS) {
      it(`${setName}/${grid.id}: order is DOM order, col/row only with a grid`, async () => {
        const specs = ITEM_SETS[setName];
        const built = await makeBinpack({
          items: specs,
          attrs: {
            gap: '10px',
            'column-width': String(grid.columnWidth),
            'row-height': String(grid.rowHeight),
          },
        });
        host = built.host;

        const layout = built.host.getLayout();

        expect(Object.keys(layout).sort()).toEqual(specs.map(s => s.name).sort());
        expect(specs.map(s => layout[s.name].order)).toEqual(specs.map((_, i) => i));

        const placed = byName(placements(built.host, specs));
        for (const spec of specs) {
          const entry = layout[spec.name];
          if (grid.columnWidth > 0) {
            // "col" is the item's x expressed in grid cells; a grid snap that
            // does not invert cleanly is not a grid snap.
            expect(entry.col).toBe(placed[spec.name].x / (grid.columnWidth + 10));
          } else {
            expect(entry.col).toBeUndefined();
          }
          if (grid.rowHeight > 0) {
            expect(entry.row).toBe(placed[spec.name].y / (grid.rowHeight + 10));
          } else {
            expect(entry.row).toBeUndefined();
          }
        }
      });
    }
  }
});

describe('binpack matrix / setLayout', () => {
  // "setLayout(layout) - Apply saved layout (reorder, hide/show)"
  const REORDERS = [
    { id: 'reverse', map: (names: string[]) => [...names].reverse() },
    { id: 'rotate', map: (names: string[]) => [...names.slice(1), names[0]] },
    { id: 'identity', map: (names: string[]) => [...names] },
  ];

  for (const setName of SETS) {
    for (const reorder of REORDERS) {
      it(`${setName}/${reorder.id}: DOM order follows the saved order`, async () => {
        const specs = ITEM_SETS[setName];
        const built = await makeBinpack({ items: specs, attrs: { gap: '10px' } });
        host = built.host;

        const target = reorder.map(specs.map(s => s.name));
        const layout = Object.fromEntries(target.map((name, order) => [name, { order }]));
        built.host.setLayout(layout);
        await wait(0);

        const domNames = [...built.host.children].map(el => el.getAttribute('name'));
        expect(domNames).toEqual(target);
      });
    }
  }

  for (const setName of SETS) {
    it(`${setName}/hidden: hidden items are hidden and skipped by layout`, async () => {
      const specs = ITEM_SETS[setName];
      const built = await makeBinpack({ items: specs, attrs: { gap: '10px' } });
      host = built.host;

      const hiddenName = specs[1].name;
      built.host.setLayout(Object.fromEntries(
        specs.map((s, order) => [s.name, { order, hidden: s.name === hiddenName }]),
      ));
      await wait(0);

      const hiddenEl = built.host.querySelector(`[name="${hiddenName}"]`) as HTMLElement;
      expect(hiddenEl.hasAttribute('hidden')).toBe(true);

      // A hidden item is not part of the packing, so the VISIBLE items must
      // still form a valid packing among themselves.
      const visible = placements(built.host, specs).filter(p => p.name !== hiddenName);
      expectNoOverlap(visible);

      // …and the round-trip reports it back.
      expect(built.host.getLayout()[hiddenName].hidden).toBe(true);
    });
  }

  it('round-trip: getLayout() -> setLayout() reproduces the same placements', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;

    const saved = built.host.getLayout();
    const before = byName(placements(built.host, MIXED));

    built.host.setLayout(saved);
    await wait(0);

    const after = byName(placements(built.host, MIXED));
    for (const spec of MIXED) {
      expect([after[spec.name].x, after[spec.name].y])
        .toEqual([before[spec.name].x, before[spec.name].y]);
    }
  });
});

// ── stamp / unstamp / fit ───────────────────────────────────────────────────

describe('binpack matrix / stamp', () => {
  // "stamp(elements) - Layout around fixed elements"
  for (const setName of SETS) {
    it(`${setName}: stamped item keeps its box and the rest flow around it`, async () => {
      const specs = ITEM_SETS[setName];
      const built = await makeBinpack({ items: specs, attrs: { gap: '10px' } });
      host = built.host;

      const stamped = built.children[0];
      const stampedAt = parseTransform(stamped)!;

      built.host.stamp(stamped);
      await wait(30);

      // "Fixed": the stamp does not move.
      expect(parseTransform(stamped)).toEqual(stampedAt);
      // "Layout around": the whole set, stamp included, is still a packing.
      expectNoOverlap(placements(built.host, specs));
    });
  }

  it('unstamp returns the element to normal layout', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;
    const before = byName(placements(built.host, MIXED));

    built.host.stamp(built.children[2]);
    await wait(30);
    built.host.unstamp(built.children[2]);
    await wait(30);

    const after = byName(placements(built.host, MIXED));
    for (const spec of MIXED) {
      expect([after[spec.name].x, after[spec.name].y])
        .toEqual([before[spec.name].x, before[spec.name].y]);
    }
  });
});

describe('binpack matrix / fit', () => {
  // "fit(element, x?, y?) - Position specific item at coordinates, reflow others"
  // "binpack-fit-complete -> { item, x, y }"
  const TARGETS = [
    { id: 'origin', x: 0, y: 0 },
    { id: 'inset', x: 120, y: 40 },
    { id: 'low', x: 20, y: 200 },
  ];

  for (const target of TARGETS) {
    it(`(${target.x},${target.y}): item lands exactly there and others reflow`, async () => {
      const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
      host = built.host;

      const item = built.children[3];
      const detail: any[] = [];
      built.host.addEventListener('binpack-fit-complete', (e: any) => detail.push(e.detail));

      built.host.fit(item, target.x, target.y);
      await wait(0);

      expect(parseTransform(item)).toEqual({ x: target.x, y: target.y });
      expect(detail).toHaveLength(1);
      expect(detail[0].item).toBe(item);
      expect([detail[0].x, detail[0].y]).toEqual([target.x, target.y]);
      expectNoOverlap(placements(built.host, MIXED));
    });
  }

  it('ignores elements that are not layout items', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;
    const stranger = document.createElement('div');
    const seen: any[] = [];
    built.host.addEventListener('binpack-fit-complete', (e: any) => seen.push(e.detail));

    built.host.fit(stranger, 10, 10);
    await wait(0);

    expect(seen).toEqual([]);
    expect(stranger.style.transform).toBe('');
  });
});

// ── stagger ─────────────────────────────────────────────────────────────────

describe('binpack matrix / stagger', () => {
  // "stagger: ms delay between each item transition"
  for (const stagger of [0, 25, 50, 120]) {
    it(`stagger=${stagger}: nth placed item is delayed n x ${stagger}ms`, async () => {
      const built = await makeBinpack({
        items: UNIFORM,
        attrs: { gap: '10px', stagger: String(stagger) },
      });
      host = built.host;

      const delays = built.children.map(c => c.style.transitionDelay);
      const expected = UNIFORM.map((_, i) => (stagger > 0 && i > 0 ? `${i * stagger}ms` : ''));
      expect(delays).toEqual(expected);
    });
  }
});

// ── DOM & event contract ────────────────────────────────────────────────────

describe('binpack matrix / documented DOM contract', () => {
  it('container is part=base with role=list; items become listitems', async () => {
    const built = await makeBinpack({ items: MIXED });
    host = built.host;
    const container = built.host.shadowRoot.querySelector('[part="base"]');
    expect(container?.getAttribute('role')).toBe('list');
    expect(built.children.map(c => c.getAttribute('role')))
      .toEqual(MIXED.map(() => 'listitem'));
  });

  it('FOUC gate: the [ready] attribute appears only after the first layout', async () => {
    const built = await makeBinpack({ items: UNIFORM });
    host = built.host;
    await wait(30);
    expect(built.host.hasAttribute('ready')).toBe(true);
  });

  for (const [gap, duration] of [['0px', '0s'], ['1rem', '0.4s'], ['24px', '1.2s']] as const) {
    it(`gap=${gap} duration=${duration} reach --binpack-gap/--binpack-transition-duration`, async () => {
      const built = await makeBinpack({
        items: UNIFORM,
        attrs: { gap, 'transition-duration': duration },
      });
      host = built.host;
      expect(built.host.style.getPropertyValue('--binpack-gap')).toBe(gap);
      expect(built.host.style.getPropertyValue('--binpack-transition-duration')).toBe(duration);
    });
  }

  it('binpack-layout-complete carries every collected item', async () => {
    const built = await makeBinpack({ items: MIXED, attrs: { gap: '10px' } });
    host = built.host;
    const seen: any[] = [];
    built.host.addEventListener('binpack-layout-complete', (e: any) => seen.push(e.detail));

    built.host.layout();
    await wait(0);

    expect(seen).toHaveLength(1);
    expect(seen[0].items).toEqual(built.children);
  });

  it('draggable reflects to the host attribute in both directions', async () => {
    const built = await makeBinpack({ items: UNIFORM });
    host = built.host;
    expect(built.host.hasAttribute('draggable')).toBe(false);
    built.host.draggable = true;
    expect(built.host.hasAttribute('draggable')).toBe(true);
    built.host.draggable = false;
    expect(built.host.hasAttribute('draggable')).toBe(false);
  });
});
