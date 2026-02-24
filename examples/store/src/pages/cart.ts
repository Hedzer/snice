import { property, render, styles, html, css, context, ready } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import type { StoreAppContext, CartItem } from '../types/store';
import { removeFromCart, updateQuantity, getCartTotal, getCartCount } from '../services/cart';

@page({
  tag: 'cart-page',
  routes: ['/cart'],
  placard: { name: 'cart', title: 'Cart', icon: 'shopping-cart', order: 2 },
})
class CartPage extends HTMLElement {
  @property({ type: Array }) items: CartItem[] = [];
  @property({ type: Number }) total = 0;
  @property({ type: Number }) count = 0;
  private ctx!: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as StoreAppContext;
    this.items = app.cart;
    this.total = app.cartTotal;
    this.count = app.cartCount;
  }

  @ready()
  load() {
    const app = this.ctx?.application as StoreAppContext | undefined;
    if (app) {
      this.items = app.cart;
      this.total = app.cartTotal;
      this.count = app.cartCount;
    }
  }

  private updateCartState() {
    const app = this.ctx.application as StoreAppContext;
    app.cartTotal = getCartTotal(app.cart);
    app.cartCount = getCartCount(app.cart);
    this.items = app.cart;
    this.total = app.cartTotal;
    this.count = app.cartCount;
    this.ctx.update();
  }

  private handleQuantityChange(e: CustomEvent) {
    const { productId, quantity } = e.detail;
    const app = this.ctx.application as StoreAppContext;
    app.cart = updateQuantity(app.cart, productId, quantity);
    this.updateCartState();
  }

  private handleRemoveItem(e: CustomEvent) {
    const { productId } = e.detail;
    const app = this.ctx.application as StoreAppContext;
    app.cart = removeFromCart(app.cart, productId);
    this.updateCartState();
  }

  @render()
  template() {
    const hasItems = this.items.length > 0;
    const isEmpty = this.items.length === 0;
    const shipping = this.total > 50 ? 0 : 9.99;
    const orderTotal = this.total + shipping;
    return html`
      <div class="cart-page">
        <h1>Shopping Cart</h1>

        <if ${isEmpty}>
          <div class="empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <a href="/#/products" class="shop-link">Start Shopping</a>
          </div>
        </if>

        <if ${hasItems}>
          <div class="cart-layout">
            <div class="cart-items">
              ${this.items.map(item => html`
                <cart-item-row
                  key=${item.product.id}
                  productId="${item.product.id}"
                  name="${item.product.name}"
                  image="${item.product.image}"
                  .price=${item.product.price}
                  .quantity=${item.quantity}
                  @quantity-change=${(e: CustomEvent) => this.handleQuantityChange(e)}
                  @remove-item=${(e: CustomEvent) => this.handleRemoveItem(e)}
                ></cart-item-row>
              `)}
            </div>
            <div class="order-summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal (${this.count} items)</span>
                <span>$${this.total.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span>
              </div>
              <if ${shipping > 0}>
                <p class="free-shipping-hint">Add $${(50 - this.total).toFixed(2)} more for free shipping</p>
              </if>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Total</span>
                <span>$${orderTotal.toFixed(2)}</span>
              </div>
              <a href="/#/checkout" class="checkout-btn">Proceed to Checkout</a>
              <a href="/#/products" class="continue-shopping">Continue Shopping</a>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  cartStyles() {
    return css`
      :host {
        display: block;
      }
      h1 {
        margin: 0 0 1.5rem 0;
        font-size: 1.75rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 4rem 2rem;
        text-align: center;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .empty h2 {
        margin: 0.5rem 0 0;
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .empty p { margin: 0; }
      .shop-link {
        display: inline-block;
        margin-top: 0.5rem;
        padding: 0.75rem 2rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        text-decoration: none;
        border-radius: 10px;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .shop-link:hover { background: rgb(29 78 216); }
      .cart-layout {
        display: grid;
        grid-template-columns: 1fr 22rem;
        gap: 2rem;
        align-items: start;
      }
      .cart-items {
        background: var(--snice-color-background, rgb(255 255 255));
        border-radius: 12px;
        padding: 0 1.5rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
      }
      .order-summary {
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 12px;
        padding: 1.5rem;
        position: sticky;
        top: 6rem;
      }
      .order-summary h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.9375rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .summary-row.total {
        font-size: 1.125rem;
        font-weight: var(--snice-font-weight-bold, 700);
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .summary-divider {
        border-top: 1px solid var(--snice-color-border, rgb(226 226 226));
        margin: 0.75rem 0;
      }
      .free-shipping-hint {
        font-size: 0.8125rem;
        color: var(--snice-color-primary, rgb(37 99 235));
        margin: 0.25rem 0 0;
      }
      .checkout-btn {
        display: block;
        text-align: center;
        margin-top: 1.25rem;
        padding: 0.75rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        text-decoration: none;
        border-radius: 10px;
        font-weight: var(--snice-font-weight-semibold, 600);
        font-size: 0.9375rem;
        transition: background 0.15s;
      }
      .checkout-btn:hover { background: rgb(29 78 216); }
      .continue-shopping {
        display: block;
        text-align: center;
        margin-top: 0.75rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        text-decoration: none;
        font-size: 0.875rem;
      }
      .continue-shopping:hover { color: var(--snice-color-primary, rgb(37 99 235)); }

      @media (max-width: 768px) {
        .cart-layout {
          grid-template-columns: 1fr;
        }
        .order-summary { position: static; }
      }
    `;
  }
}

export { CartPage };
