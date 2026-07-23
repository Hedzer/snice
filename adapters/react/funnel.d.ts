import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Funnel component
 */
export interface FunnelProps extends SniceBaseProps {
    data?: any;
    variant?: any;
    orientation?: any;
    showLabels?: any;
    showValues?: any;
    showPercentages?: any;
    animation?: any;
    onFunnelClick?: (event: any) => void;
    onFunnelHover?: (event: any) => void;
}
/**
 * Funnel - React adapter for snice-funnel
 *
 * This is an auto-generated React wrapper for the Snice funnel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/funnel/snice-funnel';
 * import { Funnel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Funnel />;
 * }
 * ```
 */
export declare const Funnel: SniceReactComponent<FunnelProps, SniceComponentRef>;
//# sourceMappingURL=funnel.d.ts.map