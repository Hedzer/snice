import { element, property, query, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-alert.css?inline';
import type { AlertVariant, AlertSize, SniceAlertElement } from './snice-alert.types';

@element('snice-alert')
export class SniceAlert extends HTMLElement implements SniceAlertElement {
  @property({  })
  variant: AlertVariant = 'info';

  @property({  })
  size: AlertSize = 'medium';

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
  renderContent() {
    const hasIcon = this.icon ? this.icon !== 'none' : this.shouldShowDefaultIcon();
    const classes = ['alert', this.isHidden ? 'alert--hidden' : ''].filter(Boolean).join(' ');
    const iconClasses = ['alert-icon', !this.icon || this.icon === 'none' ? 'alert-icon--default' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${classes}" role="alert" aria-live="polite" @animationend=${this.handleAnimationEnd}>
        <if ${hasIcon}>
          <div class="${iconClasses}">
            ${this.icon || ''}
          </div>
        </if>
        <div class="alert-content">
          <if ${this.title}>
            <div class="alert-title">${this.title}</div>
          </if>
          <div class="alert-description">
            <slot></slot>
          </div>
        </div>
        <if ${this.dismissible}>
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
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  private shouldShowDefaultIcon(): boolean {
    // Show default icons for variants unless explicitly disabled
    return this.icon !== 'none';
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