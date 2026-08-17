/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-code-block> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is read off `docs/ai/components/code-block.md` and
 * `snice-code-block.types.ts`, never off rendered output (`.ai/fuzzing.md`):
 *
 *   code: string = ''                 set via slot or property
 *   language: 'javascript'|…|'plaintext' = 'plaintext'
 *   grammar: GrammarDefinition|string|null = ''
 *   showLineNumbers = false           attr show-line-numbers
 *   startLine = 1                     attr start-line
 *   highlightLines: number[] = []     JS-only, no attribute
 *   copyable = true
 *   filename = ''
 *   format = ''
 *   theme: ''|'dark'|'light' = ''
 *   fetchMode: 'native'|'virtual'|'event' = 'native'   attr fetch-mode
 *
 *   CSS parts: container · header · filename · copy-button · content · pre · code
 *   Slot: (default) — code content as slotted text, AUTO-DEDENTED
 *   Events: code-copy, code-before/after-format, code-before/after-highlight,
 *           grammar-request (event mode only), grammar-loaded
 *   Methods: copy(), highlight(), setHighlighter(fn), setFormatter(fn),
 *            setGrammar(grammar)
 *
 * ── What the oracle claims, and what it deliberately does not ───────────────
 *
 * The docs describe WHICH text is shown, WHICH parts exist and WHICH line
 * carries a line number or a highlight. They describe token COLOURS
 * (`--code-keyword-color`, …) but never which substring of a given language is
 * a keyword, so the oracle judges the code element by its TEXT — the string a
 * reader actually sees — and by the line structure, and leaves the token
 * markup to the grammar's own tests.
 *
 * The slot is the primary mount channel here, because it is the one the docs
 * lead with and the one that is reactive. The `code` PROPERTY channel — also
 * documented, in the Basic Usage block — has its own pinned finding.
 */
import { Problems, mount, part, shadow, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/code-block/snice-code-block';

export const LANGUAGES = [
  'javascript', 'typescript', 'html', 'css', 'json', 'python', 'bash', 'plaintext',
] as const;
export type CodeLanguage = typeof LANGUAGES[number];

export const FETCH_MODES = ['native', 'virtual', 'event'] as const;
export type FetchMode = typeof FETCH_MODES[number];

export const THEMES = ['', 'dark', 'light'] as const;
export type CodeTheme = typeof THEMES[number];

/** The documented CSS parts, in the order the doc lists them. */
export const PARTS = [
  'container', 'header', 'filename', 'copy-button', 'content', 'pre', 'code',
] as const;

/** Code shapes: the line structures line numbers and highlights key off. */
export const SNIPPETS = {
  oneLine: 'const x = 1;',
  threeLines: 'const x = 1;\nconst y = 2;\nconst sum = x + y;',
  withBlank: 'const x = 1;\n\nconst y = 2;',
  json: '{\n  "a": 1,\n  "b": [2, 3]\n}',
} as const;

export type SnippetName = keyof typeof SNIPPETS;
export const SNIPPET_NAMES = Object.keys(SNIPPETS) as SnippetName[];

export interface CodeBlockCombo {
  snippet: SnippetName;
  language?: CodeLanguage;
  showLineNumbers?: boolean;
  startLine?: number;
  highlightLines?: number[];
  copyable?: boolean;
  filename?: string;
  theme?: CodeTheme;
}

export function comboId(combo: CodeBlockCombo): string {
  const bits = [
    `snippet=${combo.snippet}`,
    combo.language ? `language=${combo.language}` : 'language=default',
    combo.showLineNumbers ? 'line-numbers' : '-',
    combo.startLine !== undefined ? `start=${combo.startLine}` : 'start=default',
    combo.highlightLines?.length ? `highlight=[${combo.highlightLines}]` : 'highlight=none',
    combo.copyable === false ? 'not-copyable' : 'copyable',
    combo.filename ? `file="${combo.filename}"` : 'no-file',
  ];
  if (combo.theme) bits.push(`theme=${combo.theme}`);
  return bits.join('/');
}

/** Documented defaults, applied where a combo leaves a dimension unset. */
export function resolved(combo: CodeBlockCombo) {
  return {
    code: SNIPPETS[combo.snippet],
    language: combo.language ?? 'plaintext',
    showLineNumbers: combo.showLineNumbers ?? false,
    startLine: combo.startLine ?? 1,
    highlightLines: combo.highlightLines ?? [],
    copyable: combo.copyable ?? true,
    filename: combo.filename ?? '',
    theme: combo.theme ?? '',
  };
}

/**
 * Mount a combo with its code as SLOTTED TEXT — the documented default form:
 *
 *     <snice-code-block language="javascript">
 *     const x = 1;
 *     </snice-code-block>
 *
 * The slotted text is written indented, because the docs promise it is
 * auto-dedented and that promise is only testable if there is indentation to
 * remove.
 */
export async function mountCodeBlock(combo: CodeBlockCombo): Promise<HTMLElement> {
  const want = resolved(combo);
  const el = document.createElement('snice-code-block');

  // The ATTRIBUTE channel for everything the docs give an attribute name —
  // `show-line-numbers`, `start-line`, `fetch-mode` and the plain ones — set
  // BEFORE connection, which is the form the documentation writes:
  //
  //     <snice-code-block language="javascript" show-line-numbers start-line="10">
  //
  el.setAttribute('language', want.language);
  if (want.showLineNumbers) el.setAttribute('show-line-numbers', '');
  el.setAttribute('start-line', String(want.startLine));
  if (!want.copyable) el.setAttribute('copyable', 'false');
  if (want.filename) el.setAttribute('filename', want.filename);
  if (want.theme) el.setAttribute('theme', want.theme);

  // `highlightLines` is documented "JS-only; no attribute", so it can only
  // cross the property channel — assigned before insertion, so it is in place
  // for the element's first render exactly as an attribute would be.
  if (want.highlightLines.length) (el as any).highlightLines = want.highlightLines;

  // The slotted code, written indented: the docs promise auto-dedent, and that
  // promise is only testable if there is indentation to remove.
  const indented = want.code.split('\n').map(line => (line ? `      ${line}` : line)).join('\n');
  el.innerHTML = `\n${indented}\n    `;

  document.body.appendChild(el);
  await (el as any).ready;
  await wait(40);
  return el;
}

/** The rendered code lines, as a reader sees them (line numbers stripped). */
export function renderedLines(el: HTMLElement): string[] {
  const code = part(el, 'code');
  if (!code) return [];
  const lineNodes = [...code.querySelectorAll('.code-block__line')];
  if (lineNodes.length === 0) {
    return (code.textContent ?? '').replace(/\n$/, '').split('\n');
  }
  return lineNodes.map((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.code-block__line-number').forEach(n => n.remove());
    return (clone.textContent ?? '').replace(/\n$/, '');
  });
}

/** The line numbers the component printed, in order. */
export function renderedLineNumbers(el: HTMLElement): number[] {
  const code = part(el, 'code');
  if (!code) return [];
  return [...code.querySelectorAll('.code-block__line-number')]
    .map(node => Number((node.textContent ?? '').trim()));
}

/** The 1-based indices of the lines carrying the highlight class. */
export function highlightedIndices(el: HTMLElement): number[] {
  const code = part(el, 'code');
  if (!code) return [];
  const lines = [...code.querySelectorAll('.code-block__line')];
  return lines
    .map((node, index) => ((node.getAttribute('class') ?? '').split(/\s+/)
      .includes('code-block__line--highlight') ? index : -1))
    .filter(index => index >= 0);
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted code block against the documented contract, collecting
 * EVERY violation so a failing combo tells its whole story in one run.
 */
export function checkCodeBlock(el: HTMLElement, combo: CodeBlockCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);
  const root = shadow(el);

  // ── the seven documented parts ──────────────────────────────────────────
  for (const name of PARTS) {
    problems.check(!!exactPart(el, name), `no part="${name}"`);
  }

  // ── the code element carries its language ───────────────────────────────
  const code = exactPart(el, 'code');
  if (!code) {
    // Nothing below can be judged without it, and `matrix-common`'s `check`
    // returns void, so the early exit is written out rather than folded into
    // the call.
    problems.say('no part="code" — the block rendered no code element');
    return problems;
  }
  const classes = (code.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  problems.check(
    classes.includes(`language-${want.language}`),
    `code element classes ${classes.join(' ')} lack "language-${want.language}"`,
  );
  problems.equal(code.getAttribute('data-language'), want.language, 'data-language');

  // ── the slotted code arrives dedented ───────────────────────────────────
  problems.equal(
    (el as any).code, want.code,
    'the slotted code was not dedented to the source snippet',
  );

  // ── the text a reader sees ──────────────────────────────────────────────
  const expectedLines = want.code.split('\n');
  problems.equalList(renderedLines(el), expectedLines, 'rendered code lines');

  // ── line numbers ────────────────────────────────────────────────────────
  const numbers = renderedLineNumbers(el);
  if (want.showLineNumbers) {
    const expected = expectedLines.map((_, index) => want.startLine + index);
    problems.equalList(numbers, expected, 'printed line numbers');
  } else {
    problems.equal(numbers.length, 0, 'line numbers printed without show-line-numbers');
  }

  // ── highlighted lines ───────────────────────────────────────────────────
  // `highlightLines` is documented as LINE NUMBERS, so it is read against
  // `startLine`: with start-line=10, highlighting line 11 marks the second row.
  const expectedHighlights = want.highlightLines
    .map(number => number - want.startLine)
    .filter(index => index >= 0 && index < expectedLines.length);
  problems.equalList(
    highlightedIndices(el), expectedHighlights.sort((a, b) => a - b),
    'highlighted line indices',
  );

  // ── header: filename text and the copy button ───────────────────────────
  const filename = exactPart(el, 'filename');
  problems.check(!!filename, 'no part="filename"');
  if (filename) problems.equal(textOf(filename), want.filename, 'filename text');

  const copyButton = exactPart<HTMLButtonElement>(el, 'copy-button');
  problems.check(!!copyButton, 'no part="copy-button"');
  if (copyButton) {
    problems.equal(copyButton.tagName.toLowerCase(), 'button', 'copy control is a <button>');
    // `copyable = false` must actually take the button away from the reader.
    const hidden = copyButton.style.display === 'none';
    problems.equal(!hidden, want.copyable, 'copy button is offered');
    if (want.copyable) {
      problems.equal(textOf(copyButton), 'Copy', 'copy button label');
      problems.equal(copyButton.getAttribute('aria-live'), 'polite', 'copy button aria-live');
    }
  }

  // ── theme: '' means auto-detect, a value forces it ──────────────────────
  problems.equal((el as any).theme, want.theme, 'theme property');

  // ── the slot exists and is not shown twice ──────────────────────────────
  const slot = root.querySelector('slot:not([name])');
  problems.check(!!slot, 'no default slot for code content');

  return problems;
}

// ── Event recording ─────────────────────────────────────────────────────────

export const CODE_EVENTS = [
  'code-copy', 'code-before-format', 'code-after-format',
  'code-before-highlight', 'code-after-highlight',
  'grammar-request', 'grammar-loaded',
] as const;

export interface Recorded { type: string; detail: any }

/** Record every documented event the element emits, in dispatch order. */
export function recordEvents(el: HTMLElement): { seen: Recorded[]; of: (type: string) => any[] } {
  const seen: Recorded[] = [];
  for (const type of CODE_EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return { seen, of: (type: string) => seen.filter(e => e.type === type).map(e => e.detail) };
}

/**
 * Answer the documented `snice/code-block/load-grammar` request channel the
 * way a controller would (docs/ai/request-response.md).
 */
export function respondToGrammar(
  target: EventTarget, reply: (payload: any) => any,
): { payloads: any[]; stop: () => void } {
  const payloads: any[] = [];
  const type = '@request/snice/code-block/load-grammar';
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    payloads.push(detail.payload);
    detail.discovery.resolve();
    try {
      detail.data.resolve(reply(detail.payload));
    } catch (error) {
      detail.data.reject(error);
    }
  };
  target.addEventListener(type, handler);
  return { payloads, stop: () => target.removeEventListener(type, handler) };
}

/** The documented request channel for grammar loading in `virtual` mode. */
export const LOAD_GRAMMAR_CHANNEL = 'snice/code-block/load-grammar';

/** A minimal grammar whose only rule tags the word `alpha`. */
export const TEST_GRAMMAR = {
  name: 'matrix-test',
  defaultToken: '',
  tokenizer: {
    root: [
      ['alpha', 'keyword'],
      ['.', ''],
    ],
  },
  formatters: {
    pretty: { indent: 2 },
  },
} as any;

export { Problems, part, shadow, textOf, wait };
