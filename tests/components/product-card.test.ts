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
    const img = queryShadow(el as HTMLElement, '.product-card__gallery-image') as HTMLImageElement;
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
    const img = queryShadow(el as HTMLElement, '.product-card__gallery-image') as HTMLImageElement;
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
    const gallery = queryShadow(el as HTMLElement, '.product-card__gallery') as HTMLElement;
    gallery.click();
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
});
