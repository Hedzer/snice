import { element, property, watch, query, on, dispatch, part } from 'snice';
import css from './snice-alert.css?inline';
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

  html() {
    return /*html*/`
      <div class="alert ${this.isHidden ? 'alert--hidden' : ''}" role="alert" aria-live="polite">
        <div part="icon-section"></div>
        <div class="alert-content">
          <div part="title-section"></div>
          <div part="description-section"></div>
        </div>
        <div part="dismiss-section"></div>
      </div>
    `;
  }

  @part('icon-section')
  renderIconSection() {
    const hasIcon = this.icon || this.shouldShowDefaultIcon();
    return hasIcon ? /*html*/`
      <div class="alert-icon ${!this.icon ? 'alert-icon--default' : ''}">
        ${this.icon || ''}
      </div>
    ` : '';
  }

  @watch('title')
  @part('title-section')
  renderTitleSection() {
    return this.title ? /*html*/`
      <div class="alert-title">${this.title}</div>
    ` : '';
  }

  @part('description-section')
  renderDescriptionSection() {
    return /*html*/`
      <div class="alert-description">
        <slot></slot>
      </div>
    `;
  }

  @watch('dismissible')
  @part('dismiss-section')
  renderDismissSection() {
    return this.dismissible ? /*html*/`
      <button class="alert-dismiss" type="button" aria-label="Dismiss alert">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
        </svg>
      </button>
    ` : '';
  }

  css() {
    return css;
  }

  private shouldShowDefaultIcon(): boolean {
    // Show default icons for variants unless explicitly disabled
    return this.icon !== 'none';
  }


  @on('click', '.alert-dismiss')
  @dispatch('alert-dismiss')
  handleDismiss() {
    this.hide();
    return {
      variant: this.variant,
      title: this.title
    };
  }

  @on('animationend', '.alert')
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