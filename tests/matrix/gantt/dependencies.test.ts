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
 * MATRIX-gantt-1  `show-dependencies` renders nothing at all.
 *   combo:    shape=chain/zoom=day|week/show-dependencies=true (2 declared edges)
 *   expected: 4 dependency link elements in the timeline; 0 when the switch
 *             is off, so the documented default of `true` is observable.
 *   actual:   0 elements either way. `showDependencies` is declared as a
 *             property and never read by the render, and `GanttTask.dependencies`
 *             is accepted and discarded. The stylesheet still ships the
 *             `.gantt-dependencies`, `.gantt-dependency-arrow` and
 *             `.gantt-dependency-arrowhead` rules the render never emits, so
 *             the feature is half-built rather than undocumented.
 *
 * MATRIX-gantt-2  `task-link` is unreachable.
 *   combo:    dataset=chained/zoom=week/show-dependencies=true
 *   expected: some documented interaction creates a dependency link and emits
 *             `task-link` with `{ source, target }`.
 *   actual:   no port, handle or drop target exists to create a link with, and
 *             the emitter is never called from any code path, so no sequence of
 *             user gestures can produce the event.
 *
 * Both assertions below are the DOCUMENTED expectation at full strength and are
 * pinned with `it.fails`. Fixing the component turns them green and this file
 * red, which is the signal to unpin them.
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

          // The no-edge shape has nothing to draw either way, so it is the one
          // combination the current build satisfies honestly.
          const pin = edges > 0 && showDependencies ? it.fails : it;

          pin(`${id}: draws ${showDependencies ? edges : 0} dependency links${
            edges > 0 && showDependencies ? ' [MATRIX-gantt-1]' : ''}`, async () => {
            el = await makeGantt(c, tasks);
            expectClean(dependencyProblems(el, { ...c, showDependencies }, tasks), id);
          });
        }
      }
    }
  });

  describe('MATRIX-gantt-1: the documented default', () => {
    it.fails('show-dependencies defaults to true, so links are drawn unasked', async () => {
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

  describe('MATRIX-gantt-2: task-link reachability', () => {
    it.fails('some documented gesture creates a link and emits task-link', async () => {
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

    it('no port or link affordance is rendered on any bar', async () => {
      // The observable half of the same finding, stated positively so the file
      // records what IS true today without weakening the claim above.
      el = await makeGantt(combo({ dataset: 'chained' }));
      const ports = el.shadowRoot.querySelectorAll(
        '.gantt-port, .gantt-bar-port, [part~="port"], [data-port]',
      );
      expect(ports).toHaveLength(0);
    });
  });
});
