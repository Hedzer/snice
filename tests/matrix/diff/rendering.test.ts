/**
 * snice-diff matrix — the RENDERED TABLE, across the display switches.
 *
 * Four documented switches decide what a diff row is made of:
 *
 *   · `mode: 'unified'|'split' = 'unified'` — one table or two panes;
 *   · `lineNumbers: boolean = true` (attr `line-numbers`) — the gutter columns;
 *   · `markers: boolean = true` — "Show +/- markers column";
 *   · `showModeToggle: boolean = true` — the header's Unified/Split buttons.
 *
 * They are independent, so the matrix is their full cross over six text
 * scenarios: 6 x 2 x 2 x 2 = 48 combos. Every one is judged by `checkRender`,
 * whose expectation is recomputed from the documented LCS pipeline in
 * `diff-support.ts` rather than read back from the component.
 */
import { describe, it, afterEach } from 'vitest';
import {
  DEFAULTS, MODES, Problems, SCENARIO_NAMES, checkRender, expectClean, makeDiff,
  removeComponent, vectorId, type Diff, type DiffVector,
} from './diff-support';

let el: Diff | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const COMBOS: DiffVector[] = [];
for (const scenario of SCENARIO_NAMES) {
  for (const mode of MODES) {
    for (const lineNumbers of [true, false]) {
      for (const markers of [true, false]) {
        COMBOS.push({ ...DEFAULTS, scenario, mode, lineNumbers, markers });
      }
    }
  }
}

describe('snice-diff matrix: rendered table', () => {
  for (const vector of COMBOS) {
    it(vectorId(vector), async () => {
      el = await makeDiff(vector);
      const problems = new Problems();
      checkRender(problems, el, vector);
      expectClean(problems, vectorId(vector));
    });
  }
});

describe('snice-diff matrix: the header toggle switch', () => {
  // `showModeToggle` is orthogonal to everything else the header shows, so it
  // gets its own small cross rather than doubling the 48 above.
  for (const scenario of SCENARIO_NAMES) {
    for (const mode of MODES) {
      const vector: DiffVector = { ...DEFAULTS, scenario, mode, showModeToggle: false };
      it(vectorId(vector), async () => {
        el = await makeDiff(vector);
        const problems = new Problems();
        checkRender(problems, el, vector);
        expectClean(problems, vectorId(vector));
      });
    }
  }
});
