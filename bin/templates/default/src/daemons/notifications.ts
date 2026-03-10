import type { Notification } from '../types/notifications';

type NotificationHandler = (notification: Notification) => void;

export class NotificationsDaemon {
  private ws: WebSocket | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private reconnectInterval: number = 5000;
  private reconnectTimer: number | null = null;
  private mockInterval: number | null = null;
  private url: string;
  private isStarted: boolean = false;

  constructor(url: string) {
    this.url = url;
  }

  start(): void {
    if (this.isStarted) return;
    this.isStarted = true;

    // For demo purposes, use mock notifications instead of real WebSocket
    // In production, uncomment the connect() line and remove startMockNotifications()
    // this.connect();
    this.startMockNotifications();
  }

  stop(): void {
    if (!this.isStarted) return;
    this.isStarted = false;

    this.stopMockNotifications();

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  dispose(): void {
    this.stop();
    this.handlers.clear();
  }

  subscribe(handler: NotificationHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.notify(notification);
        } catch (err) {
          console.error('Failed to parse notification:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (this.isStarted) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      if (this.isStarted) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  private notify(notification: Notification): void {
    this.handlers.forEach(handler => {
      try {
        handler(notification);
      } catch (err) {
        console.error('Notification handler error:', err);
      }
    });
  }

  // Mock notifications for demo
  private startMockNotifications(): void {
    const messages = [
      { title: 'Welcome!', message: 'Thanks for checking out the PWA template', type: 'info' as const },
      { title: 'New Feature', message: 'Check out the notifications page', type: 'success' as const },
      { title: 'System Update', message: 'A new version is available', type: 'info' as const },
      { title: 'Reminder', message: 'Don\'t forget to star the repo!', type: 'warning' as const }
    ];

    let index = 0;
    this.mockInterval = window.setInterval(() => {
      const notification: Notification = {
        id: `mock-${Date.now()}`,
        ...messages[index % messages.length],
        timestamp: new Date().toISOString()
      };
      this.notify(notification);
      index++;
    }, 10000); // Send notification every 10 seconds
  }

  private stopMockNotifications(): void {
    if (this.mockInterval !== null) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}
