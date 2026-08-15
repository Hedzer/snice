/**
 * snice-funnel matrix — the API and re-render cross.
 *
 * Everything here is about the SECOND render. The display cross mounts each
 * combo fresh; this file changes a mounted funnel and asserts the chart caught
 * up, one test per documented mutation entry point:
 *
 *   · every reactive property, flipped at runtime (the `@watch` cross);
 *   · `setStages()`, the documented replace-all method;
 *   · `data` reassigned, including to a shorter list and to an empty one;
 *   · `exportImage()`, both documented formats;
 *   · `animation`, which the docs expose as a switch and which must therefore
 *     be observable in the output rather than a no-op flag.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeFunnel, expectFunnelMatches, stageEls, shapeOf, textIn, svgEl, partEl,
  wait, SETTLE, CANONICAL,
  type FunnelStage, type SniceFunnelElement,
} from './matrix-utils';

const ALL_ON = { showLabels: true, showValues: true, showPercentages: true };

describe('snice-funnel matrix: API and re-render', () => {
  let el: SniceFunnelElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // ── Documented parts ─────────────────────────────────────────────────────

  for (const part of ['base', 'chart', 'tooltip'] as const) {
    it(`exposes part="${part}"`, async () => {
      el = await makeFunnel({ data: CANONICAL });
      expect(partEl(el, part)).not.toBeNull();
    });
  }

  // ── Every reactive property, flipped after mount ─────────────────────────

  it('rebuilds when orientation changes', async () => {
    el = await makeFunnel({ data: CANONICAL, orientation: 'vertical', ...ALL_ON });
    const before = shapeOf(stageEls(el)[0])!.getAttribute('d');

    el.orientation = 'horizontal';
    await wait(SETTLE);

    expect(shapeOf(stageEls(el)[0])!.getAttribute('d')).not.toBe(before);
    expectFunnelMatches(el, CANONICAL, ALL_ON);
  });

  it('rebuilds when variant changes', async () => {
    el = await makeFunnel({ data: CANONICAL, variant: 'default', ...ALL_ON });
    const before = stageEls(el).map(s => shapeOf(s)!.getAttribute('fill'));

    el.variant = 'gradient';
    await wait(SETTLE);

    const after = stageEls(el).map(s => shapeOf(s)!.getAttribute('fill'));
    expect(after).not.toEqual(before);
    // A gradient must actually grade: no two stages share a fill.
    expect(new Set(after).size).toBe(CANONICAL.length);
    expectFunnelMatches(el, CANONICAL, ALL_ON);
  });

  for (const [prop, cls] of [
    ['showLabels', 'label'],
    ['showValues', 'value'],
    ['showPercentages', 'percentage'],
  ] as const) {
    it(`removes and restores the ${cls} text when ${prop} is toggled`, async () => {
      el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
      // Index 1 rather than 0: percentages are relative to stage 0, so stage 0
      // is the one stage that never carries one.
      expect(textIn(stageEls(el)[1], cls)).not.toBeNull();

      (el as any)[prop] = false;
      await wait(SETTLE);
      expect(stageEls(el).every(s => textIn(s, cls) === null)).toBe(true);

      (el as any)[prop] = true;
      await wait(SETTLE);
      expect(textIn(stageEls(el)[1], cls)).not.toBeNull();
      expectFunnelMatches(el, CANONICAL, ALL_ON);
    });
  }

  it('carries a staggered animation delay only when animation is on', async () => {
    el = await makeFunnel({ data: CANONICAL, animation: false });
    expect(stageEls(el).every(s => !shapeOf(s)!.getAttribute('style'))).toBe(true);

    el.animation = true;
    await wait(SETTLE);
    const styles = stageEls(el).map(s => shapeOf(s)!.getAttribute('style') ?? '');
    expect(styles.every(s => s.includes('animation-delay'))).toBe(true);
    // Staggered, not simultaneous: each stage waits longer than the last.
    expect(new Set(styles).size).toBe(CANONICAL.length);
  });

  // ── setStages(): the documented replace-all method ───────────────────────

  it('replaces every stage via setStages()', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const next: FunnelStage[] = [
      { label: 'Signups', value: 800 },
      { label: 'Activated', value: 200 },
    ];

    el.setStages(next);
    await wait(SETTLE);

    expectFunnelMatches(el, next, ALL_ON);
    expect(stageEls(el)).toHaveLength(2);
  });

  it('does not alias the array handed to setStages()', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const source: FunnelStage[] = [{ label: 'A', value: 10 }];

    el.setStages(source);
    await wait(SETTLE);
    source.push({ label: 'Sneaked in', value: 5 });
    await wait(SETTLE);

    expect(stageEls(el)).toHaveLength(1);
  });

  // ── data reassignment, including shrinking to nothing ────────────────────

  it('drops removed stages when the data shrinks', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const shorter = CANONICAL.slice(0, 2);

    el.data = shorter;
    await wait(SETTLE);

    expectFunnelMatches(el, shorter, ALL_ON);
  });

  it('clears the chart when the data is emptied', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    el.data = [];
    await wait(SETTLE);

    expect(svgEl(el)).toBeNull();
    expect(stageEls(el)).toHaveLength(0);
  });

  it('rebuilds from empty back to a full chart', async () => {
    el = await makeFunnel({ data: [], ...ALL_ON });
    el.data = CANONICAL;
    await wait(SETTLE);

    expectFunnelMatches(el, CANONICAL, ALL_ON);
  });

  // ── exportImage(): documented to return a data URL ───────────────────────

  it('exports the chart as an svg data URL', async () => {
    el = await makeFunnel({ data: CANONICAL, ...ALL_ON });
    const url = el.exportImage('svg');

    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    // The export must contain the chart, not an empty shell.
    expect(decodeURIComponent(url)).toContain('Visitors');
  });

  it('exports an empty string when there is no chart to export', async () => {
    el = await makeFunnel({ data: [] });
    expect(el.exportImage('svg')).toBe('');
    expect(el.exportImage('png')).toBe('');
  });
});
