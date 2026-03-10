import { useState, useEffect, useCallback } from 'react';
import { useSniceContext } from 'snice/react';
import { Avatar, Divider } from 'snice/react';
import { NotificationBadge } from './NotificationBadge';
import type { NotificationsDaemon } from '../daemons/notifications';

export function AppHeader() {
  const ctx = useSniceContext();
  const app = ctx.application;
  const principal = app.principal;
  const authenticated = principal?.isAuthenticated || false;
  const user = principal?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const daemon = app.notifications as NotificationsDaemon | undefined;
    if (!daemon) return;

    const unsubscribe = daemon.subscribe(() => {
      setNotificationCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [app.notifications]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await app.logout();
  };

  return (
    <header className="app-header">
      <div className="brand">
        <a href="#/">{'{{projectName}}'}</a>
      </div>

      {authenticated ? (
        <>
          <nav className="nav-links">
            <a href="#/dashboard">Dashboard</a>
            <a href="#/data">Data</a>
            <a href="#/notifications">
              <NotificationBadge count={notificationCount} />
              Notifications
            </a>
          </nav>

          <div className="user-section">
            <button className="user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <Avatar
                src={user?.avatar || ''}
                name={user?.name || ''}
                size="small"
              />
              <span className="user-name">{user?.name}</span>
            </button>

            {menuOpen && (
              <div className="user-menu">
                <a href="#/profile" onClick={() => setMenuOpen(false)}>Profile</a>
                <a href="#/settings" onClick={() => setMenuOpen(false)}>Settings</a>
                <Divider />
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <a href="#/login" className="login-link">Sign In</a>
      )}
    </header>
  );
}
