import { property, render, styles, html, css, ready, context } from 'snice';
import type { Context } from 'snice';
import { page } from '../router';
import type { Product, StoreAppContext } from '../types/store';
import { getAllProducts, getCategories, getProductsByCategory, searchProducts } from '../services/products';
import { addToCart, getCartTotal, getCartCount } from '../services/cart';

@page({
  tag: 'products-page',
  routes: ['/products'],
  placard: { name: 'products', title: 'Products', icon: 'grid', order: 1 },
})
class ProductsPage extends HTMLElement {
  @property({ type: Array }) products: Product[] = [];
  @property({ type: Array }) categories: string[] = [];
  @property() activeCategory = '';
  @property() searchQuery = '';
  @property({ type: Boolean }) loading = true;
  private ctx!: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  private fetchProducts(opts: { category?: string; search?: string }): Product[] {
    if (opts.search) return searchProducts(opts.search);
    if (opts.category) return getProductsByCategory(opts.category);
    return getAllProducts();
  }

  @ready()
  load() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const category = params.get('category') || '';
    this.activeCategory = category;

    this.products = this.fetchProducts({ category });
    this.categories = getCategories();
    this.loading = false;
  }

  private filterByCategory(cat: string) {
    this.activeCategory = cat;
    this.products = this.fetchProducts({ category: cat });
  }

  private handleSearch(e: Event) {
    const query = (e.target as HTMLInputElement).value;
    this.searchQuery = query;
    if (query.length >= 2) {
      this.products = this.fetchProducts({ search: query });
    } else if (query.length === 0) {
      this.products = this.fetchProducts({ category: this.activeCategory });
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
    const hasProducts = !isLoading && this.products.length > 0;
    const isEmpty = !isLoading && this.products.length === 0;
    return html`
      <div class="products-page">
        <div class="page-header">
          <h1>Products</h1>
          <div class="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              .value=${this.searchQuery}
              @input=${(e: Event) => this.handleSearch(e)}
            />
          </div>
        </div>

        <div class="filters">
          <button
            class="filter-btn ${this.activeCategory === '' ? 'active' : ''}"
            @click=${() => this.filterByCategory('')}
          >All</button>
          ${this.categories.map(cat => html`
            <button
              key=${cat}
              class="filter-btn ${this.activeCategory === cat ? 'active' : ''}"
              @click=${() => this.filterByCategory(cat)}
            >${cat}</button>
          `)}
        </div>

        <if ${isLoading}>
          <div class="product-grid">
            ${[1, 2, 3, 4, 5, 6].map(i => html`<div key=${i} class="skeleton-card"></div>`)}
          </div>
        </if>
        <if ${hasProducts}>
          <div class="product-grid">
            ${this.products.map(p => html`
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
        <if ${isEmpty}>
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <h3>No products found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  pageStyles() {
    return css`
      :host {
        display: block;
      }
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: var(--snice-font-weight-bold, 700);
      }
      .search-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 10px;
        min-width: 16rem;
        transition: border-color 0.15s;
      }
      .search-bar:focus-within {
        border-color: var(--snice-color-primary, rgb(37 99 235));
        box-shadow: 0 0 0 3px var(--snice-focus-ring-color, rgb(59 130 246 / 0.5));
      }
      .search-bar svg {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        flex-shrink: 0;
      }
      .search-bar input {
        border: none;
        background: none;
        outline: none;
        font-size: 0.875rem;
        color: var(--snice-color-text, rgb(23 23 23));
        width: 100%;
        font-family: inherit;
      }
      .search-bar input::placeholder {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 9999px;
        background: var(--snice-color-background, rgb(255 255 255));
        color: var(--snice-color-text-secondary, rgb(82 82 82));
        font-size: 0.8125rem;
        font-weight: var(--snice-font-weight-medium, 500);
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .filter-btn:hover {
        border-color: var(--snice-color-primary, rgb(37 99 235));
        color: var(--snice-color-primary, rgb(37 99 235));
      }
      .filter-btn.active {
        background: var(--snice-color-primary, rgb(37 99 235));
        border-color: var(--snice-color-primary, rgb(37 99 235));
        color: white;
      }
      .product-grid {
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
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 4rem 2rem;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .empty-state h3 {
        margin: 0;
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .empty-state p { margin: 0; }

      @media (max-width: 640px) {
        .page-header { flex-direction: column; align-items: stretch; }
        .search-bar { min-width: 0; }
        .product-grid { grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); }
      }
    `;
  }
}

export { ProductsPage };
