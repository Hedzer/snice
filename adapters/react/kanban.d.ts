import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Kanban component
 */
export interface KanbanProps extends SniceBaseProps {
    columns?: any;
    allowDragDrop?: any;
    showCardCount?: any;
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
 * import 'snice/components/kanban/snice-kanban';
 * import { Kanban } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Kanban />;
 * }
 * ```
 */
export declare const Kanban: SniceReactComponent<KanbanProps, SniceComponentRef>;
//# sourceMappingURL=kanban.d.ts.map