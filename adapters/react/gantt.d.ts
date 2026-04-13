import type { SniceBaseProps } from './types';
/**
 * Props for the Gantt component
 */
export interface GanttProps extends SniceBaseProps {
    tasks?: any;
    zoom?: any;
    showDependencies?: any;
    onTaskClick?: (event: any) => void;
    onTaskResize?: (event: any) => void;
    onTaskMove?: (event: any) => void;
    onTaskLink?: (event: any) => void;
}
/**
 * Gantt - React adapter for snice-gantt
 *
 * This is an auto-generated React wrapper for the Snice gantt component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/gantt';
 * import { Gantt } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Gantt />;
 * }
 * ```
 */
export declare const Gantt: import("react").ForwardRefExoticComponent<Omit<GanttProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=gantt.d.ts.map