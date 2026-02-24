import { controller, respond } from 'snice';
import { getNotificationsDaemon } from '../daemons/notifications';
import type { Notification } from '../types/notifications';

@controller('notification-controller')
export class NotificationController {
  element!: HTMLElement;
  private notifications: Notification[] = [];
  private unsubscribe: (() => void) | null = null;

  async attach(el: HTMLElement) {
    this.element = el;
    const daemon = getNotificationsDaemon();
    this.unsubscribe = daemon.subscribe((notification) => {
      this.notifications = [notification, ...this.notifications];
    });
  }

  async detach() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  @respond('get-notifications')
  handleGetNotifications() {
    return this.notifications;
  }

  @respond('clear-notifications')
  handleClearNotifications() {
    this.notifications = [];
    return { cleared: true };
  }

  @respond('dismiss-notification')
  handleDismissNotification(payload: { id: string }) {
    this.notifications = this.notifications.filter(n => n.id !== payload.id);
    return { dismissed: true };
  }
}
