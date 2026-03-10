import { useSniceContext } from 'snice/react';

export function SettingsPage() {
  const ctx = useSniceContext();

  return (
    <div className="page">
      <h1>Settings</h1>
      <p>Welcome, {ctx.application.user?.name}. This page is guard-protected.</p>
      <p>Only authenticated users can access this page.</p>
    </div>
  );
}
