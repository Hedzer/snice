/**
 * snice-product-card feature-combination matrix.
 *
 * Dimensions (docs/ai/components/product-card.md + the .types.ts contract):
 *
 *   variant x images x sale            6 x 3 x 2 = 36  structure
 *   rating x reviewCount                   6 x 1 =  6  stars
 *   price/sale pairs                             =  6  pricing + discount
 *   stockCount x inStock                   6 x 2 = 12  stock messaging
 *   variant selectors                            =  4  radiogroup semantics
 *   badge x badgeVariant                   2 x 3 =  6  badge
 *   loading                                      =  2  skeleton
 *   events                                       = 10  the five documented events
 *                                               ──────────────────────────────
 *                                                  82 combos
 *
 * Sized to the component: a product card is a gallery, a title, a price block,
 * a stock line, a set of selectors and a CTA — six regions with real rules
 * between them (sale ⇒ discount, out of stock ⇒ disabled CTA). Eighty-two
 * combos exhaust those rules. The six LAYOUTS are paint, and the visual tier
 * (tests/live/matrix/product-card/) owns them.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, mount, removeComponent, text, wait,
} from '../matrix-kit';
import {
  BADGE_VARIANTS, COLOR_VARIANT, IMAGE_SETS, NAME, SIZE_VARIANT, VARIANTS,
  type CardSpec, checkCard, discountPercent, optionsOf, partOf, partsOf, priceNumber, spec,
} from './product-card-support';
import '../../../packages/components/src/product-card/snice-product-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * Mount a spec. `variant`, `badge`, `currency` and the numbers cross the
 * ATTRIBUTE channel (the documented HTML form); `images` and `variants` have
 * no attribute form at all, so they cross the property channel, exactly as the
 * doc's own example does.
 */
async function mountCard(s: CardSpec): Promise<HTMLElement> {
  const attrs: Record<string, string | number | boolean> = {
    name: s.name,
    price: s.price,
    currency: s.currency,
    rating: s.rating,
    'review-count': s.reviewCount,
    variant: s.variant,
    'badge-variant': s.badgeVariant,
    'stock-count': s.stockCount,
  };
  if (s.salePrice !== null) attrs['sale-price'] = s.salePrice;
  if (s.badge) attrs.badge = s.badge;
  attrs['in-stock'] = s.inStock;
  if (s.loading) attrs.loading = true;
  if (s.favorite) attrs.favorite = true;

  el = await mount('snice-product-card', attrs, {
    images: s.images,
    variants: s.variants,
  });
  return el;
}

// ── Structure: variant x images x sale ──────────────────────────────────────

describe('product-card matrix: structure', () => {
  for (const combo of cross({
    variant: VARIANTS,
    images: ['none', 'one', 'three'] as const,
    sale: [false, true],
  })) {
    it(combo.id, async () => {
      const s = spec({
        variant: combo.variant,
        images: IMAGE_SETS[combo.images],
        salePrice: combo.sale ? 99.99 : null,
      });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // The layout switch is presentation only: it may not add, remove or
      // rename a documented region.
      problems.equal((card as any).variant, combo.variant, 'variant property');

      expectClean(problems, combo.id);
    });
  }
});

// ── Rating: five stars, half steps, the numeric aria-label ──────────────────

describe('product-card matrix: rating', () => {
  for (const combo of cross({ rating: [0, 0.5, 2.5, 3.7, 4.5, 5] })) {
    it(`${combo.id}/stars`, async () => {
      const s = spec({ rating: combo.rating, reviewCount: 342 });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);

      expectClean(problems, `${combo.id}/stars`);
    });
  }
});

// ── Pricing: sale, discount, currency ───────────────────────────────────────

describe('product-card matrix: pricing', () => {
  const CASES: Array<{ id: string; price: number; salePrice: number | null; currency: string }> = [
    { id: 'plain', price: 129.99, salePrice: null, currency: '$' },
    { id: 'sale-25pc', price: 100, salePrice: 75, currency: '$' },
    { id: 'sale-half', price: 80, salePrice: 40, currency: '€' },
    { id: 'sale-equal', price: 60, salePrice: 60, currency: '$' },
    { id: 'sale-higher', price: 60, salePrice: 70, currency: '$' },
    { id: 'free', price: 0, salePrice: null, currency: '£' },
  ];

  for (const testCase of CASES) {
    it(`${testCase.id}/price`, async () => {
      const s = spec(testCase);
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // Documented: `discount` is a PERCENTAGE badge. A sale that saves
      // nothing (equal) or costs more (higher) is not a sale at all.
      const discount = partOf(card, 'discount');
      if (discount) {
        problems.equal(text(discount), `-${discountPercent(s)}%`, 'discount text');
      }
      problems.equal(
        priceNumber(partOf(card, 'price-current'), s.currency),
        s.salePrice !== null && s.salePrice < s.price ? s.salePrice : s.price,
        'the shopper-facing price',
      );

      expectClean(problems, `${testCase.id}/price`);
    });
  }
});

// ── Stock: the sentinel, the urgency band, the CTA it disables ──────────────

describe('product-card matrix: stock', () => {
  for (const combo of cross({
    stockCount: [-1, 0, 1, 4, 5, 12],
    inStock: [true, false],
  })) {
    /**
     * FINDING MATRIX-product-card-1 — `stock-count="0"`.
     *
     * The doc's contract for the property is "-1=hidden, <5=urgency". Zero is
     * neither the hidden sentinel nor five or more, so the documented reading
     * is that it belongs to the urgency band. The component treats it as
     * hidden (`stockCount > 0 && stockCount < 5`) and renders the plain
     * "In Stock"/"Out of Stock" line instead — a card that has exactly none
     * left says nothing about it.
     */
    const finding = combo.stockCount === 0;
    const runner = finding ? it.fails : it;

    runner(`${combo.id}/stock`, async () => {
      const s = spec({ stockCount: combo.stockCount, inStock: combo.inStock });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // Documented: "Out-of-stock disables CTA button".
      const cta = partOf(card, 'cta') as HTMLButtonElement | null;
      problems.equal(cta?.disabled, !combo.inStock, 'CTA disabled state');

      expectClean(problems, `${combo.id}/stock`);
    });
  }
});

// ── Variant selectors ───────────────────────────────────────────────────────

describe('product-card matrix: variant selectors', () => {
  const CASES: Array<{ id: string; variants: typeof SIZE_VARIANT[] }> = [
    { id: 'none', variants: [] },
    { id: 'size', variants: [SIZE_VARIANT] },
    { id: 'color', variants: [COLOR_VARIANT] },
    { id: 'size+color', variants: [SIZE_VARIANT, COLOR_VARIANT] },
  ];

  for (const testCase of CASES) {
    it(`${testCase.id}/selectors`, async () => {
      const s = spec({ variants: testCase.variants });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // Documented: the first option of each group is the initial selection —
      // `add-to-cart` carries `selectedVariants` for every documented type, so
      // every group must start with one.
      partsOf(card, 'variant-group').forEach((group, i) => {
        const options = optionsOf(group);
        problems.equal(
          options.findIndex(o => o.getAttribute('aria-checked') === 'true'), 0,
          `group ${i} initial selection`,
        );
      });

      expectClean(problems, `${testCase.id}/selectors`);
    });
  }
});

// ── Badge ───────────────────────────────────────────────────────────────────

describe('product-card matrix: badge', () => {
  for (const combo of cross({
    badge: ['', 'SALE'],
    badgeVariant: BADGE_VARIANTS,
  })) {
    it(`${combo.id}/badge`, async () => {
      const s = spec({ badge: combo.badge, badgeVariant: combo.badgeVariant });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      problems.equal((card as any).badgeVariant, combo.badgeVariant, 'badgeVariant property');

      expectClean(problems, `${combo.id}/badge`);
    });
  }
});

// ── Loading ─────────────────────────────────────────────────────────────────

describe('product-card matrix: loading', () => {
  for (const combo of cross({ loading: [false, true] })) {
    it(`${combo.id}/skeleton`, async () => {
      const s = spec({ loading: combo.loading, images: IMAGE_SETS.one, rating: 4 });
      const card = await mountCard(s);
      const problems = new Problems();

      checkCard(card, s, problems);
      // Documented: `loading` is a SKELETON — a placeholder, so the real
      // product content must not be showing through it.
      if (combo.loading) {
        problems.check(
          text(partOf(card, 'title')) !== NAME,
          'the skeleton still shows the product name',
        );
      }

      expectClean(problems, `${combo.id}/skeleton`);
    });
  }
});

// ── The five documented events ──────────────────────────────────────────────

describe('product-card matrix: events', () => {
  it('add-to-cart carries the documented detail', async () => {
    const s = spec({ variants: [SIZE_VARIANT, COLOR_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents<any>(card, 'add-to-cart');

    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(seen.length, 1, 'add-to-cart event count');
    problems.equal(seen[0]?.name, s.name, 'add-to-cart detail.name');
    problems.equal(seen[0]?.salePrice, null, 'add-to-cart detail.salePrice');
    problems.equal(seen[0]?.selectedVariants, { Size: 'S', Color: '#1a1a2e' },
      'add-to-cart detail.selectedVariants');

    expectClean(problems, 'add-to-cart');
  });

  /**
   * FINDING MATRIX-product-card-2 — `add-to-cart` detail on a sale item.
   *
   * The documented detail is `{ name, price, salePrice, selectedVariants }`:
   * two separate numeric fields, one named after the `price` property and one
   * after `salePrice`. On a discounted card the component sends the SALE price
   * in BOTH — `price: this.salePrice ?? this.price` — so a cart listener has no
   * way to recover the original price it was told it would receive.
   *
   * combo:    price=100, sale-price=75
   * expected: detail.price === 100, detail.salePrice === 75
   * actual:   detail.price === 75,  detail.salePrice === 75
   */
  it.fails('add-to-cart on a sale item reports both the list price and the sale price', async () => {
    const s = spec({ price: 100, salePrice: 75 });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents<any>(card, 'add-to-cart');

    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(seen[0]?.price, 100, 'add-to-cart detail.price');
    problems.equal(seen[0]?.salePrice, 75, 'add-to-cart detail.salePrice');

    expectClean(problems, 'add-to-cart/sale');
  });

  it('an out-of-stock card adds nothing to the cart', async () => {
    const s = spec({ inStock: false });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents(card, 'add-to-cart');

    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(seen.length, 0, 'add-to-cart events from an out-of-stock card');

    expectClean(problems, 'add-to-cart/out-of-stock');
  });

  it('a loading card adds nothing to the cart', async () => {
    const s = spec({ loading: true });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents(card, 'add-to-cart');

    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(seen.length, 0, 'add-to-cart events from a loading card');

    expectClean(problems, 'add-to-cart/loading');
  });

  for (const combo of cross({ from: [false, true] })) {
    it(`favorite=${combo.from} toggles and announces`, async () => {
      const s = spec({ favorite: combo.from });
      const card = await mountCard(s);
      const problems = new Problems();
      const seen = captureEvents<{ favorited: boolean }>(card, 'favorite');
      const before = partOf(card, 'favorite-btn')?.getAttribute('aria-label');

      click(partOf(card, 'favorite-btn'));
      await wait(30);

      problems.equal(seen, [{ favorited: !combo.from }], 'favorite detail');
      problems.equal((card as any).favorite, !combo.from, 'favorite property');
      // Documented: "Favorite button has descriptive aria-label" — a label
      // that does not change with the state describes nothing.
      problems.check(
        partOf(card, 'favorite-btn')?.getAttribute('aria-label') !== before,
        `the favorite button still says "${before}" after toggling`,
      );

      expectClean(problems, `favorite/${combo.from}`);
    });
  }

  it('image-click reports the index and src of the visible image', async () => {
    const s = spec({ images: IMAGE_SETS.three });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents<{ index: number; src: string }>(card, 'image-click');

    click(partsOf(card, 'image')[0]);
    await wait(30);

    problems.equal(seen, [{ index: 0, src: IMAGE_SETS.three[0] }], 'image-click detail');

    expectClean(problems, 'image-click');
  });

  it('a card with no images clicks through to nothing', async () => {
    const s = spec({ images: [] });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents(card, 'image-click');

    click(partOf(card, 'gallery'));
    await wait(30);

    problems.equal(seen.length, 0, 'image-click events from an empty gallery');

    expectClean(problems, 'image-click/empty');
  });

  it('variant-select reports the type and value, and moves aria-checked', async () => {
    const s = spec({ variants: [SIZE_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents<{ type: string; value: string }>(card, 'variant-select');

    const options = optionsOf(partsOf(card, 'variant-group')[0]);
    click(options[2]);
    await wait(30);

    problems.equal(seen, [{ type: 'Size', value: 'L' }], 'variant-select detail');
    const after = optionsOf(partsOf(card, 'variant-group')[0]);
    problems.equal(
      after.map(o => o.getAttribute('aria-checked')), ['false', 'false', 'true'],
      'aria-checked after selection',
    );

    expectClean(problems, 'variant-select');
  });

  it('a selected variant reaches the cart', async () => {
    const s = spec({ variants: [SIZE_VARIANT, COLOR_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();
    const cart = captureEvents<any>(card, 'add-to-cart');

    click(optionsOf(partsOf(card, 'variant-group')[0])[1]);
    click(optionsOf(partsOf(card, 'variant-group')[1])[1]);
    await wait(30);
    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(cart[0]?.selectedVariants, { Size: 'M', Color: '#e94560' },
      'selectedVariants after two selections');

    expectClean(problems, 'variant-select/cart');
  });
});

// ── Runtime reconfiguration ─────────────────────────────────────────────────

describe('product-card matrix: reconfiguration', () => {
  it('switching layout keeps every documented region', async () => {
    const s = spec({ images: IMAGE_SETS.three, rating: 4.5, salePrice: 99, variants: [SIZE_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();

    for (const variant of VARIANTS) {
      (card as any).variant = variant;
      await wait(30);
      checkCard(card, { ...s, variant }, problems);
    }

    expectClean(problems, 'layout switching');
  });

  it('replacing the variants list resets the selections to the new first options', async () => {
    const s = spec({ variants: [SIZE_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();

    click(optionsOf(partsOf(card, 'variant-group')[0])[2]);
    await wait(30);

    (card as any).variants = [COLOR_VARIANT];
    await wait(30);

    const next = { ...s, variants: [COLOR_VARIANT] };
    checkCard(card, next, problems);
    const cart = captureEvents<any>(card, 'add-to-cart');
    click(partOf(card, 'cta'));
    await wait(30);
    // The stale "Size" selection must not follow a product that no longer has
    // sizes into the cart.
    problems.equal(cart[0]?.selectedVariants, { Color: '#1a1a2e' },
      'selectedVariants after the variants list was replaced');

    expectClean(problems, 'variants replacement');
  });

  it('coming out of the skeleton restores the real card', async () => {
    const s = spec({ loading: true, images: IMAGE_SETS.one, rating: 4, salePrice: 99 });
    const card = await mountCard(s);
    const problems = new Problems();

    (card as any).loading = false;
    await wait(30);

    checkCard(card, { ...s, loading: false }, problems);

    expectClean(problems, 'loading → loaded');
  });
});
