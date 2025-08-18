import { element, property, watch, query, on, dispatch } from '../../src/index';
import css from './snice-alert.css?inline';
import type { AlertVariant, AlertSize, SniceAlertElement } from './snice-alert.types';

@element('snice-alert')
export class SniceAlert extends HTMLElement implements SniceAlertElement {
  @property({ reflect: true })
  variant: AlertVariant = 'info';

  @property({ reflect: true })
  size: AlertSize = 'medium';

  @property({ reflect: true })
  title = '';

  @property({ type: Boolean, reflect: true })
  dismissible = false;

  @property({ reflect: true })
  icon = '';

  @query('.alert')
  alertElement?: HTMLElement;

  private isHidden = false;

  html() {
    const hasIcon = this.icon || this.shouldShowDefaultIcon();
    
    return /*html*/`
      <div class="alert ${this.isHidden ? 'alert--hidden' : ''}" 
           role="alert"
           aria-live="polite">
        ${hasIcon ? /*html*/`
          <div class="alert-icon ${!this.icon ? 'alert-icon--default' : ''}">
            ${this.icon || ''}
          </div>
        ` : ''}
        <div class="alert-content">
          ${this.title ? /*html*/`
            <div class="alert-title">${this.title}</div>
          ` : ''}
          <div class="alert-description">
            <slot></slot>
          </div>
        </div>
        ${this.dismissible ? /*html*/`
          <button class="alert-dismiss" 
                  type="button"
                  aria-label="Dismiss alert">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
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

  @watch('variant', 'title', 'dismissible', 'icon')
  updateAlert() {
    this.render();
  }

  private render() {
    const shadow = this.shadowRoot;
    if (shadow) {
      shadow.innerHTML = '';
      if (this.css) {
        const style = document.createElement('style');
        style.textContent = this.css();
        shadow.appendChild(style);
      }
      const template = document.createElement('template');
      template.innerHTML = this.html();
      shadow.appendChild(template.content.cloneNode(true));
    }
  }
}