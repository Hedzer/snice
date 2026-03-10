import { useState, useCallback } from 'react';
import { SniceRouter, Route } from 'snice/react';
import { isAuthenticated as checkAuth } from './services/auth';
import { getUser } from './services/storage';
import { login, logout } from './services/auth';
import { NotificationsDaemon } from './daemons/notifications';
import { isAuthenticated } from './guards/auth';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataPage } from './pages/DataPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { User } from './types/auth';

// In production, use actual WebSocket URL from env
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const notifications = new NotificationsDaemon(wsUrl);
notifications.start();

export function App() {
  const [authState, setAuthState] = useState(() => ({
    user: getUser<User>(),
    isAuthenticated: checkAuth()
  }));

  const refreshAuth = useCallback(() => {
    setAuthState({
      user: getUser<User>(),
      isAuthenticated: checkAuth()
    });
  }, []);

  const context = {
    principal: authState,
    notifications,
    refreshAuth,
    login: async (email: string, password: string) => {
      const result = await login({ email, password });
      refreshAuth();
      return result;
    },
    logout: async () => {
      await logout();
      refreshAuth();
    }
  };

  return (
    <SniceRouter
      mode="hash"
      context={context}
      layout={AppLayout}
      fallback={<NotFound />}
    >
      <Route path="/login" page={LoginPage} layout={false} />
      <Route
        path="/"
        page={DashboardPage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'dashboard', title: 'Dashboard', icon: '\ud83d\udcca', show: true, order: 1 }}
      />
      <Route
        path="/dashboard"
        page={DashboardPage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'dashboard', title: 'Dashboard', icon: '\ud83d\udcca', show: false }}
      />
      <Route
        path="/profile"
        page={ProfilePage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'profile', title: 'Profile', icon: '\ud83d\udc64', show: true, order: 2 }}
      />
      <Route
        path="/notifications"
        page={NotificationsPage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'notifications', title: 'Notifications', icon: '\ud83d\udd14', show: true, order: 3 }}
      />
      <Route
        path="/settings"
        page={SettingsPage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'settings', title: 'Settings', icon: '\u2699\ufe0f', show: true, order: 4 }}
      />
      <Route
        path="/data"
        page={DataPage}
        guard={isAuthenticated}
        guardRedirect="/login"
        placard={{ name: 'data', title: 'Data', icon: '\ud83d\udcca', show: true, order: 5 }}
      />
    </SniceRouter>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404</h1>
      <p>Page not found</p>
      <a href="#/">Go home</a>
    </div>
  );
}
