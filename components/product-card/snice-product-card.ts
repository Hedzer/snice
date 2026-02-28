import { element, property, dispatch, watch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-product-card.css?inline';
import type {
  SniceProductCardElement,
  ProductCardVariant,
  BadgeVariant,
  ProductVariant,
  AddToCartDetail,
  VariantSelectDetail,
  ImageClickDetail,
  FavoriteDetail
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

  @property()
  badge = '';

  @property({ attribute: 'badge-variant' })
  badgeVariant: BadgeVariant = 'sale';

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  favorite = false;

  @property({ type: Number, attribute: 'stock-count' })
  stockCount = -1;

  @property({ type: Number, attribute: false })
  private currentImageIndex = 0;

  @property({ type: Object, attribute: false })
  private selectedVariants: Record<string, string> = {};

  @property({ type: Boolean, attribute: false })
  private heartAnimating = false;

  @ready()
  init() {
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
    if (!this.inStock || this.loading) return;
    this.emitAddToCart({
      name: this.name,
      price: this.salePrice ?? this.price,
      salePrice: this.salePrice,
      selectedVariants: { ...this.selectedVariants }
    });
  }

  private handleFavoriteClick(e: Event) {
    e.stopPropagation();
    this.favorite = !this.favorite;
    this.heartAnimating = true;
    setTimeout(() => { this.heartAnimating = false; }, 300);
    this.emitFavorite({ favorited: this.favorite });
  }

  private handleQuickView(e: Event) {
    e.stopPropagation();
    this.emitQuickView();
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

  @dispatch('favorite', { bubbles: true, composed: true })
  private emitFavorite(detail?: FavoriteDetail): FavoriteDetail {
    return detail!;
  }

  @dispatch('quick-view', { bubbles: true, composed: true })
  private emitQuickView(): void {
    return;
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

  private renderHeartIcon(): unknown {
    const iconClasses = [
      'product-card__favorite-icon',
      this.favorite ? 'product-card__favorite-icon--active' : '',
      this.heartAnimating ? 'product-card__favorite-icon--animate' : ''
    ].filter(Boolean).join(' ');

    if (this.favorite) {
      return html/*html*/`
        <svg class="${iconClasses}" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
        </svg>
      `;
    }
    return html/*html*/`
      <svg class="${iconClasses}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
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
        <div class="product-card__stars" part="stars" aria-label="Rating: ${this.rating} out of 5">${stars}</div>
        <if ${this.reviewCount > 0}>
          <span class="product-card__review-count">(${this.reviewCount})</span>
        </if>
      </div>
    `;
  }

  private renderBadge(): unknown {
    if (!this.badge) return html``;
    return html/*html*/`
      <span class="product-card__badge product-card__badge--${this.badgeVariant}" part="badge">
        ${this.badge}
      </span>
    `;
  }

  private renderFavoriteButton(): unknown {
    return html/*html*/`
      <button class="product-card__favorite-btn"
              part="favorite-btn"
              aria-label="${this.favorite ? 'Remove from favorites' : 'Add to favorites'}"
              @click=${(e: Event) => this.handleFavoriteClick(e)}>
        ${this.renderHeartIcon()}
      </button>
    `;
  }

  private renderQuickView(): unknown {
    return html/*html*/`
      <button class="product-card__quick-view"
              @click=${(e: Event) => this.handleQuickView(e)}
              aria-label="Quick view">
        <span class="product-card__quick-view-label">
          <svg class="product-card__quick-view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Quick View
        </span>
      </button>
    `;
  }

  private renderGallery(): unknown {
    const isFeatured = this.variant === 'featured';

    if (this.images.length === 0) {
      return html/*html*/`
        <div class="product-card__gallery" part="gallery">
          <div class="product-card__gallery-image-wrapper" style="display: flex; align-items: center; justify-content: center; color: var(--pc-text-tertiary); font-size: 0.875rem;">
            No image
          </div>
          ${this.renderBadge()}
          ${this.renderFavoriteButton()}
        </div>
      `;
    }

    const hasMultiple = this.images.length > 1;

    return html/*html*/`
      <div class="product-card__gallery" part="gallery">
        <div class="product-card__gallery-image-wrapper" @click=${() => this.handleImageClick()}>
          ${this.images.map((src: string, i: number) => html/*html*/`
            <img class="product-card__gallery-image ${i === this.currentImageIndex ? 'product-card__gallery-image--active' : ''}"
                 src="${src}"
                 alt="${this.name}"
                 part="image"
                 loading="lazy" />
          `)}
        </div>
        <if ${isFeatured}>
          <div class="product-card__gallery-gradient"></div>
        </if>
        ${this.renderBadge()}
        ${this.renderFavoriteButton()}
        ${this.renderQuickView()}
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
        <span class="product-card__price-current ${hasSale ? 'product-card__price-current--sale' : ''}" part="price-current">
          ${this.currency}${this.formatPrice(hasSale ? this.salePrice! : this.price)}
        </span>
        <if ${hasSale}>
          <span class="product-card__price-original" part="price-original">${this.currency}${this.formatPrice(this.price)}</span>
          <span class="product-card__price-discount" part="discount">-${discount}%</span>
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
            <div class="product-card__variant-group" part="variant-group">
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
                            part="variant-option"
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
    const hasLowStock = this.stockCount > 0 && this.stockCount < 5;

    return html/*html*/`
      <div class="product-card__stock ${this.inStock ? 'product-card__stock--in' : 'product-card__stock--out'}" part="stock">
        <span class="product-card__stock-dot"></span>
        <if ${hasLowStock}>
          <span class="product-card__stock-urgency">Only ${this.stockCount} left!</span>
        </if>
        <if ${!hasLowStock}>
          ${this.inStock ? 'In Stock' : 'Out of Stock'}
        </if>
      </div>
    `;
  }

  private renderCta(): unknown {
    const ctaClasses = [
      'product-card__cta',
      this.loading ? 'product-card__cta--loading' : ''
    ].filter(Boolean).join(' ');

    if (this.loading) {
      return html/*html*/`
        <button class="${ctaClasses}" part="cta" disabled>
          <span class="product-card__cta-spinner"></span>
          Adding...
        </button>
      `;
    }

    return html/*html*/`
      <button class="${ctaClasses}"
              part="cta"
              ?disabled=${!this.inStock}
              @click=${() => this.handleAddToCart()}>
        <if ${this.inStock}>
          <svg class="product-card__cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
          </svg>
          Add to Cart
        </if>
        <if ${!this.inStock}>Out of Stock</if>
      </button>
    `;
  }

  private renderSkeleton(): unknown {
    const cardClasses = `product-card product-card--${this.variant} product-card--skeleton`;

    return html/*html*/`
      <div class="${cardClasses}" part="base">
        <div class="product-card__gallery" part="gallery">
          <div class="product-card__skeleton-image"></div>
        </div>
        <div class="product-card__body" part="body">
          <div class="product-card__skeleton-line product-card__skeleton-line--title"></div>
          <div class="product-card__skeleton-line product-card__skeleton-line--rating"></div>
          <div class="product-card__skeleton-line product-card__skeleton-line--price"></div>
          <div class="product-card__skeleton-line product-card__skeleton-line--stock"></div>
          <div class="product-card__skeleton-line product-card__skeleton-line--cta"></div>
        </div>
      </div>
    `;
  }

  @render()
  renderContent() {
    if (this.loading) {
      return this.renderSkeleton();
    }

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
          ${this.renderCta()}
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
