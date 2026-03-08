import type { SniceBaseProps } from './types';
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
}
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
export declare const Login: import("react").ForwardRefExoticComponent<Omit<LoginProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=login.d.ts.map