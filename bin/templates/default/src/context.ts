import type { Principal } from './types/auth';
import { getUser } from './services/storage';
import { isAuthenticated } from './services/auth';
import { NotificationsDaemon } from './daemons/notifications';

// In production, use actual WebSocket URL from env
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const notifications = new NotificationsDaemon(wsUrl);
notifications.start();

export const appContext = {
  principal: {
    get user() { return getUser(); },
    get isAuthenticated() { return isAuthenticated(); }
  } as Principal,
  notifications
};
