import { element, property, query, dispatch, watch, render, styles, html, css } from 'snice';
import cssContent from './snice-cart.css?inline';
import type {
  SniceCartElement,
  CartItem,
  ItemAddDetail,
  ItemRemoveDetail,
  QuantityChangeDetail,
  CouponApplyDetail,
  CheckoutDetail
} from './snice-cart.types';

@element('snice-cart')
export class SniceCart extends HTMLElement implements SniceCartElement {
  @property({ type: Array, attribute: false })
  items: CartItem[] = [];

  @property()
  currency = '$';

  @property({ type: Number, attribute: 'tax-rate' })
  taxRate = 0;

  @property({ type: Number })
  discount = 0;

  @property({ attribute: 'coupon-code' })
  couponCode = '';

  @property({ attribute: false })
  private couponInput = '';

  @query('.cart__coupon-input')
  private couponInputEl?: HTMLInputElement;

  addItem(item: CartItem) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      this.updateQuantity(item.id, existing.quantity + (item.quantity || 1));
    } else {
      this.items = [...this.items, { ...item, quantity: item.quantity || 1 }];
      this.emitItemAdd({ item });
    }
  }

  removeItem(id: string) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    this.items = this.items.filter(i => i.id !== id);
    this.emitItemRemove({ item });
  }

  updateQuantity(id: string, qty: number) {
    if (qty <= 0) {
      this.removeItem(id);
      return;
    }
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    const previousQuantity = item.quantity;
    this.items = this.items.map(i =>
      i.id === id ? { ...i, quantity: qty } : i
    );
    this.emitQuantityChange({ item: { ...item, quantity: qty }, previousQuantity, newQuantity: qty });
  }

  applyCoupon(code: string) {
    this.couponCode = code;
    this.emitCouponApply({ code });
  }

  clear() {
    this.items = [];
  }

  private getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private getTax(): number {
    const subtotal = this.getSubtotal();
    const afterDiscount = subtotal - this.discount;
    return afterDiscount * (this.taxRate / 100);
  }

  private getTotal(): number {
    const subtotal = this.getSubtotal();
    const tax = this.getTax();
    return subtotal - this.discount + tax;
  }

  private getTotalItems(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  private formatPrice(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private handleDecrement(item: CartItem) {
    this.updateQuantity(item.id, item.quantity - 1);
  }

  private handleIncrement(item: CartItem) {
    this.updateQuantity(item.id, item.quantity + 1);
  }

  private handleRemove(item: CartItem) {
    this.removeItem(item.id);
  }

  private handleCouponInput(e: Event) {
    this.couponInput = (e.target as HTMLInputElement).value;
  }

  private handleApplyCoupon() {
    if (this.couponInput.trim()) {
      this.applyCoupon(this.couponInput.trim());
      this.couponInput = '';
    }
  }

  private handleCheckout() {
    this.emitCheckout({
      items: [...this.items],
      subtotal: this.getSubtotal(),
      discount: this.discount,
      tax: this.getTax(),
      total: this.getTotal()
    });
  }

  @dispatch('item-add', { bubbles: true, composed: true })
  private emitItemAdd(detail?: ItemAddDetail): ItemAddDetail {
    return detail!;
  }

  @dispatch('item-remove', { bubbles: true, composed: true })
  private emitItemRemove(detail?: ItemRemoveDetail): ItemRemoveDetail {
    return detail!;
  }

  @dispatch('quantity-change', { bubbles: true, composed: true })
  private emitQuantityChange(detail?: QuantityChangeDetail): QuantityChangeDetail {
    return detail!;
  }

  @dispatch('coupon-apply', { bubbles: true, composed: true })
  private emitCouponApply(detail?: CouponApplyDetail): CouponApplyDetail {
    return detail!;
  }

  @dispatch('checkout', { bubbles: true, composed: true })
  private emitCheckout(detail?: CheckoutDetail): CheckoutDetail {
    return detail!;
  }

  private renderItem(item: CartItem): unknown {
    const lineTotal = item.price * item.quantity;

    return html/*html*/`
      <li class="cart__item" part="item">
        <if ${item.image}>
          <img class="cart__item-image" src="${item.image}" alt="${item.name}" loading="lazy" />
        </if>
        <if ${!item.image}>
          <div class="cart__item-image-placeholder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
            </svg>
          </div>
        </if>
        <div class="cart__item-details">
          <h4 class="cart__item-name">${item.name}</h4>
          <if ${item.variant}>
            <span class="cart__item-variant">${item.variant}</span>
          </if>
          <span class="cart__item-price">${this.currency}${this.formatPrice(item.price)} each</span>
        </div>
        <div class="cart__item-actions">
          <div class="cart__qty">
            <button class="cart__qty-btn" @click=${() => this.handleDecrement(item)} aria-label="Decrease quantity">-</button>
            <span class="cart__qty-value">${item.quantity}</span>
            <button class="cart__qty-btn" @click=${() => this.handleIncrement(item)} aria-label="Increase quantity">+</button>
          </div>
          <span class="cart__item-total">${this.currency}${this.formatPrice(lineTotal)}</span>
          <button class="cart__item-remove" @click=${() => this.handleRemove(item)} aria-label="Remove ${item.name}">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </li>
    `;
  }

  @render()
  renderContent() {
    const isEmpty = this.items.length === 0;
    const subtotal = this.getSubtotal();
    const tax = this.getTax();
    const total = this.getTotal();
    const itemCount = this.getTotalItems();

    return html/*html*/`
      <div class="cart" part="base">
        <div class="cart__header" part="header">
          <h3 class="cart__title">Shopping Cart</h3>
          <span class="cart__count">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
        </div>

        <if ${isEmpty}>
          <div class="cart__empty" part="empty">
            Your cart is empty
          </div>
        </if>

        <if ${!isEmpty}>
          <ul class="cart__items" part="items">
            ${this.items.map((item: CartItem) => this.renderItem(item))}
          </ul>

          <div class="cart__coupon" part="coupon">
            <input class="cart__coupon-input"
                   type="text"
                   placeholder="Coupon code"
                   .value="${this.couponInput}"
                   @input=${(e: Event) => this.handleCouponInput(e)}
                   @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleApplyCoupon(); }} />
            <button class="cart__coupon-btn" @click=${() => this.handleApplyCoupon()}>Apply</button>
          </div>

          <div class="cart__summary" part="summary">
            <div class="cart__summary-row">
              <span class="cart__summary-label">Subtotal</span>
              <span class="cart__summary-value">${this.currency}${this.formatPrice(subtotal)}</span>
            </div>
            <if ${this.discount > 0}>
              <div class="cart__summary-row">
                <span class="cart__summary-label">Discount${this.couponCode ? ` (${this.couponCode})` : ''}</span>
                <span class="cart__summary-value cart__summary-value--discount">-${this.currency}${this.formatPrice(this.discount)}</span>
              </div>
            </if>
            <if ${this.taxRate > 0}>
              <div class="cart__summary-row">
                <span class="cart__summary-label">Tax (${this.taxRate}%)</span>
                <span class="cart__summary-value">${this.currency}${this.formatPrice(tax)}</span>
              </div>
            </if>
            <div class="cart__summary-divider"></div>
            <div class="cart__summary-row cart__summary-total">
              <span class="cart__summary-label">Total</span>
              <span class="cart__summary-value">${this.currency}${this.formatPrice(total)}</span>
            </div>
          </div>

          <div class="cart__checkout" part="checkout">
            <button class="cart__checkout-btn" @click=${() => this.handleCheckout()}>
              Checkout
            </button>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
