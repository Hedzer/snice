/**
 * Matrix slice GANTT / STRUCTURE — every dataset shape crossed with every zoom
 * level and both settings of the dependency switch.
 *
 * Dimensions: dataset (10) x zoom (3) x showDependencies (2) = 60 combos.
 *
 * Documented contract under test (docs/ai/components/gantt.md):
 *   · all six CSS parts exist for every combo, tasks or no tasks, and nest as
 *     the doc describes them (controls in header; task-list and timeline in body);
 *   · the header carries exactly the three Day/Week/Month zoom toggle buttons,
 *     and the one matching `zoom` reads as current;
 *   · one bar per `GanttTask`, labelled with that task's `name`;
 *   · the left sidebar lists task names, grouped under each `group` header;
 *   · every bar carries the documented left and right resize handles.
 *
 * it.fails policy: nothing here is pinned. The dependency findings this
 * component has (MATRIX-gantt-1, MATRIX-gantt-2) live in dependencies.test.ts,
 * and neither of them touches the structure claims above — which is exactly why
 * the switch is crossed here too: a dependency layer that appears later must
 * not disturb the parts contract.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DATASET_NAMES, ZOOMS, DEPENDENCY_FLAGS,
  combo, comboId, tasksOf, makeGantt, structureProblems, expectClean, removeComponent,
} from './gantt-support';

describe('gantt matrix: structure', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  for (const dataset of DATASET_NAMES) {
    for (const zoom of ZOOMS) {
      for (const showDependencies of DEPENDENCY_FLAGS) {
        const c = combo({ dataset, zoom, showDependencies });

        it(`${comboId(c)}: renders the documented chart shell`, async () => {
          const tasks = tasksOf(c);
          el = await makeGantt(c, tasks);
          expectClean(structureProblems(el, c, tasks), comboId(c));
        });
      }
    }
  }
});
