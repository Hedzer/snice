import { page } from '../router';
import { render, styles, html, css, ready, dispose, watch, on } from 'snice';
import type { Placard } from 'snice';
import { isAuthenticated } from '../guards/auth';
import { getNotificationsDaemon } from '../daemons/notifications';
import type { Notification, NotificationType } from '../types/notifications';

const placard: Placard = {
  name: 'notifications',
  title: 'Notifications',
  icon: '\ud83d\udd14',
  show: true,
  order: 3
};

@page({ tag: 'notifications-page', routes: ['/notifications'], guards: [isAuthenticated], placard })
export class NotificationsPage extends HTMLElement {
  notifications: Notification[] = [];
  filter: NotificationType | 'all' = 'all';
  private unsubscribe: (() => void) | null = null;

  @ready()
  initialize() {
    const daemon = getNotificationsDaemon();
    this.unsubscribe = daemon.subscribe((notification) => {
      this.notifications = [notification, ...this.notifications];
    });
  }

  @dispose()
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  @watch('filter')
  onFilterChange() {
    // Re-render triggers automatically via property change
  }

  get filteredNotifications(): Notification[] {
    if (this.filter === 'all') return this.notifications;
    return this.notifications.filter(n => n.type === this.filter);
  }

  getVariant(type: string): string {
    const variants: Record<string, string> = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };
    return variants[type] || 'info';
  }

  @on('keydown:ctrl+Backspace')
  clearAll() {
    this.notifications = [];
  }

  setFilter(filter: NotificationType | 'all') {
    this.filter = filter;
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  @render()
  renderContent() {
    const filtered = this.filteredNotifications;
    const hasNotifications = filtered.length > 0;
    const isEmpty = filtered.length === 0;

    return html`
      <div class="container">
        <div class="header">
          <div>
            <h1>Notifications</h1>
            <span class="count">${this.notifications.length} total</span>
          </div>
          <if ${this.notifications.length > 0}>
            <snice-button
              variant="secondary"
              size="small"
              @click=${this.clearAll}
            >
              Clear All (Ctrl+Backspace)
            </snice-button>
          </if>
        </div>

        <if ${this.notifications.length > 0}>
          <div class="filters">
            <button
              class="filter-btn ${this.filter === 'all' ? 'active' : ''}"
              @click=${() => this.setFilter('all')}
            >All</button>
            <button
              class="filter-btn ${this.filter === 'info' ? 'active' : ''}"
              @click=${() => this.setFilter('info')}
            >Info</button>
            <button
              class="filter-btn ${this.filter === 'success' ? 'active' : ''}"
              @click=${() => this.setFilter('success')}
            >Success</button>
            <button
              class="filter-btn ${this.filter === 'warning' ? 'active' : ''}"
              @click=${() => this.setFilter('warning')}
            >Warning</button>
            <button
              class="filter-btn ${this.filter === 'error' ? 'active' : ''}"
              @click=${() => this.setFilter('error')}
            >Error</button>
          </div>
        </if>

        <case ${isEmpty ? 'empty' : 'list'}>
          <when value="empty">
            <snice-empty-state
              icon="\ud83d\udd14"
              title="No notifications"
              description="You'll see live notifications here as they arrive"
            ></snice-empty-state>
          </when>
          <default>
            <div class="notifications">
              ${filtered.map(notification => html`
                <snice-alert
                  key=${notification.id}
                  variant="${this.getVariant(notification.type)}"
                  dismissible
                  @dismiss=${() => this.removeNotification(notification.id)}
                >
                  <strong>${notification.title}</strong>
                  <p>${notification.message}</p>
                  <small>${new Date(notification.timestamp).toLocaleTimeString()}</small>
                </snice-alert>
              `)}
            </div>
          </default>
        </case>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .container {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      h1 {
        margin: 0;
        color: var(--primary-color);
      }

      .count {
        font-size: 0.8125rem;
        color: var(--text-light);
      }

      .filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      .filter-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        color: var(--text-light);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.15s;
      }

      .filter-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .filter-btn.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .notifications {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      snice-alert {
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      snice-alert strong {
        display: block;
        margin-bottom: 0.5rem;
      }

      snice-alert p {
        margin: 0 0 0.5rem 0;
      }

      snice-alert small {
        opacity: 0.7;
      }
    `;
  }
}
