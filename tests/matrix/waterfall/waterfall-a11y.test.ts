/**
 * Matrix slice WATERFALL / ACCESSIBILITY + ANIMATION — the documented promises
 * about what a bar IS, beyond where it is drawn.
 *
 * Documented contract (docs/ai/components/waterfall.md "Accessibility"):
 *   · "Bars carry data-visualization roles, are focusable, and activate by
 *     keyboard"
 *   · "showValues exposes value labels as screen-reader text"
 *   · "Bar types distinguishable by color *and* value label, not color alone"
 *
 * and, from "Properties", `animated: boolean = false`.
 *
 * The last two are asserted in waterfall-structure.test.ts, where the value
 * labels live, and they pass. All findings below are FIXED and unpinned.
 *
 * ── FINDING MATRIX-waterfall-2 (FIXED) ──────────────────────────────────────
 * `animated` is a documented property with no effect. The stylesheet ships the
 * rule it exists for (`.waterfall-bar-animated { animation: waterfall-grow … }`,
 * plus the `prefers-reduced-motion` guard the docs call out), but no code path
 * ever puts that class on a bar: `rebuildChart()` emits
 * `class="waterfall-bar-${bar.type}"` and nothing else, and `animated` is not
 * even in the `@watch` list that triggers a rebuild.
 *
 *   combo:    data=doc/orientation=vertical/values/connectors/animated
 *   expected: with `animated` true, the bars carry the animation class the
 *             component's own stylesheet defines.
 *   actual:   classes are ["waterfall-bar-total", "waterfall-bar-increase",
 *             "waterfall-bar-decrease", "waterfall-bar-decrease",
 *             "waterfall-bar-total"] — identical to `animated=false`.
 *
 * ── FINDING MATRIX-waterfall-3 (FIXED) ──────────────────────────────────────
 * Bars carry no role and no tabindex. Each bar is a bare
 * `<rect class="waterfall-bar-…" data-index="…">`; there is no `role`, no
 * `tabindex`, and no accessible name anywhere in the SVG, so a screen-reader
 * user is told nothing and a keyboard user cannot reach a bar at all.
 *
 *   combo:    data=doc/orientation=vertical/values/connectors/static
 *   expected: every bar carries a data-visualization role and a tabindex.
 *   actual:   `<rect class="waterfall-bar-increase" x="106.4" y="40.87"
 *             width="43.2" height="69.57" rx="2" data-index="1">` —
 *             role null, tabindex null, for every bar of every dataset.
 *
 * ── FINDING MATRIX-waterfall-4 (FIXED) ──────────────────────────────────────
 * Bars do not activate by keyboard. The component listens for `click` and
 * `mouseover` on the chart container only; there is no `keydown` handler, so
 * Enter and Space on a bar emit nothing. (This is a separate defect from
 * MATRIX-waterfall-3: adding a tabindex alone would still leave the bar
 * unactivatable, and adding a key handler alone would leave it unreachable.)
 *
 *   combo:    data=doc/orientation=vertical/values/connectors/static
 *   expected: Enter and Space on a bar emit `bar-click` with that bar's item
 *             and index, exactly as a pointer click does.
 *   actual:   no event at all — the recorded sequence is [].
 *
 * Every assertion below is the documented expectation, unweakened.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import {
  DATASET_NAMES, DATASETS,
  combo, comboId, dataOf, makeWaterfall,
  a11yProblems, expectClean, animationClasses,
  collectEvents, pressBar, clickBar,
} from './waterfall-support';

const POPULATED = DATASET_NAMES.filter(name => DATASETS[name].length > 0);

describe('waterfall matrix: accessibility and animation', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  // ── MATRIX-waterfall-2 ────────────────────────────────────────────────────

  it('animated=false leaves the bars unanimated', async () => {
    const c = combo({ animated: false });
    el = await makeWaterfall(c);
    const animatedBars = animationClasses(el).filter(cls => cls.includes('animated'));
    expect(animatedBars, `combo ${comboId(c)}`).toEqual([]);
  });

  it('MATRIX-waterfall-2 (fixed) animated=true animates the bars', async () => {
    const c = combo({ animated: true });
    el = await makeWaterfall(c);
    const classes = animationClasses(el);
    const animatedBars = classes.filter(cls => cls.includes('animated'));
    expect(animatedBars, `combo ${comboId(c)} bar classes ${JSON.stringify(classes)}`)
      .toHaveLength(dataOf(c).length);
  });

  it('MATRIX-waterfall-2 (fixed) toggling animated after mount animates the bars', async () => {
    el = await makeWaterfall(combo({ animated: false }));
    el.animated = true;
    await wait(30);
    expect(animationClasses(el).filter(cls => cls.includes('animated')))
      .toHaveLength(dataOf(combo()).length);
  });

  // ── MATRIX-waterfall-3 ────────────────────────────────────────────────────

  it('an empty chart has no bars, so it makes no accessibility claim', async () => {
    const c = combo({ dataset: 'empty' });
    el = await makeWaterfall(c);
    expectClean(a11yProblems(el, c), comboId(c));
  });

  for (const dataset of POPULATED) {
    const c = combo({ dataset });

    it(
      `MATRIX-waterfall-3 (fixed) ${comboId(c)}: bars carry a role and are focusable`,
      async () => {
        el = await makeWaterfall(c);
        expectClean(a11yProblems(el, c), comboId(c));
      },
    );
  }

  // ── MATRIX-waterfall-4 ────────────────────────────────────────────────────

  it('a pointer click on a bar does report it (the path that works)', async () => {
    const c = combo();
    el = await makeWaterfall(c);
    const seen = collectEvents(el, ['bar-click']);

    clickBar(el, 1);
    await wait(20);

    expect(seen.map(e => e.detail.index)).toEqual([1]);
  });

  for (const key of ['Enter', ' ']) {
    it(
      `MATRIX-waterfall-4 (fixed) "${key === ' ' ? 'Space' : key}" on a bar activates it`,
      async () => {
        const c = combo();
        el = await makeWaterfall(c);
        const seen = collectEvents(el, ['bar-click']);

        expect(pressBar(el, 1, key), 'no bar rendered at index 1').toBe(true);
        await wait(20);

        expect(seen.map(e => e.detail.index), `combo ${comboId(c)} key ${key}`).toEqual([1]);
        expect(seen[0].detail.item).toBe(dataOf(c)[1]);
      },
    );
  }
});
