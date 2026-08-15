/**
 * Smoke slice of the snice-divider matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full divider cross runs via `npm run test:matrix`.
 * This file lives at `smoke.test.ts` so it stays collected, and it is the
 * standing cost the everyday loop pays for this component.
 *
 * The subset: the two render-tree shapes (labelled / bare), the vertical axis,
 * one reflection combo standing in for the whole styling contract, and the two
 * marquee findings the matrix pinned. Every assertion routes through the
 * matrix's own oracle, so this file cannot drift into something weaker than the
 * suite it stands in for. Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeDivider, dividerProblems, wait,
  type DividerCombo,
} from './divider-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<DividerCombo> = {}): DividerCombo => ({
  id: 'smoke', ...DEFAULTS, ...over,
} as DividerCombo);

describe('divider matrix smoke', () => {
  it('a bare divider is one element carrying part="base line"', async () => {
    const c = combo();
    el = await makeDivider(c);
    expect(dividerProblems(el, c)).toEqual([]);
  });

  it('a labelled divider renders line / text / line', async () => {
    const c = combo({ text: 'OR', align: 'start' });
    el = await makeDivider(c);
    expect(dividerProblems(el, c)).toEqual([]);
  });

  it('a vertical divider carries aria-orientation="vertical"', async () => {
    const c = combo({ orientation: 'vertical', spacing: 'large' });
    el = await makeDivider(c);
    expect(dividerProblems(el, c)).toEqual([]);
  });

  it('every style-hook property reflects to the attribute its CSS keys off', async () => {
    const c = combo({ variant: 'dashed', spacing: 'small', align: 'end', capped: true });
    el = await makeDivider(c);
    expect(dividerProblems(el, c)).toEqual([]);
  });

  // MATRIX-divider-1: a vertical divider drops its documented `text` label.
  it.fails('MATRIX-divider-1: a vertical divider keeps its text label', async () => {
    const c = combo({ orientation: 'vertical', text: 'OR' });
    el = await makeDivider(c);
    expect(dividerProblems(el, c)).toEqual([]);
  });

  // MATRIX-divider-2: clearing `color` never releases --divider-color.
  it.fails('MATRIX-divider-2: clearing color releases --divider-color', async () => {
    el = await makeDivider(combo({ color: 'rgb(59, 130, 246)' }));
    el.color = '';
    await wait(20);
    expect(dividerProblems(el, combo(), { fresh: false })).toEqual([]);
  });
});
