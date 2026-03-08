import { createReactAdapter } from './wrapper';
/**
 * Login - React adapter for snice-login
 *
 * This is an auto-generated React wrapper for the Snice login component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/login';
 * import { Login } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Login />;
 * }
 * ```
 */
export const Login = createReactAdapter({
    tagName: 'snice-login',
    properties: ["variant", "size", "title", "disabled", "loading", "showRememberMe", "showForgotPassword", "actionText", "alertMessage", "alertVariant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=login.js.map