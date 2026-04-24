import { element, property, watch, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import { renderIcon } from '../utils';
import { INFO_CIRCLE_SOLID, CHECK_CIRCLE_SOLID, EXCLAMATION_TRIANGLE_SOLID, X_CIRCLE_SOLID } from '../icons';
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

    const defaultSvg = DEFAULT_BANNER_ICONS[this.variant];

    return html/*html*/`
      <div class="${bannerClasses}" role="alert" part="banner">
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
