/**
 * snice-code-block matrix — the HEADER and LANGUAGE cross.
 *
 * The header is the only chrome the component has, and the docs give it three
 * inputs: `filename` (its text), `copyable` (whether the button is offered)
 * and — one level out — `language`, which the code element must carry as both
 * a class and a data attribute so the token colours have something to key off.
 *
 *   · language (8, the full documented enumeration) x the four vectors of
 *     {copyable, filename} = 32 combos;
 *   · theme ('', 'dark', 'light') x {copyable, filename} = 12 combos, since
 *     `theme` is documented as an independent forcing switch;
 *   · the header's reactivity: `filename`, `copyable` and `language` all carry
 *     watchers, so changing each after mount must update the rendered header
 *     rather than freeze at its first value.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import {
  LANGUAGES, THEMES, checkCodeBlock, comboId, mountCodeBlock,
  type CodeBlockCombo, type CodeLanguage, type CodeTheme,
} from './code-block-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/** The four vectors of the two header switches. */
const HEADER_VECTORS: Array<{ copyable: boolean; filename: string }> = [
  { copyable: true, filename: '' },
  { copyable: true, filename: 'app.ts' },
  { copyable: false, filename: '' },
  { copyable: false, filename: 'app.ts' },
];

const LANGUAGE_COMBOS: Array<CodeBlockCombo & { id: string }> = (() => {
  const out: Array<CodeBlockCombo & { id: string }> = [];
  for (const language of LANGUAGES as readonly CodeLanguage[]) {
    for (const vector of HEADER_VECTORS) {
      const combo: CodeBlockCombo = { snippet: 'threeLines', language, ...vector };
      out.push({ ...combo, id: comboId(combo) });
    }
  }
  return out;
})();

describe('code-block matrix: language x copyable x filename', () => {
  for (const combo of LANGUAGE_COMBOS) {
    it(combo.id, async () => {
      el = await mountCodeBlock(combo);
      expectClean(checkCodeBlock(el, combo), combo.id);
    });
  }
});

const THEME_COMBOS: Array<CodeBlockCombo & { id: string }> = (() => {
  const out: Array<CodeBlockCombo & { id: string }> = [];
  for (const theme of THEMES as readonly CodeTheme[]) {
    for (const vector of HEADER_VECTORS) {
      const combo: CodeBlockCombo = { snippet: 'json', language: 'json', theme, ...vector };
      out.push({ ...combo, id: comboId(combo) });
    }
  }
  return out;
})();

describe('code-block matrix: theme x copyable x filename', () => {
  for (const combo of THEME_COMBOS) {
    it(combo.id, async () => {
      el = await mountCodeBlock(combo);
      expectClean(checkCodeBlock(el, combo), combo.id);
    });
  }
});

describe('code-block matrix: the header reacts to its inputs', () => {
  it('a later filename replaces the rendered one', async () => {
    const combo: CodeBlockCombo = { snippet: 'oneLine', filename: 'first.ts' };
    el = await mountCodeBlock(combo);
    expectClean(checkCodeBlock(el, combo), comboId(combo));

    (el as any).filename = 'second.ts';
    await wait(30);
    expect(textOf(exactPart(el, 'filename'))).toBe('second.ts');
    expectClean(checkCodeBlock(el, { ...combo, filename: 'second.ts' }), 'filename=second.ts');
  });

  it('clearing filename empties the header text', async () => {
    const combo: CodeBlockCombo = { snippet: 'oneLine', filename: 'first.ts' };
    el = await mountCodeBlock(combo);
    (el as any).filename = '';
    await wait(30);
    expectClean(checkCodeBlock(el, { ...combo, filename: '' }), 'filename=""');
  });

  it('turning copyable off withdraws the button, and back on restores it', async () => {
    const combo: CodeBlockCombo = { snippet: 'oneLine', copyable: true };
    el = await mountCodeBlock(combo);
    expectClean(checkCodeBlock(el, combo), comboId(combo));

    (el as any).copyable = false;
    await wait(30);
    expectClean(checkCodeBlock(el, { ...combo, copyable: false }), 'copyable=false');

    (el as any).copyable = true;
    await wait(30);
    expectClean(checkCodeBlock(el, { ...combo, copyable: true }), 'copyable=true again');
  });

  it('a later language re-labels the code element', async () => {
    const combo: CodeBlockCombo = { snippet: 'threeLines', language: 'javascript' };
    el = await mountCodeBlock(combo);
    (el as any).language = 'python';
    await wait(30);
    expectClean(checkCodeBlock(el, { ...combo, language: 'python' }), 'language=python');
  });
});
