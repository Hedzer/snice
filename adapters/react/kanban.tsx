import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Kanban component
 */
export interface KanbanProps extends SniceBaseProps {
  columns?: any;
  allowDragDrop?: any;
  showCardCount?: any;

}

/**
 * Kanban - React adapter for snice-kanban
 *
 * This is an auto-generated React wrapper for the Snice kanban component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/kanban';
 * import { Kanban } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Kanban />;
 * }
 * ```
 */
export const Kanban = createReactAdapter<KanbanProps>({
  tagName: 'snice-kanban',
  properties: ["columns","allowDragDrop","showCardCount"],
  events: {},
  formAssociated: false
});
