import { element, property, render, styles, html, css } from 'snice';

@element('notification-badge')
export class NotificationBadge extends HTMLElement {
  @property({ type: Number }) count = 0;

  @render()
  renderContent() {
    return html`
      <if ${this.count > 0}>
        <span class="badge">${this.count > 99 ? '99+' : this.count}</span>
      </if>
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
