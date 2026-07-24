import { element, property, dispatch, render, styles, html, css as cssTag } from 'snice';
import { renderIcon } from '../utils';
import '../empty-state/snice-empty-state';
import cssContent from './snice-notification-center.css?inline';
import type { NotificationItem, SniceNotificationCenterElement } from './snice-notification-center.types';

const DEFAULT_TYPE_ICONS: Record<string, string> = {
  success: 'check-circle',
  warning: 'exclamation-triangle',
  error: 'x-circle',
  info: 'info-circle',
};

@element('snice-notification-center')
export class SniceNotificationCenter extends HTMLElement implements SniceNotificationCenterElement {
  @property({ type: Array, attribute: false })
  notifications: NotificationItem[] = [];

  @property({ type: Boolean })
  open = false;

  @property()
  placement: 'start' | 'end' = 'end';

  @property()
  icon = '';

  @dispatch('notification-click', { bubbles: true, composed: true })
  private emitNotificationClick(notification: NotificationItem) {
    return { notification };
  }

  @dispatch('notification-dismiss', { bubbles: true, composed: true })
  private emitNotificationDismiss(id: string) {
    return { id };
  }

  @dispatch('notification-read-all', { bubbles: true, composed: true })
  private emitReadAll() {
    return undefined;
  }

  private get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.emitReadAll();
  }

  dismiss(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.emitNotificationDismiss(id);
  }

  private togglePanel() {
    this.open = !this.open;
  }

  private handleItemClick(notification: NotificationItem) {
    if (!notification.read) {
      this.markAsRead(notification.id);
    }
    this.emitNotificationClick(notification);
  }

  private handleDismiss(e: Event, id: string) {
    e.stopPropagation();
    this.dismiss(id);
  }

  private getDefaultIcon(type?: string): string {
    return DEFAULT_TYPE_ICONS[type ?? 'info'] ?? DEFAULT_TYPE_ICONS.info;
  }

  @render()
  template() {
    const unread = this.unreadCount;

    const items = this.notifications.map(n => html`
      <li class="notification-item ${n.read ? '' : 'unread'}"
          @click=${() => this.handleItemClick(n)}>
        <span class="notification-icon notification-icon--${n.type || 'info'}">${renderIcon(n.icon || this.getDefaultIcon(n.type), 'notification-icon-img')}</span>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${n.timestamp}</div>
        </div>
        <button class="dismiss-btn"
                aria-label="Dismiss"
                @click=${(e: Event) => this.handleDismiss(e, n.id)}>${renderIcon('x-mark', 'dismiss-icon')}</button>
      </li>
    `);

    return html`
      <button part="trigger" class="bell-button"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded="${this.open ? 'true' : 'false'}"
              aria-controls="snice-notif-panel"
              @click=${() => this.togglePanel()}>
        <snice-badge count=${unread} variant="error" size="small" position="top-right">
          <span class="bell-icon" part="icon">
            <slot name="icon">
              ${renderIcon(this.icon || 'bell', 'bell-icon-img')}
            </slot>
          </span>
        </snice-badge>
      </button>
      <div part="panel" class="panel panel--${this.placement}" ?hidden=${!this.open}
           id="snice-notif-panel" role="dialog" aria-modal="false"
           aria-labelledby="snice-notif-title">
        <div part="panel-header" class="panel-header">
          <span class="panel-title" id="snice-notif-title">Notifications</span>
          <button class="mark-all-btn" @click=${() => this.markAllAsRead()}>Mark all read</button>
        </div>
        ${this.notifications.length > 0
          ? html`<ul class="notification-list">${items}</ul>`
          : html`<snice-empty-state icon="bell" title="No notifications" size="small" style="padding: 2rem 1rem;"></snice-empty-state>`
        }
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
