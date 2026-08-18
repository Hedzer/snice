/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-doc TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/doc, 43 cases via `npm run test:matrix`) owns
 * everything a string can answer: the four documented parts, the toolbar
 * inventory, the icon-part mapping per set, the accessor derivations, and
 * reflection. It cannot own the clauses that need a real engine:
 *
 *   · "Ctrl/Cmd+B - Bold, Ctrl/Cmd+I - Italic, Ctrl/Cmd+U - Underline" —
 *     keyboard formatting is a NATIVE contentEditable behaviour; happy-dom
 *     has no editing engine at all;
 *   · "Fonts cascade from light DOM into shadow DOM" — a paint claim about
 *     the webfont icon sets;
 *   · ":host([readonly]) .toolbar { display: none }" — readonly hides the
 *     toolbar through computed style, not by removing it;
 *   · the placeholder — CSS `:empty::before` content that only a rendering
 *     engine produces.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   icons (3 documented sets) x readonly (2) x content (2: empty, sample)
 *   = 12 combos: the toolbar strip and the editing surface stack without
 *   overlapping, every toolbar button is a real hit target, readonly swaps
 *   the toolbar out of the paint and the editor out of editability, and the
 *   icon set changes which buttons carry icon glyphs without moving boxes.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The toolbar must paint its own documented surface, the placeholder must
 *   actually draw glyphs, and a readonly editor must lose its toolbar strip
 *   from the PAINT, not just from the accessibility tree.
 *
 * Findings history (.ai/fuzzing.md — pins are deleted the day they expire,
 * never softened):
 *   VISUAL-MATRIX-doc-1 (fixed) — a freshly mounted editor used to seed
 *     `<p><br></p>`, which defeats the placeholder's `:empty::before` hook,
 *     so the documented `placeholder: string = 'Start typing...'` never
 *     showed on a fresh editor. A fresh editor now mounts empty; `clear()`
 *     is the one that re-seeds the paragraph.
 *   VISUAL-MATRIX-doc-2 (fixed) — the editing surface used to escape its
 *     host: `.doc-editor` was `width: 100%` on a content-box element
 *     carrying `padding: 3.75rem 6.25rem`, so its border box was the host
 *     width PLUS 12.5rem. `box-sizing: border-box` now keeps it inside.
 *   VISUAL-MATRIX-doc-3 (fixed) — Firefox's native editing shortcuts
 *     (Ctrl/Cmd+B, I, U) only reached light-DOM contenteditables, so the
 *     documented shortcuts fired into the page while the selection sat in
 *     the shadow root and nothing was formatted. The component now forwards
 *     Ctrl/Cmd+B/I/U to execCommand itself (handleEditingShortcuts), in
 *     every engine, so the documented shortcuts work everywhere and the pin
 *     is unwrapped.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/doc/matrix.html';

type IconSet = 'default' | 'material' | 'fontawesome';

interface Combo {
  id: string;
  icons: IconSet;
  readonly: boolean;
  content: 'empty' | 'sample';
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }
    if (getComputedStyle(host).display !== 'block') {
      say(`host display "${getComputedStyle(host).display}", expected "block"`);
    }

    // ── The toolbar strip ──────────────────────────────────────────────────
    const toolbar = partNamed('toolbar');
    if (!toolbar) { say('no part="toolbar"'); return problems; }
    const toolbarCs = getComputedStyle(toolbar);

    if (combo.readonly) {
      // ":host([readonly]) .toolbar { display: none }" — readonly removes
      // the toolbar from the PAINT (the DOM matrix proved it stays in the
      // tree).
      if (toolbarCs.display !== 'none') {
        say(`readonly toolbar display "${toolbarCs.display}", expected "none"`);
      }
    } else {
      if (toolbarCs.display !== 'flex') {
        say(`toolbar display "${toolbarCs.display}", expected "flex"`);
      }
      const toolbarBox = rect(toolbar);
      if (toolbarBox.width <= 0 || toolbarBox.height <= 0) {
        say(`toolbar renders at ${toolbarBox.width}x${toolbarBox.height}`);
      }

      const buttons = [...toolbar.querySelectorAll('.toolbar-btn')] as HTMLElement[];
      if (buttons.length !== 15) {
        say(`${buttons.length} toolbar buttons, expected the 15 documented commands`);
      }
      for (const [index, button] of buttons.entries()) {
        const box = rect(button);
        if (box.width <= 0 || box.height <= 0) {
          say(`toolbar button ${index} renders at ${box.width}x${box.height}`);
        }
      }
      // Buttons must not overlap each other.
      for (let i = 1; i < buttons.length; i++) {
        const a = rect(buttons[i - 1]);
        const b = rect(buttons[i]);
        if (b.left < a.right - EPS && Math.abs(b.top - a.top) < EPS) {
          say(`toolbar button ${i} overlaps button ${i - 1}`);
          break;
        }
      }
      // A real pointer at the Bold button's centre must reach it.
      const bold = buttons[0];
      const boldBox = rect(bold);
      const hit = (sr as any).elementFromPoint(
        boldBox.left + boldBox.width / 2,
        boldBox.top + boldBox.height / 2,
      ) as Element | null;
      if (hit !== bold && !bold.contains(hit as Node)) {
        say(`the Bold button is occluded by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    // ── The editing surface ────────────────────────────────────────────────
    const editor = partNamed('editor');
    if (!editor) { say('no part="editor"'); return problems; }
    const editorBox = rect(editor);
    if (editorBox.width <= 0 || editorBox.height <= 0) {
      say(`editor renders at ${editorBox.width}x${editorBox.height}`);
      return problems;
    }

    // "contentEditable for native text editing" — the engine's own verdict.
    const editable = (editor as HTMLElement).isContentEditable;
    if (editable === combo.readonly) {
      say(`editor isContentEditable=${editable} under readonly=${combo.readonly}`);
    }
    if (combo.readonly && getComputedStyle(editor).cursor !== 'default') {
      say(`readonly editor cursor "${getComputedStyle(editor).cursor}", expected "default"`);
    }

    // The toolbar strip sits ABOVE the editing surface, inside the host.
    if (!combo.readonly) {
      const toolbarBox = rect(toolbar);
      if (toolbarBox.bottom > editorBox.top + EPS) {
        say(`the toolbar (${toolbarBox.bottom.toFixed(0)}) overlaps the editor (${editorBox.top.toFixed(0)})`);
      }
      if (editorBox.right > hostBox.right + EPS || editorBox.left < hostBox.left - EPS) {
        say('the editor escapes the host box');
      }
    }

    // ── Content ────────────────────────────────────────────────────────────
    if (combo.content === 'sample') {
      const heading = editor.querySelector('h1');
      if (!heading) { say('sample content rendered no h1'); }
      else {
        const headingBox = rect(heading);
        if (headingBox.height <= 0) say('the sample h1 renders with no height');
        if (headingBox.top < editorBox.top - EPS) say('the sample h1 escapes the editor');
      }
      const list = editor.querySelector('ul');
      if (!list) say('sample content rendered no list');
    }

    // The icon set moves glyphs, not boxes: every set lays out the same
    // button count at the same strip height (checked above), and the icon
    // parts exist per set — the DOM matrix owns the exact counts, so here
    // only the paint-level sanity that the buttons are non-empty targets.
    const iconParts = sr.querySelectorAll('[part="icon"]').length;
    if (!combo.readonly && iconParts === 0) {
      say(`the "${combo.icons}" set painted no icon parts at all`);
    }

    return problems;
  }, combo as any);
}

test.describe('doc visual matrix: layer 1', () => {
  const combos: Combo[] = [];
  for (const icons of ['default', 'material', 'fontawesome'] as const) {
    for (const readonly of [false, true]) {
      for (const content of ['empty', 'sample'] as const) {
        combos.push({
          id: `${icons}/${readonly ? 'readonly' : 'editable'}-${content}`,
          icons, readonly, content,
        });
      }
    }
  }

  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── The clauses that need gestures, not just boxes ──────────────────────────

test.describe('doc visual matrix: editing behaviour', () => {
  test('the placeholder draws once the document is truly empty', async () => {
    // The fixture empties the editor with setHTML(''), which is the state
    // the :empty::before hook answers to.
    await page.evaluate(() => (window as any).matrix.mount({ content: 'empty' }));
    const placeholder = await page.evaluate(() => {
      const editor = document.getElementById('subject')
        .shadowRoot.querySelector('[part="editor"]');
      return {
        empty: editor.childElementCount === 0,
        content: getComputedStyle(editor, '::before').content,
        attr: editor.getAttribute('data-placeholder'),
      };
    });
    expect(placeholder.empty, 'the fixture did not produce an empty editor').toBe(true);
    // Chromium resolves `content: attr(data-placeholder)` to the attribute's
    // literal text; Firefox reports the declaration itself, unresolved. The
    // documented contract — the default placeholder is "Start typing..." —
    // holds in both: either the computed content carries the literal, or the
    // rule is in force and the attribute it reads carries it.
    const literalDrawn = placeholder.content.includes('Start typing');
    const attrDriven = /attr\(data-placeholder\)/.test(placeholder.content)
      && placeholder.attr === 'Start typing...';
    expect(literalDrawn || attrDriven,
      `the placeholder resolves to neither the text nor a live attr() read`
      + ` (content "${placeholder.content}", attr "${placeholder.attr}")`).toBe(true);
  });

  // FINDING VISUAL-MATRIX-doc-1 (fixed): a fresh editor used to seed
  // <p><br></p>, which is not :empty, so the documented default placeholder
  // never showed on mount. A fresh editor now mounts empty and the
  // placeholder shows through the :empty::before hook; clear() is the one
  // that re-seeds the paragraph.
  test('a freshly mounted editor shows its placeholder', async () => {
    // Mount WITHOUT clearing: the editor keeps its seeded paragraph, which
    // is exactly the state a page author gets from <snice-doc></snice-doc>.
    await page.evaluate(async () => {
      const matrix = (window as any).matrix;
      matrix.unmount();
      const el = document.createElement('snice-doc') as any;
      el.id = 'subject';
      document.getElementById('stage').appendChild(el);
      await el.ready;
      await matrix.settle();
    });
    const placeholder = await page.evaluate(() => {
      const editor = document.getElementById('subject')
        .shadowRoot.querySelector('[part="editor"]');
      return {
        content: getComputedStyle(editor, '::before').content,
        attr: editor.getAttribute('data-placeholder'),
      };
    });
    // Same engine-aware oracle as the empty-editor test above: Chromium
    // resolves `content: attr(data-placeholder)` to the literal text;
    // Firefox reports the declaration itself, unresolved, so the attribute
    // it reads has to carry the documented default.
    const literalDrawn = placeholder.content.includes('Start typing');
    const attrDriven = /attr\(data-placeholder\)/.test(placeholder.content)
      && placeholder.attr === 'Start typing...';
    expect(literalDrawn || attrDriven,
      `the placeholder resolves to neither the text nor a live attr() read`
      + ` (content "${placeholder.content}", attr "${placeholder.attr}")`).toBe(true);
  });

  /**
   * Real-input selection: click into the editable, then let the browser's own
   * Ctrl+A own the selection. A Range added programmatically from page script
   * never sticks in WebKit (its shadow selections are flattered only through
   * user gestures), and native shortcut handling in Firefox needs genuine
   * focus — synthetic focus is not enough. The documented contract is a user
   * pressing keys, so the spec drives real ones.
   */
  async function selectAllNatively() {
    const pts = await page.evaluate(() => {
      const editor = document.getElementById('subject')
        .shadowRoot.querySelector('[part="editor"]');
      const box = editor.getBoundingClientRect();
      return { x: box.x + 30, y: box.y + 14 };
    });
    await page.mouse.click(pts.x, pts.y);
    await page.keyboard.press('Control+a');
  }

  // FINDING VISUAL-MATRIX-doc-3 (fixed): Firefox's native editing shortcuts
  // only reached light-DOM contenteditables, so Ctrl/Cmd+B/I/U fired into
  // the page while the selection sat in the shadow root and nothing was
  // formatted. The component now forwards the chords to execCommand itself
  // (handleEditingShortcuts) in every engine, so the documented behaviour
  // holds on firefox too and the assertions run normally everywhere.
  test('Ctrl/Cmd+B, I, and U format the selection through native editing', async () => {
    // "Ctrl/Cmd+B - Bold, Ctrl/Cmd+I - Italic, Ctrl/Cmd+U - Underline" —
    // only a real editing engine can answer this.
    await page.evaluate(() => (window as any).matrix.mount({ content: 'html:<p>bold me</p>' }));
    await selectAllNatively();
    await page.keyboard.press('Control+b');
    const bolded = await page.evaluate(() => (window as any).matrix.content());
    expect(bolded.toLowerCase()).toContain('<b>');

    await page.evaluate(() => (window as any).matrix.mount({ content: 'html:<p>tilt me</p>' }));
    await selectAllNatively();
    await page.keyboard.press('Control+i');
    const italicized = await page.evaluate(() => (window as any).matrix.content());
    expect(italicized.toLowerCase()).toContain('<i>');

    await page.evaluate(() => (window as any).matrix.mount({ content: 'html:<p>rule me</p>' }));
    await selectAllNatively();
    await page.keyboard.press('Control+u');
    const underlined = await page.evaluate(() => (window as any).matrix.content());
    expect(underlined.toLowerCase()).toContain('<u>');
  });

  test('the Bold toolbar button formats the selection too', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ content: 'html:<p>bold me</p>' }));
    await selectAllNatively();
    // A real click, like a real user: a synthetic button.click() from page
    // script works everywhere, but on WebKit the selection the button needs
    // is the one a gesture made — see selectAllNatively.
    const btn = await page.evaluate(() => {
      const button = [...document.getElementById('subject').shadowRoot
        .querySelectorAll('.toolbar-btn')]
        .find((node: Element) => node.getAttribute('title') === 'Bold (Ctrl+B)') as HTMLElement | undefined;
      if (!button) return null;
      const box = button.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    expect(btn, 'no Bold button to click').toBeTruthy();
    await page.mouse.click(btn!.x, btn!.y);
    const html = await page.evaluate(() => (window as any).matrix.content());
    expect(html.toLowerCase()).toContain('<b>');
  });

  test('a readonly editor refuses every editing gesture', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      readonly: true, content: 'html:<p>Frozen</p>',
    }));
    const verdict = await page.evaluate(async () => {
      const matrix = (window as any).matrix;
      await matrix.selectAllInEditor();
      document.execCommand('bold');
      await matrix.settle();
      return {
        html: matrix.content(),
        editable: matrix.el.shadowRoot.querySelector('[part="editor"]').isContentEditable,
      };
    });
    expect(verdict.editable).toBe(false);
    expect(verdict.html, 'a readonly editor let a bold command through').toBe('<p>Frozen</p>');
  });

  test('the heading scale really orders h1 above h2 above h3 above p', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      content: 'html:<h1>One</h1><h2>Two</h2><h3>Three</h3><p>Body</p>',
    }));
    const sizes = await page.evaluate(() => {
      const editor = document.getElementById('subject')
        .shadowRoot.querySelector('[part="editor"]');
      const size = (selector: string) =>
        parseFloat(getComputedStyle(editor.querySelector(selector)).fontSize);
      return { h1: size('h1'), h2: size('h2'), h3: size('h3'), p: size('p') };
    });
    expect(sizes.h1, 'h1 is not larger than h2').toBeGreaterThan(sizes.h2);
    expect(sizes.h2, 'h2 is not larger than h3').toBeGreaterThan(sizes.h3);
    expect(sizes.h3, 'h3 is not larger than body text').toBeGreaterThan(sizes.p);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive
// than an evaluate, and layer 1 already measured the model the browser
// built. These exist because "the toolbar has a background-color" and "the
// strip is visible as a strip" are different claims.

test.describe('doc visual matrix: marquee pixels', () => {
  test('the toolbar strip paints a surface distinct from the editing page', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ content: 'sample' }));
    const [strip, sheet] = await capture(
      page, '#subject', 'doc-toolbar-surface',
      `(host) => {
        const toolbar = host.shadowRoot.querySelector('[part="toolbar"]');
        const t = toolbar.getBoundingClientRect();
        const editor = host.shadowRoot.querySelector('[part="editor"]');
        const e = editor.getBoundingClientRect();
        return [
          { x: t.x + t.width / 2, y: t.y + t.height / 2 },
          { x: e.x + e.width / 2, y: Math.min(e.bottom - 4, e.y + e.height / 2) },
        ];
      }`,
    );
    // Two near-white theme steps: sameColor is the honest judge.
    expect(sameColor(strip as RGB, sheet as RGB),
      `the toolbar and the editor both painted ${strip.join(',')}`).toBe(false);
  });

  test('the placeholder really draws glyphs on the empty editor', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ content: 'empty' }));
    const points = await capture(
      page, '#subject', 'doc-placeholder',
      `(host) => {
        const editor = host.shadowRoot.querySelector('[part="editor"]');
        const styles = getComputedStyle(editor);
        const line = parseFloat(styles.lineHeight) || 24;
        const left = editor.getBoundingClientRect().left
          + parseFloat(styles.paddingLeft) + 4;
        const top = editor.getBoundingClientRect().top + parseFloat(styles.paddingTop);
        const probes = [];
        for (let i = 1; i <= 14; i++) {
          probes.push({ x: left + (i * 12), y: top + line / 2 });
        }
        probes.push({ x: left + 400, y: top + line / 2 });
        return probes;
      }`,
    );
    const surface = points[points.length - 1] as RGB;
    const glyphZone = points.slice(0, -1) as RGB[];
    expect(glyphZone.some(p => !sameColor(p, surface)),
      'no placeholder glyph painted — the strip is bare surface').toBe(true);
    const best = Math.max(...glyphZone.map(p => contrast(p, surface)));
    expect(best, `best placeholder-vs-surface contrast is ${best.toFixed(2)}:1`)
      .toBeGreaterThan(1.2);
  });

  test('readonly removes the toolbar strip from the paint', async () => {
    // Capture the SAME host region twice; the editable one shows a toolbar
    // surface at the top, the readonly one shows the editor surface there.
    await page.evaluate(() => (window as any).matrix.mount({ content: 'sample' }));
    const [editableStrip] = await capture(
      page, '#subject', 'doc-editable-strip',
      `(host) => {
        const toolbar = host.shadowRoot.querySelector('[part="toolbar"]');
        const t = toolbar.getBoundingClientRect();
        return [{ x: t.x + t.width / 2, y: t.y + t.height / 2 }];
      }`,
    );

    await page.evaluate(() => (window as any).matrix.mount({
      readonly: true, content: 'sample',
    }));
    const [readonlyStrip] = await capture(
      page, '#subject', 'doc-readonly-strip',
      `(host) => {
        const editor = host.shadowRoot.querySelector('[part="editor"]');
        const e = editor.getBoundingClientRect();
        // The pixel where the toolbar strip USED to be: at the very top of
        // the host, now editor surface.
        return [{ x: e.x + e.width / 2, y: host.getBoundingClientRect().top + 6 }];
      }`,
    );
    expect(sameColor(editableStrip as RGB, readonlyStrip as RGB),
      `the toolbar strip is still painted under readonly (${editableStrip.join(',')})`)
      .toBe(false);
  });
});
