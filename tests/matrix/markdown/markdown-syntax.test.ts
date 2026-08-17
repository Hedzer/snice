/**
 * snice-markdown matrix — the SYNTAX cross.
 *
 * The doc's "Supported Syntax" line is the specification: headings h1-h6,
 * bold, italic, strikethrough, ordered/unordered/task lists, code blocks with
 * language class, inline code, blockquotes, tables (GFM), images, links,
 * autolinks, horizontal rules.
 *
 * Each of those 21 cases is crossed against the two properties that could
 * change the outcome — `sanitize` (the rendered HTML passes through the
 * sanitizer or does not) and the delivery channel (`setContent()` vs slotted
 * text, the two the docs name) — for 21 x 2 x 2 = 84 combos. `theme` is
 * crossed separately below, because it is documented as a styling switch and
 * must NOT change the rendered structure.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  SYNTAX, THEMES, checkSyntax, mountMarkdown,
  type MarkdownCombo, type MarkdownTheme,
} from './markdown-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * MATRIX-markdown-1 — "task lists" are on the documented supported-syntax
 * list, and `sanitize: boolean = true` is the documented DEFAULT. The parser
 * renders a task item as
 *
 *     <li class="task-list-item"><input type="checkbox" disabled> Todo</li>
 *
 * and the sanitizer's dangerous-tag list contains `input`, so the default
 * configuration strips every checkbox back out. A task list therefore renders
 * as a plain bullet list unless the consumer turns sanitization OFF — which
 * the docs never suggest, and which would disable the rest of the protection.
 *
 * Expected: `- [ ] Todo` renders a checkbox with `sanitize` at its default.
 * Actual:   the checkbox is removed; only the label survives.
 *
 * Minimal repro:
 *   md.setContent('- [ ] Todo');      // -> <li class="task-list-item"> Todo</li>
 *
 * Reported, not fixed — see DANGEROUS_TAGS in
 * packages/components/src/markdown/snice-markdown.ts.
 */
const stripsTaskCheckboxes = (name: string, sanitize: boolean) =>
  name === 'task list' && sanitize;

describe('markdown matrix: documented syntax x sanitize x delivery channel', () => {
  for (const syntax of SYNTAX) {
    for (const sanitize of [true, false]) {
      for (const viaSlot of [false, true]) {
        const id = `${syntax.name}/${sanitize ? 'sanitized' : 'raw'}`
          + `/${viaSlot ? 'slot' : 'setContent'}`;
        const run = stripsTaskCheckboxes(syntax.name, sanitize) ? it.fails : it;
        const label = stripsTaskCheckboxes(syntax.name, sanitize)
          ? `MATRIX-markdown-1: ${id}`
          : id;
        run(label, async () => {
          const combo: MarkdownCombo = { source: syntax.source, sanitize, viaSlot };
          el = await mountMarkdown(combo);
          expectClean(checkSyntax(el, syntax, combo), id);
        });
      }
    }
  }
});

describe('markdown matrix: theme is styling only', () => {
  // `theme: 'default'|'github'` is documented under Properties with no effect
  // on the supported syntax, so the same source must render the same STRUCTURE
  // under both. A theme that changed the DOM would break every consumer that
  // walks the rendered tree.
  for (const theme of THEMES as readonly MarkdownTheme[]) {
    for (const syntax of SYNTAX) {
      // The theme cross runs at the documented `sanitize` default, so the
      // task-list finding reproduces here too.
      const run = stripsTaskCheckboxes(syntax.name, true) ? it.fails : it;
      const id = `theme=${theme}/${syntax.name}`;
      run(stripsTaskCheckboxes(syntax.name, true) ? `MATRIX-markdown-1: ${id}` : id, async () => {
        const combo: MarkdownCombo = { source: syntax.source, theme };
        el = await mountMarkdown(combo);
        expectClean(checkSyntax(el, syntax, combo), id);
      });
    }
  }
});
