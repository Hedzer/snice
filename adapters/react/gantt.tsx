import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Gantt component
 */
export interface GanttProps extends SniceBaseProps {
  tasks?: any;
  zoom?: any;
  showDependencies?: any;

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
export const Gantt = createReactAdapter<GanttProps>({
  tagName: 'snice-gantt',
  properties: ["tasks","zoom","showDependencies"],
  events: {},
  formAssociated: false
});
