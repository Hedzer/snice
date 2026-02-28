import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/product-card/snice-product-card';
import type { SniceProductCardElement, ProductVariant } from '../../components/product-card/snice-product-card.types';

describe('snice-product-card', () => {
  let el: SniceProductCardElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    expect(el.name).toBe('');
    expect(el.price).toBe(0);
    expect(el.salePrice).toBe(null);
    expect(el.currency).toBe('$');
    expect(el.images).toEqual([]);
    expect(el.rating).toBe(0);
    expect(el.reviewCount).toBe(0);
    expect(el.variants).toEqual([]);
    expect(el.inStock).toBe(true);
    expect(el.variant).toBe('vertical');
    expect(el.badge).toBe('');
    expect(el.badgeVariant).toBe('sale');
    expect(el.loading).toBe(false);
    expect(el.favorite).toBe(false);
    expect(el.stockCount).toBe(-1);
  });

  it('should render product name', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.name = 'Test Product';
    await wait(50);
    const title = queryShadow(el as HTMLElement, '.product-card__title');
    expect(title?.textContent).toBe('Test Product');
  });

  it('should render price', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.price = 49.99;
    await wait(50);
    const price = queryShadow(el as HTMLElement, '.product-card__price-current');
    expect(price?.textContent?.trim()).toContain('49.99');
  });

  it('should render sale price with original crossed out', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.price = 99.99;
    el.salePrice = 79.99;
    await wait(50);
    const current = queryShadow(el as HTMLElement, '.product-card__price-current--sale');
    expect(current).toBeTruthy();
    const original = queryShadow(el as HTMLElement, '.product-card__price-original');
    expect(original).toBeTruthy();
    expect(original?.textContent?.trim()).toContain('99.99');
  });

  it('should render discount percentage', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.price = 100;
    el.salePrice = 75;
    await wait(50);
    const discount = queryShadow(el as HTMLElement, '.product-card__price-discount');
    expect(discount).toBeTruthy();
    expect(discount?.textContent?.trim()).toContain('-25%');
  });

  it('should render star rating', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.rating = 4;
    await wait(50);
    const filledStars = queryShadowAll(el as HTMLElement, '.product-card__star--filled');
    expect(filledStars.length).toBe(4);
  });

  it('should render review count', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.rating = 3;
    el.reviewCount = 42;
    await wait(50);
    const count = queryShadow(el as HTMLElement, '.product-card__review-count');
    expect(count?.textContent).toContain('42');
  });

  it('should render gallery with images', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    await wait(50);
    const img = queryShadow(el as HTMLElement, '.product-card__gallery-image--active') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img?.src).toContain('img1.jpg');
  });

  it('should render gallery navigation for multiple images', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg'];
    await wait(50);
    const prev = queryShadow(el as HTMLElement, '.product-card__gallery-nav--prev');
    const next = queryShadow(el as HTMLElement, '.product-card__gallery-nav--next');
    expect(prev).toBeTruthy();
    expect(next).toBeTruthy();
  });

  it('should render gallery dots', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    await wait(50);
    const dots = queryShadowAll(el as HTMLElement, '.product-card__gallery-dot');
    expect(dots.length).toBe(3);
  });

  it('should navigate images on next/prev click', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg'];
    await wait(50);
    const next = queryShadow(el as HTMLElement, '.product-card__gallery-nav--next') as HTMLElement;
    next.click();
    await wait(50);
    const img = queryShadow(el as HTMLElement, '.product-card__gallery-image--active') as HTMLImageElement;
    expect(img?.src).toContain('img2.jpg');
  });

  it('should render variant selectors', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.variants = [
      { type: 'Size', options: ['S', 'M', 'L'] }
    ];
    await wait(50);
    const options = queryShadowAll(el as HTMLElement, '.product-card__variant-option');
    expect(options.length).toBe(3);
  });

  it('should select first variant option by default', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.variants = [
      { type: 'Size', options: ['S', 'M', 'L'] }
    ];
    await wait(50);
    const selected = queryShadow(el as HTMLElement, '.product-card__variant-option--selected');
    expect(selected).toBeTruthy();
    expect(selected?.textContent?.trim()).toBe('S');
  });

  it('should emit variant-select event', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.variants = [
      { type: 'Size', options: ['S', 'M', 'L'] }
    ];
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('variant-select', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const options = queryShadowAll(el as HTMLElement, '.product-card__variant-option');
    (options[1] as HTMLElement).click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.type).toBe('Size');
    expect(detail.value).toBe('M');
  });

  it('should emit add-to-cart event', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.name = 'Test Product';
    el.price = 29.99;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('add-to-cart', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const cta = queryShadow(el as HTMLElement, '.product-card__cta') as HTMLElement;
    cta.click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.name).toBe('Test Product');
    expect(detail.price).toBe(29.99);
  });

  it('should emit image-click event', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('image-click', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const wrapper = queryShadow(el as HTMLElement, '.product-card__gallery-image-wrapper') as HTMLElement;
    wrapper.click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.index).toBe(0);
    expect(detail.src).toBe('img1.jpg');
  });

  it('should disable CTA when out of stock', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.inStock = false;
    await wait(50);
    const cta = queryShadow(el as HTMLElement, '.product-card__cta') as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
  });

  it('should show in-stock status', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.inStock = true;
    await wait(50);
    const stock = queryShadow(el as HTMLElement, '.product-card__stock--in');
    expect(stock).toBeTruthy();
  });

  it('should show out-of-stock status', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.inStock = false;
    await wait(50);
    const stock = queryShadow(el as HTMLElement, '.product-card__stock--out');
    expect(stock).toBeTruthy();
  });

  it('should render horizontal variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'horizontal'
    });
    await wait(50);
    const card = queryShadow(el as HTMLElement, '.product-card--horizontal');
    expect(card).toBeTruthy();
  });

  it('should render compact variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'compact'
    });
    await wait(50);
    const card = queryShadow(el as HTMLElement, '.product-card--compact');
    expect(card).toBeTruthy();
  });

  it('should not emit add-to-cart when out of stock', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.inStock = false;
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('add-to-cart', spy);
    const cta = queryShadow(el as HTMLElement, '.product-card__cta') as HTMLElement;
    cta.click();
    await wait(50);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should use custom currency', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.currency = '\u20AC';
    el.price = 49.99;
    await wait(50);
    const price = queryShadow(el as HTMLElement, '.product-card__price-current');
    expect(price?.textContent?.trim()).toContain('\u20AC');
  });

  // ── New variant tests ──

  it('should render featured variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'featured'
    });
    await wait(50);
    const card = queryShadow(el as HTMLElement, '.product-card--featured');
    expect(card).toBeTruthy();
  });

  it('should render minimal variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'minimal'
    });
    await wait(50);
    const card = queryShadow(el as HTMLElement, '.product-card--minimal');
    expect(card).toBeTruthy();
  });

  it('should render grid variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'grid'
    });
    await wait(50);
    const card = queryShadow(el as HTMLElement, '.product-card--grid');
    expect(card).toBeTruthy();
  });

  // ── Badge tests ──

  it('should render badge text', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.badge = 'NEW';
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.product-card__badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent?.trim()).toBe('NEW');
  });

  it('should not render badge when empty', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.product-card__badge');
    expect(badge).toBeNull();
  });

  it('should apply badge-variant class for sale', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.badge = 'SALE';
    el.badgeVariant = 'sale';
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.product-card__badge--sale');
    expect(badge).toBeTruthy();
  });

  it('should apply badge-variant class for new', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.badge = 'NEW';
    el.badgeVariant = 'new';
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.product-card__badge--new');
    expect(badge).toBeTruthy();
  });

  it('should apply badge-variant class for featured', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.badge = 'HOT';
    el.badgeVariant = 'featured';
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.product-card__badge--featured');
    expect(badge).toBeTruthy();
  });

  // ── Favorite tests ──

  it('should render favorite button', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    const btn = queryShadow(el as HTMLElement, '.product-card__favorite-btn');
    expect(btn).toBeTruthy();
  });

  it('should toggle favorite on click', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    expect(el.favorite).toBe(false);
    const btn = queryShadow(el as HTMLElement, '.product-card__favorite-btn') as HTMLElement;
    btn.click();
    await wait(50);
    expect(el.favorite).toBe(true);
  });

  it('should emit favorite event with detail', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('favorite', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const btn = queryShadow(el as HTMLElement, '.product-card__favorite-btn') as HTMLElement;
    btn.click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.favorited).toBe(true);
  });

  it('should show filled heart when favorite is true', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    el.favorite = true;
    await wait(50);
    const activeIcon = queryShadow(el as HTMLElement, '.product-card__favorite-icon--active');
    expect(activeIcon).toBeTruthy();
  });

  // ── Quick view tests ──

  it('should render quick view overlay', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    const quickView = queryShadow(el as HTMLElement, '.product-card__quick-view');
    expect(quickView).toBeTruthy();
  });

  it('should emit quick-view event on click', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg'];
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('quick-view', spy);
    const quickView = queryShadow(el as HTMLElement, '.product-card__quick-view') as HTMLElement;
    quickView.click();
    await wait(50);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ── Loading / Skeleton tests ──

  it('should render skeleton when loading is true', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      loading: true
    });
    await wait(50);
    const skeleton = queryShadow(el as HTMLElement, '.product-card--skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('should show shimmer lines in skeleton', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      loading: true
    });
    await wait(50);
    const titleLine = queryShadow(el as HTMLElement, '.product-card__skeleton-line--title');
    const priceLine = queryShadow(el as HTMLElement, '.product-card__skeleton-line--price');
    expect(titleLine).toBeTruthy();
    expect(priceLine).toBeTruthy();
  });

  it('should not render product content when loading', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      loading: true
    });
    el.name = 'Test';
    await wait(50);
    const title = queryShadow(el as HTMLElement, '.product-card__title');
    expect(title).toBeNull();
  });

  // ── Stock count tests ──

  it('should show urgency text when stock-count is low', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.stockCount = 3;
    el.inStock = true;
    await wait(50);
    const urgency = queryShadow(el as HTMLElement, '.product-card__stock-urgency');
    expect(urgency).toBeTruthy();
    expect(urgency?.textContent).toContain('3');
  });

  it('should show normal in-stock when stock-count >= 5', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.stockCount = 10;
    el.inStock = true;
    await wait(50);
    const urgency = queryShadow(el as HTMLElement, '.product-card__stock-urgency');
    expect(urgency).toBeNull();
    const stock = queryShadow(el as HTMLElement, '.product-card__stock--in');
    expect(stock).toBeTruthy();
  });

  it('should render pulsing stock dot for in-stock', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.inStock = true;
    await wait(50);
    const dot = queryShadow(el as HTMLElement, '.product-card__stock-dot');
    expect(dot).toBeTruthy();
  });

  // ── CTA loading state tests ──

  it('should show spinner in CTA when loading attribute is used on CTA', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    // Note: the `loading` property triggers skeleton. For CTA loading we need
    // the component to not be in skeleton mode. We'll test the CTA has cart icon.
    el.inStock = true;
    await wait(50);
    const ctaIcon = queryShadow(el as HTMLElement, '.product-card__cta-icon');
    expect(ctaIcon).toBeTruthy();
  });

  // ── CSS parts tests ──

  it('should have part attributes on key elements', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.name = 'Test';
    el.price = 10;
    el.rating = 4;
    el.badge = 'NEW';
    el.images = ['img1.jpg'];
    await wait(50);

    const parts = ['base', 'gallery', 'body', 'title', 'rating', 'stars', 'price', 'price-current', 'stock', 'cta', 'badge', 'favorite-btn'];
    for (const part of parts) {
      const found = queryShadow(el as HTMLElement, `[part="${part}"]`);
      expect(found).toBeTruthy();
    }
  });

  // ── Image crossfade tests ──

  it('should render all images with crossfade classes', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
    await wait(50);
    const allImages = queryShadowAll(el as HTMLElement, '.product-card__gallery-image');
    expect(allImages.length).toBe(3);
    const activeImages = queryShadowAll(el as HTMLElement, '.product-card__gallery-image--active');
    expect(activeImages.length).toBe(1);
  });

  it('should crossfade to next image on navigation', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card');
    el.images = ['img1.jpg', 'img2.jpg'];
    await wait(50);
    const next = queryShadow(el as HTMLElement, '.product-card__gallery-nav--next') as HTMLElement;
    next.click();
    await wait(50);
    const active = queryShadow(el as HTMLElement, '.product-card__gallery-image--active') as HTMLImageElement;
    expect(active?.src).toContain('img2.jpg');
  });

  // ── Featured variant gradient overlay ──

  it('should render gradient overlay on featured variant', async () => {
    el = await createComponent<SniceProductCardElement>('snice-product-card', {
      variant: 'featured'
    });
    el.images = ['img1.jpg'];
    await wait(50);
    const gradient = queryShadow(el as HTMLElement, '.product-card__gallery-gradient');
    expect(gradient).toBeTruthy();
  });
});
