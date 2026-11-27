import { element, property, query, dispatch, watch, render, styles, html, css } from 'snice';
import cssContent from './snice-cart.css?inline';
// The template renders these as child elements; importing them here keeps the
// documented single-import usage (`import 'snice/components/cart/snice-cart'`)
// from leaving the controls inert.
import '../button/snice-button';
import '../step-input/snice-step-input';
import '../input/snice-input';
import '../divider/snice-divider';
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

  private handleRemove(item: CartItem) {
    this.removeItem(item.id);
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
          <img class="cart__item-image" part="item-image" src="${item.image}" alt="${item.name}" loading="lazy" />
        </if>
        <if ${!item.image}>
          <div class="cart__item-image-placeholder" part="item-image-placeholder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" part="item-image-icon">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
            </svg>
          </div>
        </if>
        <div class="cart__item-body" part="item-body">
          <div class="cart__item-header" part="item-header">
            <div class="cart__item-details" part="item-details">
              <h4 class="cart__item-name" part="item-name">${item.name}</h4>
              <if ${item.variant}>
                <span class="cart__item-variant" part="item-variant">${item.variant}</span>
              </if>
              <span class="cart__item-price" part="item-price">${this.currency}${this.formatPrice(item.price)} each</span>
            </div>
            <snice-button size="small" variant="text" circle icon="x-mark" part="remove-button" exportparts="base: remove-button-base, spinner: remove-button-spinner, label: remove-button-label, icon: remove-button-icon, icon-start: remove-button-icon-start, icon-end: remove-button-icon-end, base-loading: remove-button-base-loading, base-disabled: remove-button-base-disabled" @button-click=${() => this.handleRemove(item)} aria-label="Remove ${item.name}"></snice-button>
          </div>
          <div class="cart__item-actions" part="item-actions">
            <snice-step-input
              class="cart__qty"
              part="quantity"
              exportparts="base: quantity-base, base-invalid: quantity-base-invalid, decrement-button: quantity-decrement-button, increment-button: quantity-increment-button, button: quantity-button, icon: quantity-icon, decrement-icon: quantity-decrement-icon, increment-icon: quantity-increment-icon, input: quantity-input"
              size="small"
              min="1"
              step="1"
              value="${item.quantity}"
              @value-change=${(e: CustomEvent) => this.updateQuantity(item.id, e.detail.value)}
            ></snice-step-input>
            <span class="cart__item-total" part="item-total">${this.currency}${this.formatPrice(lineTotal)}</span>
          </div>
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
          <h3 class="cart__title" part="title">Shopping Cart</h3>
          <span class="cart__count" part="count">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
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
            <snice-input
              class="cart__coupon-input"
              part="coupon-input"
              exportparts="base: coupon-input-base, wrapper: coupon-input-wrapper, label: coupon-input-label, container: coupon-input-container, input: coupon-input-input, prefix-icon: coupon-input-prefix-icon, suffix-icon: coupon-input-suffix-icon, clear: coupon-input-clear, clear-icon: coupon-input-clear-icon, spinner: coupon-input-spinner, password-toggle: coupon-input-password-toggle, password-icon: coupon-input-password-icon, helper-text: coupon-input-helper-text, error-text: coupon-input-error-text, label-required: coupon-input-label-required, input-invalid: coupon-input-input-invalid, input-loading: coupon-input-input-loading, input-clearable: coupon-input-input-clearable, clear-with-suffix: coupon-input-clear-with-suffix, password-icon-hidden: coupon-input-password-icon-hidden, password-icon-visible: coupon-input-password-icon-visible"
              size="small"
              placeholder="Coupon code"
              .value="${this.couponInput}"
              @input-input=${(e: CustomEvent) => { this.couponInput = e.detail.value; }}
              @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleApplyCoupon(); }}
            ></snice-input>
            <snice-button size="small" outline part="apply-button" exportparts="base: apply-button-base, spinner: apply-button-spinner, label: apply-button-label, icon: apply-button-icon, icon-start: apply-button-icon-start, icon-end: apply-button-icon-end, base-loading: apply-button-base-loading, base-disabled: apply-button-base-disabled" @button-click=${() => this.handleApplyCoupon()}>Apply</snice-button>
          </div>

          <div class="cart__summary" part="summary">
            <div class="cart__summary-row" part="summary-row">
              <span class="cart__summary-label" part="summary-label">Subtotal</span>
              <span class="cart__summary-value" part="summary-value">${this.currency}${this.formatPrice(subtotal)}</span>
            </div>
            <if ${this.discount > 0}>
              <div class="cart__summary-row" part="summary-row">
                <span class="cart__summary-label" part="summary-label">Discount${this.couponCode ? ` (${this.couponCode})` : ''}</span>
                <span class="cart__summary-value cart__summary-value--discount" part="summary-value summary-value-discount">-${this.currency}${this.formatPrice(this.discount)}</span>
              </div>
            </if>
            <if ${this.taxRate > 0}>
              <div class="cart__summary-row" part="summary-row">
                <span class="cart__summary-label" part="summary-label">Tax (${this.taxRate}%)</span>
                <span class="cart__summary-value" part="summary-value">${this.currency}${this.formatPrice(tax)}</span>
              </div>
            </if>
            <snice-divider spacing="small" part="divider" exportparts="base: divider-base, line: divider-line, line-before: divider-line-before, line-after: divider-line-after, text: divider-text"></snice-divider>
            <div class="cart__summary-row cart__summary-total" part="summary-row summary-row-total">
              <span class="cart__summary-label" part="summary-label">Total</span>
              <span class="cart__summary-value" part="summary-value">${this.currency}${this.formatPrice(total)}</span>
            </div>
          </div>

          <div class="cart__checkout" part="checkout">
            <snice-button variant="primary" style="width:100%" part="checkout-button" exportparts="base: checkout-button-base, spinner: checkout-button-spinner, label: checkout-button-label, icon: checkout-button-icon, icon-start: checkout-button-icon-start, icon-end: checkout-button-icon-end, base-loading: checkout-button-base-loading, base-disabled: checkout-button-base-disabled" @button-click=${() => this.handleCheckout()}>
              Checkout
            </snice-button>
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
