/**
 * snice-sortable matrix — the RENDERED SHELL, across every documented switch.
 *
 * `docs/ai/components/sortable.md` gives the container exactly one part and one
 * slot, and one sentence of behaviour about what it does to what it projects:
 *
 *   · "CSS Parts — `base`: Outer sortable container"
 *   · "Slots — (default): Items to be sortable (auto set `draggable`)"
 *
 * Neither of those is documented as conditional, so all four documented
 * switches — `direction`, `handle`, `disabled`, `group` — must leave them
 * intact. This slice crosses all of them (2 x 2 x 2 x 2 = 16 combos) and
 * asserts the shell is the same shell in every one, plus that each switch
 * survived the attribute channel the doc's own markup uses.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, DIRECTIONS, GROUPS, HANDLES, Problems, checkShell, expectClean,
  makeSortable, removeComponent, vectorId, type Sortable, type SortableVector,
} from './sortable-support';

let el: Sortable | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const COMBOS: SortableVector[] = [];
for (const direction of DIRECTIONS) {
  for (const handle of HANDLES) {
    for (const disabled of [false, true]) {
      for (const group of GROUPS) {
        COMBOS.push({ ...DEFAULTS, direction, handle, disabled, group });
      }
    }
  }
}

describe('snice-sortable matrix: shell', () => {
  for (const vector of COMBOS) {
    it(vectorId(vector), async () => {
      el = await makeSortable(vector);
      const problems = new Problems();
      checkShell(problems, el, vector);
      expectClean(problems, vectorId(vector));
    });
  }
});
