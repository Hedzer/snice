import { useRef, useState } from 'react';
import { useSniceContext, useNavigate, Login, useRequestHandler } from 'snice/react';
import 'snice/components/login/snice-login';

export function LoginPage() {
  const ctx = useSniceContext();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useRequestHandler(containerRef, {
    'login-user': async (credentials: { username: string; password: string }) => {
      setError('');
      try {
        await ctx.application.login(credentials.username, credentials.password);
        navigate('/dashboard');
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        return { success: false, error: message };
      }
    }
  });

  return (
    <div className="login-page" ref={containerRef}>
      <Login
        variant="card"
        size="medium"
        title={'{{projectName}}'}
        actionText="Sign In"
        showForgotPassword={false}
        alertMessage={error}
        alertVariant={error ? 'error' : undefined}
      >
        <p slot="subtitle">Sign in to your account</p>
        <div slot="footer">
          <p className="hint">Demo credentials:</p>
          <p className="hint"><strong>Email:</strong> demo@example.com</p>
          <p className="hint"><strong>Password:</strong> demo</p>
        </div>
      </Login>
    </div>
  );
}
