/**
 * Matrix slice DOC / CONTENT — the document data surface.
 *
 * Dimensions: sample document (9) x accessor (3: getHTML, getText,
 * getMarkdown) — each sample is one combo asserting all three accessors plus
 * the clear() contract, because they read the same authored content.
 *
 * Documented contract:
 *   · `getHTML()` → "Get HTML content" and `setHTML(html)` — the authored
 *     HTML is the document, and it round-trips.
 *   · `getText()` → "Get plain text content" — the words, without markup.
 *   · `getMarkdown()` → "Get content as Markdown" — the documented Markdown
 *     derivation, established by tests/components/doc.test.ts and the
 *     showcase: `#`/`##`/`###` headings, blank-line-separated paragraphs,
 *     `**bold**`, `*italic*`, `<u>…</u>`, `~~strike~~`, `[text](href)`
 *     links, `![alt](src)` images, `- ` and `1. ` lists, `---` rules,
 *     `> ` blockquotes, backtick code, and pipe tables with a `---`
 *     separator row after the first.
 *   · `clear()` → "Clear all content" — the established empty-document seed
 *     is `<p><br></p>` (tests/components/doc.test.ts).
 *   · `downloadAs(format, filename?)` — "Download as 'html'|'markdown'|
 *     'text'". The download itself is a browser interaction (anchor click +
 *     object URL); its CONTENT is exactly getHTML()/getMarkdown()/getText(),
 *     which is what this slice pins. No network, no files.
 *   · "Semantic HTML output" — setHTML content is not rewritten.
 *
 * Sample content follows the established showcase approach
 * (website/showcases/doc/full.html): headings, styled paragraphs, lists,
 * hr — all local strings, nothing remote.
 *
 * it.fails policy: no finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, mountDoc, cleanupDocs, mountDocWithContent, editorOf,
  type DocCombo,
} from './doc-support';

const COMBO: DocCombo = {
  icons: 'default', readonly: false, placeholder: DEFAULTS.placeholder, channel: 'attr',
};

interface Sample {
  name: string;
  html: string;
  /** The words getText() must surface. */
  words: string[];
  /** The documented Markdown for the sample. */
  markdown: string;
}

/**
 * Every sample carries the derivation of its Markdown in the spelling of the
 * mapped blocks; compact HTML (no inter-tag whitespace) so the round-trip is
 * exact under happy-dom's serializer.
 */
const SAMPLES: Sample[] = [
  {
    name: 'heading-and-paragraph',
    html: '<h1>Title</h1><p>Content with <b>bold</b>.</p>',
    words: ['Title', 'Content', 'bold'],
    // h1 -> "# ", p -> text + blank line, b -> **
    markdown: '# Title\n\nContent with **bold**.',
  },
  {
    name: 'heading-levels',
    html: '<h1>One</h1><h2>Two</h2><h3>Three</h3><p>Body</p>',
    words: ['One', 'Two', 'Three', 'Body'],
    markdown: '# One\n\n## Two\n\n### Three\n\nBody',
  },
  {
    name: 'inline-marks',
    html: '<p><b>bold</b> <i>italic</i> <u>under</u> <s>strike</s> <code>code</code></p>',
    words: ['bold', 'italic', 'under', 'strike', 'code'],
    // u keeps its HTML spelling; s becomes ~~…~~; code becomes `…`
    markdown: '**bold** *italic* <u>under</u> ~~strike~~ `code`',
  },
  {
    name: 'strong-em-del-aliases',
    html: '<p><strong>firm</strong> <em>emphasis</em> <del>removed</del></p>',
    words: ['firm', 'emphasis', 'removed'],
    markdown: '**firm** *emphasis* ~~removed~~',
  },
  {
    name: 'link',
    // The derivation reads the anchor's .href IDL property, which URL-
    // normalizes; the explicit path keeps the expectation stable in every
    // engine.
    html: '<p>See <a href="https://example.com/docs">the docs</a>.</p>',
    words: ['See', 'the', 'docs'],
    markdown: 'See [the docs](https://example.com/docs).',
  },
  {
    name: 'image',
    // Absolute URL: the markdown derivation reads the .src IDL property,
    // which resolves relative URLs against the document base.
    html: '<p><img src="https://example.com/pic.png" alt="A picture"></p>',
    words: [],
    markdown: '![A picture](https://example.com/pic.png)',
  },
  {
    name: 'lists',
    html: '<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol>',
    words: ['one', 'two', 'first', 'second'],
    // ul -> "- item" lines, ol -> "n. item" lines, one blank line after each
    markdown: '- one\n- two\n\n1. first\n2. second',
  },
  {
    name: 'divider',
    html: '<p>Before</p><hr><p>After</p>',
    words: ['Before', 'After'],
    markdown: 'Before\n\n---\n\nAfter',
  },
  {
    name: 'blockquote',
    html: '<blockquote><p>Quoted line</p></blockquote>',
    words: ['Quoted', 'line'],
    markdown: '> Quoted line',
  },
  {
    name: 'table',
    // tbody authored explicitly: the HTML parser inserts one anyway, and the
    // round-trip assertion reads what innerHTML really holds.
    html: '<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></tbody></table>',
    words: [],
    // pipe rows with a --- separator after the first row
    markdown: '| A | B |\n| --- | --- |\n| 1 | 2 |',
  },
];

describe('doc matrix: content', () => {
  afterEach(() => cleanupDocs());

  for (const sample of SAMPLES) {
    it(`${sample.name}: setHTML round-trips, getText yields the words, getMarkdown yields the derivation`,
      async () => {
        const el = await mountDocWithContent(COMBO, sample.html);

        // "Get HTML content" + "Semantic HTML output": the authored document
        // comes back unchanged.
        expect(el.getHTML(), `${sample.name} getHTML round-trip`).toBe(sample.html);

        // "Get plain text content": every word is present.
        const text = el.getText();
        for (const word of sample.words) {
          expect(text, `${sample.name} getText misses "${word}"`).toContain(word);
        }

        // "Get content as Markdown": the documented derivation, with the
        // trailing newline the accessor adds after its trim.
        expect(el.getMarkdown(), `${sample.name} getMarkdown`).toBe(`${sample.markdown}\n`);

        // "Clear all content" — the established empty-document seed.
        el.clear();
        expect(el.getHTML(), `${sample.name} clear seed`).toBe('<p><br></p>');
        expect(el.getText(), `${sample.name} cleared text`).toBe('');
      });
  }

  it('a fresh editor seeds exactly one empty paragraph', async () => {
    const el = await mountDoc(COMBO);
    expect(el.getHTML()).toBe('<p><br></p>');
    expect(editorOf(el)!.childElementCount).toBe(1);
  });

  it('setHTML before the editor exists is queued and applied on ready', async () => {
    // The pre-ready queue: a setHTML call on a disconnected element must not
    // lose the document.
    const el = document.createElement('snice-doc') as any;
    el.setHTML('<p>Queued content</p>');
    document.body.appendChild(el);
    await (el as any).ready;
    await new Promise(r => setTimeout(r, 30));
    mountedKeepAlive(el);
    expect(el.getHTML()).toContain('Queued content');
  });

  it('clear is the same seed whatever the content was', async () => {
    for (const html of ['<h1>Big</h1>', '<p>plain</p>', '']) {
      const el = await mountDocWithContent(COMBO, html);
      el.clear();
      expect(el.getHTML(), `clear after ${JSON.stringify(html)}`).toBe('<p><br></p>');
    }
  });

  it('content survives readonly — readonly edits nothing, it bars editing', async () => {
    const el = await mountDocWithContent(
      { ...COMBO, readonly: true }, '<p>Frozen</p>');
    expect(el.getHTML()).toBe('<p>Frozen</p>');
    expect(el.getMarkdown()).toBe('Frozen\n');
    // clear() is a content method, not an editing gesture; the doc bars
    // EDITING, and clear is documented unconditionally.
    el.clear();
    expect(el.getHTML()).toBe('<p><br></p>');
  });
});

/** Track an element mounted outside mountDoc for the shared cleanup. */
function mountedKeepAlive(el: HTMLElement): void {
  // cleanupDocs clears document.body, so registration is belt-and-braces.
  (globalThis as any).__docMatrixExtras ??= [];
  (globalThis as any).__docMatrixExtras.push(el);
}
