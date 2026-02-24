import { property, render, styles, html, css, context, ready, dispose } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import type { StoreAppContext } from '../types/store';
import type { Product } from '../types/store';
import { getAllProducts, getCategories } from '../services/products';
import { addToCart, getCartTotal, getCartCount } from '../services/cart';

@page({
  tag: 'home-page',
  routes: ['/', '/home'],
  placard: { name: 'home', title: 'Home', icon: 'home', order: 0 },
})
class HomePage extends HTMLElement {
  @property({ type: Array }) featuredProducts: Product[] = [];
  @property({ type: Array }) categories: string[] = [];
  @property({ type: Boolean }) loading = true;
  @property() userName = '';
  private ctx!: Context;
  private heroInterval: ReturnType<typeof setInterval> | null = null;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
    const app = ctx.application as StoreAppContext;
    this.userName = app.user?.name ?? '';
  }

  @ready()
  load() {
    this.featuredProducts = getAllProducts().slice(0, 8);
    this.categories = getCategories();
    this.loading = false;
  }

  @dispose()
  cleanup() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  }

  private handleAddToCart(product: Product) {
    const app = this.ctx.application as StoreAppContext;
    app.cart = addToCart(app.cart, product, 1);
    app.cartTotal = getCartTotal(app.cart);
    app.cartCount = getCartCount(app.cart);
    this.ctx.update();
  }

  @render()
  template() {
    const isLoading = this.loading;
    const hasProducts = !isLoading && this.featuredProducts.length > 0;
    return html`
      <div class="home">
        <section class="hero">
          <div class="hero-content">
            <if ${this.userName !== ''}>
              <p class="hero-greeting">Welcome back, ${this.userName}</p>
            </if>
            <h1>Discover Quality Products</h1>
            <p class="hero-subtitle">Curated collection of premium items for your everyday needs</p>
            <a href="/#/products" class="hero-cta">Shop Now</a>
          </div>
        </section>

        <section class="categories">
          <h2>Shop by Category</h2>
          <div class="category-grid">
            ${this.categories.map(cat => html`
              <a key=${cat} href="/#/products?category=${cat}" class="category-card">
                <span class="category-name">${cat}</span>
              </a>
            `)}
          </div>
        </section>

        <section class="featured">
          <div class="section-header">
            <h2>Featured Products</h2>
            <a href="/#/products" class="see-all">See all</a>
          </div>
          <if ${isLoading}>
            <div class="loading-grid">
              ${[1, 2, 3, 4].map(i => html`<div key=${i} class="skeleton-card"></div>`)}
            </div>
          </if>
          <if ${hasProducts}>
            <div class="product-grid">
              ${this.featuredProducts.map(p => html`
                <product-card
                  key=${p.id}
                  productId="${p.id}"
                  name="${p.name}"
                  image="${p.image}"
                  .price=${p.price}
                  category="${p.category}"
                  .rating=${p.rating}
                  .reviews=${p.reviews}
                  ?inStock=${p.inStock}
                  @add-to-cart=${() => this.handleAddToCart(p)}
                ></product-card>
              `)}
            </div>
          </if>
        </section>
      </div>
    `;
  }

  @styles()
  homeStyles() {
    return css`
      :host {
        display: block;
      }
      .hero {
        background: linear-gradient(135deg, rgb(37 99 235) 0%, rgb(79 70 229) 100%);
        border-radius: 16px;
        padding: 3rem 2rem;
        margin-bottom: 3rem;
        color: white;
      }
      .hero-content {
        max-width: 36rem;
      }
      .hero-greeting {
        font-size: 0.875rem;
        opacity: 0.85;
        margin: 0 0 0.5rem 0;
      }
      .hero h1 {
        margin: 0 0 0.75rem 0;
        font-size: 2.25rem;
        font-weight: var(--snice-font-weight-bold, 700);
        line-height: 1.15;
      }
      .hero-subtitle {
        margin: 0 0 1.5rem 0;
        opacity: 0.85;
        font-size: 1.125rem;
        line-height: 1.5;
      }
      .hero-cta {
        display: inline-block;
        padding: 0.75rem 2rem;
        background: white;
        color: rgb(37 99 235);
        border-radius: 10px;
        font-weight: var(--snice-font-weight-semibold, 600);
        text-decoration: none;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .hero-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .categories {
        margin-bottom: 3rem;
      }
      .categories h2 {
        margin: 0 0 1.25rem 0;
        font-size: 1.5rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: 1rem;
      }
      .category-card {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 12px;
        text-decoration: none;
        color: var(--snice-color-text, rgb(23 23 23));
        font-weight: var(--snice-font-weight-semibold, 600);
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .category-card:hover {
        border-color: var(--snice-color-primary, rgb(37 99 235));
        box-shadow: 0 0 0 1px var(--snice-color-primary, rgb(37 99 235));
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .section-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      .see-all {
        color: var(--snice-color-primary, rgb(37 99 235));
        text-decoration: none;
        font-weight: var(--snice-font-weight-medium, 500);
        font-size: 0.875rem;
      }
      .see-all:hover {
        text-decoration: underline;
      }
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        gap: 1.5rem;
      }
      .loading-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        gap: 1.5rem;
      }
      .skeleton-card {
        aspect-ratio: 0.75;
        background: linear-gradient(135deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 12px;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (max-width: 640px) {
        .hero { padding: 2rem 1.25rem; }
        .hero h1 { font-size: 1.75rem; }
        .product-grid { grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); }
      }
    `;
  }
}

export { HomePage };
