import { element, property, watch, dispatch, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-banner.css?inline';
import type { BannerVariant, BannerPosition, SniceBannerElement } from './snice-banner.types';

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

  @watch('open')
  updateOpenAttribute() {
    if (this.open) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
  }

  @render()
  render() {
    const bannerClasses = ['banner', `banner--${this.variant}`].filter(Boolean).join(' ');

    const defaultIcons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    const displayIcon = this.icon || defaultIcons[this.variant];

    return html/*html*/`
      <div class="${bannerClasses}" role="alert" part="banner">
        <if ${displayIcon}>
          ${renderIcon(displayIcon, 'banner__icon')}
        </if>

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
          >✕</button>
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

  @watch('open')
  handleOpenChange() {
    if (this.open) {
      this.dispatchOpenEvent();
    } else {
      this.dispatchCloseEvent();
    }
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
