// GENERATED FILE — DO NOT EDIT.
// Source: components/order-tracker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the OrderTracker component
 */
export interface OrderTrackerProps extends SniceBaseProps {
  steps?: any;
  trackingNumber?: any;
  carrier?: any;
  variant?: any;
  onStepClick?: (event: any) => void;
}

/**
 * OrderTracker - React adapter for snice-order-tracker
 *
 * This is an auto-generated React wrapper for the Snice order-tracker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/order-tracker/snice-order-tracker';
 * import { OrderTracker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <OrderTracker />;
 * }
 * ```
 */
export const OrderTracker: SniceReactComponent<OrderTrackerProps, SniceComponentRef> = createReactAdapter<OrderTrackerProps, false>({
  tagName: 'snice-order-tracker',
  properties: ["steps","trackingNumber","carrier","variant"],
  events: {"step-click":"onStepClick"},
  formAssociated: false
});
