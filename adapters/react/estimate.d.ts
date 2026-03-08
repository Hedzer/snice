import type { SniceBaseProps } from './types';
/**
 * Props for the Estimate component
 */
export interface EstimateProps extends SniceBaseProps {
    estimateNumber?: any;
    date?: any;
    expiryDate?: any;
    status?: any;
    from?: any;
    to?: any;
    items?: any;
    currency?: any;
    taxRate?: any;
    discount?: any;
    notes?: any;
    terms?: any;
    variant?: any;
    showQr?: any;
    qrData?: any;
    qrPosition?: any;
}
/**
 * Estimate - React adapter for snice-estimate
 *
 * This is an auto-generated React wrapper for the Snice estimate component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/estimate';
 * import { Estimate } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Estimate />;
 * }
 * ```
 */
export declare const Estimate: import("react").ForwardRefExoticComponent<Omit<EstimateProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=estimate.d.ts.map