import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the WorkOrder component
 */
export interface WorkOrderProps extends SniceBaseProps {
    woNumber?: any;
    date?: any;
    dueDate?: any;
    priority?: any;
    status?: any;
    customer?: any;
    description?: any;
    tasks?: any;
    parts?: any;
    asset?: any;
    laborRate?: any;
    notes?: any;
    variant?: any;
    showQr?: any;
    qrData?: any;
    qrPosition?: any;
    onTaskToggle?: (event: any) => void;
    onStatusChange?: (event: any) => void;
    onWoSign?: (event: any) => void;
}
/**
 * WorkOrder - React adapter for snice-work-order
 *
 * This is an auto-generated React wrapper for the Snice work-order component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/work-order/snice-work-order';
 * import { WorkOrder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <WorkOrder />;
 * }
 * ```
 */
export declare const WorkOrder: SniceReactComponent<WorkOrderProps, SniceComponentRef>;
//# sourceMappingURL=work-order.d.ts.map