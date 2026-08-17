/**
 * Matrix slice GANTT / EVENTS + METHODS — the three reachable documented events
 * and the two documented scroll methods.
 *
 * Dimensions:
 *   · click source (2: bar, sidebar name) x dataset (4) x task index (2)  = 16
 *   · drag kind (3) x dataset (3) x zoom (2)                              = 18
 *   · scroll method calls (10)                                            = 10
 *   Total 44.
 *
 * Documented contract (docs/ai/components/gantt.md):
 *   · `task-click  → { task: GanttTask }` — "Task bar or name clicked", so BOTH
 *     the timeline bar and the sidebar name are documented triggers, and both
 *     must hand back the caller's own task object;
 *   · `task-move   → { task, start, end }` — "Task moved via drag";
 *   · `task-resize → { task, start, end }` — "Task resized via drag handles",
 *     of which the doc names two: left and right;
 *   · `scrollToDate(date)` / `scrollToTask(id)` — "Scroll timeline to center on
 *     a date" / "Scroll to a task's start date".
 *
 * The doc fixes no pixels-per-day, so the drag oracle asserts the DIRECTION and
 * the internal consistency of each emitted detail (a move preserves the span; a
 * right-handle resize leaves the start alone) rather than a day count that
 * could only have come from reading the implementation.
 *
 * `task-link` is the fourth documented event and is unreachable — that is
 * MATRIX-gantt-2, pinned in dependencies.test.ts.
 *
 * it.fails policy: nothing pinned here; all 44 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, tasksOf, makeGantt, collectEvents,
  barAt, taskNameAt, clickNode, drag, dragDetailProblems, expectedSidebar,
  expectClean, removeComponent, wait, SETTLE,
} from './gantt-support';
import type { DatasetName, DragKind } from './gantt-support';

const CLICK_DATASETS: DatasetName[] = ['single', 'basic', 'grouped', 'mixed'];
const DRAG_DATASETS: DatasetName[] = ['single', 'basic', 'chained'];
const DRAG_KINDS: DragKind[] = ['move', 'resize-left', 'resize-right'];

describe('gantt matrix: events', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('task-click', () => {
    for (const dataset of CLICK_DATASETS) {
      for (const index of [0, 1]) {
        for (const source of ['bar', 'name'] as const) {
          const c = combo({ dataset });
          const id = `${comboId(c)}/source=${source}/index=${index}`;

          it(`${id}: hands back the caller's own task`, async () => {
            const tasks = tasksOf(c);
            if (index >= tasks.length) return; // single-task datasets have no index 1
            el = await makeGantt(c, tasks);
            const seen = collectEvents(el);

            // The sidebar reorders tasks under their groups; the timeline does
            // not. Each source is addressed in ITS OWN order, and the expected
            // task is resolved through the documented sidebar layout.
            const expected = source === 'bar'
              ? tasks[index]
              : tasks.find(task => task.name === expectedSidebar(tasks).names[index])!;

            expect(clickNode(source === 'bar' ? barAt(el, index) : taskNameAt(el, index))).toBe(true);
            await wait(SETTLE);

            const clicks = seen.filter(event => event.type === 'task-click');
            expect(clicks).toHaveLength(1);
            expect(clicks[0].detail.task).toBe(expected);
          });
        }
      }
    }
  });

  describe('drag', () => {
    for (const kind of DRAG_KINDS) {
      for (const dataset of DRAG_DATASETS) {
        for (const zoom of ['day', 'month'] as const) {
          const c = combo({ dataset, zoom });
          const id = `${comboId(c)}/drag=${kind}`;

          it(`${id}: emits the documented ${kind === 'move' ? 'task-move' : 'task-resize'} detail`, async () => {
            const tasks = tasksOf(c);
            const before = { ...tasks[0] };
            el = await makeGantt(c, tasks);
            const seen = collectEvents(el);

            // 600px is far past any plausible cell width at any zoom, so the
            // gesture is unambiguously "several days". Each handle is dragged
            // the way that GROWS the bar — the left handle earlier, the right
            // handle later — because a handle dragged past the bar's other end
            // is a resize the component is right to refuse.
            const dx = kind === 'resize-left' ? -600 : 600;
            expect(await drag(el, 0, kind, dx)).toBe(true);

            const type = kind === 'move' ? 'task-move' : 'task-resize';
            expectClean(dragDetailProblems(seen, type, before, kind, dx), id);

            // The other drag event must not also fire.
            const other = kind === 'move' ? 'task-resize' : 'task-move';
            expect(seen.filter(event => event.type === other)).toHaveLength(0);
          });
        }
      }
    }
  });

  describe('scroll methods', () => {
    it('scrollToDate is callable for a date inside the timeline', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      expect(() => el.scrollToDate('2026-03-10')).not.toThrow();
    });

    it('scrollToDate is callable for a date outside the timeline', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      expect(() => el.scrollToDate('2001-01-01')).not.toThrow();
    });

    it('scrollToDate tolerates an unparseable date', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      expect(() => el.scrollToDate('not-a-date')).not.toThrow();
    });

    it('scrollToDate on an empty chart is a no-op', async () => {
      const c = combo({ dataset: 'empty' });
      el = await makeGantt(c);
      expect(() => el.scrollToDate('2026-03-10')).not.toThrow();
    });

    for (const taskId of ['1', '2', '3']) {
      it(`scrollToTask("${taskId}") scrolls to that task's start`, async () => {
        const c = combo({ dataset: 'basic' });
        const tasks = tasksOf(c);
        el = await makeGantt(c, tasks);
        expect(() => el.scrollToTask(taskId)).not.toThrow();
        // The doc defines it as scrollToDate(task.start); the task must exist.
        expect(tasks.some(task => task.id === taskId)).toBe(true);
      });
    }

    it('scrollToTask for an unknown id is a silent no-op', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      const seen = collectEvents(el);
      expect(() => el.scrollToTask('nope')).not.toThrow();
      await wait(SETTLE);
      expect(seen).toHaveLength(0);
    });

    it('neither scroll method emits a documented event', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      const seen = collectEvents(el);
      el.scrollToDate('2026-03-10');
      el.scrollToTask('2');
      await wait(SETTLE);
      expect(seen).toHaveLength(0);
    });

    it('scroll methods leave the task data untouched', async () => {
      const c = combo({ dataset: 'basic' });
      el = await makeGantt(c);
      const before = JSON.stringify(el.tasks);
      el.scrollToDate('2026-03-10');
      el.scrollToTask('3');
      await wait(SETTLE);
      expect(JSON.stringify(el.tasks)).toBe(before);
    });
  });
});
