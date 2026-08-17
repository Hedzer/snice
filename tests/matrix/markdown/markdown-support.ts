/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-markdown> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is read off `docs/ai/components/markdown.md` and
 * `snice-markdown.types.ts`, never off rendered output (`.ai/fuzzing.md`):
 *
 *   sanitize: boolean = true        Sanitize HTML output
 *   theme: 'default'|'github' = 'default'
 *   setContent(markdown)            Set markdown source and re-render
 *   events: markdown-render -> { html }
 *           link-click     -> { href, text }   (default prevented)
 *   slot:  (default) — markdown source text
 *   part:  base — rendered markdown body container
 *
 *   Supported syntax (the doc's own list, verbatim):
 *     headings h1-h6, bold, italic, strikethrough, ordered/unordered/task
 *     lists, code blocks with language class, inline code, blockquotes,
 *     tables (GFM), images, links, autolinks, horizontal rules.
 *
 *   Accessibility: "keeps the semantic heading hierarchy (h1-h6)", "tables
 *   render real <thead>/<tbody> structure".
 *
 * ── What the oracle claims ──────────────────────────────────────────────────
 *
 * For each documented syntax the oracle states the SEMANTIC element that must
 * appear and the text it must carry — `**bold**` produces a `<strong>` saying
 * `bold`, a GFM table produces a real `<thead>` and `<tbody>`, a fenced block
 * with a language produces `<code class="language-…">`. It does not claim a
 * particular attribute order or whitespace, because the docs describe rendered
 * SEMANTICS, not a serialization.
 *
 * Sanitization is judged the same way: the doc says "built-in sanitization",
 * so the oracle asserts that a script/handler/`javascript:` payload is not
 * present in the rendered tree when `sanitize` is on, and that the surrounding
 * legitimate markdown still rendered.
 */
import { Problems, mount, part, shadow, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/markdown/snice-markdown';

export const THEMES = ['default', 'github'] as const;
export type MarkdownTheme = typeof THEMES[number];

/**
 * One documented syntax, its source, and the semantic shape it must produce.
 *
 * `expect` is a list of assertions over the rendered body: a CSS selector that
 * must match, optionally with the text the first match must carry and a count.
 */
export interface SyntaxCase {
  name: string;
  source: string;
  expect: Array<{ selector: string; text?: string; count?: number }>;
  /** Substrings that must NOT survive into the rendered text. */
  absentText?: string[];
}

export const SYNTAX: SyntaxCase[] = [
  // ── Headings h1-h6 — the accessibility section pins the hierarchy ────────
  ...[1, 2, 3, 4, 5, 6].map(level => ({
    name: `h${level}`,
    source: `${'#'.repeat(level)} Heading ${level}`,
    expect: [{ selector: `h${level}`, text: `Heading ${level}`, count: 1 }],
  })),

  // ── Inline emphasis ──────────────────────────────────────────────────────
  { name: 'bold', source: 'This is **bold** text.', expect: [{ selector: 'strong', text: 'bold' }] },
  { name: 'italic', source: 'This is *italic* text.', expect: [{ selector: 'em', text: 'italic' }] },
  {
    name: 'strikethrough',
    source: 'This is ~~gone~~ text.',
    expect: [{ selector: 'del, s, strike', text: 'gone' }],
  },
  {
    name: 'bold+italic together',
    source: 'A **bold** and an *italic* word.',
    expect: [{ selector: 'strong', text: 'bold' }, { selector: 'em', text: 'italic' }],
  },

  // ── Lists ────────────────────────────────────────────────────────────────
  {
    name: 'unordered list',
    source: '- Alpha\n- Beta\n- Gamma',
    expect: [{ selector: 'ul', count: 1 }, { selector: 'ul > li', count: 3 }],
  },
  {
    name: 'ordered list',
    source: '1. Alpha\n2. Beta\n3. Gamma',
    expect: [{ selector: 'ol', count: 1 }, { selector: 'ol > li', count: 3 }],
  },
  {
    name: 'task list',
    source: '- [ ] Todo\n- [x] Done',
    expect: [
      { selector: 'li', count: 2 },
      { selector: 'input[type="checkbox"]', count: 2 },
    ],
  },

  // ── Code ─────────────────────────────────────────────────────────────────
  {
    name: 'fenced code with a language class',
    source: '```javascript\nconst x = 1;\n```',
    expect: [
      { selector: 'pre', count: 1 },
      { selector: 'code.language-javascript', text: 'const x = 1;' },
    ],
  },
  {
    name: 'fenced code without a language',
    source: '```\nplain\n```',
    expect: [{ selector: 'pre', count: 1 }, { selector: 'pre code', text: 'plain' }],
  },
  {
    name: 'inline code',
    source: 'Call `render()` first.',
    expect: [{ selector: 'code', text: 'render()' }],
  },

  // ── Blocks ───────────────────────────────────────────────────────────────
  {
    name: 'blockquote',
    source: '> Quoted line',
    expect: [{ selector: 'blockquote', text: 'Quoted line' }],
  },
  {
    name: 'horizontal rule',
    source: 'Above\n\n---\n\nBelow',
    expect: [{ selector: 'hr', count: 1 }],
  },

  // ── GFM table — the accessibility section pins thead/tbody ───────────────
  {
    name: 'GFM table',
    source: '| Name | Size |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |',
    expect: [
      { selector: 'table', count: 1 },
      { selector: 'thead', count: 1 },
      { selector: 'tbody', count: 1 },
      { selector: 'thead th', count: 2 },
      { selector: 'tbody tr', count: 2 },
      { selector: 'tbody td', count: 4 },
    ],
  },

  // ── Links and images ─────────────────────────────────────────────────────
  {
    name: 'link',
    source: 'See [the docs](https://example.com/docs).',
    expect: [{ selector: 'a[href="https://example.com/docs"]', text: 'the docs' }],
  },
  {
    name: 'autolink',
    source: 'Visit https://example.com for more.',
    expect: [{ selector: 'a[href="https://example.com"]', count: 1 }],
  },
  {
    name: 'image',
    source: '![Alt text](https://example.com/pic.png)',
    expect: [{ selector: 'img[src="https://example.com/pic.png"][alt="Alt text"]', count: 1 }],
  },
];

/** Sanitization cases: the payload, and what must survive alongside it. */
export const SANITIZE_CASES: Array<{
  name: string;
  source: string;
  /** Selectors that must NOT exist when `sanitize` is on. */
  forbidden: string[];
  /** Selectors that must still exist either way — sanitizing is not deleting. */
  survives: string[];
}> = [
  {
    name: 'inline script tag',
    source: 'Before\n\n<script>window.pwned = 1;</script>\n\nAfter',
    forbidden: ['script'],
    survives: [],
  },
  {
    name: 'img with an onerror handler',
    source: '<img src="x.png" onerror="window.pwned = 1">',
    forbidden: ['img[onerror]'],
    survives: ['img'],
  },
  {
    name: 'javascript: link',
    source: '[click](javascript:alert(1))',
    forbidden: ['a[href^="javascript:"]'],
    survives: [],
  },
  {
    name: 'iframe',
    source: '<iframe src="https://evil.example"></iframe>\n\n**kept**',
    forbidden: ['iframe'],
    survives: ['strong'],
  },
  {
    name: 'object and embed',
    source: '<object data="x"></object><embed src="y">\n\n**kept**',
    forbidden: ['object', 'embed'],
    survives: ['strong'],
  },
  {
    name: 'form controls',
    source: '<form action="/x"><input name="a"></form>\n\n**kept**',
    forbidden: ['form', 'input[name="a"]'],
    survives: ['strong'],
  },
  {
    name: 'inline style attribute',
    source: '<span style="position:fixed">tricky</span>\n\n**kept**',
    forbidden: ['span[style]'],
    survives: ['strong'],
  },
  {
    name: 'data: image src',
    source: '<img src="data:text/html,<script>1</script>">\n\n**kept**',
    forbidden: ['img[src^="data:"]'],
    survives: ['strong'],
  },
];

export interface MarkdownCombo {
  source: string;
  sanitize?: boolean;
  theme?: MarkdownTheme;
  /** Deliver the source through the slot rather than through setContent(). */
  viaSlot?: boolean;
}

export function resolved(combo: MarkdownCombo) {
  return {
    sanitize: combo.sanitize ?? true,
    theme: combo.theme ?? 'default',
  };
}

/**
 * Mount a markdown block.
 *
 * The docs give two channels — "Use `setContent()` or slotted text" — and both
 * are exercised: `viaSlot` writes the source as light-DOM text before
 * connection, otherwise `setContent()` is called on a mounted element.
 */
export async function mountMarkdown(combo: MarkdownCombo): Promise<HTMLElement> {
  const want = resolved(combo);
  const props: Record<string, any> = { sanitize: want.sanitize, theme: want.theme };

  if (combo.viaSlot) {
    // The slot carries markdown SOURCE TEXT, so it is appended as a text node
    // rather than parsed as markup: `innerHTML = '<iframe>…'` would put a real
    // element in the light DOM and the component would read back only the text
    // between the tags, which is not what a consumer writing markdown means.
    const el = document.createElement('snice-markdown');
    el.appendChild(document.createTextNode(combo.source));
    document.body.appendChild(el);
    await (el as any).ready;
    for (const [key, value] of Object.entries(props)) (el as any)[key] = value;
    await wait(30);
    return el;
  }
  const el = await mount<HTMLElement>('snice-markdown', props);
  (el as any).setContent(combo.source);
  await wait(30);
  return el;
}

/**
 * The rendered HTML, with the template engine's own marker comments removed.
 *
 * `unsafeHTML` leaves `<!--?snice$…-->` bookmarks in the body so it can update
 * that region later. They are framework plumbing, not rendered markdown, and
 * their ids change per render — comparing them would make every assertion
 * about the engine rather than about the component.
 */
export function renderedHtml(el: HTMLElement): string {
  return (body(el)?.innerHTML ?? '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

/** The rendered markdown body — the one documented part. */
export function body(el: HTMLElement): HTMLElement | null {
  return exactPart(el, 'base');
}

// ── The oracle ──────────────────────────────────────────────────────────────

/** The invariants every mounted markdown block must satisfy. */
export function checkFrame(el: HTMLElement, combo: MarkdownCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);
  const root = shadow(el);

  const base = body(el);
  problems.check(!!base, 'no part="base"');
  if (base) {
    problems.check(
      (base.getAttribute('class') ?? '').split(/\s+/).includes('markdown-body'),
      `part="base" classes "${base.getAttribute('class')}" lack "markdown-body"`,
    );
  }
  problems.check(!!root.querySelector('slot'), 'no slot for the markdown source');
  problems.equal((el as any).sanitize, want.sanitize, 'sanitize property');
  problems.equal((el as any).theme, want.theme, 'theme property');
  problems.equal((el as any).content, combo.source, 'content property');

  return problems;
}

/** Judge one documented syntax against the rendered body. */
export function checkSyntax(
  el: HTMLElement, syntax: SyntaxCase, combo: MarkdownCombo,
): Problems {
  const problems = checkFrame(el, combo);
  const base = body(el);
  if (!base) return problems;

  for (const rule of syntax.expect) {
    const found = [...base.querySelectorAll(rule.selector)];
    if (rule.count !== undefined) {
      problems.equal(found.length, rule.count, `${syntax.name}: "${rule.selector}" count`);
    } else {
      problems.check(found.length > 0, `${syntax.name}: nothing matched "${rule.selector}"`);
    }
    if (rule.text !== undefined) {
      problems.equal(textOf(found[0]), rule.text, `${syntax.name}: "${rule.selector}" text`);
    }
  }

  // The raw markdown punctuation must not survive as visible text — that is
  // what "renders" means.
  for (const absent of syntax.absentText ?? []) {
    problems.check(
      !textOf(base).includes(absent),
      `${syntax.name}: the raw source "${absent}" is still visible`,
    );
  }

  return problems;
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface Recorded { type: string; detail: any }

export function recordEvents(el: HTMLElement): { seen: Recorded[]; of: (t: string) => any[] } {
  const seen: Recorded[] = [];
  for (const type of ['markdown-render', 'link-click']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return { seen, of: (type: string) => seen.filter(e => e.type === type).map(e => e.detail) };
}

export { Problems, part, shadow, textOf, wait };
