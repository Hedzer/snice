import { element, property, query, dispatch, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-message-strip.css?inline';
import type { MessageStripVariant, SniceMessageStripElement } from './snice-message-strip.types';

@element('snice-message-strip')
export class SniceMessageStrip extends HTMLElement implements SniceMessageStripElement {
  @property()
  variant: MessageStripVariant = 'info';

  @property({ type: Boolean })
  dismissable = false;

  @property()
  icon = '';

  @query('.message-strip')
  stripElement?: HTMLElement;

  private isHidden = false;

  @render()
  renderContent() {
    const hasIcon = this.icon ? this.icon !== 'none' : true;
    const showDefaultIcon = !this.icon || this.icon === 'none';
    const iconClasses = showDefaultIcon ? 'message-strip-icon message-strip-icon--default' : 'message-strip-icon';
    const classes = [
      'message-strip',
      this.isHidden ? 'message-strip--hidden' : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${classes}" role="status" aria-live="polite" @animationend=${this.handleAnimationEnd}>
        <if ${hasIcon}>
          <div class="${iconClasses}" part="icon">
            <slot name="icon">
              ${this.icon && this.icon !== 'none' ? renderIcon(this.icon, 'message-strip-icon-content') : ''}
            </slot>
          </div>
        </if>
        <div class="message-strip-content" part="content">
          <slot></slot>
        </div>
        <if ${this.dismissable}>
          <button class="message-strip-dismiss"
                  type="button"
                  aria-label="Dismiss"
                  part="dismiss"
                  @click=${this.handleDismiss}>
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

  @dispatch('dismiss', { bubbles: true, composed: true })
  private handleDismiss() {
    this.hide();
    return { variant: this.variant };
  }

  private handleAnimationEnd(event: AnimationEvent) {
    if (event.animationName === 'stripSlideOut') {
      this.isHidden = true;
      if (this.stripElement) {
        this.stripElement.classList.add('message-strip--hidden');
        this.stripElement.classList.remove('message-strip--hiding');
      }
    }
  }

  show() {
    this.isHidden = false;
    if (this.stripElement) {
      this.stripElement.classList.remove('message-strip--hidden', 'message-strip--hiding');
    }
  }

  hide() {
    if (this.stripElement && !this.isHidden) {
      this.stripElement.classList.add('message-strip--hiding');
    }
  }
}
