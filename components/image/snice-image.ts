import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-image.css?inline';
import type { ImageVariant, ImageSize, ImageFit, SniceImageElement } from './snice-image.types';

@element('snice-image')
export class SniceImage extends HTMLElement implements SniceImageElement {
  @property({  })
  src = '';

  @property({  })
  alt = '';

  @property({  })
  fallback = '';

  @property({  })
  placeholder = '';

  @property({  })
  srcset = '';

  @property({  })
  sizes = '';

  @property({  })
  variant: ImageVariant = 'rounded';

  @property({  })
  size: ImageSize = 'medium';

  @property({ type: Boolean })
  lazy = true;

  @property({ type: Boolean })
  observeVisibility = false;

  @property({  })
  fit: ImageFit = 'cover';

  @property({  })
  width = '';

  @property({  })
  height = '';

  @property({ type: Boolean, attribute: false })
  private imageError = false;

  @property({ type: Boolean, attribute: false })
  private imageLoaded = false;

  @property({ type: Boolean, attribute: false })
  private isVisible = false;

  private observer: IntersectionObserver | null = null;

  connectedCallback() {
    super.connectedCallback?.();

    if (this.observeVisibility && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isVisible) {
            this.isVisible = true;
            this.observer?.disconnect();
          }
        });
      }, {
        rootMargin: '50px'
      });

      this.observer.observe(this);
    } else if (this.observeVisibility) {
      // Fallback if IntersectionObserver not supported
      this.isVisible = true;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.observer?.disconnect();
    this.observer = null;
  }

  @styles()
  get componentStyles() {
    return css`${cssContent}`;
  }

  @render()
  renderContent() {
    const shouldLoadImage = !this.observeVisibility || this.isVisible;
    const imageSrc = this.imageError && this.fallback ? this.fallback : this.src;
    const imageAlt = this.alt || 'Image';
    const loadingAttr = this.lazy ? 'lazy' : 'eager';

    const imageClasses = [
      'image',
      `image--${this.variant}`,
      `image--${this.size}`,
      `image--${this.fit}`,
      this.imageLoaded ? 'image--loaded' : ''
    ].filter(Boolean).join(' ');

    const placeholderClasses = [
      'image-placeholder',
      `image--${this.variant}`,
      `image--${this.size}`,
      `image--${this.fit}`,
      this.imageLoaded ? 'image-placeholder--hidden' : ''
    ].filter(Boolean).join(' ');

    const containerClasses = [
      'image-container',
      `image-container--${this.size}`
    ].join(' ');

    const inlineStyles = this.getInlineStyles();

    // Show placeholder if no src or if waiting for visibility
    if (!this.src || !shouldLoadImage) {
      return html`
        <div class="${containerClasses}" part="container">
          <div class="${imageClasses} image--placeholder" part="placeholder" style="${inlineStyles}"></div>
        </div>
      `;
    }

    const hasPlaceholder = this.placeholder && !this.imageLoaded;

    return html`
      <div class="${containerClasses}" part="container">
        <if ${hasPlaceholder}>
          <img
            src="${this.placeholder}"
            alt=""
            aria-hidden="true"
            class="${placeholderClasses}"
            part="placeholder"
            style="${inlineStyles}"
          />
        </if>
        <img
          src="${imageSrc}"
          srcset="${this.srcset || ''}"
          sizes="${this.sizes || ''}"
          alt="${imageAlt}"
          loading="${loadingAttr}"
          class="${imageClasses}"
          part="image"
          style="${inlineStyles}"
          @error="${() => this.handleImageError()}"
          @load="${() => this.handleImageLoad()}"
        />
      </div>
    `;
  }

  private getInlineStyles(): string {
    const styles: string[] = [];

    if (this.width) {
      styles.push(`width: ${this.width}`);
    }

    if (this.height) {
      styles.push(`height: ${this.height}`);
    }

    return styles.join('; ');
  }

  private handleImageError() {
    if (!this.imageError) {
      this.imageError = true;
    }
  }

  private handleImageLoad() {
    this.imageError = false;
    this.imageLoaded = true;
  }
}
