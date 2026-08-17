/**
 * Matrix slice GANTT / BARS — the optional `GanttTask` presentation fields, the
 * today indicator, and the documented a11y ABSENCE on task bars.
 *
 * Dimensions:
 *   · dataset (10) x zoom (3)               = 30 presentation combos
 *   · progress edge value (7) x zoom (2)    = 14 progress combos
 *   · colour form (5)                       =  5 colour combos
 *   · dataset (5) a11y absence              =  5 combos
 *   Total 54.
 *
 * Documented contract (docs/ai/components/gantt.md):
 *   · `progress?: number  // 0-100` renders a progress indicator sized to that
 *     percentage — the doc calls them "progress indicators";
 *   · `color?: string  // bar color override` paints the bar;
 *   · "Today line as red vertical indicator" — present exactly when today falls
 *     inside the span the tasks cover;
 *   · "role/aria not explicitly set on task bars" — a documented absence, and
 *     therefore a documented expectation. If an a11y pass adds roles later, the
 *     doc has to move first, and this slice is what says so.
 *
 * it.fails policy: nothing pinned; all 54 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DATASET_NAMES, ZOOMS, combo, comboId, tasksOf, makeGantt,
  barProblems, barAriaProblems, readFacts, todayInsideTasks, isoFromToday,
  expectClean, removeComponent,
} from './gantt-support';
import type { DatasetName } from './gantt-support';
import type { GanttTask } from '../../../packages/components/src/gantt/snice-gantt.types';

/** The documented range endpoints plus the values just outside them. */
const PROGRESS_VALUES = [undefined, 0, 1, 33, 50, 99, 100] as const;

/** Every colour syntax a `color?: string` override can legally carry. */
const COLOR_VALUES = [
  'rgb(234 88 12)',
  '#a21caf',
  'rebeccapurple',
  'rgb(16 185 129 / 0.5)',
  'hsl(210 90% 40%)',
] as const;

const A11Y_DATASETS: DatasetName[] = ['single', 'basic', 'grouped', 'chained', 'styled'];

describe('gantt matrix: bars', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('presentation', () => {
    for (const dataset of DATASET_NAMES) {
      for (const zoom of ZOOMS) {
        const c = combo({ dataset, zoom });

        it(`${comboId(c)}: progress, colour and today line`, async () => {
          const tasks = tasksOf(c);
          el = await makeGantt(c, tasks);
          expectClean(barProblems(el, c, tasks), comboId(c));
        });
      }
    }
  });

  describe('progress', () => {
    for (const progress of PROGRESS_VALUES) {
      for (const zoom of ['day', 'month'] as const) {
        const id = `progress=${progress ?? 'none'}/zoom=${zoom}`;
        const c = combo({ dataset: 'single', zoom });

        it(`${id}: the indicator matches the authored percentage`, async () => {
          const tasks: GanttTask[] = [{
            id: 'p', name: 'Measured', start: '2026-03-01', end: '2026-03-10',
            ...(progress === undefined ? {} : { progress }),
          }];
          el = await makeGantt(c, tasks);
          expectClean(barProblems(el, c, tasks), id);

          const bar = readFacts(el).bars[0];
          if (progress === undefined || progress === 0) {
            // No progress to show; the doc's range starts at 0 meaning "none".
            expect(bar.progressWidth).toBeNull();
          } else {
            expect(bar.progressWidth).toContain(`${progress}%`);
          }
        });
      }
    }
  });

  describe('colour override', () => {
    for (const color of COLOR_VALUES) {
      const id = `color=${color}`;
      const c = combo({ dataset: 'single' });

      it(`${id}: paints the bar`, async () => {
        const tasks: GanttTask[] = [
          { id: 'c', name: 'Tinted', start: '2026-03-01', end: '2026-03-06', color },
        ];
        el = await makeGantt(c, tasks);
        expectClean(barProblems(el, c, tasks), id);
        expect(readFacts(el).bars[0].style).toContain(color);
      });
    }
  });

  describe('today line', () => {
    it('is drawn when a task straddles today', async () => {
      const c = combo({ dataset: 'today' });
      const tasks = tasksOf(c);
      el = await makeGantt(c, tasks);

      expect(todayInsideTasks(tasks)).toBe(true);
      expect(readFacts(el).todayLine).toBe(true);
      expectClean(barProblems(el, c, tasks), comboId(c));
    });

    it('is drawn when today sits between two tasks', async () => {
      const c = combo({ dataset: 'single' });
      const tasks: GanttTask[] = [
        { id: 'before', name: 'Before', start: isoFromToday(-10), end: isoFromToday(-5) },
        { id: 'after', name: 'After', start: isoFromToday(5), end: isoFromToday(10) },
      ];
      el = await makeGantt(c, tasks);
      expect(readFacts(el).todayLine).toBe(true);
    });
  });

  describe('a11y absence documented for task bars', () => {
    for (const dataset of A11Y_DATASETS) {
      const c = combo({ dataset });

      it(`${comboId(c)}: bars carry no role or aria-label`, async () => {
        const tasks = tasksOf(c);
        el = await makeGantt(c, tasks);
        expectClean(barAriaProblems(el, tasks), comboId(c));
      });
    }
  });
});
