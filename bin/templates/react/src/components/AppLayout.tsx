import { type ReactNode } from 'react';
import { useSniceContext, useRoute } from 'snice/react';

export function AppLayout({ children }: { children: ReactNode }) {
  const ctx = useSniceContext();
  const route = useRoute();
  const user = ctx.application.user;

  return (
    <div className="app">
      <header className="app-header">
        <nav>
          <a href="#/" className={route === '/' ? 'active' : ''}>Home</a>
          <a href="#/about" className={route === '/about' ? 'active' : ''}>About</a>
          <a href="#/settings" className={route === '/settings' ? 'active' : ''}>Settings</a>
        </nav>
        <div className="auth">
          {user ? (
            <>
              <span>{user.name}</span>
              <button onClick={ctx.application.logout}>Logout</button>
            </>
          ) : (
            <button onClick={ctx.application.login}>Login</button>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
