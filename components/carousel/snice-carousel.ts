import { element, property, query, watch, dispatch, ready, dispose, on, render, styles, html, css } from 'snice';
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

  @query('slot')
  private slotElement?: HTMLSlotElement;

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

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.updateSlideCount();
  }

  @dispose()
  cleanup() {
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
    if (this.slotElement) {
      this.slideCount = this.slotElement.assignedElements().length;
    }
  }

  private updateTransform() {
    if (!this.container) return;

    const slideWidth = 100 / this.slidesPerView;
    const offset = -(this.activeIndex * slideWidth);
    this.container.style.transform = `translateX(${offset}%)`;
  }

  @dispatch('carousel-slide-change', { bubbles: true, composed: true })
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

    return html/*html*/`
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
              <span>‹</span>
            </button>
            <button
              class="carousel__button carousel__button--next"
              part="button-next"
              @click="${() => this.next()}"
              ?disabled="${!canGoNext}"
              aria-label="Next slide">
              <span>›</span>
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

              return html/*html*/`
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
    const slideWidth = 100 / this.slidesPerView;
    const gapAdjustment = this.spaceBetween * (this.slidesPerView - 1) / this.slidesPerView;

    return css/*css*/`
      ${cssContent}
      ::slotted(*) {
        flex: 0 0 auto;
        width: calc(${slideWidth}% - ${gapAdjustment}px);
        margin-right: ${this.spaceBetween}px;
        box-sizing: border-box;
      }
      ::slotted(*:last-child) {
        margin-right: 0;
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
    if (index >= 0) {
      // Allow setting any index - validation happens on render
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
