/**
 * snice-code-block matrix — the DISPLAY cross.
 *
 * The three properties that decide what a reader sees line by line, crossed
 * against the four code shapes:
 *
 *   · `showLineNumbers` (2) — the gutter;
 *   · `startLine` (3: default 1, 10, 0) — what the gutter counts FROM, and
 *     therefore also the frame `highlightLines` is read in;
 *   · `highlightLines` (4: none, one, several, out-of-range) — which rows are
 *     marked;
 *   · code shape (4: one line, three lines, a blank line in the middle, JSON).
 *
 * 2 x 3 x 4 x 4 = 96 combos. Every one is judged by the shared oracle, which
 * derives the expected line text, gutter numbers and highlight indices from
 * the snippet and the documented defaults.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  SNIPPET_NAMES, checkCodeBlock, comboId, mountCodeBlock,
  type CodeBlockCombo, type SnippetName,
} from './code-block-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const START_LINES = [undefined, 10, 0] as const;

/**
 * Highlight sets, expressed as LINE NUMBERS relative to `startLine` so each
 * one means the same thing wherever the gutter starts. The last entry is
 * deliberately outside every snippet: the docs give `highlightLines` no
 * bounds, so a number with no row must simply mark nothing.
 */
const HIGHLIGHTS = [
  { name: 'none', lines: (start: number) => [] as number[] },
  { name: 'first', lines: (start: number) => [start] },
  { name: 'first+third', lines: (start: number) => [start, start + 2] },
  { name: 'out-of-range', lines: (start: number) => [start + 99] },
] as const;

interface DisplayCombo extends CodeBlockCombo {
  id: string;
}

const COMBOS: DisplayCombo[] = (() => {
  const out: DisplayCombo[] = [];
  for (const showLineNumbers of [false, true]) {
    for (const startLine of START_LINES) {
      for (const highlight of HIGHLIGHTS) {
        for (const snippet of SNIPPET_NAMES as SnippetName[]) {
          const start = startLine ?? 1;
          const combo: CodeBlockCombo = {
            snippet,
            language: 'javascript',
            showLineNumbers,
            highlightLines: highlight.lines(start),
          };
          if (startLine !== undefined) combo.startLine = startLine;
          out.push({ ...combo, id: `${comboId(combo)}/highlight-set=${highlight.name}` });
        }
      }
    }
  }
  return out;
})();

describe('code-block matrix: line numbers x start line x highlight lines x code shape', () => {
  for (const combo of COMBOS) {
    it(combo.id, async () => {
      el = await mountCodeBlock(combo);
      expectClean(checkCodeBlock(el, combo), combo.id);
    });
  }
});
