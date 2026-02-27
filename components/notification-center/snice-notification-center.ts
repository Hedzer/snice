import { element, property, dispatch, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-notification-center.css?inline';
import type { NotificationItem, SniceNotificationCenterElement } from './snice-notification-center.types';

@element('snice-notification-center')
export class SniceNotificationCenter extends HTMLElement implements SniceNotificationCenterElement {
  @property({ type: Array })
  notifications: NotificationItem[] = [];

  @property({ type: Boolean })
  open = false;

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
    switch (type) {
      case 'success': return '\u2705';
      case 'warning': return '\u26A0\uFE0F';
      case 'error': return '\u274C';
      default: return '\u2139\uFE0F';
    }
  }

  @render()
  template() {
    const unread = this.unreadCount;

    const items = this.notifications.map(n => html`
      <li class="notification-item ${n.read ? '' : 'unread'}"
          @click=${() => this.handleItemClick(n)}>
        <span class="notification-icon">${n.icon || this.getDefaultIcon(n.type)}</span>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-time">${n.timestamp}</div>
        </div>
        <button class="dismiss-btn"
                aria-label="Dismiss"
                @click=${(e: Event) => this.handleDismiss(e, n.id)}>\u2715</button>
      </li>
    `);

    return html`
      <button part="trigger" class="bell-button" aria-label="Notifications" @click=${() => this.togglePanel()}>
        \uD83D\uDD14
        <span part="badge" class="badge" ?hidden=${unread === 0}>${unread}</span>
      </button>
      <div part="panel" class="panel" ?hidden=${!this.open}>
        <div part="panel-header" class="panel-header">
          <span class="panel-title">Notifications</span>
          <button class="mark-all-btn" @click=${() => this.markAllAsRead()}>Mark all read</button>
        </div>
        ${this.notifications.length > 0
          ? html`<ul class="notification-list">${items}</ul>`
          : html`<div class="empty-state">No notifications</div>`
        }
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
