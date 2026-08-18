import { element, property, watch, ready, dispose, on, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import { renderIcon } from '../utils';
import { INFO_CIRCLE_SOLID, CHECK_CIRCLE_SOLID, EXCLAMATION_TRIANGLE_SOLID, X_CIRCLE_SOLID, X_MARK } from '../icons';
import cssContent from './snice-banner.css?inline';
import type { BannerVariant, BannerPosition, SniceBannerElement } from './snice-banner.types';

// Default icons by variant — consumer overrides via slot or `icon` prop.
const DEFAULT_BANNER_ICONS: Record<BannerVariant, string> = {
  info: INFO_CIRCLE_SOLID,
  success: CHECK_CIRCLE_SOLID,
  warning: EXCLAMATION_TRIANGLE_SOLID,
  error: X_CIRCLE_SOLID,
};

@element('snice-banner')
export class SniceBanner extends HTMLElement implements SniceBannerElement {
  @property({  })
  variant: BannerVariant = 'info';

  @property({  })
  position: BannerPosition = 'top';

  @property({  })
  message = '';

  @property({ type: Boolean,  })
  dismissible = true;

  @property({  })
  icon = '';

  @property({ attribute: 'action-text',  })
  actionText = '';

  @property({ type: Boolean })
  open = false;

  // Accessible name for the banner region; falls back to "<variant> banner".
  @property({  })
  label = '';

  // Auto-dismiss after this many milliseconds once open; 0 disables. The
  // countdown pauses while the pointer is over the banner.
  @property({ type: Number })
  duration = 0;

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownStartedAt = 0;
  private countdownRemaining = 0;

  @render()
  render() {
    const bannerClasses = ['banner', `banner--${this.variant}`].filter(Boolean).join(' ');

    const defaultSvg = DEFAULT_BANNER_ICONS[this.variant];

    return html/*html*/`
      <div class="${bannerClasses}" role="alert" aria-label="${this.label || `${this.variant} banner`}" part="banner">
        <span class="banner__icon-slot" part="icon">
          <slot name="icon">
            <if ${this.icon}>
              ${renderIcon(this.icon, 'banner__icon')}
            </if>
            <if ${!this.icon && defaultSvg}>
              <span class="banner__icon" aria-hidden="true">${unsafeHTML(defaultSvg)}</span>
            </if>
          </slot>
        </span>

        <span class="banner__message" part="message">${this.message}</span>

        <div class="banner__slot">
          <slot></slot>
        </div>

        <if ${this.actionText}>
          <button
            class="banner__action"
            part="action"
            type="button"
            @click=${this.handleActionClick}
          >${this.actionText}</button>
        </if>

        <if ${this.dismissible}>
          <button
            class="banner__close"
            part="close"
            type="button"
            aria-label="Close"
            @click=${this.handleClose}
          ><span class="banner__close-icon" aria-hidden="true">${unsafeHTML(X_MARK)}</span></button>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private handleActionClick(e: Event) {
    this.dispatchActionEvent();
  }

  private handleClose() {
    this.hide();
  }

  @watch('open', { immediate: false })
  handleOpenChange() {
    if (this.open) {
      this.startCountdown();
      this.dispatchOpenEvent();
    } else {
      this.clearCountdown();
      this.dispatchCloseEvent();
    }
  }

  @ready()
  init() {
    if (this.open) {
      this.startCountdown();
    }
  }

  @dispose()
  cleanup() {
    this.clearCountdown();
  }

  @watch('duration', { immediate: false })
  handleDurationChange() {
    if (this.open) {
      this.startCountdown();
    }
  }

  @on('mouseenter')
  pauseCountdown() {
    if (this.dismissTimer === null) return;

    clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
    this.countdownRemaining = Math.max(0, this.countdownRemaining - (Date.now() - this.countdownStartedAt));
  }

  @on('mouseleave')
  resumeCountdown() {
    if (this.duration > 0 && this.open && this.countdownRemaining > 0) {
      this.armCountdown(this.countdownRemaining);
    }
  }

  private startCountdown() {
    this.clearCountdown();
    if (this.duration > 0) {
      this.armCountdown(this.duration);
    }
  }

  private armCountdown(ms: number) {
    this.countdownStartedAt = Date.now();
    this.countdownRemaining = ms;
    this.dismissTimer = setTimeout(() => {
      this.dismissTimer = null;
      this.hide();
    }, ms);
  }

  private clearCountdown() {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    this.countdownRemaining = 0;
  }

  @dispatch('banner-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { banner: this };
  }

  @dispatch('banner-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { banner: this };
  }

  @dispatch('banner-action', { bubbles: true, composed: true })
  private dispatchActionEvent() {
    return { banner: this };
  }

  // Public API
  show() {
    this.open = true;
  }

  hide() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }
}
