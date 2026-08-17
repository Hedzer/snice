/**
 * Smoke slice of the snice-product-card matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/product-card/, 85 combos) is excluded from the
 * default Vitest include and runs via `npm run test:matrix`. This file lives at
 * `smoke.test.ts` so it stays collected, and every assertion routes through the
 * matrix's own oracle.
 *
 * The marquee: the fully-loaded card (gallery, rating, sale, selectors), the
 * out-of-stock CTA lock, the skeleton, and the add-to-cart detail.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, expectClean, mount, removeComponent, text, wait,
} from '../matrix-kit';
import {
  COLOR_VARIANT, IMAGE_SETS, NAME, SIZE_VARIANT,
  type CardSpec, checkCard, optionsOf, partOf, partsOf, spec,
} from './product-card-support';
import '../../../packages/components/src/product-card/snice-product-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountCard(s: CardSpec): Promise<HTMLElement> {
  const attrs: Record<string, string | number | boolean> = {
    name: s.name, price: s.price, currency: s.currency, rating: s.rating,
    'review-count': s.reviewCount, variant: s.variant, 'badge-variant': s.badgeVariant,
    'stock-count': s.stockCount, 'in-stock': s.inStock,
  };
  if (s.salePrice !== null) attrs['sale-price'] = s.salePrice;
  if (s.badge) attrs.badge = s.badge;
  if (s.loading) attrs.loading = true;
  if (s.favorite) attrs.favorite = true;
  el = await mount('snice-product-card', attrs, { images: s.images, variants: s.variants });
  return el;
}

describe('product-card matrix smoke', () => {
  it('a fully-loaded card renders every documented region', async () => {
    const s = spec({
      images: IMAGE_SETS.three, rating: 4.5, reviewCount: 342, salePrice: 99.99,
      badge: 'SALE', variants: [SIZE_VARIANT, COLOR_VARIANT], stockCount: 3,
    });
    const card = await mountCard(s);
    const problems = new Problems();

    checkCard(card, s, problems);

    expectClean(problems, 'smoke/full');
  });

  it('out of stock disables the CTA and adds nothing to the cart', async () => {
    const s = spec({ inStock: false });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents(card, 'add-to-cart');

    checkCard(card, s, problems);
    click(partOf(card, 'cta'));
    await wait(30);
    problems.equal(seen.length, 0, 'add-to-cart events from an out-of-stock card');

    expectClean(problems, 'smoke/out-of-stock');
  });

  it('the skeleton hides the product and gives it back', async () => {
    const s = spec({ loading: true, images: IMAGE_SETS.one, rating: 4 });
    const card = await mountCard(s);
    const problems = new Problems();

    checkCard(card, s, problems);
    problems.check(text(partOf(card, 'title')) !== NAME, 'the skeleton shows the product name');

    (card as any).loading = false;
    await wait(30);
    checkCard(card, { ...s, loading: false }, problems);

    expectClean(problems, 'smoke/skeleton');
  });

  it('add-to-cart carries the selected variants', async () => {
    const s = spec({ variants: [SIZE_VARIANT] });
    const card = await mountCard(s);
    const problems = new Problems();
    const seen = captureEvents<any>(card, 'add-to-cart');

    click(optionsOf(partsOf(card, 'variant-group')[0])[1]);
    await wait(30);
    click(partOf(card, 'cta'));
    await wait(30);

    problems.equal(seen.length, 1, 'add-to-cart event count');
    problems.equal(seen[0]?.selectedVariants, { Size: 'M' }, 'selectedVariants');
    problems.equal(seen[0]?.name, NAME, 'detail.name');

    expectClean(problems, 'smoke/add-to-cart');
  });

  it('the favorite toggle announces its new state', async () => {
    const card = await mountCard(spec());
    const problems = new Problems();
    const seen = captureEvents<{ favorited: boolean }>(card, 'favorite');

    click(partOf(card, 'favorite-btn'));
    await wait(30);

    problems.equal(seen, [{ favorited: true }], 'favorite detail');

    expectClean(problems, 'smoke/favorite');
  });
});
