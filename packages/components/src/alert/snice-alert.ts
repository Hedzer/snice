import { element, property, query, watch, ready, dispose, on, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import { renderIcon } from '../utils';
import { INFO_CIRCLE_SOLID, CHECK_CIRCLE_SOLID, EXCLAMATION_TRIANGLE_SOLID, X_CIRCLE_SOLID } from '../icons';
import cssContent from './snice-alert.css?inline';
import type { AlertVariant, AlertSize, AlertAppearance, SniceAlertElement } from './snice-alert.types';

@element('snice-alert')
export class SniceAlert extends HTMLElement implements SniceAlertElement {
  @property({  })
  variant: AlertVariant = 'info';

  @property({  })
  size: AlertSize = 'medium';

  @property({  })
  appearance: AlertAppearance = 'filled';

  // No reflection: a `title` attribute on the host would double as a native
  // browser tooltip over the whole alert.
  @property({ reflect: false })
  title = '';

  @property({ type: Boolean,  })
  dismissible = false;

  @property({  })
  icon = '';

  // Auto-dismiss after this many milliseconds; 0 disables. The countdown
  // pauses while the pointer is over the alert.
  @property({ type: Number })
  duration = 0;

  @query('.alert')
  alertElement?: HTMLElement;

  private isHidden = false;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownStartedAt = 0;
  private countdownRemaining = 0;

  @render()
  render() {
    const hasIcon = this.icon ? this.icon !== 'none' : this.shouldShowDefaultIcon();
    const classes = [
      'alert',
      `alert--${this.variant}`,
      `alert--${this.size}`,
      this.isHidden ? 'alert--hidden' : ''
    ].filter(Boolean).join(' ');

    const showDefaultIcon = !this.icon || this.icon === 'none';
    const iconClasses = showDefaultIcon ? 'alert-icon alert-icon--default' : 'alert-icon';

    return html/*html*/`
      <div class="${classes}" part="base" @animationend=${this.handleAnimationEnd}>
        <div class="alert-region" role="alert" aria-live="polite">
          <if value="${hasIcon}">
            <div class="${iconClasses}" part="icon">
              <slot name="icon">
                ${this.icon ? renderIcon(this.icon, 'alert-icon-content') : this.defaultIconSvg()}
              </slot>
            </div>
          </if>
          <div class="alert-content">
            <if value="${this.title}">
              <div class="alert-title">${this.title}</div>
            </if>
            <div class="alert-description">
              <slot></slot>
            </div>
          </div>
        </div>
        <if value="${this.dismissible}">
          <button class="alert-dismiss" type="button" aria-label="Dismiss alert" @click=${this.handleDismiss}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
            </svg>
          </button>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private shouldShowDefaultIcon(): boolean {
    // Show default icons for variants unless explicitly disabled
    return this.icon !== 'none';
  }

  @ready()
  init() {
    this.stripNativeTooltip();
    this.startCountdown();
  }

  @dispose()
  cleanup() {
    this.clearCountdown();
  }

  // A `title` attribute on the host paints a native tooltip over the whole
  // alert. Accept it as input, then remove it — the property keeps the value.
  @watch('title')
  handleTitleChange() {
    this.stripNativeTooltip();
  }

  private stripNativeTooltip() {
    if (!this.hasAttribute('title')) return;

    const value = this.title || this.getAttribute('title') || '';
    this.removeAttribute('title');
    if (this.title !== value) {
      this.title = value;
    }
  }

  @watch('duration', { immediate: false })
  handleDurationChange() {
    this.startCountdown();
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
    if (this.duration > 0 && !this.isHidden && this.countdownRemaining > 0) {
      this.armCountdown(this.countdownRemaining);
    }
  }

  private startCountdown() {
    this.clearCountdown();
    if (this.duration > 0 && !this.isHidden) {
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

  /**
   * Default icons sourced from the central Heroicons module. Consumers can
   * override via `<slot name="icon">...</slot>` or the `icon` prop; this
   * fallback is only rendered when neither is supplied.
   */
  private defaultIconSvg() {
    const svg = {
      success: CHECK_CIRCLE_SOLID,
      warning: EXCLAMATION_TRIANGLE_SOLID,
      error:   X_CIRCLE_SOLID,
      info:    INFO_CIRCLE_SOLID,
    }[this.variant] ?? INFO_CIRCLE_SOLID;
    return html/*html*/`<span class="alert-icon-content" aria-hidden="true">${unsafeHTML(svg)}</span>`;
  }


  @dispatch('alert-dismiss')
  handleDismiss() {
    this.hide();
    return {
      variant: this.variant,
      title: this.title
    };
  }

  handleAnimationEnd(event: AnimationEvent) {
    if (event.animationName === 'slideOut') {
      this.isHidden = true;
      if (this.alertElement) {
        this.alertElement.classList.add('alert--hidden');
        this.alertElement.classList.remove('alert--hiding');
      }
      this.dispatchAlertHidden();
    }
  }

  @dispatch('alert-hidden')
  private dispatchAlertHidden() {
    return {
      variant: this.variant,
      title: this.title
    };
  }

  @dispatch('alert-shown')
  private dispatchAlertShown() {
    return {
      variant: this.variant,
      title: this.title
    };
  }

  show() {
    this.isHidden = false;
    if (this.alertElement) {
      this.alertElement.classList.remove('alert--hidden', 'alert--hiding');
    }
    this.startCountdown();
    this.dispatchAlertShown();
  }

  hide() {
    this.clearCountdown();
    if (this.alertElement && !this.isHidden) {
      this.alertElement.classList.add('alert--hiding');
    }
  }

}