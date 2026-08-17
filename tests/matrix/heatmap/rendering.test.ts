/**
 * snice-heatmap matrix — the CALENDAR and its labels.
 *
 * The component is documented as a "GitHub-style calendar heatmap", which fixes
 * more than it looks: the grid is one cell per day, contiguous, ending today,
 * and every cell announces its own date and value —
 *
 *   doc: `weeks: number = 52` — "Number of weeks to display"
 *   doc: `showLabels: boolean = true` (attr `show-labels`)
 *   doc, Accessibility: "aria-labels on all cells with date and value";
 *        "Cells are focusable buttons"
 *
 * The matrix crosses three window widths, three data shapes and both label
 * states — 3 x 3 x 2 = 18 combos — and every cell of every combo is checked
 * against `expectedDates` / `expectedLabel`, which are the calendar the doc
 * describes rather than a reading of the component.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, SCHEMES, WEEK_COUNTS, cells, checkCalendar, checkIntensity,
  checkLabels, checkShell, dataFor, daysAgo, expectClean, expectedLabel, makeHeatmap,
  removeComponent, vectorId, type DataShape, type Heatmap, type HeatmapVector,
} from './heatmap-support';

let el: Heatmap | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const SHAPES: DataShape[] = ['none', 'sparse', 'ramp'];

const COMBOS: HeatmapVector[] = [];
for (const weeks of WEEK_COUNTS) {
  for (const data of SHAPES) {
    for (const showLabels of [true, false]) {
      COMBOS.push({ ...DEFAULTS, weeks, data, showLabels });
    }
  }
}

describe('snice-heatmap matrix: calendar', () => {
  for (const vector of COMBOS) {
    it(vectorId(vector), async () => {
      el = await makeHeatmap(vector);
      const problems = new Problems();
      checkShell(problems, el, vector);
      checkCalendar(problems, el, vector);
      checkIntensity(problems, el, vector);
      checkLabels(problems, el, vector);
      expectClean(problems, vectorId(vector));
    });
  }
});

describe('snice-heatmap matrix: colour schemes', () => {
  // The five documented schemes have no DOM-visible effect beyond the attribute
  // the stylesheet selects on, so they get one cheap combo each here and their
  // real assertion in the visual tier.
  for (const colorScheme of SCHEMES) {
    it(`color-scheme=${colorScheme}`, async () => {
      const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, colorScheme, data: 'ramp' };
      el = await makeHeatmap(vector);
      const problems = new Problems();
      checkShell(problems, el, vector);
      checkCalendar(problems, el, vector);
      problems.equal(el.getAttribute('color-scheme'), colorScheme,
        'the scheme did not reach the attribute the stylesheet selects on');
      expectClean(problems, `scheme/${colorScheme}`);
    });
  }
});

describe('snice-heatmap matrix: cell geometry', () => {
  // `cellSize` and `cellGap` are documented in PIXELS, and the only trace they
  // leave in the DOM is the pair of custom properties the host carries; the
  // visual tier measures the boxes they produce.
  for (const cellSize of [8, 12, 20] as const) {
    for (const cellGap of [0, 3, 6] as const) {
      it(`cell-size=${cellSize}/cell-gap=${cellGap}`, async () => {
        const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, cellSize, cellGap };
        el = await makeHeatmap(vector);
        const problems = new Problems();
        checkShell(problems, el, vector);
        checkCalendar(problems, el, vector);
        expectClean(problems, `geometry/${cellSize}/${cellGap}`);
      });
    }
  }
});

describe('snice-heatmap matrix: the calendar itself', () => {
  it('the cells run one per day, without a gap or a repeat', async () => {
    el = await makeHeatmap({ weeks: 4 });
    const labels = cells(el).map(cell => cell.getAttribute('aria-label')!);
    const dates = labels.map(label => label.split(' on ')[1]);
    expect(new Set(dates).size, 'a date appears twice in the grid').toBe(dates.length);

    const asDays = dates.map(date => Date.parse(`${date}T00:00:00`));
    for (let i = 1; i < asDays.length; i++) {
      expect(asDays[i] - asDays[i - 1], `a gap before ${dates[i]}`).toBe(86_400_000);
    }
  });

  it('the last cell is today', async () => {
    // "GitHub-style" fixes the anchor: the calendar runs up to the present.
    el = await makeHeatmap({ weeks: 2 });
    expect(cells(el).at(-1)!.getAttribute('aria-label')).toBe(expectedLabel(daysAgo(0), 0));
  });

  it('a data point lands on the cell for its own date', async () => {
    // doc: `data` is `{ date, value }[]`, so the value belongs to that date and
    // to no other.
    el = await makeHeatmap({ weeks: 2, data: 'sparse' });
    const byDate = new Map(cells(el).map((cell) => {
      const label = cell.getAttribute('aria-label')!;
      return [label.split(' on ')[1], label];
    }));
    for (const point of dataFor('sparse')) {
      expect(byDate.get(point.date), `the cell for ${point.date}`)
        .toBe(expectedLabel(point.date, point.value));
    }
  });

  it('a data point outside the window changes nothing', async () => {
    // A two-week heatmap given last year's data is still a two-week heatmap of
    // empty days; nothing may be invented for a date it does not show.
    el = await makeHeatmap({ weeks: 2 });
    el.data = [{ date: daysAgo(900), value: 99 }];
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(cells(el).every(cell => cell.getAttribute('aria-label')!.startsWith('0 '))).toBe(true);
  });

  it('the aria-label says "1 contribution" for a single one', async () => {
    // doc: "aria-labels on all cells with date and value" — a label a screen
    // reader reads aloud, so the count agrees with the noun.
    el = await makeHeatmap({ weeks: 2 });
    el.data = [{ date: daysAgo(1), value: 1 }];
    await new Promise(resolve => setTimeout(resolve, 30));
    const label = cells(el).at(-2)!.getAttribute('aria-label');
    expect(label).toBe(`1 contribution on ${daysAgo(1)}`);
  });

  it('a later data assignment repaints the same calendar', async () => {
    // `data` is documented `attribute: false`, so assignment is its ONLY
    // channel and it has to work after the first render.
    el = await makeHeatmap({ weeks: 2 });
    const before = cells(el).length;
    el.data = [{ date: daysAgo(0), value: 4 }];
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(cells(el).length, 'the calendar changed shape when only data changed').toBe(before);
    expect(cells(el).at(-1)!.getAttribute('aria-label')).toBe(expectedLabel(daysAgo(0), 4));
  });
});
