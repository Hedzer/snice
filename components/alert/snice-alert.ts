import { element, property, watch, query, dispatch, render, styles, html } from 'snice';
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
    return html`
      <div class="alert ${this.isHidden ? 'alert--hidden' : ''}" role="alert" aria-live="polite" @animationend=${this.handleAnimationEnd}>
        ${this.renderIconSection()}
        <div class="alert-content">
          ${this.renderTitleSection()}
          ${this.renderDescriptionSection()}
        </div>
        ${this.renderDismissSection()}
      </div>
    `;
  }

  renderIconSection() {
    const hasIcon = this.icon || this.shouldShowDefaultIcon();
    return hasIcon ? html`
      <div class="alert-icon ${!this.icon ? 'alert-icon--default' : ''}">
        ${this.icon || ''}
      </div>
    ` : '';
  }

  renderTitleSection() {
    return this.title ? html`
      <div class="alert-title">${this.title}</div>
    ` : '';
  }

  renderDescriptionSection() {
    return html`
      <div class="alert-description">
        <slot></slot>
      </div>
    `;
  }

  renderDismissSection() {
    return this.dismissible ? html`
      <button class="alert-dismiss" type="button" aria-label="Dismiss alert" @click=${this.handleDismiss}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
        </svg>
      </button>
    ` : '';
  }

  @styles()
  componentStyles() {
    return cssContent;
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