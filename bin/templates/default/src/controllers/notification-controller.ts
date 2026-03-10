import { controller, respond, IController } from 'snice';
import type { Notification } from '../types/notifications';

@controller('notification-controller')
export class NotificationController implements IController {
  element: HTMLElement | null = null;
  private notifications: Notification[] = [];

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @respond('get-notifications')
  handleGetNotifications() {
    return this.notifications;
  }

  @respond('add-notification')
  handleAddNotification(notification: Notification) {
    this.notifications = [notification, ...this.notifications];
    return { added: true };
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
