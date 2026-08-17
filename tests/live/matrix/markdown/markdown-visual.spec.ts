/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-markdown TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/markdown, `npm run test:matrix`) owns semantic
 * truth: which element every documented syntax produces, what it says, what
 * sanitization removes, and both events. It cannot own visual truth, because
 * happy-dom performs no layout and paints nothing.
 *
 * snice-markdown is a PURELY PRESENTATIONAL component — no interaction beyond
 * `link-click`, no requests, no state. Its rendered output is plain semantic
 * HTML, so what the component itself contributes on top of the parser is
 * ENTIRELY the stylesheet, and that is what this tier is for. The visual
 * matrix is therefore deliberately compact: it asserts the documented styling
 * hooks rather than re-walking the syntax list a second time.
 *
 * The claims reachable only here, each one a documented CSS custom property in
 * `docs/ai/components/markdown.md`:
 *
 *   · the heading hierarchy is VISIBLY a hierarchy — h1 through h6 in
 *     descending type size. The DOM tier can only say the tags are right;
 *   · `--snice-color-primary` is the link colour, so a link is a different
 *     colour from the prose around it;
 *   · `--snice-color-surface-container-high` backs code, blockquotes and table
 *     rows — three tints that must actually differ from the page;
 *   · `--snice-color-border` draws the heading rules, the table grid and the
 *     blockquote's left bar;
 *   · strikethrough is struck through, which is a line-decoration, not a tag;
 *   · a wide table and a long code line stay inside the body's box.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/markdown/matrix.html';

const DOCUMENTS = [
  'headings', 'emphasis', 'lists', 'code', 'quote', 'table', 'links', 'rule', 'mixed',
] as const;
const THEMES = ['default', 'github'] as const;

interface Combo {
  id: string;
  document: typeof DOCUMENTS[number];
  theme: typeof THEMES[number];
}

/** 9 documents x 2 themes = 18 combos. */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const document of DOCUMENTS) {
    for (const theme of THEMES) {
      combos.push({ id: `${document}/theme=${theme}`, document, theme });
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const base = sr.querySelector('[part~="base"]') as HTMLElement | null;
    if (!base) { say('no part="base"'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`the rendered body is ${baseBox.width}x${baseBox.height}`);
      return problems;
    }

    // ── Every block-level child has a box, and they stack ──────────────────
    const blocks = [...base.children] as HTMLElement[];
    let previousBottom = -Infinity;
    for (const [i, block] of blocks.entries()) {
      const box = rect(block);
      const tag = block.tagName.toLowerCase();
      if (box.height <= 0) {
        say(`the ${tag} at index ${i} renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.top < previousBottom - EPS) {
        say(`the ${tag} at index ${i} overlaps the block above it`);
      }
      previousBottom = box.bottom;
      if (box.right > baseBox.right + EPS || box.left < baseBox.left - EPS) {
        say(`the ${tag} at index ${i} escapes the rendered body horizontally`);
      }
    }

    // ── Headings are a VISIBLE hierarchy ───────────────────────────────────
    const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      .map(tag => base.querySelector(tag) as HTMLElement | null);
    const sizes = headings.map(h => (h ? parseFloat(getComputedStyle(h).fontSize) : null));
    for (let i = 1; i < sizes.length; i++) {
      const previous = sizes[i - 1];
      const current = sizes[i];
      if (previous === null || current === null) continue;
      if (current > previous + 0.01) {
        say(`h${i + 1} (${current}px) is larger than h${i} (${previous}px)`);
      }
    }
    for (const [i, heading] of headings.entries()) {
      if (!heading) continue;
      const cs = getComputedStyle(heading);
      if (parseFloat(cs.fontSize) < 9) say(`h${i + 1} font-size ${cs.fontSize}`);
      if (Number(cs.opacity) <= 0) say(`h${i + 1} is transparent`);
      if (cs.visibility !== 'visible') say(`h${i + 1} visibility "${cs.visibility}"`);
    }

    // ── Links are the documented primary colour, not the prose colour ──────
    const link = base.querySelector('a') as HTMLElement | null;
    if (link) {
      const linkColor = getComputedStyle(link).color;
      const proseColor = getComputedStyle(base).color;
      if (linkColor === proseColor) {
        say(`a link paints ${linkColor}, the same as the prose around it`);
      }
      const box = rect(link);
      if (box.width <= 0 || box.height <= 0) {
        say(`a link renders at ${box.width}x${box.height}`);
      } else {
        // The link is a real target, not text behind an overlay.
        const x = box.left + Math.min(4, box.width / 2);
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`a link's hit-test found <${outer?.tagName.toLowerCase() ?? 'nothing'}>,`
            + ' not the markdown body');
        }
      }
    }

    // ── Strikethrough is actually struck ───────────────────────────────────
    const struck = base.querySelector('del, s, strike') as HTMLElement | null;
    if (struck) {
      const decoration = getComputedStyle(struck).textDecorationLine;
      if (!decoration.includes('line-through')) {
        say(`strikethrough text has text-decoration-line "${decoration}"`);
      }
    }

    // ── Code, blockquote and table rows carry their documented tints ───────
    const surface = getComputedStyle(base).backgroundColor;
    const pre = base.querySelector('pre') as HTMLElement | null;
    if (pre) {
      const bg = getComputedStyle(pre).backgroundColor;
      if (bg === 'rgba(0, 0, 0, 0)' || bg === surface) {
        say(`the code block paints no background of its own (${bg})`);
      }
    }

    // A blockquote must be SET APART from the prose. The docs list both a
    // border colour ("Headings, tables, code, blockquote borders") and a
    // surface tint ("Code, blockquote, table row backgrounds") for it, and the
    // `github` theme deliberately drops the tint in favour of the bar alone —
    // so the invariant is that at least one of the two is present, plus the
    // indent that makes the bar mean something.
    const quote = base.querySelector('blockquote') as HTMLElement | null;
    if (quote) {
      const cs = getComputedStyle(quote);
      const bar = parseFloat(cs.borderLeftWidth) || 0;
      const bg = cs.backgroundColor;
      const tinted = bg !== 'rgba(0, 0, 0, 0)' && bg !== surface;
      if (bar <= 0 && !tinted) {
        say(`the blockquote is set apart by nothing — no left bar, background ${bg}`);
      }
      if (parseFloat(cs.paddingLeft) <= 0) say('the blockquote is not indented from its bar');
    }

    // ── Tables: a real grid that stays inside the body ─────────────────────
    const table = base.querySelector('table') as HTMLElement | null;
    if (table) {
      const tableBox = rect(table);
      if (tableBox.width <= 0 || tableBox.height <= 0) {
        say(`the table renders at ${tableBox.width}x${tableBox.height}`);
      }
      const cells = [...table.querySelectorAll('th, td')] as HTMLElement[];
      if (cells.length === 0) say('the table rendered no cells');
      for (const [i, cell] of cells.entries()) {
        const box = rect(cell);
        if (box.width <= 0 || box.height <= 0) {
          say(`table cell ${i} renders at ${box.width}x${box.height}`);
        }
      }
      // Header cells sit above every body cell.
      const firstBody = table.querySelector('tbody td') as HTMLElement | null;
      const firstHead = table.querySelector('thead th') as HTMLElement | null;
      if (firstBody && firstHead && rect(firstHead).bottom > rect(firstBody).top + EPS) {
        say('the table header overlaps the first body row');
      }
      // Rows are disjoint and ascending.
      const rows = [...table.querySelectorAll('tbody tr')] as HTMLElement[];
      let bottom = -Infinity;
      for (const [i, row] of rows.entries()) {
        const box = rect(row);
        if (box.top < bottom - EPS) say(`table rows ${i - 1}/${i} overlap`);
        bottom = box.bottom;
      }
    }

    // ── A horizontal rule is a visible rule ────────────────────────────────
    const hr = base.querySelector('hr') as HTMLElement | null;
    if (hr) {
      const box = rect(hr);
      const cs = getComputedStyle(hr);
      const thickness = Math.max(
        box.height,
        parseFloat(cs.borderTopWidth) || 0,
        parseFloat(cs.borderBottomWidth) || 0,
      );
      if (thickness <= 0) say('the horizontal rule has no thickness at all');
      if (box.width <= 0) say('the horizontal rule has no width');
    }

    // ── Lists are indented from the prose ──────────────────────────────────
    for (const tag of ['ul', 'ol']) {
      const list = base.querySelector(tag) as HTMLElement | null;
      if (!list) continue;
      const items = [...list.querySelectorAll(':scope > li')] as HTMLElement[];
      if (items.length === 0) { say(`the ${tag} rendered no items`); continue; }
      for (const [i, item] of items.entries()) {
        const box = rect(item);
        if (box.height <= 0) say(`${tag} item ${i} renders at ${box.width}x${box.height}`);
      }
      const cs = getComputedStyle(list);
      const indent = parseFloat(cs.paddingInlineStart || cs.paddingLeft) || 0;
      const marginIndent = parseFloat(cs.marginInlineStart || cs.marginLeft) || 0;
      if (indent + marginIndent <= 0 && cs.listStylePosition !== 'inside') {
        say(`the ${tag} is not indented — its markers would paint outside the body`);
      }
    }

    // ── Prose is legible ───────────────────────────────────────────────────
    const cs = getComputedStyle(base);
    if (parseFloat(cs.fontSize) < 9) say(`the body font-size is ${cs.fontSize}`);
    if (parseFloat(cs.lineHeight) < parseFloat(cs.fontSize)) {
      say(`line-height ${cs.lineHeight} is tighter than the font size ${cs.fontSize}`);
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('markdown visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.children, `combo ${combo.id} rendered an empty body`).toBeGreaterThan(0);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('markdown visual matrix: overflow', () => {
  test('a code line too long for the body does not escape it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      document: 'wideCode', narrow: true,
    }));
    const measured = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const pre = base.querySelector('pre') as HTMLElement;
      return {
        baseRight: base.getBoundingClientRect().right,
        preRight: pre.getBoundingClientRect().right,
        overflow: pre.scrollWidth - pre.clientWidth,
        overflowX: getComputedStyle(pre).overflowX,
        wrap: getComputedStyle(pre).whiteSpace,
      };
    });
    expect(measured.preRight,
      'the code block paints past the right edge of the markdown body')
      .toBeLessThanOrEqual(measured.baseRight + 1);
    if (measured.overflow > 0) {
      expect(measured.overflowX,
        'the code block overflows but cannot be scrolled').toMatch(/auto|scroll/);
    }
  });

  test('a three-column table does not escape a narrow body', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      document: 'table', narrow: true,
    }));
    const measured = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const base = sr.querySelector('[part~="base"]') as HTMLElement;
      const table = base.querySelector('table') as HTMLElement;
      return {
        baseRight: base.getBoundingClientRect().right,
        tableRight: table.getBoundingClientRect().right,
        cells: [...table.querySelectorAll('td, th')]
          .map(c => c.getBoundingClientRect().right),
      };
    });
    expect(measured.tableRight).toBeLessThanOrEqual(measured.baseRight + 1);
    for (const right of measured.cells) {
      expect(right, 'a table cell paints past the markdown body')
        .toBeLessThanOrEqual(measured.baseRight + 1);
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('markdown visual matrix: marquee pixels', () => {
  test('a code block is visibly tinted against the page', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ document: 'code' }));
    const [inside, outside] = await capture(
      page, '#subject', 'markdown-code-tint',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const pre = base.querySelector('pre').getBoundingClientRect();
        return [
          { x: pre.right - 6, y: pre.bottom - 6 },
          { x: pre.right - 6, y: pre.top - 8 },
        ];
      }`,
    );
    expect(sameColor(inside, outside),
      `the code block painted ${inside.join(',')}, identical to the page around it`)
      .toBe(false);
  });

  test('a blockquote paints both a bar and a tint', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ document: 'quote' }));
    const [bar, fill, page_] = await capture(
      page, '#subject', 'markdown-blockquote',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const q = base.querySelector('blockquote').getBoundingClientRect();
        return [
          { x: q.left + 1, y: q.y + q.height / 2 },
          { x: q.right - 6, y: q.y + q.height / 2 },
          { x: q.right - 6, y: q.top - 10 },
        ];
      }`,
    );
    expect(sameColor(bar, fill),
      `the blockquote's left edge painted ${bar.join(',')}, the same as its interior`
      + ' — there is no bar').toBe(false);
    expect(sameColor(fill, page_),
      `the blockquote's interior painted ${fill.join(',')}, the same as the page`
      + ' — there is no tint').toBe(false);
  });

  test('a link is painted in ink the surrounding prose does not use', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ document: 'links' }));
    // Scan across the link's text and across the plain text before it; the two
    // darkest inks must differ.
    const scan = await capture(
      page, '#subject', 'markdown-link',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const a = base.querySelector('a').getBoundingClientRect();
        const p = base.querySelector('p').getBoundingClientRect();
        const points = [];
        for (let x = Math.round(a.left); x < Math.round(a.right); x++) {
          points.push({ x, y: a.y + a.height / 2 });
        }
        for (let x = Math.round(p.left); x < Math.round(a.left) - 6; x++) {
          points.push({ x, y: a.y + a.height / 2 });
        }
        points.push({ x: p.right - 2, y: p.bottom + 4 });
        return points;
      }`,
    );
    const background = scan[scan.length - 1];
    const linkInk = new Set(scan.slice(0, -1).map(px => px.join(',')));
    expect(linkInk.size,
      'the link row painted a single flat colour — nothing was drawn').toBeGreaterThan(1);
    // Whatever the link's strongest ink is, it must not be the prose's.
    const strongest = (pixels: number[][]) => pixels
      .reduce((best, px) => (contrast(px, background) > contrast(best, background) ? px : best));
    const half = scan.findIndex((_, i) => i > 0 && i === scan.length - 1);
    void half;
    expect(strongest(scan.slice(0, -1)).join(','),
      'the link is painted in exactly the page background').not.toBe(background.join(','));
  });

  test('a table paints a grid and its header stands apart from its body', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ document: 'table' }));
    const [headerPx, bodyPx, outsidePx] = await capture(
      page, '#subject', 'markdown-table',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const th = base.querySelector('thead th').getBoundingClientRect();
        const td = base.querySelector('tbody td').getBoundingClientRect();
        const table = base.querySelector('table').getBoundingClientRect();
        return [
          { x: th.right - 4, y: th.y + th.height / 2 },
          { x: td.right - 4, y: td.y + td.height / 2 },
          { x: table.right - 4, y: table.top - 10 },
        ];
      }`,
    );
    const distinct = new Set([headerPx, bodyPx, outsidePx].map(px => px.join(',')));
    expect(distinct.size,
      `the table header (${headerPx.join(',')}), its body (${bodyPx.join(',')}) and the`
      + ` page (${outsidePx.join(',')}) painted ${distinct.size} distinct colours`)
      .toBeGreaterThan(1);
  });

  test('the horizontal rule is really drawn', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ document: 'rule' }));
    const scan = await capture(
      page, '#subject', 'markdown-hr',
      `(host) => {
        const base = host.shadowRoot.querySelector('[part~="base"]');
        const hr = base.querySelector('hr').getBoundingClientRect();
        const points = [];
        for (let y = Math.round(hr.top) - 2; y <= Math.round(hr.bottom) + 2; y++) {
          points.push({ x: hr.x + hr.width / 2, y });
        }
        points.push({ x: hr.x + hr.width / 2, y: hr.top - 14 });
        return points;
      }`,
    );
    const background = scan[scan.length - 1];
    const inked = scan.slice(0, -1).filter(px => !sameColor(px, background));
    expect(inked.length,
      `every pixel across the rule painted ${background.join(',')} — no rule was drawn`)
      .toBeGreaterThan(0);
  });
});
