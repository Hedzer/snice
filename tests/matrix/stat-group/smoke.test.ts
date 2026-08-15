/**
 * Smoke slice of the snice-stat-group matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full stat-group matrix runs only via
 * `npm run test:matrix`. This file is the standing cost the everyday loop DOES
 * pay, and it lives at `smoke.test.ts` so it stays collected.
 *
 * The marquee combos, one per feature family and no more:
 *   · the richest StatItem shape (icon + colour + trend + trendValue), because
 *     it is the only combo where every optional field is on at once;
 *   · the barest one, because "renders nothing extra" is the half that a
 *     rich-only smoke would never notice;
 *   · a pinned column count, the one documented setting with a side effect
 *     outside the shadow root;
 *   · one activation per documented path (pointer and keyboard), since
 *     `stat-click` is the component's entire API surface.
 *
 * Every assertion routes through the matrix's own oracle (`checkStructure`,
 * `checkColumns`), so this file cannot drift into asserting something weaker
 * than the suite it stands in for.
 *
 * BUDGET: under 1s. Adding a combo here taxes every developer; add it to
 * tests/matrix/stat-group/ instead.
 */
import { describe, it, afterEach } from 'vitest';
import { Problems, captureEvents, click, expectClean, mount, press, removeComponent, wait } from '../matrix-kit';
import {
  SHAPES, cardsOf, checkColumns, checkStructure, datasetFor, type StatItem,
} from './stat-group-support';
import '../../../packages/components/src/stat-group/snice-stat-group';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const FULL = SHAPES.find(s => s.name === 'full')!;
const BARE = SHAPES.find(s => s.name === 'bare')!;

describe('stat-group matrix smoke', () => {
  it('the richest shape renders every documented piece', async () => {
    const stats = datasetFor(FULL);
    el = await mount('snice-stat-group', { variant: 'card' }, { stats });
    const problems = new Problems();
    checkStructure(el, stats, problems);
    expectClean(problems, 'smoke/full');
  });

  it('the barest shape renders nothing it was not given', async () => {
    const stats = datasetFor(BARE);
    el = await mount('snice-stat-group', { variant: 'minimal' }, { stats });
    const problems = new Problems();
    checkStructure(el, stats, problems);
    expectClean(problems, 'smoke/bare');
  });

  it('a pinned column count reaches the grid and auto-fit releases it', async () => {
    const stats = datasetFor(FULL);
    el = await mount('snice-stat-group', { variant: 'bordered', columns: 3 }, { stats });
    const problems = new Problems();
    checkColumns(el, 3, problems);
    (el as any).columns = 0;
    await wait(30);
    checkColumns(el, 0, problems);
    expectClean(problems, 'smoke/columns');
  });

  for (const activation of ['click', 'Enter', ' '] as const) {
    it(`${activation === 'click' ? 'a click' : `"${activation}"`} on a card emits stat-click with its index`, async () => {
      const stats = datasetFor(FULL);
      el = await mount('snice-stat-group', {}, { stats });
      const problems = new Problems();
      const seen = captureEvents<{ stat: StatItem; index: number }>(el, 'stat-click');

      const card = cardsOf(el)[1];
      if (activation === 'click') click(card); else press(card, activation);
      await wait(20);

      problems.equal(seen.length, 1, 'stat-click count');
      problems.equal(seen[0]?.index, 1, 'stat-click index');
      problems.check(seen[0]?.stat === stats[1], 'stat-click carried a different StatItem');
      expectClean(problems, `smoke/${activation}`);
    });
  }

  it('replacing the stats array repaints instead of recycling stale pieces', async () => {
    el = await mount('snice-stat-group', {}, { stats: datasetFor(FULL) });
    const problems = new Problems();
    const bare = datasetFor(BARE);
    (el as any).stats = bare;
    await wait(40);
    checkStructure(el, bare, problems);
    expectClean(problems, 'smoke/replace');
  });
});
