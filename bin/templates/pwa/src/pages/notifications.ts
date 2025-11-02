import { page } from '../router';
import { render, styles, html, css, ready, dispose } from 'snice';
import type { Placard } from 'snice';
import { authGuard } from '../guards/auth';
import { getNotificationsDaemon } from '../daemons/notifications';
import type { Notification } from '../types/notifications';

const placard: Placard = {
  name: 'notifications',
  title: 'Notifications',
  icon: '🔔',
  show: true,
  order: 3
};

@page({ tag: 'notifications-page', routes: ['/notifications'], guards: [authGuard], placard })
export class NotificationsPage extends HTMLElement {
  notifications: Notification[] = [];
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

  getVariant(type: string): string {
    const variants: Record<string, string> = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };
    return variants[type] || 'info';
  }

  clearAll() {
    this.notifications = [];
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <div class="header">
          <h1>Notifications</h1>
          <if ${this.notifications.length > 0}>
            <snice-button
              variant="secondary"
              size="small"
              @click=${this.clearAll}
            >
              Clear All
            </snice-button>
          </if>
        </div>

        <if ${this.notifications.length === 0}>
          <snice-empty-state
            icon="🔔"
            title="No notifications"
            description="You'll see live notifications here as they arrive"
          ></snice-empty-state>
        </if>

        <if ${this.notifications.length > 0}>
          <div class="notifications">
            ${this.notifications.map(notification => html`
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
        </if>
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
        align-items: center;
        margin-bottom: 2rem;
      }

      h1 {
        margin: 0;
        color: var(--primary-color);
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
