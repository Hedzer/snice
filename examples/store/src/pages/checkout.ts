import { property, render, styles, html, css, context, ready } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import { isAuthenticated } from '../guards/auth';
import type { StoreAppContext, CartItem, CheckoutForm } from '../types/store';
import { saveCart } from '../services/cart';

@page({
  tag: 'checkout-page',
  routes: ['/checkout'],
  guards: [isAuthenticated],
})
class CheckoutPage extends HTMLElement {
  @property({ type: Array }) items: CartItem[] = [];
  @property({ type: Number }) total = 0;
  @property({ type: Boolean }) orderPlaced = false;
  @property() orderId = '';
  @property() userName = '';
  @property() userEmail = '';
  private ctx!: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as StoreAppContext;
    this.items = app.cart;
    this.total = app.cartTotal;
    this.userName = app.user?.name ?? '';
    this.userEmail = app.user?.email ?? '';
  }

  @ready()
  load() {
    if (this.items.length === 0 && !this.orderPlaced) {
      window.location.hash = '#/cart';
    }
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const formData = Object.fromEntries(data.entries()) as unknown as CheckoutForm;
    console.log('Checkout submitted:', formData);

    this.orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    this.orderPlaced = true;

    const app = this.ctx.application as StoreAppContext;
    app.cart = [];
    app.cartTotal = 0;
    app.cartCount = 0;
    saveCart([]);
    this.ctx.update();
  }

  @render()
  template() {
    const hasItems = this.items.length > 0 && !this.orderPlaced;
    const isConfirmed = this.orderPlaced;
    const shipping = this.total > 50 ? 0 : 9.99;
    const orderTotal = this.total + shipping;

    return html`
      <div class="checkout-page">
        <if ${isConfirmed}>
          <div class="confirmation">
            <div class="check-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1>Order Confirmed!</h1>
            <p class="order-id">Order #${this.orderId}</p>
            <p class="confirm-msg">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
            <a href="/#/" class="home-link">Continue Shopping</a>
          </div>
        </if>

        <if ${hasItems}>
          <h1>Checkout</h1>
          <div class="checkout-layout">
            <div class="form-section">
              <form @submit=${(e: Event) => this.handleFormSubmit(e)}>
                <h2>Shipping Information</h2>
                <div class="form-row">
                  <div class="field">
                    <label>First Name</label>
                    <input type="text" name="firstName" .value=${this.userName} required />
                  </div>
                  <div class="field">
                    <label>Last Name</label>
                    <input type="text" name="lastName" required />
                  </div>
                </div>
                <div class="field">
                  <label>Email</label>
                  <input type="email" name="email" .value=${this.userEmail} required />
                </div>
                <div class="field">
                  <label>Address</label>
                  <input type="text" name="address" placeholder="123 Main St" required />
                </div>
                <div class="form-row">
                  <div class="field">
                    <label>City</label>
                    <input type="text" name="city" required />
                  </div>
                  <div class="field">
                    <label>ZIP Code</label>
                    <input type="text" name="zip" pattern="[0-9]{5}" placeholder="12345" required />
                  </div>
                </div>

                <h2>Payment</h2>
                <div class="field">
                  <label>Card Number</label>
                  <input type="text" name="cardNumber" placeholder="4242 4242 4242 4242" required />
                </div>
                <div class="form-row">
                  <div class="field">
                    <label>Expiry</label>
                    <input type="text" name="expiry" placeholder="MM/YY" required />
                  </div>
                  <div class="field">
                    <label>CVV</label>
                    <input type="text" name="cvv" placeholder="123" required />
                  </div>
                </div>
                <button type="submit" class="place-order-btn">Place Order - $${orderTotal.toFixed(2)}</button>
              </form>
            </div>

            <div class="summary-section">
              <h3>Order Summary</h3>
              <div class="summary-items">
                ${this.items.map(item => html`
                  <div key=${item.product.id} class="summary-item">
                    <img src="${item.product.image}" alt="${item.product.name}" />
                    <div class="summary-item-info">
                      <span class="summary-item-name">${item.product.name}</span>
                      <span class="summary-item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <span class="summary-item-price">$${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                `)}
              </div>
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>$${this.total.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>Shipping</span>
                  <span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
                </div>
                <div class="divider"></div>
                <div class="summary-row total">
                  <span>Total</span>
                  <span>$${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  checkoutStyles() {
    return css`
      :host {
        display: block;
      }
      h1 {
        margin: 0 0 1.5rem;
        font-size: 1.75rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      h2 {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      h2:not(:first-of-type) {
        margin-top: 1.5rem;
      }
      .checkout-layout {
        display: grid;
        grid-template-columns: 1fr 22rem;
        gap: 2rem;
        align-items: start;
      }
      .form-section {
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 12px;
        padding: 1.5rem;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      label {
        font-size: 0.8125rem;
        font-weight: var(--snice-font-weight-medium, 500);
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      input {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 8px;
        font-size: 0.9375rem;
        font-family: inherit;
        color: var(--snice-color-text, rgb(23 23 23));
        transition: border-color 0.15s;
      }
      input:focus {
        outline: none;
        border-color: var(--snice-color-primary, rgb(37 99 235));
        box-shadow: 0 0 0 3px var(--snice-focus-ring-color, rgb(59 130 246 / 0.5));
      }
      input.invalid {
        border-color: var(--snice-color-danger, rgb(220 38 38));
      }
      input::placeholder {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .place-order-btn {
        margin-top: 1rem;
        padding: 0.875rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        cursor: pointer;
        transition: background 0.15s;
        font-family: inherit;
      }
      .place-order-btn:hover { background: rgb(29 78 216); }
      .summary-section {
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 12px;
        padding: 1.5rem;
        position: sticky;
        top: 6rem;
      }
      h3 {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .summary-items {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .summary-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .summary-item img {
        width: 3rem;
        height: 3rem;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
      }
      .summary-item-info {
        flex: 1;
        min-width: 0;
      }
      .summary-item-name {
        display: block;
        font-size: 0.8125rem;
        font-weight: var(--snice-font-weight-medium, 500);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .summary-item-qty {
        font-size: 0.75rem;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .summary-item-price {
        font-size: 0.875rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        flex-shrink: 0;
      }
      .summary-totals {
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        padding-top: 0.75rem;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.375rem 0;
        font-size: 0.875rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .summary-row.total {
        font-size: 1rem;
        font-weight: var(--snice-font-weight-bold, 700);
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .divider {
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        margin: 0.5rem 0;
      }

      .confirmation {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 4rem 2rem;
      }
      .check-icon {
        color: var(--snice-color-success, rgb(22 163 74));
        margin-bottom: 1rem;
      }
      .confirmation h1 {
        margin: 0 0 0.5rem;
      }
      .order-id {
        font-size: 0.9375rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        margin: 0 0 0.75rem;
        font-weight: var(--snice-font-weight-medium, 500);
      }
      .confirm-msg {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        margin: 0 0 1.5rem;
        max-width: 28rem;
      }
      .home-link {
        padding: 0.75rem 2rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        text-decoration: none;
        border-radius: 10px;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .home-link:hover { background: rgb(29 78 216); }

      @media (max-width: 768px) {
        .checkout-layout {
          grid-template-columns: 1fr;
        }
        .summary-section { position: static; }
        .form-row { grid-template-columns: 1fr; }
      }
    `;
  }
}

export { CheckoutPage };
