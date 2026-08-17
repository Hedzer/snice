/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-product-card TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/product-card, `npm run test:matrix`) owns
 * structure truth: which parts exist per spec, the five event details, the
 * star arithmetic. Four of this component's documented claims are invisible to
 * happy-dom, which performs no layout and paints nothing:
 *
 *   · "price-original — Original price (STRIKETHROUGH on sale)". A
 *     `text-decoration` is a computed style, and a strikethrough that never
 *     resolves is a price the shopper reads as the price;
 *   · six LAYOUTS whose entire difference is where the gallery sits relative
 *     to the body — a DOM assertion cannot tell `vertical` from `horizontal`;
 *   · the gallery is an overlay stack: badge, heart, quick-view and two nav
 *     arrows all paint ON TOP of the image. Any of them can swallow another's
 *     clicks, and only a hit-test knows;
 *   · "Out-of-stock disables CTA button" — a disabled button that still looks
 *     and hit-tests like a live one is the defect this catches.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/product-card/matrix.html';

type Variant = 'vertical' | 'horizontal' | 'compact' | 'featured' | 'minimal' | 'grid';
const VARIANTS: Variant[] = ['vertical', 'horizontal', 'compact', 'featured', 'minimal', 'grid'];

const SIZE_VARIANT = { type: 'Size', options: ['S', 'M', 'L'] };

interface Combo {
  id: string;
  variant: Variant;
  images: number;
  sale: boolean;
  inStock: boolean;
  stageWidth: number;
}

/**
 * 6 layouts x 3 gallery sizes x sale x stock — 72 combos. Sized to a component
 * whose visual surface is "six arrangements of the same six regions, plus an
 * overlay stack"; the point of this tier is that each arrangement meets a real
 * layout engine with real overlays on top of it.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const variant of VARIANTS) {
    for (const images of [0, 1, 3]) {
      for (const sale of [false, true]) {
        for (const inStock of [true, false]) {
          combos.push({
            id: `${variant}/images=${images}/${sale ? 'sale' : 'list'}/${inStock ? 'in-stock' : 'out'}`,
            variant,
            images,
            sale,
            inStock,
            // The horizontal layout puts the gallery beside the body; a 420px
            // stage would squeeze both into unreadable columns.
            stageWidth: variant === 'horizontal' ? 640 : 420,
          });
        }
      }
    }
  }
  return combos;
}

function mountArgs(combo: Combo) {
  return {
    variant: combo.variant,
    images: Array.from({ length: combo.images }, (_, i) => i),
    price: 129.99,
    salePrice: combo.sale ? 99.99 : null,
    rating: 4.5,
    reviewCount: 342,
    badge: combo.sale ? 'SALE' : '',
    inStock: combo.inStock,
    variants: [SIZE_VARIANT],
    stageWidth: combo.stageWidth,
  };
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning EVERY violation at once. */
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
    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
    const partOf = (name: string) =>
      ([...sr.querySelectorAll('[part]')].find(node => tokens(node).includes(name)) ?? null) as HTMLElement | null;
    const partsOf = (name: string) =>
      [...sr.querySelectorAll('[part]')].filter(node => tokens(node).includes(name)) as HTMLElement[];

    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`the card renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    const base = partOf('base');
    if (!base) { say('no [part="base"]'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`[part="base"] renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }

    // ── The card is a block that fills its container ─────────────────────────
    const stage = document.getElementById('stage')!.getBoundingClientRect();
    if (hostBox.width > stage.width + EPS) {
      say(`the card is ${hostBox.width.toFixed(0)}px wide in a ${stage.width.toFixed(0)}px container`);
    }

    // ── Gallery and body are disjoint regions inside the base ────────────────
    const gallery = partOf('gallery');
    const body = partOf('body');
    if (!gallery) say('no [part="gallery"]');
    if (!body) say('no [part="body"]');
    if (gallery && body) {
      const g = rect(gallery);
      const b = rect(body);
      for (const [name, box] of [['gallery', g], ['body', b]] as const) {
        if (box.width <= 0 || box.height <= 0) say(`[part="${name}"] renders at ${box.width}x${box.height}`);
        if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS
          || box.top < baseBox.top - EPS || box.bottom > baseBox.bottom + EPS) {
          say(`[part="${name}"] escapes [part="base"]`);
        }
      }
      // Stacked or side by side, they may not sit on top of each other.
      const overlapX = Math.min(g.right, b.right) - Math.max(g.left, b.left);
      const overlapY = Math.min(g.bottom, b.bottom) - Math.max(g.top, b.top);
      if (overlapX > EPS && overlapY > EPS) {
        say(`the gallery and the body overlap by ${overlapX.toFixed(0)}x${overlapY.toFixed(0)}px`);
      }
    }

    // ── The gallery's overlay stack ──────────────────────────────────────────
    // Every overlay must be hit-testable: the shopper has to be able to reach
    // the heart, and the heart must not cover the badge or the image.
    const favorite = partOf('favorite-btn');
    if (!favorite) say('no [part="favorite-btn"]');
    else {
      const box = rect(favorite);
      if (box.width < 16 || box.height < 16) {
        say(`the favorite button renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)} — too small to hit`);
      } else {
        const hit = (sr as any).elementFromPoint(
          box.left + box.width / 2, box.top + box.height / 2) as Element | null;
        if (hit !== favorite && !favorite.contains(hit as Node)) {
          say(`the favorite button is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
    }

    const badge = partOf('badge');
    if (combo.sale && !badge) say('a badged card paints no [part="badge"]');
    if (badge) {
      const box = rect(badge);
      if (box.width <= 0 || box.height <= 0) say(`[part="badge"] renders at ${box.width}x${box.height}`);
      if (favorite) {
        const f = rect(favorite);
        const ox = Math.min(box.right, f.right) - Math.max(box.left, f.left);
        const oy = Math.min(box.bottom, f.bottom) - Math.max(box.top, f.top);
        if (ox > EPS && oy > EPS) say('the badge and the favorite button overlap');
      }
      // A badge with no fill of its own is a word floating on the photo.
      if (getComputedStyle(badge).backgroundColor === 'rgba(0, 0, 0, 0)') {
        say('[part="badge"] is transparent');
      }
    }

    // ── Images: painted, stacked, inside the gallery ─────────────────────────
    const images = partsOf('image');
    if (images.length !== combo.images) {
      say(`${images.length} [part="image"] elements for ${combo.images} images`);
    }
    if (gallery && images.length) {
      const g = rect(gallery);
      // Exactly one image is the visible one; a gallery showing two at once is
      // the classic carousel defect.
      const visible = images.filter((img) => {
        const cs = getComputedStyle(img);
        return cs.display !== 'none' && cs.visibility === 'visible' && Number(cs.opacity) > 0.05;
      });
      if (visible.length !== 1) {
        say(`${visible.length} of ${images.length} gallery images are visible at once`);
      }
      // Containment is judged on the device grid. EPS exists to absorb
      // sub-pixel rounding, and engines resolve the image's height:100% chain
      // against an aspect-ratio-sized gallery a device pixel or two apart
      // (WebKit: 1.6px over the 16/9 gallery at dpr 2, where EPS 1.5 was
      // tuned for dpr 1). The gallery's own overflow:hidden clips exactly that
      // sliver, so a real escape — an image meaningfully outside its frame —
      // stays far beyond this tolerance on every engine.
      const containEps = EPS * window.devicePixelRatio;
      for (const img of visible) {
        const box = rect(img);
        if (box.width <= 0 || box.height <= 0) say(`a visible image renders at ${box.width}x${box.height}`);
        if (box.right > g.right + containEps || box.bottom > g.bottom + containEps) {
          say('a visible image escapes the gallery');
        }
      }
    }

    // ── Price: the documented strikethrough ──────────────────────────────────
    const current = partOf('price-current');
    if (!current) say('no [part="price-current"]');
    else if (rect(current).height <= 0) say('[part="price-current"] has no box');

    const original = partOf('price-original');
    if (combo.sale) {
      if (!original) say('a sale card paints no [part="price-original"]');
      else {
        // The documented claim, in the browser's own words.
        const decoration = getComputedStyle(original).textDecorationLine;
        if (!decoration.includes('line-through')) {
          say(`[part="price-original"] text-decoration-line is "${decoration}", not line-through`);
        }
        if (current) {
          const c = rect(current);
          const o = rect(original);
          const ox = Math.min(c.right, o.right) - Math.max(c.left, o.left);
          const oy = Math.min(c.bottom, o.bottom) - Math.max(c.top, o.top);
          if (ox > EPS && oy > EPS) say('the sale price and the original price overlap');
        }
      }
      const discount = partOf('discount');
      if (!discount) say('a sale card paints no [part="discount"]');
      else if (rect(discount).width <= 0) say('[part="discount"] has no box');
    } else if (original) {
      say('a card that is not on sale paints [part="price-original"]');
    }

    // ── Stock line ───────────────────────────────────────────────────────────
    const stock = partOf('stock');
    if (!stock) say('no [part="stock"]');
    else if (rect(stock).height <= 0) say('[part="stock"] has no box');

    // ── Variant options ──────────────────────────────────────────────────────
    const options = partsOf('variant-option');
    if (options.length !== 3) say(`${options.length} [part="variant-option"] buttons, expected 3`);
    let previousRight = -Infinity;
    for (const option of options) {
      const box = rect(option);
      if (box.width < 16 || box.height < 16) {
        say(`a variant option renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)} — too small to hit`);
        continue;
      }
      if (box.left < previousRight - EPS) say('two variant options overlap');
      previousRight = box.right;
      const hit = (sr as any).elementFromPoint(
        box.left + box.width / 2, box.top + box.height / 2) as Element | null;
      if (hit !== option && !option.contains(hit as Node)) {
        say(`a variant option is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }
    // The checked option must LOOK different, not just announce itself.
    const checked = options.find(o => o.getAttribute('aria-checked') === 'true');
    const unchecked = options.find(o => o.getAttribute('aria-checked') === 'false');
    if (checked && unchecked) {
      const a = getComputedStyle(checked);
      const b = getComputedStyle(unchecked);
      const same = a.borderColor === b.borderColor
        && a.backgroundColor === b.backgroundColor
        && a.outlineColor === b.outlineColor
        && a.boxShadow === b.boxShadow;
      if (same) say('the selected variant option is styled identically to an unselected one');
    }

    // ── CTA ──────────────────────────────────────────────────────────────────
    const cta = partOf('cta') as HTMLButtonElement | null;
    if (!cta) say('no [part="cta"]');
    else {
      const box = rect(cta);
      if (box.width < 40 || box.height < 20) {
        say(`the CTA renders at ${box.width.toFixed(0)}x${box.height.toFixed(0)} — too small to press`);
      } else {
        const hit = (sr as any).elementFromPoint(
          box.left + box.width / 2, box.top + box.height / 2) as Element | null;
        if (hit !== cta && !cta.contains(hit as Node)) {
          say(`the CTA is covered by <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
        }
      }
      if (cta.disabled !== !combo.inStock) {
        say(`the CTA disabled=${cta.disabled} for inStock=${combo.inStock}`);
      }
      // Documented: out of stock DISABLES the CTA. A disabled control that
      // looks live is a button the shopper will keep pressing.
      if (!combo.inStock && getComputedStyle(cta).cursor === 'pointer') {
        say('the out-of-stock CTA still shows a pointer cursor');
      }
      if (box.bottom > baseBox.bottom + EPS) say('the CTA hangs outside the card');
    }

    return problems;
  }, combo as any);
}

// ── Findings: documented regions the layout stylesheet deletes ──────────────
//
// `.ai/fuzzing.md`: a combo that diverges from the docs is a FINDING — keep the
// correct assertion, pin it against an id, never weaken it. `it.fails` is the
// DOM tier's tool; the equivalent here is deliberately stricter than
// `test.fail()`, which would mark the whole combo expected-to-fail and quietly
// absorb any unrelated regression alongside it.
//
// A waiver names the EXACT message it excuses and the exact combos it applies
// to. Everything else the combo reports still fails, and a waiver that stops
// reproducing fails on its own — so a fixed component cannot leave a permanent
// lie behind in the suite.
//
// All three findings below have the same shape: `snice-product-card.css`
// deletes documented regions for three of the six documented layouts, and the
// doc's `variant` property says nothing about a layout dropping features. The
// DOM tier cannot see any of it — the parts are all present in the shadow tree;
// only `display: none` removes them from the shopper's screen.

interface Waiver {
  id: string;
  applies: (combo: Combo) => boolean;
  matches: RegExp;
  /** How many times the message is expected, when it repeats per element. */
  times?: number;
}

const WAIVERS: Waiver[] = [
  {
    /**
     * FINDING MATRIX-product-card-3 — `variant="compact"` deletes three
     * documented regions.
     *
     * combo:    variant=compact (any images/sale/stock)
     * expected: the documented `variants`, `badge` and `favorite-btn` parts are
     *           on screen, as they are for `vertical`
     * actual:   `.product-card--compact` sets `display: none` on all three, so
     *           they render at 0x0 — a compact card cannot be favourited, shows
     *           no badge, and offers no size or colour choice.
     */
    id: 'MATRIX-product-card-3',
    applies: c => c.variant === 'compact',
    matches: /^a variant option renders at 0x0 — too small to hit$/,
    times: 3,
  },
  {
    id: 'MATRIX-product-card-3',
    applies: c => c.variant === 'compact',
    matches: /^the favorite button renders at 0x0 — too small to hit$/,
  },
  {
    id: 'MATRIX-product-card-3',
    applies: c => c.variant === 'compact' && c.sale,
    matches: /^\[part="badge"\] renders at 0x0$/,
  },
  {
    /**
     * FINDING MATRIX-product-card-4 — `variant="grid"` deletes the variant
     * selectors.
     *
     * combo:    variant=grid, variants=[{ type: 'Size', options: [S,M,L] }]
     * expected: three hit-testable `variant-option` buttons
     * actual:   `.product-card--grid .product-card__variants { display: none }`
     *           — a grid card silently drops every documented selector while
     *           `add-to-cart` still reports a `selectedVariants` the shopper
     *           was never shown.
     */
    id: 'MATRIX-product-card-4',
    applies: c => c.variant === 'grid',
    matches: /^a variant option renders at 0x0 — too small to hit$/,
    times: 3,
  },
  {
    /**
     * FINDING MATRIX-product-card-5 — `variant="minimal"` deletes the stock
     * line.
     *
     * combo:    variant=minimal, in-stock or out
     * expected: the documented `stock` part is on screen — the doc makes stock
     *           a first-class region and even ties `stockCount` urgency to it
     * actual:   `.product-card--minimal .product-card__stock { display: none }`
     *           — an out-of-stock minimal card says nothing about it anywhere
     *           except a disabled button.
     */
    id: 'MATRIX-product-card-5',
    applies: c => c.variant === 'minimal',
    matches: /^\[part="stock"\] has no box$/,
  },
];

const combos = generateCombos();

test.describe('product-card visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs(combo) as any);
      const problems = await visualProblems(combo);
      const waivers = WAIVERS.filter(w => w.applies(combo));

      const excused = (problem: string) => waivers.some(w => w.matches.test(problem));
      expect(problems.filter(p => !excused(p)), `combo ${combo.id}`).toEqual([]);

      for (const waiver of waivers) {
        const hits = problems.filter(p => waiver.matches.test(p)).length;
        expect(hits,
          `combo ${combo.id}: ${waiver.id} no longer reproduces (${waiver.matches})`
          + ' — delete its waiver in product-card-visual.spec.ts')
          .toBe(waiver.times ?? 1);
      }
    });
  }
});

test.describe('product-card visual matrix: the six layouts', () => {
  test('every layout gives the gallery and the body their own space', async () => {
    const shapes: Record<string, string> = {};
    for (const variant of VARIANTS) {
      await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
        id: variant, variant, images: 1, sale: false, inStock: true,
        stageWidth: variant === 'horizontal' ? 640 : 420,
      }) as any);
      shapes[variant] = await page.evaluate(() => {
        const host = document.getElementById('subject')!;
        const sr = host.shadowRoot!;
        const find = (name: string) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement;
        const g = find('gallery').getBoundingClientRect();
        const b = find('body').getBoundingClientRect();
        // "Beside" vs "above" is the only geometric distinction the doc's six
        // names imply, so that is what is recorded.
        return g.bottom <= b.top + 1 ? 'stacked' : (g.right <= b.left + 1 ? 'beside' : 'other');
      });
    }
    expect(shapes.horizontal, `horizontal laid out ${JSON.stringify(shapes)}`).toBe('beside');
    for (const variant of VARIANTS.filter(v => v !== 'horizontal')) {
      expect(shapes[variant], `${variant} laid out ${JSON.stringify(shapes)}`).not.toBe('other');
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────
//
// Small on purpose. Layer 1 read the computed cascade; these exist because a
// discount badge that resolves to a colour still has to reach the screen as a
// colour anyone can read, and because a skeleton that "renders" still has to
// look like a placeholder rather than like an empty card.

test.describe('product-card visual matrix: marquee pixels', () => {
  test('the sale badge paints a readable label on its own fill', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
      id: 'marquee', variant: 'vertical', images: 1, sale: true, inStock: true, stageWidth: 420,
    }) as any);

    const probes = await capture(
      page, '#subject', 'product-card-badge',
      `(host) => {
        const sr = host.shadowRoot;
        const find = (name) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes(name));
        const badge = find('badge').getBoundingClientRect();
        // The corner is the badge's own fill, clear of the label's box.
        const points = [{ x: badge.right - 2, y: badge.top + 2 }];
        // A grid across the label: a single row can land entirely between
        // glyphs and read back as the fill.
        for (let row = 1; row <= 3; row++) {
          for (let i = 0; i < 24; i++) {
            points.push({
              x: badge.x + (badge.width * (i + 0.5)) / 24,
              y: badge.y + (badge.height * row) / 4,
            });
          }
        }
        return points;
      }`,
    );
    const [fill, ...glyphs] = probes;
    // The ink is whichever probe is FURTHEST from the fill — the label may be
    // lighter or darker than its badge, and a "darkest pixel" rule would pick
    // the fill itself on a dark badge with a light label.
    const distance = (c: number[]) => Math.max(...c.map((channel, i) => Math.abs(channel - fill[i])));
    const ink = glyphs.reduce((a, b) => (distance(a) >= distance(b) ? a : b));
    expect(distance(ink),
      `every probe across the badge read its own fill rgb(${fill.join(',')}) — no label was painted`)
      .toBeGreaterThan(8);
    expect(contrast(ink, fill),
      `the badge paints rgb(${ink.join(',')}) on rgb(${fill.join(',')}) —`
      + ` ${contrast(ink, fill).toFixed(2)}:1`)
      .toBeGreaterThan(3);
  });

  test('the gallery image really reaches the screen', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
      id: 'marquee', variant: 'vertical', images: 3, sale: false, inStock: true, stageWidth: 420,
    }) as any);

    const [pixel, surface] = await capture(
      page, '#subject', 'product-card-gallery',
      `(host) => {
        const sr = host.shadowRoot;
        const find = (name) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes(name));
        const gallery = find('gallery').getBoundingClientRect();
        const body = find('body').getBoundingClientRect();
        return [
          { x: gallery.x + gallery.width / 2, y: gallery.y + gallery.height / 2 },
          { x: body.x + 4, y: body.bottom - 4 },
        ];
      }`,
    );
    // The fixture's first image is a solid #3355bb rectangle. Its centre must
    // paint blue, and must not paint the card's own surface.
    expect(sameColor(pixel, surface),
      `the gallery centre painted ${pixel.join(',')}, identical to the card surface`).toBe(false);
    expect(pixel[2], `the gallery centre painted rgb(${pixel.join(',')}), not the blue test image`)
      .toBeGreaterThan(pixel[0]);
  });

  test('the out-of-stock CTA is visibly dimmer than the live one', async () => {
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const cta = [...sr.querySelectorAll('[part]')]
        .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes('cta'))
        .getBoundingClientRect();
      return [{ x: cta.x + 6, y: cta.y + cta.height / 2 }];
    }`;

    await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
      id: 'live', variant: 'vertical', images: 1, sale: false, inStock: true, stageWidth: 420,
    }) as any);
    const [live] = await capture(page, '#subject', 'product-card-cta-live', probe);

    await page.evaluate(c => (window as any).matrix.mount(c), mountArgs({
      id: 'out', variant: 'vertical', images: 1, sale: false, inStock: false, stageWidth: 420,
    }) as any);
    const [out] = await capture(page, '#subject', 'product-card-cta-out', probe);

    expect(sameColor(live, out),
      `both CTAs painted rgb(${live.join(',')}) — out of stock looks exactly like in stock`)
      .toBe(false);
  });

  test('the skeleton paints placeholder blocks, not an empty card', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      variant: 'vertical', images: [0], loading: true, price: 129.99, stageWidth: 420,
    } as any);

    const [block, surface] = await capture(
      page, '#subject', 'product-card-skeleton',
      `(host) => {
        const sr = host.shadowRoot;
        const find = (name) => [...sr.querySelectorAll('[part]')]
          .find(n => (n.getAttribute('part') ?? '').split(/\\s+/).includes(name));
        const gallery = find('gallery').getBoundingClientRect();
        const base = find('base').getBoundingClientRect();
        return [
          { x: gallery.x + gallery.width / 2, y: gallery.y + gallery.height / 2 },
          { x: base.right - 3, y: base.bottom - 3 },
        ];
      }`,
    );
    expect(sameColor(block, surface),
      `the skeleton's image placeholder painted rgb(${block.join(',')}), the same as the card surface`)
      .toBe(false);
  });
});
