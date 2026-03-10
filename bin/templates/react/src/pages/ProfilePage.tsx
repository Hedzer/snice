import { useSniceContext, Card, Avatar, Button, Divider, Spinner } from 'snice/react';

export function ProfilePage() {
  const ctx = useSniceContext();
  const principal = ctx.application.principal;
  const user = principal?.user;

  const handleLogout = async () => {
    await ctx.application.logout();
    window.location.hash = '#/login';
  };

  if (!user) {
    return (
      <div className="page-container-narrow">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-narrow">
      <Card style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', paddingBottom: '1.5rem' }}>
          <Avatar
            src={user.avatar || ''}
            name={user.name}
            size="large"
            style={{ marginBottom: '1rem' }}
          />
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--snice-color-primary)' }}>{user.name}</h1>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-text-secondary)' }}>{user.email}</p>
          <a href="#/settings" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="small">Edit Profile</Button>
          </a>
        </div>

        <Divider style={{ margin: '0.5rem 0' }} />

        <div style={{ paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'var(--snice-color-background-secondary)',
              borderRadius: 'var(--snice-border-radius-md)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--snice-color-text)' }}>User ID</span>
              <span style={{ color: 'var(--snice-color-text-secondary)' }}>{user.id}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'var(--snice-color-background-secondary)',
              borderRadius: 'var(--snice-border-radius-md)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--snice-color-text)' }}>Email</span>
              <span style={{ color: 'var(--snice-color-text-secondary)' }}>{user.email}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'var(--snice-color-background-secondary)',
              borderRadius: 'var(--snice-border-radius-md)'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--snice-color-text)' }}>Name</span>
              <span style={{ color: 'var(--snice-color-text-secondary)' }}>{user.name}</span>
            </div>
          </div>
        </div>

        <Divider style={{ margin: '0.5rem 0' }} />

        <div style={{ paddingTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-primary)' }}>Session</h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--snice-color-text-secondary)' }}>
            You are currently logged in with JWT authentication.
          </p>
          <Button variant="danger" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
