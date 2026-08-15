/**
 * snice-divider matrix — the generated cross.
 *
 * orientation x text x variant (12 combos), with align/spacing/capped/color/
 * text-background rotated across them. Each combo is judged by the shared
 * oracle in divider-matrix-utils.ts, which encodes docs/ai/components/divider.md
 * and the documented reflection rules — never observed output.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, makeDivider, expectDivider, dividerProblems,
} from './divider-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('divider matrix: generated cross', () => {
  for (const combo of combos) {
    // MATRIX-divider-1: a VERTICAL divider silently drops its text label. The
    // render function branches on `this.text && this.orientation ===
    // 'horizontal'`, so a vertical divider with `text` renders the bare line and
    // the documented `text` part never exists. Nothing in
    // docs/ai/components/divider.md (or docs/components/divider.md, which
    // documents the `text` part as "Optional text label" with no caveat) makes
    // `text` horizontal-only. The assertion below stays correct: the label is
    // owed, and it is missing.
    const isVerticalLabelled = combo.orientation === 'vertical' && !!combo.text;
    const runner = isVerticalLabelled ? it.fails : it;
    const name = isVerticalLabelled ? `MATRIX-divider-1 ${combo.id}` : combo.id;

    runner(name, async () => {
      el = await makeDivider(combo);
      expectDivider(el, combo);
    });
  }
});

describe('divider matrix: the cross is what it claims to be', () => {
  it('generates 12 combos covering every orientation, text state and variant', () => {
    const seen = new Set(combos.map(c => `${c.orientation}/${!!c.text}/${c.variant}`));
    if (combos.length !== 12 || seen.size !== 12) {
      throw new Error(`generator produced ${combos.length} combos, ${seen.size} distinct`);
    }
  });

  it('rotates every documented align, spacing and capped value into the cross', () => {
    for (const [dimension, values] of Object.entries({
      align: ['start', 'center', 'end'],
      spacing: ['none', 'small', 'medium', 'large'],
    })) {
      for (const value of values) {
        if (!combos.some(c => (c as any)[dimension] === value)) {
          throw new Error(`no combo exercises ${dimension}="${value}"`);
        }
      }
    }
    if (!combos.some(c => c.capped) || !combos.some(c => !c.capped)) {
      throw new Error('capped is not exercised in both states');
    }
    if (!combos.some(c => c.color) || !combos.some(c => c.textBackground)) {
      throw new Error('color / text-background are not exercised');
    }
  });
});

describe('divider matrix: the oracle is not vacuous', () => {
  it('reports a missing label rather than passing a divider that lost its text', async () => {
    const combo = { ...combos[0], text: 'OR' };
    el = await makeDivider({ ...combo, text: '' }); // built WITHOUT the label
    const problems = dividerProblems(el, combo as any); // judged as if it had one
    if (problems.length === 0) {
      throw new Error('oracle accepted a divider whose documented label is absent');
    }
  });
});
