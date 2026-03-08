import type { SniceBaseProps } from './types';
/**
 * Props for the Toast component
 */
export interface ToastProps extends SniceBaseProps {
    type?: any;
    message?: any;
    closable?: any;
    icon?: any;
    onCloseToast?: (event: any) => void;
}
/**
 * Toast - React adapter for snice-toast
 *
 * This is an auto-generated React wrapper for the Snice toast component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/toast';
 * import { Toast } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Toast />;
 * }
 * ```
 */
export declare const Toast: import("react").ForwardRefExoticComponent<Omit<ToastProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=toast.d.ts.map