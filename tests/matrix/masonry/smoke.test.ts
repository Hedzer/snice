/**
 * Smoke slice of the snice-masonry matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/masonry/, 70 combos) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This file
 * lives at `smoke.test.ts` so it stays collected, and it routes every
 * assertion through the matrix's own oracle so it cannot claim something the
 * full suite does not.
 *
 * The marquee combos: the documented default (3 fixed columns), the documented
 * auto mode (`columns="0"`, whose entire mechanism is an attribute selector),
 * an empty masonry, and the standing finding.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  Problems, checkColumnWidth, checkContainer, checkItemRoles, checkItemText,
  checkLayoutVariables, mountMasonry, mountMasonryByProperty,
  mountMasonryMinWidthAttribute, DEFAULTS,
} from './masonry-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('masonry matrix smoke', () => {
  it('the documented defaults produce a role="list" container and listitem children', async () => {
    el = await mountMasonry({ ...DEFAULTS }, 5);
    const problems = new Problems();

    checkContainer(problems, el);
    checkLayoutVariables(problems, el, DEFAULTS);
    checkItemRoles(problems, el, 5);
    checkItemText(problems, el, 5);

    expectClean(problems, 'smoke/defaults');
  });

  it('columns=0 carries the attribute the documented auto rule selects on', async () => {
    const vector = { columns: 0, gap: '1rem', minColumnWidth: '300px' };
    el = await mountMasonryByProperty(vector, 4);
    const problems = new Problems();

    checkContainer(problems, el);
    checkLayoutVariables(problems, el, vector);

    expectClean(problems, 'smoke/auto');
  });

  it('an empty masonry is still a list, with nothing in it', async () => {
    el = await mountMasonry({ ...DEFAULTS }, 0);
    const problems = new Problems();

    checkContainer(problems, el);
    checkItemRoles(problems, el, 0);

    expectClean(problems, 'smoke/empty');
  });

  // MATRIX-masonry-1 (fixed) — see tests/matrix/masonry/layout.test.ts.
  // The documented `min-column-width` attribute now reaches the layout.
  it('MATRIX-masonry-1 (fixed): min-column-width="300px" reaches the layout', async () => {
    el = await mountMasonryMinWidthAttribute('300px');
    const problems = new Problems();
    checkColumnWidth(problems, el, '300px');
    expectClean(problems, 'smoke/min-column-width');
  });
});
