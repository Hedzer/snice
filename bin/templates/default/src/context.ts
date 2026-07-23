import type { AppContext as SniceAppContext } from 'snice';
import type { Principal, User } from './types/auth';
import { getUser } from './services/storage';
import { isAuthenticated } from './services/auth';
import { NotificationsDaemon } from './daemons/notifications';

export interface ApplicationContext extends SniceAppContext {
  principal: Principal;
  notifications: NotificationsDaemon;
}

// In production, use actual WebSocket URL from env
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const notifications = new NotificationsDaemon(wsUrl);
notifications.start();

export const appContext: ApplicationContext = {
  principal: {
    get user() { return getUser<User>(); },
    get isAuthenticated() { return isAuthenticated(); }
  },
  notifications
};
