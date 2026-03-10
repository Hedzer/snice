import { useState, useEffect } from 'react';
import { useSniceContext, Card, Button } from 'snice/react';
import type { NotificationsDaemon } from '../daemons/notifications';

export function DashboardPage() {
  const ctx = useSniceContext();
  const principal = ctx.application.principal;
  const userName = principal?.user?.name || 'User';
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const daemon = ctx.application.notifications as NotificationsDaemon | undefined;
    if (!daemon) return;

    const unsubscribe = daemon.subscribe(() => {
      setNotificationCount(prev => prev + 1);
    });

    return unsubscribe;
  }, [ctx.application.notifications]);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--snice-color-primary)', margin: '0 0 0.5rem 0' }}>
          Welcome, {userName}!
        </h1>
        <p style={{ color: 'var(--snice-color-text-secondary)', margin: 0 }}>
          This is your dashboard
        </p>
      </div>

      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '2rem', fontWeight: 700, color: 'var(--snice-color-primary)' }}>4</span>
          <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)', marginTop: '0.25rem' }}>Active Pages</span>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '2rem', fontWeight: 700, color: 'var(--snice-color-primary)' }}>{notificationCount}</span>
          <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)', marginTop: '0.25rem' }}>Notifications</span>
        </Card>
        <Card style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '2rem', fontWeight: 700, color: 'var(--snice-color-primary)' }}>3</span>
          <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--snice-color-text-secondary)', marginTop: '0.25rem' }}>Middleware</span>
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>Features</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li style={{ margin: '0.5rem 0' }}>JWT Authentication</li>
            <li style={{ margin: '0.5rem 0' }}>Protected Routes with Guards</li>
            <li style={{ margin: '0.5rem 0' }}>Middleware Pattern</li>
            <li style={{ margin: '0.5rem 0' }}>Live Notifications</li>
            <li style={{ margin: '0.5rem 0' }}>Theme Switching</li>
            <li style={{ margin: '0.5rem 0' }}>Debounced Search</li>
            <li style={{ margin: '0.5rem 0' }}>React + Snice Integration</li>
          </ul>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>Architecture</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li style={{ margin: '0.5rem 0' }}><strong>Pages:</strong> React components</li>
            <li style={{ margin: '0.5rem 0' }}><strong>Components:</strong> Snice adapters + React</li>
            <li style={{ margin: '0.5rem 0' }}><strong>Services:</strong> Business logic</li>
            <li style={{ margin: '0.5rem 0' }}><strong>Middleware:</strong> Fetch interceptors</li>
            <li style={{ margin: '0.5rem 0' }}><strong>Daemons:</strong> Lifecycle classes</li>
            <li style={{ margin: '0.5rem 0' }}><strong>Guards:</strong> Route protection</li>
          </ul>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>React Hooks</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li style={{ margin: '0.5rem 0' }}><code>useSniceContext()</code> - App state</li>
            <li style={{ margin: '0.5rem 0' }}><code>useNavigate()</code> - Navigation</li>
            <li style={{ margin: '0.5rem 0' }}><code>useParams()</code> - Route params</li>
            <li style={{ margin: '0.5rem 0' }}><code>useRoute()</code> - Current route</li>
          </ul>
        </Card>

        <Card style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>Explore</h3>
          <p style={{ color: 'var(--snice-color-text-secondary)', margin: '0 0 0.5rem 0' }}>Check out the other pages:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <a href="#/data" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ width: '100%' }}>Browse Data</Button>
            </a>
            <a href="#/settings" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ width: '100%' }}>Settings</Button>
            </a>
            <a href="#/notifications" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ width: '100%' }}>Notifications</Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
