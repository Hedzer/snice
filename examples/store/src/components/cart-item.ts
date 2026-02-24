import { element, property, render, styles, html, css, dispatch } from 'snice';

@element('cart-item-row')
class CartItemRow extends HTMLElement {
  @property() productId = '';
  @property() name = '';
  @property() image = '';
  @property({ type: Number }) price = 0;
  @property({ type: Number }) quantity = 1;

  @dispatch('quantity-change')
  emitQuantityChange() {
    return { productId: this.productId, quantity: this.quantity };
  }

  @dispatch('remove-item')
  emitRemove() {
    return { productId: this.productId };
  }

  private increment() {
    this.quantity++;
    this.emitQuantityChange();
  }

  private decrement() {
    if (this.quantity > 1) {
      this.quantity--;
      this.emitQuantityChange();
    }
  }

  @render()
  template() {
    const lineTotal = this.price * this.quantity;
    return html`
      <div class="item">
        <img class="item-image" src="${this.image}" alt="${this.name}" />
        <div class="item-info">
          <a href="/#/products/${this.productId}" class="item-name">${this.name}</a>
          <span class="item-price">$${this.price.toFixed(2)}</span>
        </div>
        <div class="quantity-controls">
          <button class="qty-btn" @click=${() => this.decrement()}>-</button>
          <span class="qty">${this.quantity}</span>
          <button class="qty-btn" @click=${() => this.increment()}>+</button>
        </div>
        <span class="line-total">$${lineTotal.toFixed(2)}</span>
        <button class="remove-btn" @click=${() => this.emitRemove()} title="Remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14"/>
          </svg>
        </button>
      </div>
    `;
  }

  @styles()
  itemStyles() {
    return css`
      :host {
        display: block;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--snice-color-border, rgb(226 226 226));
      }
      .item-image {
        width: 5rem;
        height: 5rem;
        object-fit: cover;
        border-radius: 8px;
        flex-shrink: 0;
      }
      .item-info {
        flex: 1;
        min-width: 0;
      }
      .item-name {
        display: block;
        font-weight: var(--snice-font-weight-semibold, 600);
        color: var(--snice-color-text, rgb(23 23 23));
        text-decoration: none;
        margin-bottom: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .item-name:hover {
        color: var(--snice-color-primary, rgb(37 99 235));
      }
      .item-price {
        font-size: 0.875rem;
        color: var(--snice-color-text-secondary, rgb(82 82 82));
      }
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      .qty-btn {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--snice-color-border, rgb(226 226 226));
        border-radius: 6px;
        background: var(--snice-color-background, rgb(255 255 255));
        cursor: pointer;
        font-size: 1rem;
        color: var(--snice-color-text, rgb(23 23 23));
        transition: background 0.15s;
      }
      .qty-btn:hover {
        background: var(--snice-color-background-element, rgb(252 251 249));
      }
      .qty {
        min-width: 2rem;
        text-align: center;
        font-weight: var(--snice-font-weight-semibold, 600);
      }
      .line-total {
        font-weight: var(--snice-font-weight-bold, 700);
        min-width: 5rem;
        text-align: right;
        flex-shrink: 0;
      }
      .remove-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: none;
        background: none;
        color: var(--snice-color-text-tertiary, rgb(115 115 115));
        cursor: pointer;
        border-radius: 6px;
        flex-shrink: 0;
        transition: color 0.15s, background 0.15s;
      }
      .remove-btn:hover {
        color: var(--snice-color-danger, rgb(220 38 38));
        background: rgb(254 226 226);
      }

      @media (max-width: 600px) {
        .item {
          flex-wrap: wrap;
        }
        .line-total {
          min-width: auto;
        }
      }
    `;
  }
}

export { CartItemRow };
