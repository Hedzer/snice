import { element, property, watch, query, ready } from '../../src/index';
import css from './snice-badge.css?inline';
import type { BadgeVariant, BadgePosition, BadgeSize, SniceBadgeElement } from './snice-badge.types';

@element('snice-badge')
export class SniceBadge extends HTMLElement implements SniceBadgeElement {
  @property({ reflect: true })
  content = '';

  @property({ type: Number, reflect: true })
  count = 0;

  @property({ type: Number, reflect: true })
  max = 99;

  @property({ type: Boolean, reflect: true })
  dot = false;

  @property({ reflect: true })
  variant: BadgeVariant = 'default';

  @property({ reflect: true })
  position: BadgePosition = 'top-right';

  @property({ type: Boolean, reflect: true })
  inline = false;

  @property({ reflect: true })
  size: BadgeSize = 'medium';

  @property({ type: Boolean, reflect: true })
  pulse = false;

  @property({ type: Number, reflect: true })
  offset = 0;

  @query('.badge')
  badgeElement?: HTMLElement;

  html() {
    const displayContent = this.getDisplayContent();
    const showBadge = this.shouldShowBadge();
    
    return /*html*/`
      <div class="badge-wrapper">
        <slot></slot>
        ${showBadge ? /*html*/`
          <span class="badge ${this.dot ? 'badge--dot' : ''} ${this.pulse ? 'badge--pulse' : ''}" 
                aria-label="${displayContent}"
                role="status">
            ${!this.dot ? displayContent : ''}
          </span>
        ` : ''}
      </div>
    `;
  }

  css() {
    return css;
  }

  private getDisplayContent(): string {
    if (this.dot) return 'notification';
    if (this.content) return this.content;
    if (this.count > 0) {
      return this.count > this.max ? `${this.max}+` : String(this.count);
    }
    return '';
  }

  private shouldShowBadge(): boolean {
    return this.dot || this.content !== '' || this.count > 0;
  }

  @ready()
  init() {
    this.updateOffset();
  }

  @watch('content', 'count', 'max', 'dot')
  updateBadge() {
    // Check if we need to re-render the entire component
    const shouldShow = this.shouldShowBadge();
    const badgeExists = !!this.badgeElement;
    
    if (shouldShow !== badgeExists) {
      // Need to re-render the entire shadow DOM
      this.render();
      return;
    }
    
    if (!this.badgeElement) return;
    
    const displayContent = this.getDisplayContent();
    if (this.dot) {
      this.badgeElement.textContent = '';
      this.badgeElement.classList.add('badge--dot');
    } else {
      this.badgeElement.textContent = displayContent;
      this.badgeElement.classList.remove('badge--dot');
    }
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
      
      // Don't try to set badgeElement - the @query decorator will handle it
      // The getter will automatically find the new element
    }
  }

  @watch('pulse')
  updatePulse() {
    if (!this.badgeElement) return;
    this.badgeElement.classList.toggle('badge--pulse', this.pulse);
  }

  @watch('offset')
  updateOffset() {
    this.style.setProperty('--badge-offset', `${this.offset}px`);
  }

  setBadgeContent(content: string) {
    this.content = content;
    this.count = 0;
    this.dot = false;
  }

  setBadgeCount(count: number) {
    this.count = count;
    this.content = '';
    this.dot = false;
  }

  showDot() {
    this.dot = true;
    this.content = '';
    this.count = 0;
  }

  hide() {
    this.dot = false;
    this.content = '';
    this.count = 0;
  }
}