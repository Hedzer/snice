import { property, render, styles, html, css, ready, context, watch } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import type { Product, StoreAppContext } from '../types/store';
import { getProductById } from '../services/products';
import { addToCart, getCartTotal, getCartCount } from '../services/cart';

@page({
  tag: 'product-detail-page',
  routes: ['/products/:id'],
})
class ProductDetailPage extends HTMLElement {
  @property() id = '';
  @property({ type: Object }) product: Product | null = null;
  @property({ type: Number }) quantity = 1;
  @property({ type: Boolean }) loading = true;
  @property({ type: Boolean }) addedToCart = false;
  private ctx!: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @ready()
  load() {
    if (this.id) {
      this.product = getProductById(this.id) ?? null;
      this.loading = false;
    }
  }

  @watch('quantity')
  onQuantityChange(_old: number, val: number) {
    if (val < 1) this.quantity = 1;
    if (val > 99) this.quantity = 99;
  }

  private handleAddToCart() {
    if (this.product) {
      const app = this.ctx.application as StoreAppContext;
      app.cart = addToCart(app.cart, this.product, this.quantity);
      app.cartTotal = getCartTotal(app.cart);
      app.cartCount = getCartCount(app.cart);
      this.ctx.update();
      this.addedToCart = true;
      setTimeout(() => { this.addedToCart = false; }, 2000);
    }
  }

  @render()
  template() {
    const isLoading = this.loading;
    const hasProduct = !isLoading && this.product !== null;
    const notFound = !isLoading && this.product === null;
    const p = this.product;
    const stars = p ? '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating)) : '';

    return html`
      <div class="detail">
        <if ${isLoading}>
          <div class="loading">
            <div class="skeleton-img"></div>
            <div class="skeleton-info">
              <div class="skeleton-line wide"></div>
              <div class="skeleton-line medium"></div>
              <div class="skeleton-line narrow"></div>
            </div>
          </div>
        </if>
        <if ${notFound}>
          <div class="not-found">
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist.</p>
            <a href="/#/products" class="back-link">Back to Products</a>
          </div>
        </if>
        <if ${hasProduct}>
          <a href="/#/products" class="back-nav">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Products
          </a>
          <div class="product-layout">
            <div class="image-section">
              <img src="${p!.image}" alt="${p!.name}" />
            </div>
            <div class="info-section">
              <span class="category">${p!.category}</span>
              <h1>${p!.name}</h1>
              <div class="rating">
                <span class="stars">${stars}</span>
                <span class="rating-num">${p!.rating}</span>
                <span class="review-count">(${p!.reviews} reviews)</span>
              </div>
              <p class="price">$${p!.price.toFixed(2)}</p>
              <p class="description">${p!.description}</p>
              <div class="tags">
                ${p!.tags.map(tag => html`<span key=${tag} class="tag">${tag}</span>`)}
              </div>
              <if ${p!.inStock}>
                <div class="actions">
                  <div class="quantity-picker">
                    <button @click=${() => this.quantity--}>-</button>
                    <span>${this.quantity}</span>
                    <button @click=${() => this.quantity++}>+</button>
                  </div>
                  <button class="add-btn ${this.addedToCart ? 'added' : ''}" @click=${() => this.handleAddToCart()}>
                    <if ${this.addedToCart}>Added!</if>
                    <if ${!this.addedToCart}>Add to Cart</if>
                  </button>
                </div>
              </if>
              <if ${!p!.inStock}>
                <div class="out-of-stock">
                  <span class="oos-badge">Out of Stock</span>
                  <p>This item is currently unavailable.</p>
                </div>
              </if>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  detailStyles() {
    return css`
      :host {
        display: block;
      }
      .back-nav {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: var(--snice-font-weight-medium, 500);
        margin-bottom: 1.5rem;
        transition: color 0.15s;
      }
      .back-nav:hover {
        color: var(--snice-color-primary, rgb(37 99 235));
      }
      .product-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: start;
      }
      .image-section {
        position: sticky;
        top: 6rem;
      }
      .image-section img {
        width: 100%;
        border-radius: 16px;
        aspect-ratio: 1;
        object-fit: cover;
      }
      .info-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .category {
        font-size: 0.8125rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--snice-color-primary, rgb(37 99 235));
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      h1 {
        margin: 0;
        font-size: 2rem;
        font-weight: var(--snice-font-weight-bold, 700);
        line-height: 1.2;
      }
      .rating {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9375rem;
      }
      .stars { color: #f59e0b; letter-spacing: 1px; }
      .rating-num { font-weight: var(--snice-font-weight-semibold, 600); }
      .review-count { color: var(--snice-color-text-tertiary, rgb(115 115 115)); }
      .price {
        font-size: 2rem;
        font-weight: var(--snice-font-weight-bold, 700);
        color: var(--snice-color-text, rgb(23 23 23));
        margin: 0.5rem 0;
      }
      .description {
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        line-height: 1.7;
        margin: 0;
      }
      .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .tag {
        padding: 0.25rem 0.75rem;
        background: var(--snice-color-background-element, rgb(252 251 249));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 9999px;
        font-size: 0.75rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
      }
      .quantity-picker {
        display: flex;
        align-items: center;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 10px;
        overflow: hidden;
      }
      .quantity-picker button {
        width: 2.5rem;
        height: 2.5rem;
        border: none;
        background: var(--snice-color-background, rgb(255 255 255));
        font-size: 1.125rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s;
      }
      .quantity-picker button:hover {
        background: var(--snice-color-background-element, rgb(252 251 249));
      }
      .quantity-picker span {
        min-width: 2.5rem;
        text-align: center;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .add-btn {
        flex: 1;
        padding: 0.75rem 2rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
        font-family: inherit;
      }
      .add-btn:hover { background: rgb(29 78 216); }
      .add-btn:active { transform: scale(0.98); }
      .add-btn.added {
        background: var(--snice-color-success, rgb(22 163 74));
      }
      .out-of-stock {
        margin-top: 1rem;
      }
      .oos-badge {
        display: inline-block;
        padding: 0.375rem 1rem;
        background: rgb(254 226 226);
        color: var(--snice-color-danger, rgb(220 38 38));
        border-radius: 8px;
        font-weight: var(--snice-font-weight-semibold, 600);
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      .out-of-stock p {
        margin: 0;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .not-found {
        text-align: center;
        padding: 4rem 2rem;
      }
      .not-found h2 { margin: 0 0 0.5rem 0; }
      .not-found p { color: var(--snice-color-text-secondary, rgb(82 82 82)); margin: 0 0 1.5rem 0; }
      .back-link {
        display: inline-block;
        padding: 0.5rem 1.5rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: var(--snice-font-weight-medium, 500);
      }
      .loading {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
      }
      .skeleton-img {
        aspect-ratio: 1;
        background: #f0f0f0;
        border-radius: 16px;
        animation: shimmer 1.5s infinite;
        background: linear-gradient(135deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
      }
      .skeleton-info { display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem; }
      .skeleton-line {
        height: 1.5rem;
        background: linear-gradient(135deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
      }
      .skeleton-line.wide { width: 80%; }
      .skeleton-line.medium { width: 50%; }
      .skeleton-line.narrow { width: 30%; }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (max-width: 768px) {
        .product-layout {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        .image-section { position: static; }
        .loading { grid-template-columns: 1fr; }
        h1 { font-size: 1.5rem; }
        .price { font-size: 1.5rem; }
      }
    `;
  }
}

export { ProductDetailPage };
