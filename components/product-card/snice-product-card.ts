import { element, property, dispatch, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-product-card.css?inline';
import type {
  SniceProductCardElement,
  ProductCardVariant,
  ProductVariant,
  AddToCartDetail,
  VariantSelectDetail,
  ImageClickDetail
} from './snice-product-card.types';

@element('snice-product-card')
export class SniceProductCard extends HTMLElement implements SniceProductCardElement {
  @property()
  name = '';

  @property({ type: Number })
  price = 0;

  @property({ type: Number, attribute: 'sale-price' })
  salePrice: number | null = null;

  @property()
  currency = '$';

  @property({ type: Array })
  images: string[] = [];

  @property({ type: Number })
  rating = 0;

  @property({ type: Number, attribute: 'review-count' })
  reviewCount = 0;

  @property({ type: Array })
  variants: ProductVariant[] = [];

  @property({ type: Boolean, attribute: 'in-stock' })
  inStock = true;

  @property()
  variant: ProductCardVariant = 'vertical';

  @property({ type: Number, attribute: false })
  private currentImageIndex = 0;

  @property({ type: Object, attribute: false })
  private selectedVariants: Record<string, string> = {};

  @ready()
  init() {
    // Initialize first option of each variant as selected
    this.initializeVariantSelections();
  }

  @watch('variants')
  handleVariantsChange() {
    this.initializeVariantSelections();
  }

  private initializeVariantSelections() {
    const selections: Record<string, string> = {};
    for (const v of this.variants) {
      if (v.options.length > 0) {
        selections[v.type] = v.options[0];
      }
    }
    this.selectedVariants = selections;
  }

  private handlePrevImage() {
    if (this.images.length <= 1) return;
    this.currentImageIndex = this.currentImageIndex === 0
      ? this.images.length - 1
      : this.currentImageIndex - 1;
  }

  private handleNextImage() {
    if (this.images.length <= 1) return;
    this.currentImageIndex = this.currentImageIndex === this.images.length - 1
      ? 0
      : this.currentImageIndex + 1;
  }

  private handleDotClick(index: number) {
    this.currentImageIndex = index;
  }

  private handleImageClick() {
    if (this.images.length === 0) return;
    this.emitImageClick({
      index: this.currentImageIndex,
      src: this.images[this.currentImageIndex]
    });
  }

  private handleVariantSelect(type: string, value: string) {
    this.selectedVariants = { ...this.selectedVariants, [type]: value };
    this.emitVariantSelect({ type, value });
  }

  private handleAddToCart() {
    if (!this.inStock) return;
    this.emitAddToCart({
      name: this.name,
      price: this.salePrice ?? this.price,
      salePrice: this.salePrice,
      selectedVariants: { ...this.selectedVariants }
    });
  }

  @dispatch('add-to-cart', { bubbles: true, composed: true })
  private emitAddToCart(detail?: AddToCartDetail): AddToCartDetail {
    return detail!;
  }

  @dispatch('variant-select', { bubbles: true, composed: true })
  private emitVariantSelect(detail?: VariantSelectDetail): VariantSelectDetail {
    return detail!;
  }

  @dispatch('image-click', { bubbles: true, composed: true })
  private emitImageClick(detail?: ImageClickDetail): ImageClickDetail {
    return detail!;
  }

  private formatPrice(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private getDiscountPercent(): number {
    if (!this.salePrice || this.salePrice >= this.price) return 0;
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }

  private renderStarIcon(type: 'filled' | 'half' | 'empty'): unknown {
    if (type === 'filled') {
      return html/*html*/`
        <svg class="product-card__star product-card__star--filled" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      `;
    }
    if (type === 'half') {
      return html/*html*/`
        <svg class="product-card__star product-card__star--half" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stop-color="currentColor"/>
              <stop offset="50%" stop-color="rgb(226 226 226)"/>
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      `;
    }
    return html/*html*/`
      <svg class="product-card__star product-card__star--empty" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    `;
  }

  private renderRating(): unknown {
    if (this.rating <= 0) return html``;
    const stars: unknown[] = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(this.rating)) {
        stars.push(this.renderStarIcon('filled'));
      } else if (i - 0.5 <= this.rating) {
        stars.push(this.renderStarIcon('half'));
      } else {
        stars.push(this.renderStarIcon('empty'));
      }
    }

    return html/*html*/`
      <div class="product-card__rating" part="rating">
        <div class="product-card__stars" aria-label="Rating: ${this.rating} out of 5">${stars}</div>
        <if ${this.reviewCount > 0}>
          <span class="product-card__review-count">(${this.reviewCount})</span>
        </if>
      </div>
    `;
  }

  private renderGallery(): unknown {
    if (this.images.length === 0) {
      return html/*html*/`
        <div class="product-card__gallery" part="gallery">
          <div class="product-card__gallery-image" style="background: var(--pc-bg-element); display: flex; align-items: center; justify-content: center; color: var(--pc-text-tertiary); font-size: 0.875rem;">
            No image
          </div>
        </div>
      `;
    }

    const hasMultiple = this.images.length > 1;

    return html/*html*/`
      <div class="product-card__gallery" part="gallery" @click=${() => this.handleImageClick()}>
        <img class="product-card__gallery-image"
             src="${this.images[this.currentImageIndex]}"
             alt="${this.name}"
             loading="lazy" />
        <if ${hasMultiple}>
          <button class="product-card__gallery-nav product-card__gallery-nav--prev"
                  @click=${(e: Event) => { e.stopPropagation(); this.handlePrevImage(); }}
                  aria-label="Previous image">&#8249;</button>
          <button class="product-card__gallery-nav product-card__gallery-nav--next"
                  @click=${(e: Event) => { e.stopPropagation(); this.handleNextImage(); }}
                  aria-label="Next image">&#8250;</button>
          <div class="product-card__gallery-dots">
            ${this.images.map((_: string, i: number) => html/*html*/`
              <button class="product-card__gallery-dot ${i === this.currentImageIndex ? 'product-card__gallery-dot--active' : ''}"
                      @click=${(e: Event) => { e.stopPropagation(); this.handleDotClick(i); }}
                      aria-label="View image ${i + 1}"></button>
            `)}
          </div>
        </if>
      </div>
    `;
  }

  private renderPrice(): unknown {
    const hasSale = this.salePrice !== null && this.salePrice < this.price;
    const discount = this.getDiscountPercent();

    return html/*html*/`
      <div class="product-card__price" part="price">
        <span class="product-card__price-current ${hasSale ? 'product-card__price-current--sale' : ''}">
          ${this.currency}${this.formatPrice(hasSale ? this.salePrice! : this.price)}
        </span>
        <if ${hasSale}>
          <span class="product-card__price-original">${this.currency}${this.formatPrice(this.price)}</span>
          <span class="product-card__price-discount">-${discount}%</span>
        </if>
      </div>
    `;
  }

  private renderVariants(): unknown {
    if (this.variants.length === 0) return html``;

    return html/*html*/`
      <div class="product-card__variants" part="variants">
        ${this.variants.map((v: ProductVariant) => {
          const isColor = v.type.toLowerCase() === 'color';
          return html/*html*/`
            <div class="product-card__variant-group">
              <span class="product-card__variant-label">${v.type}</span>
              <div class="product-card__variant-options" role="radiogroup" aria-label="${v.type}">
                ${v.options.map((opt: string) => {
                  const isSelected = this.selectedVariants[v.type] === opt;
                  const classes = [
                    'product-card__variant-option',
                    isColor ? 'product-card__variant-option--color' : '',
                    isSelected ? 'product-card__variant-option--selected' : ''
                  ].filter(Boolean).join(' ');
                  const colorStyle = isColor ? `background-color: ${opt}` : '';
                  return html/*html*/`
                    <button class="${classes}"
                            style="${colorStyle}"
                            role="radio"
                            aria-checked="${isSelected}"
                            aria-label="${isColor ? opt : ''}"
                            @click=${() => this.handleVariantSelect(v.type, opt)}>
                      <if ${!isColor}>${opt}</if>
                    </button>
                  `;
                })}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderStock(): unknown {
    return html/*html*/`
      <span class="product-card__stock ${this.inStock ? 'product-card__stock--in' : 'product-card__stock--out'}">
        ${this.inStock ? 'In Stock' : 'Out of Stock'}
      </span>
    `;
  }

  @render()
  renderContent() {
    const cardClasses = `product-card product-card--${this.variant}`;

    return html/*html*/`
      <div class="${cardClasses}" part="base">
        ${this.renderGallery()}
        <div class="product-card__body" part="body">
          <h3 class="product-card__title" part="title">${this.name}</h3>
          ${this.renderRating()}
          ${this.renderPrice()}
          ${this.renderStock()}
          ${this.renderVariants()}
          <button class="product-card__cta"
                  part="cta"
                  ?disabled=${!this.inStock}
                  @click=${() => this.handleAddToCart()}>
            ${this.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
