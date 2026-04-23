import { element, property, query, dispatch, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
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

  @property({  })
  title = '';

  @property({ type: Boolean,  })
  dismissible = false;

  @property({  })
  icon = '';

  @query('.alert')
  alertElement?: HTMLElement;

  private isHidden = false;

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
      <div class="${classes}" role="alert" aria-live="polite" part="base" @animationend=${this.handleAnimationEnd}>
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

  /**
   * Snice-owned solid icon set for the default alert icons. Designed as
   * filled circles/triangles at 24×24 with a bold glyph mark — readable at
   * the 20px alert-icon size without relying on Unicode fallbacks (which
   * looked like placeholder characters across OSes).
   */
  private defaultIconSvg() {
    switch (this.variant) {
      case 'success':
        return html/*html*/`<svg class="alert-icon-content" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14.59-4.3-4.3 1.42-1.42L11 13.76l5.88-5.88 1.42 1.42Z"/></svg>`;
      case 'warning':
        return html/*html*/`<svg class="alert-icon-content" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 21h22Zm1 14h-2v-2h2Zm0-4h-2V9h2Z"/></svg>`;
      case 'error':
        return html/*html*/`<svg class="alert-icon-content" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12Z"/></svg>`;
      case 'info':
      default:
        return html/*html*/`<svg class="alert-icon-content" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2Zm0-8h-2V7h2Z"/></svg>`;
    }
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
    this.dispatchAlertShown();
  }

  hide() {
    if (this.alertElement && !this.isHidden) {
      this.alertElement.classList.add('alert--hiding');
    }
  }

}