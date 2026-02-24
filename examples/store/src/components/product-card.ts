import { element, property, render, styles, html, css, dispatch, observe } from 'snice';

@element('product-card')
class ProductCard extends HTMLElement {
  @property() productId = '';
  @property() name = '';
  @property() image = '';
  @property({ type: Number }) price = 0;
  @property() category = '';
  @property({ type: Number }) rating = 0;
  @property({ type: Number }) reviews = 0;
  @property({ type: Boolean }) inStock = true;
  @property({ type: Boolean }) imageLoaded = false;

  @observe('intersection', '.card-image', { threshold: 0.1 })
  handleVisible(entries: IntersectionObserverEntry[]) {
    if (entries[0]?.isIntersecting && !this.imageLoaded) {
      this.imageLoaded = true;
    }
  }

  @dispatch('add-to-cart')
  handleAddToCart() {
    return { productId: this.productId };
  }

  @render()
  template() {
    const stars = '★'.repeat(Math.round(this.rating)) + '☆'.repeat(5 - Math.round(this.rating));
    return html`
      <a href="/#/products/${this.productId}" class="card-link">
        <div class="card-image">
          <if ${this.imageLoaded}>
            <img src="${this.image}" alt="${this.name}" loading="lazy" />
          </if>
          <if ${!this.imageLoaded}>
            <div class="image-placeholder"></div>
          </if>
          <if ${!this.inStock}>
            <span class="badge out-of-stock">Out of Stock</span>
          </if>
        </div>
        <div class="card-body">
          <span class="category">${this.category}</span>
          <h3 class="name">${this.name}</h3>
          <div class="rating">
            <span class="stars">${stars}</span>
            <span class="review-count">(${this.reviews})</span>
          </div>
          <div class="card-footer">
            <span class="price">$${this.price.toFixed(2)}</span>
            <if ${this.inStock}>
              <button class="add-btn" @click=${(e: Event) => { e.preventDefault(); e.stopPropagation(); this.handleAddToCart(); }}>
                Add to Cart
              </button>
            </if>
          </div>
        </div>
      </a>
    `;
  }

  @styles()
  cardStyles() {
    return css`
      :host {
        display: block;
        contain: layout style;
      }
      .card-link {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--snice-color-background, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 12px;
        overflow: hidden;
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .card-link:hover {
        transform: translateY(-4px);
        box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1));
      }
      .card-image {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        background: var(--snice-color-background-element, rgb(252 251 249));
      }
      .card-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }
      .card-link:hover .card-image img {
        transform: scale(1.05);
      }
      .image-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .badge {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .out-of-stock {
        background: var(--snice-color-danger, rgb(220 38 38));
        color: white;
      }
      .card-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        padding: 1rem;
        gap: 0.375rem;
      }
      .category {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        font-weight: var(--snice-font-weight-medium, 500);
      }
      .name {
        margin: 0;
        font-size: 0.9375rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        line-height: 1.3;
        color: var(--snice-color-text, rgb(23 23 23));
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .rating {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
      }
      .stars {
        color: #f59e0b;
        letter-spacing: 1px;
      }
      .review-count {
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
      }
      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: 0.75rem;
      }
      .price {
        font-size: 1.25rem;
        font-weight: var(--snice-font-weight-bold, 700);
        color: var(--snice-color-text, rgb(23 23 23));
      }
      .add-btn {
        padding: 0.5rem 1rem;
        background: var(--snice-color-primary, rgb(37 99 235));
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: var(--snice-font-weight-semibold, 600);
        cursor: pointer;
        transition: background 0.15s;
        white-space: nowrap;
      }
      .add-btn:hover {
        background: rgb(29 78 216);
      }
      .add-btn:active {
        transform: scale(0.97);
      }
    `;
  }
}

export { ProductCard };
