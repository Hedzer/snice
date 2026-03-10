import { useState, useEffect, useCallback } from 'react';
import { useSniceContext, Card, Input, Button, Switch, Alert } from 'snice/react';

export function SettingsPage() {
  const ctx = useSniceContext();
  const principal = ctx.application.principal;
  const user = principal?.user;

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('app-theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false';
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const setTheme = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    if (newTheme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notifications-enabled', String(next));
      return next;
    });
  }, []);

  const saveSettings = useCallback(() => {
    ctx.application.refreshAuth();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [ctx.application]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveSettings();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveSettings]);

  return (
    <div className="page-container-narrow">
      <h1 style={{ margin: '0 0 0.25rem 0', color: 'var(--snice-color-primary)' }}>Settings</h1>
      <p style={{ margin: '0 0 2rem 0', fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)' }}>
        Press Ctrl+S to save
      </p>

      {saved && (
        <Alert variant="success" dismissible style={{ marginBottom: '1.5rem' }}>
          Settings saved successfully!
        </Alert>
      )}

      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--snice-color-primary)' }}>Profile</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--snice-color-text)'
          }}>Display Name</label>
          <Input
            value={displayName}
            onInput={(e: any) => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--snice-color-text)'
          }}>Email</label>
          <Input
            value={email}
            onInput={(e: any) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: '100%' }}
          />
        </div>
      </Card>

      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--snice-color-primary)' }}>Appearance</h3>
        <div className="theme-options" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="theme-icon">&#9728;&#65039;</span>
            Light
          </button>
          <button
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <span className="theme-icon">&#127769;</span>
            Dark
          </button>
          <button
            className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <span className="theme-icon">&#128187;</span>
            System
          </button>
        </div>
      </Card>

      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--snice-color-primary)' }}>Notifications</h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--snice-color-text)' }}>
              Push Notifications
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)' }}>
              Receive real-time notification alerts
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onChange={toggleNotifications}
          />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={saveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
