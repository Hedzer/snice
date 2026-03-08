import type { SniceBaseProps } from './types';
/**
 * Props for the Timeline component
 */
export interface TimelineProps extends SniceBaseProps {
    orientation?: any;
    position?: any;
    items?: any;
    reverse?: any;
}
/**
 * Timeline - React adapter for snice-timeline
 *
 * This is an auto-generated React wrapper for the Snice timeline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timeline';
 * import { Timeline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timeline />;
 * }
 * ```
 */
export declare const Timeline: import("react").ForwardRefExoticComponent<Omit<TimelineProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=timeline.d.ts.map