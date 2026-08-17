/**
 * snice-heatmap matrix — the standing findings.
 *
 * Everything here asserts the DOCUMENTED behaviour and is pinned with
 * `it.fails` per `.ai/fuzzing.md`: the assertion stays correct, the component is
 * not changed, and the day it is fixed this file fails and the finding closes.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  WEEK_COUNTS, cells, gridColumns, makeHeatmap, removeComponent, type Heatmap,
} from './heatmap-support';

let el: Heatmap | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-heatmap matrix: findings', () => {
  /**
   * MATRIX-heatmap-1 — `weeks` renders one week more than it names.
   *
   * `docs/ai/components/heatmap.md` documents `weeks: number = 52; // Number of
   * weeks to display`. The grid is built from `weeks * 7 + today.getDay() + 1`
   * days, which is `weeks` complete weeks PLUS the current partial one, so the
   * rendered column count is always `weeks + 1` and the cell count always
   * exceeds `weeks * 7`. A page asking for four weeks gets five columns; the
   * default `weeks="52"` renders 53.
   *
   * The overshoot is a fixed function of the number, not of the day the suite
   * runs on: `today.getDay() + 1` is between 1 and 7, so the extra day count
   * always rounds up into exactly one more column.
   */
  for (const weeks of WEEK_COUNTS) {
    it.fails(`MATRIX-heatmap-1: weeks=${weeks} displays ${weeks} weeks`, async () => {
      el = await makeHeatmap({ weeks });
      expect(gridColumns(el), `weeks=${weeks} declared a different number of columns`)
        .toBe(weeks);
      expect(cells(el).length, `weeks=${weeks} rendered more than ${weeks * 7} days`)
        .toBe(weeks * 7);
    });
  }

  /**
   * MATRIX-heatmap-2 — `color-scheme="purple"` is the blue ramp.
   *
   * The doc offers five schemes: `'green'|'blue'|'purple'|'orange'|'red'`, which
   * is a promise that choosing one of them changes the colour the cells are
   * painted. The stylesheet builds `--heatmap-purple-1…4` out of
   * `--snice-color-blue-100/400/600/800` — the same blue family the `blue`
   * scheme uses, whose own level 1 is `--snice-color-blue-100`. So the two
   * schemes are not merely similar: their lightest level is defined from the
   * identical token, and a page that switched from `blue` to `purple` to
   * distinguish two heatmaps side by side would get two blue heatmaps.
   *
   * The DOM tier can only state the divergence; the visual tier
   * (`tests/live/matrix/heatmap/`) measures the painted pixels and pins the
   * same id.
   */
  it.fails('MATRIX-heatmap-2: the purple scheme is defined from purple tokens', async () => {
    el = await makeHeatmap({ weeks: 2, colorScheme: 'purple' });
    const sheet = [...el.shadowRoot.styleSheets]
      .flatMap(styles => [...styles.cssRules].map(rule => rule.cssText))
      .join('\n');

    const purpleBlock = /--heatmap-purple-1:[^;]+;/.exec(sheet)?.[0] ?? '';
    expect(purpleBlock, 'the purple ramp is not defined at all').not.toBe('');
    expect(purpleBlock, 'the purple ramp is built out of the blue colour tokens')
      .not.toMatch(/blue/);
  });
});
