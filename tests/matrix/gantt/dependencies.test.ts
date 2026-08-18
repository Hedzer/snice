/**
 * Matrix slice GANTT / DEPENDENCIES — the documented dependency feature, and
 * the two findings it carries.
 *
 * Dimensions:
 *   · dependency shape (6) x showDependencies (2) x zoom (2)  = 24 combos
 *   · task-link reachability probes                           =  4 combos
 *   Total 28.
 *
 * Documented contract (docs/ai/components/gantt.md):
 *   · the component summary opens "Interactive Gantt chart with … dependencies,
 *     and today line";
 *   · `showDependencies: boolean = true  // attr: show-dependencies` — a switch
 *     that defaults to ON, which is only meaningful if it switches something;
 *   · `GanttTask.dependencies?: string[]  // task IDs` — the declared edges;
 *   · `task-link → { source: string, target: string }` — "Dependency link
 *     created".
 *
 * ── FINDINGS ───────────────────────────────────────────────────────────────
 *
 * MATRIX-gantt-1 (fixed)  `show-dependencies` used to render nothing at all.
 *   `showDependencies` is declared as a property and used to be read by
 *   nothing in the render, and `GanttTask.dependencies` was accepted and
 *   discarded. The timeline now draws one dependency link per declared edge
 *   when the switch is on (its documented default), none when it is off.
 *
 * MATRIX-gantt-2 (fixed)  `task-link` used to be unreachable.
 *   No port, handle or drop target existed to create a link with. The
 *   documented gesture is now: drag from a task's right edge (its finish
 *   handle) to arm that task as a link source, then click the target bar —
 *   the link is created, added to the target's `dependencies` and announced
 *   as `task-link` with `{ source, target }`.
 *
 * Both formerly pinned assertions below are unpinned at full strength as the
 * regression guard.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, tasksOf, makeGantt, readFacts, dependencyProblems, collectEvents,
  structureProblems, barAt, drag, clickNode, expectClean, removeComponent, wait, SETTLE,
} from './gantt-support';
import type { GanttTask } from '../../../packages/components/src/gantt/snice-gantt.types';

/** Dependency graph shapes, by edge count. */
const SHAPES: Record<string, () => GanttTask[]> = {
  'no-edges': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: 'b', name: 'B', start: '2026-03-06', end: '2026-03-10' },
  ],
  'single-edge': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: 'b', name: 'B', start: '2026-03-06', end: '2026-03-10', dependencies: ['a'] },
  ],
  'chain': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: 'b', name: 'B', start: '2026-03-06', end: '2026-03-10', dependencies: ['a'] },
    { id: 'c', name: 'C', start: '2026-03-11', end: '2026-03-15', dependencies: ['b'] },
  ],
  'fan-in': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: 'b', name: 'B', start: '2026-03-01', end: '2026-03-05' },
    { id: 'c', name: 'C', start: '2026-03-06', end: '2026-03-10', dependencies: ['a', 'b'] },
  ],
  'fan-out': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: 'b', name: 'B', start: '2026-03-06', end: '2026-03-10', dependencies: ['a'] },
    { id: 'c', name: 'C', start: '2026-03-06', end: '2026-03-10', dependencies: ['a'] },
  ],
  'across-groups': () => [
    { id: 'a', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'One' },
    { id: 'b', name: 'B', start: '2026-03-06', end: '2026-03-10', group: 'Two', dependencies: ['a'] },
  ],
};

const SHAPE_NAMES = Object.keys(SHAPES);

describe('gantt matrix: dependencies', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('the switch and the declared edges', () => {
    for (const shape of SHAPE_NAMES) {
      for (const showDependencies of [true, false]) {
        for (const zoom of ['day', 'week'] as const) {
          const c = combo({ dataset: 'chained', zoom, showDependencies });
          const id = `shape=${shape}/${comboId(c)}`;
          const tasks = SHAPES[shape]();
          const edges = tasks.reduce((sum, task) => sum + (task.dependencies?.length ?? 0), 0);

          // The no-edge shape has nothing to draw either way.
          it(`${id}: draws ${showDependencies ? edges : 0} dependency links${
            edges > 0 && showDependencies ? ' [MATRIX-gantt-1 (fixed)]' : ''}`, async () => {
            el = await makeGantt(c, tasks);
            expectClean(dependencyProblems(el, { ...c, showDependencies }, tasks), id);
          });
        }
      }
    }
  });

  describe('MATRIX-gantt-1 (fixed): the documented default', () => {
    it('show-dependencies defaults to true, so links are drawn unasked (fixed)', async () => {
      const tasks = SHAPES.chain();
      // No attribute at all — the property default is documented as `true`.
      el = await makeGantt({ dataset: 'chained', zoom: 'week', showDependencies: true }, tasks);
      expect(el.showDependencies).toBe(true);
      expect(readFacts(el).dependencyEdges).toBe(2);
    });

    it('the property itself does default to true and reflects the attribute', async () => {
      // The property plumbing IS correct; only the render ignores it. Keeping
      // this unpinned isolates the finding to the render.
      el = await makeGantt({ dataset: 'chained', zoom: 'week', showDependencies: false });
      expect(el.showDependencies).toBe(false);
      el.showDependencies = true;
      await wait(SETTLE);
      expect(el.showDependencies).toBe(true);
    });

    it('dependencies never disturb the rest of the render', async () => {
      const c = combo({ dataset: 'chained' });
      const tasks = tasksOf(c);
      el = await makeGantt(c, tasks);
      expectClean(structureProblems(el, c, tasks), comboId(c));
    });
  });

  describe('MATRIX-gantt-2 (fixed): task-link reachability', () => {
    it('the documented gesture creates a link and emits task-link (fixed)', async () => {
      const tasks = SHAPES['no-edges']();
      const c = combo({ dataset: 'chained' });
      el = await makeGantt(c, tasks);
      const seen = collectEvents(el);

      // Every plausible link gesture the doc's "Dependency link created" could
      // mean: dragging from one bar onto another, and clicking a port on each.
      await drag(el, 0, 'resize-right', 400);
      clickNode(barAt(el, 0));
      clickNode(barAt(el, 1));
      await wait(SETTLE);

      expect(seen.filter(event => event.type === 'task-link')).toHaveLength(1);
    });

    it('the link gesture needs no separate port element on any bar', async () => {
      // After the fix the affordance is the task's own right edge (its finish
      // handle) plus a click on the target bar — the doc names no port, and
      // none is rendered.
      el = await makeGantt(combo({ dataset: 'chained' }));
      const ports = el.shadowRoot.querySelectorAll(
        '.gantt-port, .gantt-bar-port, [part~="port"], [data-port]',
      );
      expect(ports).toHaveLength(0);
    });
  });
});
