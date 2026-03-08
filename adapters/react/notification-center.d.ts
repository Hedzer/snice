import type { SniceBaseProps } from './types';
/**
 * Props for the NotificationCenter component
 */
export interface NotificationCenterProps extends SniceBaseProps {
    notifications?: any;
    open?: any;
    icon?: any;
}
/**
 * NotificationCenter - React adapter for snice-notification-center
 *
 * This is an auto-generated React wrapper for the Snice notification-center component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/notification-center';
 * import { NotificationCenter } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NotificationCenter />;
 * }
 * ```
 */
export declare const NotificationCenter: import("react").ForwardRefExoticComponent<Omit<NotificationCenterProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=notification-center.d.ts.map