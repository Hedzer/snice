import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
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
 * import 'snice/components/toast/snice-toast';
 * import { Toast } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Toast />;
 * }
 * ```
 */
export declare const Toast: SniceReactComponent<ToastProps, SniceComponentRef>;
//# sourceMappingURL=toast.d.ts.map