import { useSniceContext } from 'snice/react';

export function HomePage() {
  const ctx = useSniceContext();
  const user = ctx.application.user;

  return (
    <div className="page">
      <h1>Welcome{user ? `, ${user.name}` : ''}</h1>
      <p>This is a React + Snice application.</p>
      {!user && (
        <p>
          <button onClick={ctx.application.login}>Login</button> to access settings.
        </p>
      )}
    </div>
  );
}
