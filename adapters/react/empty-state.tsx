// GENERATED FILE — DO NOT EDIT.
// Source: components/empty-state/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps extends SniceBaseProps {
  size?: any;
  icon?: any;
  title?: any;
  description?: any;
  actionText?: any;
  actionHref?: any;
  onEmptyStateAction?: (event: any) => void;
}

/**
 * EmptyState - React adapter for snice-empty-state
 *
 * This is an auto-generated React wrapper for the Snice empty-state component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/empty-state/snice-empty-state';
 * import { EmptyState } from 'snice/react';
 *
 * function MyComponent() {
 *   return <EmptyState />;
 * }
 * ```
 */
export const EmptyState: SniceReactComponent<EmptyStateProps, SniceComponentRef> = createReactAdapter<EmptyStateProps, false>({
  tagName: 'snice-empty-state',
  properties: ["size","icon","title","description","actionText","actionHref"],
  events: {"empty-state-action":"onEmptyStateAction"},
  formAssociated: false
});
