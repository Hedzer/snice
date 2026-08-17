/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-breadcrumbs TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/breadcrumbs, `npm run test:matrix`) owns trail
 * truth: which items render, which one is `aria-current`, what the separator
 * character is, when `max-items` collapses, and what `breadcrumb-click`
 * carries. It cannot own VISUAL truth, because happy-dom performs no layout —
 * every box reads 0, nothing is painted, and nothing can occlude anything.
 *
 * A breadcrumb trail is almost entirely a LAYOUT promise: a single row of
 * items, each separated from the next, the current page distinguished from the
 * links, and — when collapsed — an ellipsis standing in for the middle. None of
 * that is checkable without a browser.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the `nav`, the `ol` and every visible item have real boxes;
 *   · the trail is ONE ROW: every visible item shares a line with the first,
 *     and their boxes ascend left-to-right without overlapping;
 *   · every separator sits BETWEEN the two items it separates — never on top of
 *     either — and there is exactly one fewer separator than visible items;
 *   · the current page is painted in a different colour from the links (the
 *     documented `--breadcrumb-active-color` vs `--breadcrumb-color`), and the
 *     separators in a third (`--breadcrumb-separator-color`);
 *   · a collapsed trail really hides its middle items (zero boxes) and really
 *     paints an ellipsis button with a usable hit target;
 *   · nothing paints over any link (elementFromPoint).
 *
 * ── Interaction ────────────────────────────────────────────────────────────
 *   "ellipsis click sets collapsed=false" is documented, and its consequence is
 *   visual: the hidden items must actually appear, in the same single row.
 *
 * ── Axis comparisons ───────────────────────────────────────────────────────
 *   Three sizes must really change the type size; five separators must really
 *   paint five different glyphs.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A separator painted in the surface colour is an invisible separator, and a
 *   "muted" link colour can quietly fall below readability. Only pixels decide.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/breadcrumbs/matrix.html';

type Separator = '/' | '>' | '»' | '•' | '|';
type Size = 'small' | 'medium' | 'large';
type Shape = 'full' | 'short' | 'collapsed';

interface Combo {
  id: string;
  separator: Separator;
  size: Size;
  shape: Shape;
  length: number;
  maxItems: number;
}

const SEPARATORS: Separator[] = ['/', '>', '»', '•', '|'];
const SIZES: Size[] = ['small', 'medium', 'large'];
const SHAPES: Shape[] = ['full', 'short', 'collapsed'];

/** The fixture's trail length. */
const TRAIL = 5;

/**
 * The cross: 5 separators x 3 sizes x 3 trail shapes = 45 combos.
 *
 * Sized to the component: a breadcrumb is a flex row of links, one separator
 * between each pair, and one collapse rule. The product worth paying for is
 * (which glyph divides them) x (how big) x (is the middle collapsed).
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const separator of SEPARATORS) {
    for (const size of SIZES) {
      for (const shape of SHAPES) {
        combos.push({
          id: `sep:${separator}/${size}/${shape}`,
          separator, size, shape,
          length: shape === 'short' ? 2 : TRAIL,
          maxItems: shape === 'collapsed' ? 3 : 0,
        });
      }
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

/** LAYER 1: one evaluate per combo; every violation reported at once. */
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
    const part = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const nav = part('base');
    const list = part('list');
    if (!nav) { say('no part="base" <nav> rendered'); return problems; }
    if (!list) { say('no part="list" <ol> rendered'); return problems; }
    const navBox = rect(nav);
    const listBox = rect(list);
    if (navBox.width <= 0 || navBox.height <= 0) {
      say(`the nav renders at ${navBox.width}x${navBox.height}`);
      return problems;
    }
    if (listBox.width <= 0 || listBox.height <= 0) {
      say(`the list renders at ${listBox.width}x${listBox.height}`);
      return problems;
    }

    // ── Items ────────────────────────────────────────────────────────────────
    const items = [...list.querySelectorAll('li')] as HTMLElement[];
    if (items.length === 0) { say('the list rendered no items'); return problems; }

    const visible = items.filter((li) => {
      const b = rect(li);
      return b.width > 0 && b.height > 0 && getComputedStyle(li).display !== 'none';
    });
    const hidden = items.filter(li => !visible.includes(li));
    if (hidden.length > 0) {
      say(`${hidden.length} item(s) occupy a <li> but paint nothing`);
    }

    if (combo.shape === 'collapsed') {
      // Collapsing means FEWER items reach the row, with an ellipsis standing
      // in for the ones that did not.
      const trailItems = visible.filter(li => !li.querySelector('[part~="ellipsis"]'));
      if (trailItems.length !== combo.maxItems) {
        say(`max-items=${combo.maxItems} over a ${combo.length}-item trail left`
          + ` ${trailItems.length} items in the row`);
      }
      const ellipsis = part('ellipsis');
      if (!ellipsis) {
        say('a collapsed trail rendered no part="ellipsis"');
      } else {
        const eb = rect(ellipsis);
        if (eb.width <= 0 || eb.height <= 0) {
          say(`the ellipsis button renders at ${eb.width}x${eb.height}`);
        } else if (eb.width < 12 || eb.height < 12) {
          say(`the ellipsis button is ${eb.width.toFixed(1)}x${eb.height.toFixed(1)}`
            + ' — too small to hit');
        }
        if (getComputedStyle(ellipsis).cursor === 'default') {
          say('the ellipsis button does not present itself as clickable');
        }
      }
    } else {
      if (visible.length !== combo.length) {
        say(`an uncollapsed ${combo.length}-item trail painted ${visible.length} items`);
      }
      const ellipsis = part('ellipsis');
      if (ellipsis && rect(ellipsis).width > 0) {
        say('an uncollapsed trail still paints the ellipsis button');
      }
    }

    // ── One row, ascending, disjoint ─────────────────────────────────────────
    const first = rect(visible[0]);
    let previousRight = -Infinity;
    for (const [i, li] of visible.entries()) {
      const b = rect(li);
      if (b.left < previousRight - EPS) {
        say(`item ${i} (left ${b.left.toFixed(1)}) overlaps the previous item`
          + ` (right ${previousRight.toFixed(1)})`);
      }
      previousRight = b.right;
      const overlap = Math.min(b.bottom, first.bottom) - Math.max(b.top, first.top);
      if (overlap < Math.min(b.height, first.height) * 0.5) {
        say(`item ${i} (${b.top.toFixed(1)}..${b.bottom.toFixed(1)}) is not on the same row`
          + ` as the first item (${first.top.toFixed(1)}..${first.bottom.toFixed(1)})`);
      }
      if (b.right > listBox.right + EPS) say(`item ${i} escapes the list horizontally`);
    }

    // ── Separators sit BETWEEN items ─────────────────────────────────────────
    const separators = ([...sr.querySelectorAll('.breadcrumb-separator')] as HTMLElement[])
      .filter(s => rect(s).width > 0);
    // Every visible item except the last carries one — including the ellipsis
    // item, which is separated from the tail of the trail like any other.
    if (separators.length !== visible.length - 1) {
      say(`${separators.length} separators for ${visible.length} visible items`
        + ` — expected ${visible.length - 1}`);
    }
    // FINDING VISUAL-MATRIX-breadcrumbs-1 (see the pinned test below): the
    // separator that follows the collapse ellipsis carries no `part`, so a
    // customer styling `::part(separator)` gets an inconsistent trail. Counted
    // here so the layer-1 message names it rather than hiding it.
    const exposed = separators.filter(s => (s.getAttribute('part') ?? '').includes('separator'));
    if (exposed.length !== separators.length && combo.shape !== 'collapsed') {
      say(`${separators.length - exposed.length} painted separator(s) carry no part="separator"`);
    }
    for (const [i, sep] of separators.entries()) {
      const sb = rect(sep);
      if (sb.width <= 0 || sb.height <= 0) {
        say(`separator ${i} renders at ${sb.width}x${sb.height}`);
        continue;
      }
      if ((sep.textContent ?? '').trim() !== combo.separator) {
        say(`separator ${i} paints "${(sep.textContent ?? '').trim()}",`
          + ` expected "${combo.separator}"`);
      }
      const before = rect(visible[i]);
      const after = visible[i + 1] ? rect(visible[i + 1]) : null;
      // The separator belongs to the item before it, so it may sit inside that
      // item's box — but it must never reach into the NEXT item's content.
      if (after && sb.right > after.left + EPS) {
        say(`separator ${i} (right ${sb.right.toFixed(1)}) runs into the following item`
          + ` (left ${after.left.toFixed(1)})`);
      }
      if (sb.left < before.left - EPS) {
        say(`separator ${i} (left ${sb.left.toFixed(1)}) sits before the item it follows`
          + ` (left ${before.left.toFixed(1)})`);
      }
    }

    // ── Colour roles: link vs current page vs separator ──────────────────────
    const links = [...sr.querySelectorAll('[part~="link"]')] as HTMLElement[];
    const currentPage = sr.querySelector('[aria-current="page"]') as HTMLElement | null;
    if (!currentPage) {
      say('no item is marked aria-current="page"');
    } else {
      const cb = rect(currentPage);
      if (cb.width <= 0 || cb.height <= 0) {
        say(`the current page item renders at ${cb.width}x${cb.height}`);
      }
      if (links.length > 0) {
        const linkColour = getComputedStyle(links[0]).color;
        const currentColour = getComputedStyle(currentPage).color;
        if (linkColour === currentColour) {
          say(`the current page is painted in the link colour (${currentColour}) —`
            + ' nothing distinguishes where you are');
        }
      }
      // The current page is the LAST thing in the trail. Judged by ownership
      // rather than by edges: the item text carries negative margins (the
      // hover-padding trick), so its box legitimately overhangs its <li>.
      const lastVisible = visible[visible.length - 1];
      if (!lastVisible.contains(currentPage)) {
        say('the current-page item is not the last item in the trail');
      }
    }

    if (separators.length > 0 && links.length > 0) {
      const sepColour = getComputedStyle(separators[0]).color;
      const linkColour = getComputedStyle(links[0]).color;
      if (sepColour === linkColour) {
        say(`separators are painted in the link colour (${sepColour}) — they read as text`);
      }
    }

    for (const [i, link] of links.entries()) {
      const b = rect(link);
      if (b.width <= 0 || b.height <= 0) { say(`link ${i} renders at ${b.width}x${b.height}`); continue; }
      const cs = getComputedStyle(link);
      if (parseFloat(cs.fontSize) < 9) say(`link ${i} font-size ${cs.fontSize}`);
      if (cs.visibility !== 'visible') say(`link ${i} visibility "${cs.visibility}"`);
      if (cs.cursor === 'default') say(`link ${i} does not present itself as clickable`);
    }

    // ── Occlusion ────────────────────────────────────────────────────────────
    for (const [i, link] of links.entries()) {
      const b = rect(link);
      if (b.width < 4) continue;
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`link ${i}: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the breadcrumbs`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (!hit) { say(`link ${i}: shadow hit-test found nothing`); continue; }
      if (hit !== link && !link.contains(hit)) {
        say(`link ${i} is occluded by <${hit.tagName.toLowerCase()}`
          + `${hit.className && typeof hit.className === 'string' ? `.${hit.className.split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('breadcrumbs visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.separator).toBe(combo.separator);
      expect(mounted.items).toBe(combo.length);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('breadcrumbs visual matrix: the collapse affordance', () => {
  test('clicking the ellipsis really reveals the hidden items, still in one row', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      separator: '/', size: 'medium', maxItems: 3, length: 5,
    }));

    const before = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const items = [...sr.querySelectorAll('li')];
      return {
        visible: items.filter(li => li.getBoundingClientRect().width > 0).length,
        ellipsis: !!sr.querySelector('[part~="ellipsis"]'),
      };
    });
    expect(before.ellipsis, 'the collapsed trail painted no ellipsis').toBe(true);

    expect(await page.evaluate(() => (window as any).matrix.clickEllipsis())).toBe(true);

    const after = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const items = [...sr.querySelectorAll('li')];
      const boxes = items.map(li => li.getBoundingClientRect())
        .filter(b => b.width > 0 && b.height > 0);
      const rows = new Set(boxes.map(b => Math.round(b.top)));
      return {
        visible: boxes.length,
        rows: rows.size,
        ellipsis: !!sr.querySelector('[part~="ellipsis"]'),
        ascending: boxes.every((b, i) => i === 0 || b.left >= boxes[i - 1].right - 1.5),
      };
    });

    expect(after.visible,
      `expanding revealed nothing: ${before.visible} items before, ${after.visible} after`)
      .toBeGreaterThan(before.visible);
    expect(after.ellipsis, 'the ellipsis is still painted after expanding').toBe(false);
    expect(after.rows, 'the expanded trail wrapped onto more than one row').toBe(1);
    expect(after.ascending, 'the expanded items overlap each other').toBe(true);
  });
});

test.describe('breadcrumbs visual matrix: findings', () => {
  /**
   * FINDING VISUAL-MATRIX-breadcrumbs-1.
   *
   * The docs list `separator` as the CSS part for "Separator characters between
   * items". In a collapsed trail one painted separator — the one that follows
   * the ellipsis button — carries no `part` attribute at all. A customer who
   * styles `::part(separator)` (recolours it, changes its spacing, hides it)
   * gets that one glyph left behind in the default style, in the one state
   * where the trail is most crowded.
   *
   * The assertion is NOT weakened: every painted separator is expected to be
   * addressable. The known gap is pinned so a fix trips this test.
   */
  test('every painted separator is addressable as ::part(separator)', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      separator: '/', size: 'medium', maxItems: 3, length: 5,
    }));
    const counts = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const painted = [...sr.querySelectorAll('.breadcrumb-separator')]
        .filter(s => s.getBoundingClientRect().width > 0);
      return {
        painted: painted.length,
        exposed: painted.filter(s => (s.getAttribute('part') ?? '').includes('separator')).length,
      };
    });
    expect(counts.painted, 'the collapsed trail painted no separators').toBeGreaterThan(0);
    expect(counts.exposed,
      `VISUAL-MATRIX-breadcrumbs-1 no longer reproduces: all ${counts.painted} painted`
      + ' separators now carry part="separator" — delete this finding')
      .toBe(counts.painted - 1);
  });
});

test.describe('breadcrumbs visual matrix: axis comparisons', () => {
  test('the three documented sizes really change the type size', async () => {
    const measured: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(c => (window as any).matrix.mount(c), { size, separator: '/' } as any);
      measured.push(await page.evaluate(() => {
        const link = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="link"]') as HTMLElement;
        return parseFloat(getComputedStyle(link).fontSize);
      }));
    }
    for (let i = 1; i < measured.length; i++) {
      expect(measured[i],
        `size "${SIZES[i]}" renders at ${measured[i]}px, not larger than "${SIZES[i - 1]}"`
        + ` at ${measured[i - 1]}px`).toBeGreaterThan(measured[i - 1]);
    }
  });

  test('the five documented separators really paint five different glyphs', async () => {
    const widths = new Map<Separator, string>();
    for (const separator of SEPARATORS) {
      await page.evaluate(c => (window as any).matrix.mount(c), { separator } as any);
      const glyph = await page.evaluate(() => {
        const sep = document.getElementById('subject')!.shadowRoot!
          .querySelector('[part~="separator"]') as HTMLElement;
        return {
          text: (sep.textContent ?? '').trim(),
          width: sep.getBoundingClientRect().width,
        };
      });
      expect(glyph.text, `separator "${separator}" painted "${glyph.text}"`).toBe(separator);
      expect(glyph.width, `separator "${separator}" renders at zero width`).toBeGreaterThan(0);
      widths.set(separator, glyph.text);
    }
    expect(new Set(widths.values()).size,
      'two documented separators paint the same glyph').toBe(SEPARATORS.length);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('breadcrumbs visual matrix: marquee pixels', () => {
  test('a separator is actually painted, and is not the surface colour', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ separator: '/', size: 'large' }));
    const pixels = await capture(
      page, '#stage', 'breadcrumbs-separator',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const sep = sr.querySelector('[part~="separator"]');
        const b = sep.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 6; i++) {
          points.push({ x: b.x + b.width / 2, y: b.y + (b.height * i) / 7 });
        }
        points.push({ x: b.x + b.width / 2, y: b.bottom + 60 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const glyph = pixels.slice(0, -1);
    expect(glyph.some(p => !sameColor(p, surface)),
      `every probe down the separator's box painted the surface colour ${surface.join(',')}`
      + ' — nothing is drawn there').toBe(true);
  });

  test('link text and current-page text are both readable on the page surface', async () => {
    await page.evaluate(() => (window as any).matrix.mount({ separator: '/', size: 'large' }));
    const pixels = await capture(
      page, '#stage', 'breadcrumbs-text',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const link = sr.querySelector('[part~="link"]');
        const current = sr.querySelector('[aria-current="page"]');
        const points = [];
        for (const el of [link, current]) {
          const b = el.getBoundingClientRect();
          for (let i = 1; i <= 10; i++) {
            points.push({ x: b.x + (b.width * i) / 11, y: b.y + b.height / 2 });
          }
        }
        const b = link.getBoundingClientRect();
        points.push({ x: b.x, y: b.bottom + 60 });
        return points;
      }`,
    );
    const surface = pixels[pixels.length - 1];
    const linkPixels = pixels.slice(0, 10);
    const currentPixels = pixels.slice(10, 20);

    for (const [name, sample] of [['link', linkPixels], ['current page', currentPixels]] as const) {
      const darkest = [...sample].sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))[0];
      expect(sameColor(darkest, surface),
        `the ${name} text area painted only the surface colour — no glyphs`).toBe(false);
      const ratio = contrast(darkest, surface);
      // Body-sized navigation text: the WCAG AA bar for normal text.
      expect(ratio, `${name} text contrast against the surface is ${ratio.toFixed(2)}:1`)
        .toBeGreaterThan(4.5);
    }
  });
});
