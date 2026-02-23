export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  icon?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface SniceNotificationCenterElement extends HTMLElement {
  notifications: NotificationItem[];
  markAsRead(id: string): void;
  markAllAsRead(): void;
  dismiss(id: string): void;
}

export interface SniceNotificationCenterEventMap {
  'notification-click': CustomEvent<{ notification: NotificationItem }>;
  'notification-dismiss': CustomEvent<{ id: string }>;
  'notification-read-all': CustomEvent<void>;
}
