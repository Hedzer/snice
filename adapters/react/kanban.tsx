// GENERATED FILE — DO NOT EDIT.
// Source: components/kanban/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Kanban component
 */
export interface KanbanProps extends SniceBaseProps {
  columns?: any;
  allowDragDrop?: any;
  showCardCount?: any;
  labelFilters?: any;
  searchQuery?: any;
  onKanbanCardMove?: (event: any) => void;
  onKanbanCardClick?: (event: any) => void;
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
  properties: ["columns","allowDragDrop","showCardCount","labelFilters","searchQuery"],
  events: {"kanban-card-move":"onKanbanCardMove","kanban-card-click":"onKanbanCardClick"},
  formAssociated: false
});
