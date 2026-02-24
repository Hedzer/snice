import { element, property, render, styles, ready, dispose, html, css, watch, query } from 'snice';
import { getNotificationsDaemon } from '../daemons/notifications';

@element('notification-badge')
export class NotificationBadge extends HTMLElement {
  @property({ type: Number }) count = 0;

  private unsubscribe: (() => void) | null = null;

  @query('.badge') $badge!: HTMLElement;

  @ready()
  initialize() {
    const daemon = getNotificationsDaemon();
    this.unsubscribe = daemon.subscribe(() => {
      this.count++;
    });
  }

  @dispose()
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

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
        background: var(--danger-color);
        color: white;
        font-size: 0.6875rem;
        font-weight: 600;
        border-radius: 9px;
        line-height: 1;
      }
    `;
  }
}
