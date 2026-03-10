import { element, property, render, styles, html, css, watch, query } from 'snice';

@element('notification-badge')
export class NotificationBadge extends HTMLElement {
  @property({ type: Number }) count = 0;

  @query('.badge') $badge!: HTMLElement;

  @watch('count')
  onCountChange() {
    if (this.$badge) {
      this.$badge.textContent = this.count > 99 ? '99+' : String(this.count);
      this.$badge.style.display = this.count > 0 ? 'flex' : 'none';
    }
  }

  @render({ once: true })
  renderContent() {
    const display = this.count > 0 ? 'flex' : 'none';
    return html`
      <span class="badge" style="display: ${display}">${this.count}</span>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: inline-flex;
        position: relative;
      }

      .badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        background: var(--snice-color-danger);
        color: white;
        font-size: 0.6875rem;
        font-weight: 600;
        border-radius: 9px;
        line-height: 1;
      }
    `;
  }
}
