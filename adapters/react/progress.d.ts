import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Progress component
 */
export interface ProgressProps extends SniceBaseProps {
    value?: any;
    max?: any;
    variant?: any;
    size?: any;
    color?: any;
    indeterminate?: any;
    showLabel?: any;
    label?: any;
    striped?: any;
    animated?: any;
    thickness?: any;
    onProgressChange?: (event: any) => void;
}
/**
 * Progress - React adapter for snice-progress
 *
 * This is an auto-generated React wrapper for the Snice progress component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/progress/snice-progress';
 * import { Progress } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Progress />;
 * }
 * ```
 */
export declare const Progress: SniceReactComponent<ProgressProps, SniceComponentRef>;
//# sourceMappingURL=progress.d.ts.map