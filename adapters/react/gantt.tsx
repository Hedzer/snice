// GENERATED FILE — DO NOT EDIT.
// Source: components/gantt/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


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
 * import 'snice/components/gantt/snice-gantt';
 * import { Gantt } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Gantt />;
 * }
 * ```
 */
export const Gantt: SniceReactComponent<GanttProps, SniceComponentRef> = createReactAdapter<GanttProps, false>({
  tagName: 'snice-gantt',
  properties: ["tasks","zoom","showDependencies"],
  events: {"task-click":"onTaskClick","task-resize":"onTaskResize","task-move":"onTaskMove","task-link":"onTaskLink"},
  formAssociated: false
});
