/**
 * snice-grid matrix — the documented collision algorithm.
 *
 * docs/ai/components/grid.md states it as three numbered rules:
 *
 *   1. Swap — "single occupant in target area swaps positions with incoming
 *      item";
 *   2. Push-right-then-down — "fallback if swap fails (multiple occupants or
 *      occupant doesn't fit at swap position)";
 *   3. Column clamping — "if `col + colspan > columns`, col is clamped to
 *      `columns - colspan`".
 *
 * Every scenario below is hand-derived from those three sentences — the oracle
 * deliberately does NOT re-implement the resolver, because an oracle that
 * mirrors the implementation proves nothing.
 *
 * 20 combos + 2 findings.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { finding } from '../matrix-utils';
import {
  cleanupGrid, expectPlacements, makeGrid, wait,
  type GridOptions, type MountedGrid, type Placement,
} from './grid-matrix-utils';

const BASE: GridOptions = { columnWidth: 100, rowHeight: 100, gap: '10px' };

let mounted: MountedGrid | undefined;
afterEach(() => { cleanupGrid(mounted); mounted = undefined; });

describe('grid matrix: rule 1 — swap', () => {
  // Two 1x1 neighbours, moving one onto the other: a single occupant, which the
  // docs say swaps with the incoming item.
  const PAIRS: Array<{ from: Placement; onto: Placement }> = [
    { from: { col: 0, row: 0 }, onto: { col: 1, row: 0 } },
    { from: { col: 1, row: 0 }, onto: { col: 0, row: 0 } },
    { from: { col: 0, row: 0 }, onto: { col: 0, row: 1 } },
    { from: { col: 2, row: 2 }, onto: { col: 0, row: 0 } },
  ];

  for (const pair of PAIRS) {
    const label = `(${pair.from.col},${pair.from.row}) onto (${pair.onto.col},${pair.onto.row})`;
    it(`${label}: the single occupant takes the incoming item's place`, async () => {
      mounted = await makeGrid(BASE, [
        { name: 'mover', col: pair.from.col, row: pair.from.row },
        { name: 'sitter', col: pair.onto.col, row: pair.onto.row },
      ]);
      mounted.grid.fit(mounted.item('mover'), pair.onto.col, pair.onto.row);
      await wait(30);

      expectPlacements(mounted, BASE, {
        mover: { col: pair.onto.col, row: pair.onto.row },
        sitter: { col: pair.from.col, row: pair.from.row },
      });
    });
  }

  it('a swap survives a second layout pass', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 1, row: 0 },
    ]);
    mounted.grid.fit(mounted.item('a'), 1, 0);
    await wait(30);
    mounted.grid.layout();
    await wait(30);
    expectPlacements(mounted, BASE, { a: { col: 1, row: 0 }, b: { col: 0, row: 0 } });
  });

  it('a spanning item swaps with a single occupant of the same shape', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'wide', col: 0, row: 0, colspan: 2 },
      { name: 'other', col: 0, row: 1, colspan: 2 },
    ]);
    mounted.grid.fit(mounted.item('other'), 0, 0);
    await wait(30);
    expectPlacements(mounted, BASE, {
      other: { col: 0, row: 0, colspan: 2 },
      wide: { col: 0, row: 1, colspan: 2 },
    });
  });
});

describe('grid matrix: rule 3 — column clamping', () => {
  // "if col + colspan > columns, col is clamped to columns - colspan"
  const CASES: Array<{ columns: number; col: number; colspan: number; clamped: number }> = [
    { columns: 3, col: 2, colspan: 2, clamped: 1 },
    { columns: 3, col: 3, colspan: 1, clamped: 2 },
    { columns: 4, col: 3, colspan: 2, clamped: 2 },
    { columns: 4, col: 1, colspan: 2, clamped: 1 },   // fits: not clamped
    { columns: 0, col: 9, colspan: 2, clamped: 9 },   // no column limit at all
    { columns: 2, col: 0, colspan: 2, clamped: 0 },   // exactly fills the row
  ];

  for (const shape of CASES) {
    it(`columns=${shape.columns}: col ${shape.col} span ${shape.colspan} -> col ${shape.clamped}`, async () => {
      const opts: GridOptions = { ...BASE, columns: shape.columns };
      mounted = await makeGrid(opts, [
        { name: 'a', col: shape.col, row: 0, colspan: shape.colspan },
      ]);
      expectPlacements(mounted, opts, {
        a: { col: shape.clamped, row: 0, colspan: shape.colspan },
      });
    });
  }

  it('clamping applies to every item in the row, not just the first', async () => {
    const opts: GridOptions = { ...BASE, columns: 3 };
    mounted = await makeGrid(opts, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 5, row: 1 },
      { name: 'c', col: 4, row: 2, colspan: 2 },
    ]);
    expectPlacements(mounted, opts, {
      a: { col: 0, row: 0 },
      b: { col: 2, row: 1 },
      c: { col: 1, row: 2, colspan: 2 },
    });
  });
});

describe('grid matrix: rule 2 — push-right-then-down', () => {
  it('an item authored onto an occupied cell is pushed to the next free one', async () => {
    // Neither item has moved, so there is no swap position to swap to: the
    // second one authored at an occupied cell takes the fallback.
    mounted = await makeGrid(BASE, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 0, row: 0 },
      { name: 'c', col: 0, row: 0 },
    ]);
    expectPlacements(mounted, BASE, {
      a: { col: 0, row: 0 },
      b: { col: 1, row: 0 },
      c: { col: 2, row: 0 },
    });
  });

  it('the push wraps to the next row when the column count is exhausted', async () => {
    const opts: GridOptions = { ...BASE, columns: 2 };
    mounted = await makeGrid(opts, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 0, row: 0 },
      { name: 'c', col: 0, row: 0 },
      { name: 'd', col: 0, row: 0 },
    ]);
    expectPlacements(mounted, opts, {
      a: { col: 0, row: 0 },
      b: { col: 1, row: 0 },
      c: { col: 0, row: 1 },
      d: { col: 1, row: 1 },
    });
  });

  it('a spanning item is pushed to the next place it actually fits', async () => {
    const opts: GridOptions = { ...BASE, columns: 4 };
    mounted = await makeGrid(opts, [
      { name: 'a', col: 0, row: 0 },
      { name: 'b', col: 1, row: 0 },
      { name: 'wide', col: 0, row: 0, colspan: 2 },
    ]);
    expectPlacements(mounted, opts, {
      a: { col: 0, row: 0 },
      b: { col: 1, row: 0 },
      wide: { col: 2, row: 0, colspan: 2 },
    });
  });

  // ── Findings ──────────────────────────────────────────────────────────────

  /**
   * Rule 2 names "multiple occupants" as a case where SWAP FAILS and the
   * incoming item takes the push-right-then-down fallback instead.
   */
  it(
    `${finding('MATRIX-grid-1', 'a target area with MULTIPLE occupants swaps instead of taking the documented push-right-then-down fallback')} (fixed)`,
    async () => {
      mounted = await makeGrid(BASE, [
        { name: 'a', col: 0, row: 0 },
        { name: 'b', col: 1, row: 0 },
        { name: 'wide', col: 0, row: 1, colspan: 2 },
      ]);
      // `wide` moves onto (0,0), whose 2x1 area holds TWO occupants.
      mounted.grid.fit(mounted.item('wide'), 0, 0);
      await wait(30);

      // Swap fails -> push right then down from (0,0): (0,0) and (1,0) are
      // taken, so a 2-wide item first fits at (2,0). a and b do not move.
      expectPlacements(mounted, BASE, {
        a: { col: 0, row: 0 },
        b: { col: 1, row: 0 },
        wide: { col: 2, row: 0, colspan: 2 },
      });
    },
  );

  /**
   * The other half of rule 2's parenthesis — "occupant doesn't fit at swap
   * position". Here the single occupant cannot go where the incoming item came
   * from (the incoming item's new area covers it), so the swap fails and the
   * INCOMING item is pushed.
   */
  it(
    `${finding('MATRIX-grid-2', 'when the occupant does not fit at the swap position the OCCUPANT is pushed, not the incoming item')} (fixed)`,
    async () => {
      mounted = await makeGrid(BASE, [
        { name: 'a', col: 0, row: 0 },
        { name: 'wide', col: 1, row: 0, colspan: 2 },
      ]);
      // `wide` moves onto (0,0): its new area covers (0,0) and (1,0), so `a`
      // cannot take the swap position (1,0) that `wide` vacated.
      mounted.grid.fit(mounted.item('wide'), 0, 0);
      await wait(30);

      // Swap fails -> `wide` is pushed right-then-down from (0,0) and lands
      // back at (1,0); `a` never moves.
      expectPlacements(mounted, BASE, {
        a: { col: 0, row: 0 },
        wide: { col: 1, row: 0, colspan: 2 },
      });
    },
  );

  it('a hidden item occupies nothing, so nothing collides with it', async () => {
    mounted = await makeGrid(BASE, [
      { name: 'ghost', col: 0, row: 0, hidden: true },
      { name: 'a', col: 0, row: 0 },
    ]);
    expectPlacements(mounted, BASE, { a: { col: 0, row: 0 } });
    expect(mounted.item('ghost').style.transform, 'a hidden item was positioned').toBe('');
  });
});
