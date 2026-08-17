/**
 * Matrix slice GANTT / GROUPING — `GanttTask.group`, the one field that
 * restructures the render rather than decorating it.
 *
 * Dimensions:
 *   · grouping shape (8) x zoom (3)   = 24 combos
 *   · re-grouping transition (6)      =  6 combos
 *   Total 30.
 *
 * Documented contract (docs/ai/components/gantt.md):
 *   · `group?: string  // group name` — the doc's own Basic Usage puts two of
 *     three tasks in "Phase 1" and leaves the third out, so BOTH grouped and
 *     ungrouped tasks are a supported mix;
 *   · "task-list — Left sidebar with task names" holds every task's name, and a
 *     header for each distinct group;
 *   · grouping is a LAYOUT of the same tasks: no task may be dropped,
 *     duplicated, or renamed by it, and the bar count still equals the task
 *     count (which is what pins the sidebar and the timeline to each other).
 *
 * The doc does not order the groups relative to one another, so this slice
 * asserts the properties grouping must preserve — completeness, uniqueness,
 * contiguity of each group's members — rather than a fixed group sequence.
 *
 * it.fails policy: nothing pinned; all 30 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  ZOOMS, combo, comboId, makeGantt, structureProblems, readFacts,
  expectClean, removeComponent, wait, SETTLE,
} from './gantt-support';
import type { GanttTask } from '../../../packages/components/src/gantt/snice-gantt.types';

/** Grouping shapes, named by what they do to the sidebar. */
const SHAPES: Record<string, () => GanttTask[]> = {
  'none': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08' },
  ],
  'one-group-all': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'Solo' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08', group: 'Solo' },
  ],
  'two-groups': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'One' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08', group: 'Two' },
    { id: '3', name: 'C', start: '2026-03-06', end: '2026-03-11', group: 'One' },
  ],
  'group-plus-loose': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'One' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08' },
    { id: '3', name: 'C', start: '2026-03-06', end: '2026-03-11', group: 'One' },
  ],
  'interleaved': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'X' },
    { id: '2', name: 'B', start: '2026-03-02', end: '2026-03-06', group: 'Y' },
    { id: '3', name: 'C', start: '2026-03-03', end: '2026-03-07', group: 'X' },
    { id: '4', name: 'D', start: '2026-03-04', end: '2026-03-08', group: 'Y' },
  ],
  'singleton-groups': () => [
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: 'G1' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08', group: 'G2' },
    { id: '3', name: 'C', start: '2026-03-06', end: '2026-03-11', group: 'G3' },
  ],
  'duplicate-names': () => [
    { id: '1', name: 'Review', start: '2026-03-01', end: '2026-03-05', group: 'Q1' },
    { id: '2', name: 'Review', start: '2026-03-06', end: '2026-03-10', group: 'Q2' },
  ],
  'empty-group-string': () => [
    // `group: ''` is falsy, so the doc's "group name" is absent — ungrouped.
    { id: '1', name: 'A', start: '2026-03-01', end: '2026-03-05', group: '' },
    { id: '2', name: 'B', start: '2026-03-03', end: '2026-03-08', group: 'Real' },
  ],
};

const SHAPE_NAMES = Object.keys(SHAPES);

describe('gantt matrix: grouping', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('shapes', () => {
    for (const shape of SHAPE_NAMES) {
      for (const zoom of ZOOMS) {
        const id = `shape=${shape}/zoom=${zoom}`;
        const c = combo({ dataset: 'basic', zoom });

        it(`${id}: the sidebar lays out every task under its group`, async () => {
          const tasks = SHAPES[shape]();
          el = await makeGantt(c, tasks);
          expectClean(structureProblems(el, c, tasks), id);

          const facts = readFacts(el);

          // Completeness: the sidebar names every task exactly as often as the
          // data does — grouping relocates rows, it never invents or loses one.
          const tally = (list: string[]) => list.slice().sort().join('|');
          expect(tally(facts.taskNames)).toBe(tally(tasks.map(task => task.name)));

          // Uniqueness: one header per distinct non-empty group.
          const distinct = [...new Set(tasks.map(task => task.group).filter(Boolean))];
          expect(facts.groupHeaders.slice().sort()).toEqual(distinct.slice().sort());

          // Contiguity: a group's members are adjacent in the sidebar, which is
          // the whole point of grouping them.
          for (const group of distinct) {
            const members = tasks.filter(task => task.group === group).map(task => task.name);
            const positions = members.map(name => facts.taskNames.indexOf(name)).sort((a, b) => a - b);
            const span = positions[positions.length - 1] - positions[0];
            expect(span, `group "${group}" members are not adjacent`).toBe(positions.length - 1);
          }

          // And the timeline still has one bar per task, in data order.
          expect(facts.bars.map(bar => bar.label)).toEqual(tasks.map(task => task.name));
        });
      }
    }
  });

  describe('re-grouping', () => {
    const TRANSITIONS: Array<[string, string]> = [
      ['none', 'one-group-all'],
      ['one-group-all', 'none'],
      ['two-groups', 'group-plus-loose'],
      ['group-plus-loose', 'two-groups'],
      ['interleaved', 'singleton-groups'],
      ['singleton-groups', 'interleaved'],
    ];

    for (const [from, to] of TRANSITIONS) {
      const id = `regroup=${from}->${to}`;
      const c = combo({ dataset: 'basic' });

      it(`${id}: reassigning tasks re-lays the sidebar out`, async () => {
        el = await makeGantt(c, SHAPES[from]());
        const next = SHAPES[to]();

        el.tasks = next;
        await wait(SETTLE);

        expectClean(structureProblems(el, c, next), id);
        const facts = readFacts(el);
        expect(facts.groupHeaders.slice().sort())
          .toEqual([...new Set(next.map(task => task.group).filter(Boolean))].sort());
        expect(facts.bars).toHaveLength(next.length);
      });
    }
  });
});
