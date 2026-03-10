import { useState } from 'react';
import { SniceRouter, Route } from 'snice/react';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/AppLayout';
import { isAuthenticated } from './guards/auth';

export function App() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  const login = () => setUser({ name: 'Demo User' });
  const logout = () => setUser(null);

  return (
    <SniceRouter
      mode="hash"
      context={{ user, login, logout }}
      layout={AppLayout}
      fallback={<NotFound />}
    >
      <Route path="/" page={HomePage} />
      <Route path="/about" page={AboutPage} />
      <Route
        path="/settings"
        page={SettingsPage}
        guard={isAuthenticated}
        guardRedirect="/"
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
