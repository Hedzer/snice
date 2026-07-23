// GENERATED FILE — DO NOT EDIT.
// Source: components/login/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Login component
 */
export interface LoginProps extends SniceBaseProps {
  variant?: any;
  size?: any;
  title?: any;
  disabled?: any;
  loading?: any;
  showRememberMe?: any;
  showForgotPassword?: any;
  actionText?: any;
  alertMessage?: any;
  alertVariant?: any;
  onLoginAttempt?: (event: any) => void;
  onLoginForgotPassword?: (event: any) => void;
  onLoginSuccess?: (event: any) => void;
  onLoginError?: (event: any) => void;
}

/**
 * Login - React adapter for snice-login
 *
 * This is an auto-generated React wrapper for the Snice login component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/login/snice-login';
 * import { Login } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Login />;
 * }
 * ```
 */
export const Login: SniceReactComponent<LoginProps, SniceComponentRef> = createReactAdapter<LoginProps, false>({
  tagName: 'snice-login',
  properties: ["variant","size","title","disabled","loading","showRememberMe","showForgotPassword","actionText","alertMessage","alertVariant"],
  events: {"login-attempt":"onLoginAttempt","login-forgot-password":"onLoginForgotPassword","login-success":"onLoginSuccess","login-error":"onLoginError"},
  formAssociated: false
});
