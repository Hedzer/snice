/**
 * Matrix slice WATERFALL / INTERACTION — the two documented events.
 *
 * Documented contract (docs/ai/components/waterfall.md "Events"):
 *   · `bar-click` -> `{ item: WaterfallDataPoint, index: number }`
 *   · `bar-hover` -> `{ item: WaterfallDataPoint, index: number }`
 *
 * `item` is the ORIGINAL data point the caller supplied — the object identity
 * matters, because the documented usage reads `e.detail.item.label` straight
 * off the array it handed in. `index` is that point's index in `data`.
 *
 * The cross: every bar of every non-empty dataset is clicked and hovered
 * individually (6 datasets), plus the display switches crossed against
 * activation (a chart with no value labels and no connectors still reports its
 * bars), plus the negative cases — an empty chart and a click that lands on no
 * bar emit nothing.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../../components/test-utils';
import {
  DATASET_NAMES, DATASETS,
  combo, comboId, dataOf, makeWaterfall,
  collectEvents, clickBar, hoverBar, clickChartBackground, barAt,
} from './waterfall-support';

const POPULATED = DATASET_NAMES.filter(name => DATASETS[name].length > 0);

describe('waterfall matrix: interaction', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const dataset of POPULATED) {
    const c = combo({ dataset });

    it(`${comboId(c)}: bar-click reports every bar's own item and index`, async () => {
      el = await makeWaterfall(c);
      const data = dataOf(c);
      const seen = collectEvents(el, ['bar-click']);

      for (let i = 0; i < data.length; i++) {
        expect(clickBar(el, i), `no bar rendered at index ${i}`).toBe(true);
      }
      await wait(20);

      expect(seen.map(e => e.detail.index)).toEqual(data.map((_, i) => i));
      // The documented detail carries the caller's own object, not a copy: the
      // docs' handler reads `e.detail.item.label` off the array it supplied.
      seen.forEach((event, i) => {
        expect(event.detail.item, `bar-click ${i} item identity`).toBe(data[i]);
      });
    });

    it(`${comboId(c)}: bar-hover reports every bar's own item and index`, async () => {
      el = await makeWaterfall(c);
      const data = dataOf(c);
      const seen = collectEvents(el, ['bar-hover']);

      for (let i = 0; i < data.length; i++) {
        expect(hoverBar(el, i), `no bar rendered at index ${i}`).toBe(true);
      }
      await wait(20);

      expect(seen.map(e => e.detail.index)).toEqual(data.map((_, i) => i));
      seen.forEach((event, i) => {
        expect(event.detail.item, `bar-hover ${i} item identity`).toBe(data[i]);
      });
    });
  }

  // ── The display switches must not change who is clickable ──────────────────
  for (const showValues of [true, false]) {
    for (const showConnectors of [true, false]) {
      const c = combo({ showValues, showConnectors });

      it(`${comboId(c)}: bars stay addressable whatever the display switches say`, async () => {
        el = await makeWaterfall(c);
        const seen = collectEvents(el, ['bar-click']);

        expect(clickBar(el, 2)).toBe(true);
        await wait(20);

        expect(seen).toHaveLength(1);
        expect(seen[0].detail.index).toBe(2);
        expect(seen[0].detail.item).toBe(dataOf(c)[2]);
      });
    }
  }

  // ── Negative cases ─────────────────────────────────────────────────────────

  it('an empty chart has no bars to report', async () => {
    const c = combo({ dataset: 'empty' });
    el = await makeWaterfall(c);
    const seen = collectEvents(el);

    expect(barAt(el, 0)).toBeNull();
    clickChartBackground(el);
    await wait(20);

    expect(seen).toEqual([]);
  });

  it('a click that lands on no bar reports nothing', async () => {
    el = await makeWaterfall(combo());
    const seen = collectEvents(el);

    clickChartBackground(el);
    await wait(20);

    expect(seen).toEqual([]);
  });

  it('a bar clicked twice reports twice, with the same identity', async () => {
    const c = combo({ dataset: 'auto' });
    el = await makeWaterfall(c);
    const seen = collectEvents(el, ['bar-click']);

    clickBar(el, 1);
    clickBar(el, 1);
    await wait(20);

    expect(seen.map(e => e.detail.index)).toEqual([1, 1]);
    expect(seen[0].detail.item).toBe(dataOf(c)[1]);
    expect(seen[1].detail.item).toBe(dataOf(c)[1]);
  });

  it('replacing data re-points the events at the new array', async () => {
    el = await makeWaterfall(combo({ dataset: 'auto' }));
    const replacement = DATASETS.descending;
    el.data = replacement;
    await wait(30);

    const seen = collectEvents(el, ['bar-click']);
    expect(clickBar(el, 3)).toBe(true);
    await wait(20);

    expect(seen).toHaveLength(1);
    expect(seen[0].detail.index).toBe(3);
    expect(seen[0].detail.item).toBe(replacement[3]);
  });
});
