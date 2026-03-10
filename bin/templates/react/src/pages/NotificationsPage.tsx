import { useState, useEffect, useCallback } from 'react';
import { useSniceContext, Alert, Button, EmptyState } from 'snice/react';
import type { NotificationsDaemon } from '../daemons/notifications';
import type { Notification, NotificationType } from '../types/notifications';

function getVariant(type: string): string {
  const variants: Record<string, string> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger'
  };
  return variants[type] || 'info';
}

export function NotificationsPage() {
  const ctx = useSniceContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    const daemon = ctx.application.notifications as NotificationsDaemon | undefined;
    if (!daemon) return;

    const unsubscribe = daemon.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return unsubscribe;
  }, [ctx.application.notifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Keyboard shortcut: Ctrl+Backspace to clear all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Backspace') {
        clearAll();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearAll]);

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  return (
    <div className="page-container-narrow">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--snice-color-primary)' }}>Notifications</h1>
          <span style={{ fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)' }}>
            {notifications.length} total
          </span>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" size="small" onClick={clearAll}>
            Clear All (Ctrl+Backspace)
          </Button>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="filters" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['all', 'info', 'success', 'warning', 'error'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon="&#128276;"
          title="No notifications"
          description="You'll see live notifications here as they arrive"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredNotifications.map(notification => (
            <Alert
              key={notification.id}
              variant={getVariant(notification.type)}
              dismissible
              className="notification-slide-in"
              onAlertDismiss={() => removeNotification(notification.id)}
            >
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                {notification.title}
              </strong>
              <p style={{ margin: '0 0 0.5rem 0' }}>{notification.message}</p>
              <small style={{ opacity: 0.7 }}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </small>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
