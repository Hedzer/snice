import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/cart/snice-cart';
import type { SniceCartElement, CartItem } from '../../components/cart/snice-cart.types';

const sampleItems: CartItem[] = [
  { id: '1', name: 'Running Shoes', price: 89.99, quantity: 1, variant: 'Size: M' },
  { id: '2', name: 'Watch', price: 249.00, quantity: 1 },
  { id: '3', name: 'Earbuds', price: 59.99, quantity: 2 }
];

describe('snice-cart', () => {
  let el: SniceCartElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    expect(el.items).toEqual([]);
    expect(el.currency).toBe('$');
    expect(el.taxRate).toBe(0);
    expect(el.discount).toBe(0);
    expect(el.couponCode).toBe('');
  });

  it('should render empty state', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    await wait(50);
    const empty = queryShadow(el as HTMLElement, '.cart__empty');
    expect(empty).toBeTruthy();
  });

  it('should render cart items', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    await wait(50);
    const items = queryShadowAll(el as HTMLElement, '.cart__item');
    expect(items.length).toBe(3);
  });

  it('should render item names', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    await wait(50);
    const names = queryShadowAll(el as HTMLElement, '.cart__item-name');
    expect(names[0]?.textContent).toBe('Running Shoes');
    expect(names[1]?.textContent).toBe('Watch');
  });

  it('should render item quantities', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    await wait(50);
    const qtys = queryShadowAll(el as HTMLElement, 'snice-step-input.cart__qty');
    expect(qtys[0]?.getAttribute('value')).toBe('1');
    expect(qtys[2]?.getAttribute('value')).toBe('2');
  });

  it('should render item variant', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    await wait(50);
    const variant = queryShadow(el as HTMLElement, '.cart__item-variant');
    expect(variant).toBeTruthy();
    expect(variant?.textContent).toBe('Size: M');
  });

  it('should render header with item count', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    await wait(50);
    const count = queryShadow(el as HTMLElement, '.cart__count');
    expect(count?.textContent).toContain('4');
  });

  it('should render subtotal', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 2 }];
    await wait(50);
    const summaryValues = queryShadowAll(el as HTMLElement, '.cart__summary-value');
    // First value is subtotal
    expect(summaryValues[0]?.textContent?.trim()).toContain('20.00');
  });

  it('should render tax when tax rate is set', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 100.00, quantity: 1 }];
    el.taxRate = 10;
    await wait(50);
    const labels = queryShadowAll(el as HTMLElement, '.cart__summary-label');
    const hasTax = Array.from(labels).some(l => l.textContent?.includes('Tax'));
    expect(hasTax).toBe(true);
  });

  it('should render discount', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 100.00, quantity: 1 }];
    el.discount = 15;
    await wait(50);
    const discountValue = queryShadow(el as HTMLElement, '.cart__summary-value--discount');
    expect(discountValue).toBeTruthy();
    expect(discountValue?.textContent?.trim()).toContain('15.00');
  });

  it('should update quantity via increment', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('quantity-change', (e: Event) => {
      spy((e as CustomEvent).detail);
    });
    el.updateQuantity('1', 2);
    await wait(50);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].newQuantity).toBe(2);
  });

  it('should update quantity via decrement', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 3 }];
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('quantity-change', (e: Event) => {
      spy((e as CustomEvent).detail);
    });
    el.updateQuantity('1', 2);
    await wait(50);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].newQuantity).toBe(2);
  });

  it('should remove item when quantity decremented to 0', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('item-remove', spy);
    el.updateQuantity('1', 0);
    await wait(50);
    expect(spy).toHaveBeenCalled();
  });

  it('should remove item via remove button', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    await wait(50);
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('item-remove', spy);
    el.removeItem('1');
    await wait(50);
    expect(spy).toHaveBeenCalled();
  });

  it('should emit checkout event', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 2 }];
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('checkout', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const checkoutBtn = queryShadow(el as HTMLElement, '.cart__checkout snice-button') as HTMLElement;
    checkoutBtn.dispatchEvent(new CustomEvent('button-click', { bubbles: true, composed: true }));
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.items.length).toBe(1);
    expect(detail.subtotal).toBe(20);
    expect(detail.total).toBe(20);
  });

  it('should add item via addItem method', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    const spy = vi.fn();
    (el as HTMLElement).addEventListener('item-add', spy);
    el.addItem({ id: '1', name: 'New Item', price: 15.00, quantity: 1 });
    await wait(50);
    expect(el.items.length).toBe(1);
    expect(spy).toHaveBeenCalled();
  });

  it('should increment existing item via addItem', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    el.addItem({ id: '1', name: 'Test', price: 10.00, quantity: 1 });
    await wait(50);
    expect(el.items[0].quantity).toBe(2);
  });

  it('should clear all items', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = sampleItems;
    el.clear();
    await wait(50);
    expect(el.items.length).toBe(0);
  });

  it('should emit coupon-apply event', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('coupon-apply', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    el.applyCoupon('SAVE10');
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.code).toBe('SAVE10');
    expect(el.couponCode).toBe('SAVE10');
  });

  it('should use custom currency', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.currency = '\u20AC';
    el.items = [{ id: '1', name: 'Test', price: 10.00, quantity: 1 }];
    await wait(50);
    const price = queryShadow(el as HTMLElement, '.cart__item-price');
    expect(price?.textContent).toContain('\u20AC');
  });

  it('should calculate total with tax and discount', async () => {
    el = await createComponent<SniceCartElement>('snice-cart');
    el.items = [{ id: '1', name: 'Test', price: 100.00, quantity: 1 }];
    el.taxRate = 10;
    el.discount = 20;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('checkout', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const checkoutBtn = queryShadow(el as HTMLElement, '.cart__checkout snice-button') as HTMLElement;
    checkoutBtn.dispatchEvent(new CustomEvent('button-click', { bubbles: true, composed: true }));
    await wait(50);
    // subtotal=100, discount=20, after discount=80, tax=80*0.1=8, total=88
    expect(detail.subtotal).toBe(100);
    expect(detail.discount).toBe(20);
    expect(detail.tax).toBe(8);
    expect(detail.total).toBe(88);
  });
});
