import { element, property, watch, query, ready, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-badge.css?inline';
import type { BadgeVariant, BadgePosition, BadgeSize, SniceBadgeElement } from './snice-badge.types';
import { pickContrastColor, onThemeChange } from '../utils';

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

  @render()
  render() {
    const displayContent = this.getDisplayContent();
    const showBadge = this.shouldShowBadge();
    const badgeClasses = `badge${this.dot ? ' badge--dot' : ''}${this.pulse ? ' badge--pulse' : ''}`;

    return html/*html*/`
      <div part="base" class="badge-wrapper">
        <slot></slot>
        <if ${showBadge}>
          <span part="badge" class="${badgeClasses}"
                aria-label="${displayContent}"
                role="status">
            <if ${!this.dot}>${displayContent}</if>
          </span>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
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

  private themeUnsubscribe?: () => void;

  @ready()
  init() {
    this.updateOffset();
    this.applyAutoContrastColor();
    this.themeUnsubscribe = onThemeChange(() => this.applyAutoContrastColor());
  }

  @dispose()
  teardown() {
    this.themeUnsubscribe?.();
  }

  @watch('offset')
  updateOffset() {
    this.style.setProperty('--badge-offset', `${this.offset}px`);
  }

  @watch('variant', 'dot', 'content', 'count')
  applyAutoContrastColor() {
    // If the consumer set an explicit text color on <snice-badge>, let it
    // win. Otherwise compute from the actual resolved background — this
    // covers theme swaps, custom CSS var overrides, and dot/not-dot cases.
    const explicit = this.style.color;
    if (explicit) return;
    const badge = this.badgeElement;
    if (!badge) return;
    const bg = getComputedStyle(badge).backgroundColor;
    badge.style.color = pickContrastColor(bg);
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