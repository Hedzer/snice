import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-carousel.css?inline';
import type { CarouselAutoplayDirection, SniceCarouselElement, CarouselSlideChangeDetail } from './snice-carousel.types';

@element('snice-carousel')
export class SniceCarousel extends HTMLElement implements SniceCarouselElement {
  @property({ type: Number, attribute: 'active-index' })
  activeIndex = 0;

  @property({ type: Boolean })
  autoplay = false;

  @property({ type: Number, attribute: 'autoplay-interval' })
  autoplayInterval = 3000;

  @property({ attribute: 'autoplay-direction' })
  autoplayDirection: CarouselAutoplayDirection = 'forward';

  @property({ type: Boolean })
  loop = true;

  @property({ type: Boolean, attribute: 'show-controls' })
  showControls = true;

  @property({ type: Boolean, attribute: 'show-indicators' })
  showIndicators = true;

  @property({ type: Number, attribute: 'slides-per-view' })
  slidesPerView = 1;

  @property({ type: Number, attribute: 'space-between' })
  spaceBetween = 0;

  @query('.carousel__container')
  container?: HTMLElement;

  private slideCount = 0;
  private autoplayTimer?: number;
  private previousIndex = 0;

  @ready()
  init() {
    this.updateSlideCount();
    if (this.autoplay) {
      this.play();
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
    const slot = this.shadowRoot?.querySelector('slot');
    slot?.addEventListener('slotchange', () => {
      this.updateSlideCount();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.pause();
  }

  @watch('activeIndex')
  handleActiveIndexChange() {
    this.updateTransform();
  }

  @watch('autoplay')
  handleAutoplayChange() {
    if (this.autoplay) {
      this.play();
    } else {
      this.pause();
    }
  }

  private updateSlideCount() {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement;
    if (slot) {
      this.slideCount = slot.assignedElements().length;
    }
  }

  private updateTransform() {
    if (!this.container) return;

    const slideWidth = 100 / this.slidesPerView;
    const offset = -(this.activeIndex * slideWidth);
    this.container.style.transform = `translateX(${offset}%)`;
  }

  @dispatch('@snice/carousel-slide-change', { bubbles: true, composed: true })
  private dispatchSlideChange(): CarouselSlideChangeDetail {
    return {
      activeIndex: this.activeIndex,
      previousIndex: this.previousIndex,
      carousel: this
    };
  }

  @render()
  render() {
    const canGoPrev = this.loop || this.activeIndex > 0;
    const canGoNext = this.loop || this.activeIndex < this.slideCount - this.slidesPerView;

    return html`
      <div class="carousel" part="container">
        <div class="carousel__viewport" part="viewport">
          <div class="carousel__container" part="slides-container">
            <slot></slot>
          </div>
        </div>

        <if ${this.showControls}>
          <div class="carousel__controls" part="controls">
            <button
              class="carousel__button carousel__button--prev"
              part="button-prev"
              @click="${() => this.prev()}"
              ?disabled="${!canGoPrev}"
              aria-label="Previous slide">
              ←
            </button>
            <button
              class="carousel__button carousel__button--next"
              part="button-next"
              @click="${() => this.next()}"
              ?disabled="${!canGoNext}"
              aria-label="Next slide">
              →
            </button>
          </div>
        </if>

        <if ${this.showIndicators}>
          <div class="carousel__indicators" part="indicators">
            ${Array.from({ length: this.slideCount - this.slidesPerView + 1 }).map((_, index) => {
              const indicatorClasses = [
                'carousel__indicator',
                index === this.activeIndex ? 'carousel__indicator--active' : ''
              ].filter(Boolean).join(' ');

              return html`
                <button
                  class="${indicatorClasses}"
                  part="indicator"
                  @click="${() => this.goToSlide(index)}"
                  aria-label="Go to slide ${index + 1}">
                </button>
              `;
            })}
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`
      ${cssContent}
      .carousel__slide {
        width: calc(${100 / this.slidesPerView}% - ${this.spaceBetween * (this.slidesPerView - 1) / this.slidesPerView}px);
        margin-right: ${this.spaceBetween}px;
      }
    `;
  }

  // Public API
  next() {
    this.previousIndex = this.activeIndex;
    if (this.activeIndex < this.slideCount - this.slidesPerView) {
      this.activeIndex++;
    } else if (this.loop) {
      this.activeIndex = 0;
    }
    this.dispatchSlideChange();
  }

  prev() {
    this.previousIndex = this.activeIndex;
    if (this.activeIndex > 0) {
      this.activeIndex--;
    } else if (this.loop) {
      this.activeIndex = this.slideCount - this.slidesPerView;
    }
    this.dispatchSlideChange();
  }

  goToSlide(index: number) {
    if (index >= 0 && index <= this.slideCount - this.slidesPerView) {
      this.previousIndex = this.activeIndex;
      this.activeIndex = index;
      this.dispatchSlideChange();
    }
  }

  play() {
    this.pause();
    this.autoplayTimer = window.setInterval(() => {
      if (this.autoplayDirection === 'forward') {
        this.next();
      } else {
        this.prev();
      }
    }, this.autoplayInterval);
  }

  pause() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = undefined;
    }
  }
}
