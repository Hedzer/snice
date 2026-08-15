/**
 * snice-stat-group feature-combination matrix.
 *
 * Dimensions (from docs/ai/components/stat-group.md + the .types.ts contract):
 *
 *   variant  x  columns  x  StatItem shape   = 3 x 2 x 10 = 60 structural combos
 *   shape    x  activation                   = 4 x 3      = 12 activation combos
 *                                                        --------------------
 *                                                            72 combos
 *
 * `variant` is presentation-only per the doc, so it is crossed against
 * everything precisely to assert that it changes NOTHING structural — a
 * variant that drops the trend region or the icon is the bug this cross
 * exists to catch. The paint side of `variant` belongs to the visual tier
 * (tests/live/matrix/stat-group-visual.spec.ts).
 *
 * Sized to the component: stat-group is a presentational grid of cards with
 * six optional fields and one event. Sixty structural combos exhaust its
 * documented surface; the table's thousand-combo scale would be padding.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, mount, press, removeComponent, wait,
} from '../matrix-kit';
import {
  COLUMN_SETTINGS, SHAPES, VARIANTS, cardsOf, checkColumns, checkStructure, datasetFor,
  type StatItem,
} from './stat-group-support';
import '../../../packages/components/src/stat-group/snice-stat-group';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountGroup(
  variant: string,
  columns: number,
  stats: StatItem[],
): Promise<HTMLElement> {
  el = await mount('snice-stat-group', { variant, columns }, { stats });
  return el;
}

// ── Structure: variant x columns x shape ────────────────────────────────────

describe('stat-group matrix: structure', () => {
  const combos = cross({
    variant: VARIANTS,
    // Two column settings here (auto-fit and a pinned count); the full
    // COLUMN_SETTINGS list gets its own dedicated cross below, where it is the
    // subject rather than a passenger.
    columns: [0, 2] as const,
    shape: SHAPES,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const stats = datasetFor(combo.shape);
      const group = await mountGroup(combo.variant, combo.columns, stats);
      const problems = new Problems();

      checkStructure(group, stats, problems);
      checkColumns(group, combo.columns, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Columns: every documented setting, against every variant ────────────────

describe('stat-group matrix: columns', () => {
  for (const combo of cross({ variant: VARIANTS, columns: COLUMN_SETTINGS })) {
    it(combo.id, async () => {
      const stats = datasetFor(SHAPES[5]); // trend + trendValue
      const group = await mountGroup(combo.variant, combo.columns, stats);
      const problems = new Problems();

      checkColumns(group, combo.columns, problems);
      // A column count must never change WHAT is rendered, only how it wraps.
      checkStructure(group, stats, problems);

      // Switching to auto-fit has to release the pin, not leave a stale one.
      (group as any).columns = 0;
      await wait(30);
      checkColumns(group, 0, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Activation: click, Enter, Space ─────────────────────────────────────────

describe('stat-group matrix: activation', () => {
  const ACTIVATIONS = ['click', 'Enter', ' '] as const;

  for (const combo of cross({
    shape: [SHAPES[0], SHAPES[5], SHAPES[6], SHAPES[9]],
    activation: ACTIVATIONS,
  })) {
    it(combo.id, async () => {
      const stats = datasetFor(combo.shape);
      const group = await mountGroup('card', 0, stats);
      const problems = new Problems();
      const seen = captureEvents<{ stat: StatItem; index: number }>(group, 'stat-click');

      const cards = cardsOf(group);
      if (!problems.check(cards.length === stats.length, `expected ${stats.length} cards`)) {
        expectClean(problems, combo.id);
        return;
      }

      // Activate the MIDDLE card: index 1 is the one carrying the shape, and an
      // index that is neither first nor last catches an off-by-one.
      if (combo.activation === 'click') click(cards[1]);
      else press(cards[1], combo.activation);
      await wait(20);

      problems.equal(seen.length, 1, 'stat-click count');
      if (seen.length === 1) {
        problems.equal(seen[0].index, 1, 'stat-click index');
        problems.check(seen[0].stat === stats[1], 'stat-click carried a different StatItem');
      }

      expectClean(problems, combo.id);
    });
  }

  it('every card reports its own index', async () => {
    const stats = datasetFor(SHAPES[5]);
    const group = await mountGroup('card', 0, stats);
    const problems = new Problems();
    const seen = captureEvents<{ stat: StatItem; index: number }>(group, 'stat-click');

    cardsOf(group).forEach(card => click(card));
    await wait(20);

    problems.equal(seen.map(d => d.index), [0, 1, 2], 'indices in click order');
    problems.equal(seen.map(d => d.stat.label), stats.map(s => s.label), 'labels in click order');
    expectClean(problems, 'every card reports its own index');
  });
});

// ── Re-render: the stats array is the single source of truth ────────────────

describe('stat-group matrix: re-render', () => {
  for (const combo of cross({ variant: VARIANTS, shape: [SHAPES[0], SHAPES[5], SHAPES[9]] })) {
    it(`${combo.id}/replace`, async () => {
      const problems = new Problems();
      const group = await mountGroup(combo.variant, 0, datasetFor(SHAPES[0]));

      // Replacing the array must repaint into the new shape completely: a card
      // that keeps a stale trend region or icon is the classic recycled-DOM bug.
      const next = datasetFor(combo.shape);
      (group as any).stats = next;
      await wait(40);
      checkStructure(group, next, problems);

      // …and back down to the empty state.
      (group as any).stats = [];
      await wait(40);
      checkStructure(group, [], problems);

      expectClean(problems, `${combo.id}/replace`);
    });
  }
});
