import type { SniceBaseProps } from './types';
/**
 * Props for the OrderTracker component
 */
export interface OrderTrackerProps extends SniceBaseProps {
    steps?: any;
    trackingNumber?: any;
    carrier?: any;
    variant?: any;
}
/**
 * OrderTracker - React adapter for snice-order-tracker
 *
 * This is an auto-generated React wrapper for the Snice order-tracker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/order-tracker';
 * import { OrderTracker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrderTracker />;
 * }
 * ```
 */
export declare const OrderTracker: import("react").ForwardRefExoticComponent<Omit<OrderTrackerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=order-tracker.d.ts.map