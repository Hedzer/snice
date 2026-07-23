import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the ProgressRing component
 */
export interface ProgressRingProps extends SniceBaseProps {
    value?: any;
    max?: any;
    size?: any;
    thickness?: any;
    color?: any;
    showValue?: any;
    label?: any;
    onProgressComplete?: (event: any) => void;
}
/**
 * ProgressRing - React adapter for snice-progress-ring
 *
 * This is an auto-generated React wrapper for the Snice progress-ring component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/progress-ring/snice-progress-ring';
 * import { ProgressRing } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ProgressRing />;
 * }
 * ```
 */
export declare const ProgressRing: SniceReactComponent<ProgressRingProps, SniceComponentRef>;
//# sourceMappingURL=progress-ring.d.ts.map