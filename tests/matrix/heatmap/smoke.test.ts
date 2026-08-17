/**
 * Smoke slice of the snice-heatmap matrix — the everyday-loop tier.
 *
 * The full matrix (`tests/matrix/heatmap/`, 41 combos across the calendar,
 * colour schemes, cell geometry and the two interactions) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle, so it cannot claim less than the suite it stands in for.
 *
 * The marquee combos: the documented default calendar, the labels switch, a
 * data point landing on its own day, the click event, the hover tooltip, and
 * the two standing findings.
 *
 * BUDGET: under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, captureClicks, cells, checkCalendar, checkIntensity, checkLabels,
  checkShell, clickCell, daysAgo, expectClean, expectedDates, expectedLabel, gridColumns,
  hoverCell, makeHeatmap, removeComponent, text, tooltip, type Heatmap, type HeatmapVector,
} from './heatmap-support';

let el: Heatmap | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('heatmap matrix smoke', () => {
  it('the documented default renders a labelled calendar ending today', async () => {
    const vector: HeatmapVector = { ...DEFAULTS, weeks: 4, data: 'ramp' };
    el = await makeHeatmap(vector);
    const problems = new Problems();
    checkShell(problems, el, vector);
    checkCalendar(problems, el, vector);
    checkIntensity(problems, el, vector);
    checkLabels(problems, el, vector);
    expectClean(problems, 'smoke/calendar');
  });

  it('show-labels="false" removes both label rows', async () => {
    const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, showLabels: false };
    el = await makeHeatmap(vector);
    const problems = new Problems();
    checkLabels(problems, el, vector);
    checkCalendar(problems, el, vector);
    expectClean(problems, 'smoke/no-labels');
  });

  it('a data point lands on its own day and nowhere else', async () => {
    el = await makeHeatmap({ weeks: 2 });
    el.data = [{ date: daysAgo(1), value: 7 }];
    await new Promise(resolve => setTimeout(resolve, 30));
    const labels = cells(el).map(cell => cell.getAttribute('aria-label')!);
    expect(labels.filter(label => !label.startsWith('0 ')))
      .toEqual([expectedLabel(daysAgo(1), 7)]);
  });

  it('cell-click announces the date and value of the cell that was clicked', async () => {
    el = await makeHeatmap({ weeks: 2, data: 'sparse' });
    const seen = captureClicks(el);
    const index = cells(el).length - 1;
    clickCell(el, index);
    expect(seen).toEqual([{ date: expectedDates(cells(el).length)[index], value: 5 }]);
  });

  it('a hover raises one tooltip carrying the date and value', async () => {
    el = await makeHeatmap({ weeks: 2, data: 'ramp' });
    const index = cells(el).length - 1;
    await hoverCell(el, index);
    expect(text(tooltip(el))).toBe(expectedLabel(daysAgo(0), 12));
  });

  it('the cell geometry properties reach the custom properties that answer them', async () => {
    const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, cellSize: 20, cellGap: 6 };
    el = await makeHeatmap(vector);
    const problems = new Problems();
    checkShell(problems, el, vector);
    expectClean(problems, 'smoke/geometry');
  });

  // ── Standing findings — see tests/matrix/heatmap/findings.test.ts ──────────

  // MATRIX-heatmap-1: the grid is `weeks` complete weeks PLUS the current
  // partial one, so it always renders one column more than it names.
  it.fails('MATRIX-heatmap-1: weeks=4 displays 4 weeks', async () => {
    el = await makeHeatmap({ weeks: 4 });
    expect(gridColumns(el)).toBe(4);
    expect(cells(el).length).toBe(28);
  });

  // MATRIX-heatmap-2: the purple ramp is built out of the blue colour tokens.
  it.fails('MATRIX-heatmap-2: the purple scheme is defined from purple tokens', async () => {
    el = await makeHeatmap({ weeks: 2, colorScheme: 'purple' });
    const sheet = [...el.shadowRoot.styleSheets]
      .flatMap(styles => [...styles.cssRules].map(rule => rule.cssText))
      .join('\n');
    expect(/--heatmap-purple-1:[^;]+;/.exec(sheet)?.[0] ?? '').not.toMatch(/blue/);
  });
});
