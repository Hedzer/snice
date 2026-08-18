/**
 * snice-heatmap matrix — the fixed findings.
 *
 * Each test asserts the DOCUMENTED behaviour that was once pinned with
 * `it.fails` per `.ai/fuzzing.md`; the day each was fixed the pin was
 * unwrapped, and the assertion now guards the fix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  WEEK_COUNTS, cells, componentCss, gridColumns, makeHeatmap, removeComponent,
  type Heatmap,
} from './heatmap-support';

let el: Heatmap | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('snice-heatmap matrix: findings', () => {
  /**
   * MATRIX-heatmap-1 (fixed) — `weeks` renders exactly the weeks it names.
   *
   * `docs/ai/components/heatmap.md` documents `weeks: number = 52; // Number
   * of weeks to display`. The grid used to be built from
   * `weeks * 7 + today.getDay() + 1` days — `weeks` complete weeks PLUS the
   * current partial one — so the rendered column count was always `weeks + 1`
   * and a page asking for four weeks got five columns.
   */
  for (const weeks of WEEK_COUNTS) {
    it(`MATRIX-heatmap-1 (fixed): weeks=${weeks} displays ${weeks} weeks`, async () => {
      el = await makeHeatmap({ weeks });
      expect(gridColumns(el), `weeks=${weeks} declared a different number of columns`)
        .toBe(weeks);
      expect(cells(el).length, `weeks=${weeks} rendered more than ${weeks * 7} days`)
        .toBe(weeks * 7);
    });
  }

  /**
   * MATRIX-heatmap-2 (fixed) — `color-scheme="purple"` is a purple ramp.
   *
   * The doc offers five schemes: `'green'|'blue'|'purple'|'orange'|'red'`,
   * which is a promise that choosing one of them changes the colour the cells
   * are painted. The stylesheet used to build `--heatmap-purple-1…4` out of
   * the blue tokens — the same family the `blue` scheme uses — so the two
   * schemes' lightest level was defined from the identical token. The ramp is
   * now built from purple tokens (literal purple fallbacks until the theme
   * ships purple primitives); the visual tier measures the painted pixels.
   */
  it('MATRIX-heatmap-2 (fixed): the purple scheme is defined from purple tokens', async () => {
    el = await makeHeatmap({ weeks: 2, colorScheme: 'purple' });
    const sheet = componentCss(el);

    const purpleBlock = /--heatmap-purple-1:[^;]+;/.exec(sheet)?.[0] ?? '';
    expect(purpleBlock, 'the purple ramp is not defined at all').not.toBe('');
    expect(purpleBlock, 'the purple ramp is built out of the blue colour tokens')
      .not.toMatch(/blue/);
    expect(purpleBlock).toMatch(/purple/);
  });
});
