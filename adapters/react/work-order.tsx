import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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

}

/**
 * WorkOrder - React adapter for snice-work-order
 *
 * This is an auto-generated React wrapper for the Snice work-order component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/work-order';
 * import { WorkOrder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <WorkOrder />;
 * }
 * ```
 */
export const WorkOrder = createReactAdapter<WorkOrderProps>({
  tagName: 'snice-work-order',
  properties: ["woNumber","date","dueDate","priority","status","customer","description","tasks","parts","asset","laborRate","notes","variant","showQr","qrData","qrPosition"],
  events: {},
  formAssociated: false
});
