/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-testimonial TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/testimonial, `npm run test:matrix`)
 * owns structure truth: which parts exist, what the quote reads, how many stars
 * are filled. It cannot own visual truth, because happy-dom performs no layout
 * — every box reads 0 and nothing is painted.
 *
 * snice-testimonial is a PURELY PRESENTATIONAL card, so per .ai/fuzzing.md its
 * visual matrix is deliberately MINIMAL — 24 layer-1 combos, not the table's
 * hundreds. It is also the tier that matters most for this component, because
 * `variant` produces NO DOM difference whatsoever: card, minimal and featured
 * are three CSS rules, and a browser is the only place they can be told apart.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the card has a real box and the quote wraps INSIDE it;
 *   · the documented vertical order is really painted top-to-bottom:
 *     stars, then quote, then the author row;
 *   · `variant` resolves to the documented token roles —
 *     card       → `--snice-color-surface-container-high` background
 *                  + `--snice-color-border` border,
 *     minimal    → a `--snice-color-primary` left rule and no card background,
 *     featured   → `--snice-color-primary` background
 *                  + `--snice-color-text-inverse` text;
 *   · the star row paints in `--snice-color-warning` (the documented star
 *     colour) and lays five glyphs out left-to-right without overlapping;
 *   · the avatar is a real, round, non-zero image sitting beside the author
 *     name, and the two never overlap;
 *   · the quote is never occluded — by the decorative ::before quote mark, by
 *     the author row, or by anything else (elementFromPoint through the shadow).
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   A card that "has a background-color" can still paint nothing, and text that
 *   "has a color" can still be invisible against it. The marquee captures decode
 *   the PNG inside the browser under test and assert the featured card's quote
 *   really contrasts with its own background, and that a filled star and an
 *   empty one are not the same pixels.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/testimonial/matrix.html';

type Variant = 'card' | 'minimal' | 'featured';

interface Combo {
  id: string;
  variant: Variant;
  rating: number;
  avatar: string;
  role: string;
  company: string;
  quote: string;
  author: string;
}

const QUOTE = 'This product changed my workflow completely, and the team noticed within a week.';
const AVATAR =
  'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">'
    + '<rect width="80" height="80" fill="#2563eb"/></svg>');

/**
 * The cross: variant (3) x rating (0, 4) x avatar (absent, present) x
 * role/company (none, both) = 24 combos. Sized to a card with one render branch
 * per optional block; the point of this tier is that every style-only dimension
 * gets a real browser, not that the product is large.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of ['card', 'minimal', 'featured'] as Variant[]) {
    for (const rating of [0, 4]) {
      for (const avatar of ['', AVATAR]) {
        for (const withRole of [false, true]) {
          combos.push({
            id: `${variant}/rating:${rating}/${avatar ? 'avatar' : 'no-avatar'}`
              + `/${withRole ? 'role+company' : 'author-only'}`,
            variant,
            rating,
            avatar,
            role: withRole ? 'CTO' : '',
            company: withRole ? 'Acme Corp' : '',
            quote: QUOTE,
            author: 'Jane Doe',
          });
        }
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;
    const token = (name: string) => (window as any).matrix.token(name) as string;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(node =>
        (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement | undefined;

    const hostBox = rect(host);
    const hostCs = getComputedStyle(host);
    if (hostCs.display !== 'block') say(`host computed display "${hostCs.display}", expected "block"`);
    if (hostCs.visibility !== 'visible') say(`host visibility "${hostCs.visibility}"`);
    if (Number(hostCs.opacity) <= 0) say(`host opacity "${hostCs.opacity}"`);

    const base = partNamed('base');
    if (!base) { say('no part="base" rendered'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`card renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    const baseCs = getComputedStyle(base);

    // ── variant: the documented token roles ─────────────────────────────────
    const surface = token('--snice-color-surface-container-high');
    const border = token('--snice-color-border');
    const primary = token('--snice-color-primary');
    const inverse = token('--snice-color-text-inverse');

    if (combo.variant === 'card') {
      if (baseCs.backgroundColor !== surface) {
        say(`card background "${baseCs.backgroundColor}", expected --snice-color-surface-container-high "${surface}"`);
      }
      if (parseFloat(baseCs.borderTopWidth) <= 0) {
        say(`card has no border (border-top-width ${baseCs.borderTopWidth})`);
      }
      if (baseCs.borderTopColor !== border) {
        say(`card border "${baseCs.borderTopColor}", expected --snice-color-border "${border}"`);
      }
    }
    if (combo.variant === 'minimal') {
      if (parseFloat(baseCs.borderLeftWidth) <= 0) {
        say(`minimal has no left rule (border-left-width ${baseCs.borderLeftWidth})`);
      }
      if (baseCs.borderLeftColor !== primary) {
        say(`minimal left rule "${baseCs.borderLeftColor}", expected --snice-color-primary "${primary}"`);
      }
      if (baseCs.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        say(`minimal painted a card background "${baseCs.backgroundColor}"`);
      }
    }
    if (combo.variant === 'featured') {
      if (baseCs.backgroundColor !== primary) {
        say(`featured background "${baseCs.backgroundColor}", expected --snice-color-primary "${primary}"`);
      }
      if (baseCs.color !== inverse) {
        say(`featured text "${baseCs.color}", expected --snice-color-text-inverse "${inverse}"`);
      }
    }

    // ── The quote lives inside the card ─────────────────────────────────────
    const quote = partNamed('quote');
    if (!quote) { say('no part="quote"'); return problems; }
    const quoteBox = rect(quote);
    if (quoteBox.width <= 0 || quoteBox.height <= 0) {
      say(`quote renders at ${quoteBox.width}x${quoteBox.height}`);
    }
    if (quoteBox.left < baseBox.left - EPS || quoteBox.right > baseBox.right + EPS) {
      say(`quote (${quoteBox.left.toFixed(0)}…${quoteBox.right.toFixed(0)}) overflows the card`
        + ` (${baseBox.left.toFixed(0)}…${baseBox.right.toFixed(0)})`);
    }
    if (quoteBox.bottom > baseBox.bottom + EPS) {
      say(`quote bottom ${quoteBox.bottom.toFixed(0)} spills past the card ${baseBox.bottom.toFixed(0)}`);
    }
    const quoteCs = getComputedStyle(quote);
    if (parseFloat(quoteCs.fontSize) < 10) say(`quote font-size ${quoteCs.fontSize}`);

    // ── The documented vertical order: stars, quote, author ─────────────────
    const author = partNamed('author');
    if (!author) { say('no part="author"'); return problems; }
    const authorBox = rect(author);
    if (authorBox.height <= 0) say(`author row renders at height ${authorBox.height}`);
    if (authorBox.top < quoteBox.bottom - EPS) {
      say(`author row (top ${authorBox.top.toFixed(0)}) is not below the quote`
        + ` (bottom ${quoteBox.bottom.toFixed(0)})`);
    }

    const stars = partNamed('stars');
    if (combo.rating > 0) {
      if (!stars) { say('rating > 0 painted no part="stars"'); }
      else {
        const starsBox = rect(stars);
        if (starsBox.height <= 0 || starsBox.width <= 0) {
          say(`star row renders at ${starsBox.width}x${starsBox.height}`);
        }
        if (starsBox.bottom > quoteBox.top + EPS) {
          say(`star row (bottom ${starsBox.bottom.toFixed(0)}) is not above the quote`
            + ` (top ${quoteBox.top.toFixed(0)})`);
        }
        // Documented star colour. `featured` overrides the text colour of the
        // whole card, and the docs name no star colour for it, so the token
        // assertion applies to the variants the docs do speak for.
        const starCs = getComputedStyle(stars);
        if (combo.variant !== 'featured') {
          const warning = token('--snice-color-warning');
          if (starCs.color !== warning) {
            say(`stars painted "${starCs.color}", expected --snice-color-warning "${warning}"`);
          }
        }

        const glyphs = [...stars.querySelectorAll('.star-glyph')] as HTMLElement[];
        if (glyphs.length !== 5) say(`${glyphs.length} star glyphs, expected 5`);
        let previousRight = -Infinity;
        for (const [i, glyph] of glyphs.entries()) {
          const box = rect(glyph);
          if (box.width <= 0 || box.height <= 0) {
            say(`star ${i} renders at ${box.width}x${box.height}`);
            continue;
          }
          if (box.left < previousRight - EPS) {
            say(`star ${i} (left ${box.left.toFixed(1)}) overlaps star ${i - 1}`
              + ` (right ${previousRight.toFixed(1)})`);
          }
          previousRight = box.right;
          const svg = glyph.querySelector('svg');
          if (!svg) { say(`star ${i} painted no svg`); continue; }
          const svgBox = rect(svg);
          if (svgBox.width <= 0 || svgBox.height <= 0) {
            say(`star ${i} svg renders at ${svgBox.width}x${svgBox.height}`);
          }
        }
      }
    } else if (stars) {
      say('rating 0 still painted a star row');
    }

    // ── The avatar: a real, round image beside the name ─────────────────────
    const image = author.querySelector('img.avatar') as HTMLImageElement | null;
    if (combo.avatar) {
      if (!image) { say('an avatar URL painted no image'); }
      else {
        const imageBox = rect(image);
        if (imageBox.width <= 0 || imageBox.height <= 0) {
          say(`avatar renders at ${imageBox.width}x${imageBox.height}`);
        }
        if (Math.abs(imageBox.width - imageBox.height) > 1) {
          say(`avatar is not square: ${imageBox.width.toFixed(1)}x${imageBox.height.toFixed(1)}`);
        }
        const imageCs = getComputedStyle(image);
        if (parseFloat(imageCs.borderTopLeftRadius) < imageBox.width / 2 - 1) {
          say(`avatar border-radius ${imageCs.borderTopLeftRadius} does not round a`
            + ` ${imageBox.width.toFixed(0)}px box`);
        }
        const name = author.querySelector('.author-name') as HTMLElement | null;
        const nameBox = name ? rect(name) : null;
        if (nameBox && nameBox.left < imageBox.right - EPS) {
          say(`author name (left ${nameBox.left.toFixed(1)}) overlaps the avatar`
            + ` (right ${imageBox.right.toFixed(1)})`);
        }
      }
    } else if (image) {
      say('no avatar URL, but an image was painted');
    }

    // ── The role line, when the docs say there is one ───────────────────────
    const roleLine = author.querySelector('.author-role') as HTMLElement | null;
    const wantsRole = !!(combo.role || combo.company);
    if (wantsRole && !roleLine) say('role/company set but no role line painted');
    if (!wantsRole && roleLine) say('no role or company, but a role line was painted');
    if (wantsRole && roleLine) {
      const roleBox = rect(roleLine);
      if (roleBox.height <= 0) say(`role line renders at height ${roleBox.height}`);
      const name = author.querySelector('.author-name') as HTMLElement | null;
      if (name && roleBox.top < rect(name).bottom - EPS) {
        say('role line is not below the author name');
      }
    }

    // ── Occlusion: nothing may paint over the quote ─────────────────────────
    // The card carries a decorative ::before quote mark at 8rem; it is
    // `pointer-events: none` precisely so it cannot swallow the text, and this
    // is the assertion that keeps that true.
    const y = quoteBox.top + Math.min(quoteBox.height / 2, 8);
    for (const fraction of [0.15, 0.4]) {
      const x = quoteBox.left + quoteBox.width * fraction;
      const outer = document.elementFromPoint(x, y);
      if (outer !== host) {
        say(`quote @${Math.round(fraction * 100)}%: page hit-test found`
          + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the testimonial`);
        continue;
      }
      const hit = (sr as any).elementFromPoint(x, y) as Element | null;
      if (hit !== quote && !quote.contains(hit as Node)) {
        say(`quote @${Math.round(fraction * 100)}% is occluded by`
          + ` <${hit?.tagName.toLowerCase() ?? 'nothing'}`
          + `${hit?.className ? `.${String(hit.className).split(' ')[0]}` : ''}>`);
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('testimonial visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.variant).toBe(combo.variant);
      // A non-default variant assigned as a PROPERTY must reach the attribute,
      // because `:host([variant=…])` is the only thing the stylesheet can see.
      // `card` is the documented default and defaults are not reflected.
      expect(mounted.reflected).toBe(combo.variant === 'card' ? null : combo.variant);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. A screenshot is two orders of magnitude more expensive than
// an evaluate, and layer 1 already measured the model the browser built. These
// exist because "the text has a colour" and "the text is readable on this card"
// are different claims, and only pixels can tell them apart.

test.describe('testimonial visual matrix: marquee pixels', () => {
  test('the featured card paints its quote against its own background, readably', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'featured', rating: 5, avatar: '', role: 'CTO', company: 'Acme Corp',
      quote: 'Outstanding experience from start to finish.', author: 'John Smith',
    }));
    // Probe a run of points across the quote's first line and one point in the
    // card's own padding. A card whose text renders in its background colour
    // paints one flat colour everywhere.
    const pixels = await capture(
      page, '#subject', 'testimonial-featured',
      `(host) => {
        const quote = host.shadowRoot.querySelector('[part~="quote"]');
        const card = host.shadowRoot.querySelector('[part~="base"]');
        const q = quote.getBoundingClientRect();
        const c = card.getBoundingClientRect();
        const points = [];
        for (let i = 1; i <= 12; i++) {
          points.push({ x: q.x + (q.width * i) / 14, y: q.y + Math.min(q.height / 2, 8) });
        }
        points.push({ x: c.x + 4, y: c.y + c.height - 4 });
        return points;
      }`,
    );
    const background = pixels[pixels.length - 1] as RGB;
    const text = pixels.slice(0, -1) as RGB[];
    expect(text.some(p => !sameColor(p, background)),
      `every probed quote pixel equals the card background ${background.join(',')}`).toBe(true);
    const best = Math.max(...text.map(p => contrast(p, background)));
    // Body copy on a coloured card: 3:1 is a deliberately low bar for an
    // antialiased glyph edge, but "antialiased" is not "invisible".
    expect(best, `best quote-vs-card contrast is ${best.toFixed(2)}:1`).toBeGreaterThan(3);
  });

  test('a filled star and an empty one paint different pixels', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'card', rating: 1, avatar: '', role: '', company: '',
      quote: 'Short and sweet.', author: 'Jane Doe',
    }));
    // Star 0 is filled and stars 1-4 are outlines at rating 1. A component that
    // painted the same glyph five times would read identical here.
    const pixels = await capture(
      page, '#subject', 'testimonial-stars',
      `(host) => {
        const glyphs = [...host.shadowRoot.querySelectorAll('.star-glyph')];
        return glyphs.slice(0, 2).map(g => {
          const b = g.getBoundingClientRect();
          return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        });
      }`,
    );
    const [filled, empty] = pixels as RGB[];
    expect(sameColor(filled, empty),
      `filled star painted ${filled.join(',')}, outline star painted ${empty.join(',')}`).toBe(false);
  });

  test('the card variant paints a surface that differs from the page behind it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'card', rating: 0, avatar: '', role: '', company: '',
      quote: 'A card must look like a card.', author: 'Jane Doe',
    }));
    // Captured through the page body rather than the card: the probe
    // needs one point INSIDE the card and one on the page beside it, and a
    // screenshot of the card cannot contain a pixel outside the card.
    const [inside, outside] = await capture(
      page, 'body', 'testimonial-card-surface',
      `() => {
        const host = document.getElementById('subject');
        const b = host.getBoundingClientRect();
        return [
          { x: b.x + b.width - 6, y: b.y + b.height - 6 },
          { x: b.x + b.width + 20, y: b.y + b.height + 20 },
        ];
      }`,
    );
    expect(sameColor(inside as RGB, outside as RGB),
      `card painted ${inside.join(',')} on a page painting ${outside.join(',')}`).toBe(false);
  });
});
