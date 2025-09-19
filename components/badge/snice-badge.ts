import { element, property, watch, query, ready, part } from 'snice';
import css from './snice-badge.css?inline';
import type { BadgeVariant, BadgePosition, BadgeSize, SniceBadgeElement } from './snice-badge.types';

@element('snice-badge')
export class SniceBadge extends HTMLElement implements SniceBadgeElement {
  @property({  })
  content = '';

  @property({ type: Number,  })
  count = 0;

  @property({ type: Number,  })
  max = 99;

  @property({ type: Boolean,  })
  dot = false;

  @property({  })
  variant: BadgeVariant = 'default';

  @property({  })
  position: BadgePosition = 'top-right';

  @property({ type: Boolean,  })
  inline = false;

  @property({  })
  size: BadgeSize = 'medium';

  @property({ type: Boolean,  })
  pulse = false;

  @property({ type: Number,  })
  offset = 0;

  @query('.badge')
  badgeElement?: HTMLElement;

  html() {
    return /*html*/`
      <div class="badge-wrapper">
        <slot></slot>
        <div part="badge-section"></div>
      </div>
    `;
  }

  @watch('content', 'count', 'max', 'dot', 'pulse')
  @part('badge-section')
  renderBadgeSection() {
    const displayContent = this.getDisplayContent();
    const showBadge = this.shouldShowBadge();
    
    if (!showBadge) return '';
    
    return /*html*/`
      <span class="badge ${this.dot ? 'badge--dot' : ''} ${this.pulse ? 'badge--pulse' : ''}" 
            aria-label="${displayContent}"
            role="status">
        ${!this.dot ? displayContent : ''}
      </span>
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