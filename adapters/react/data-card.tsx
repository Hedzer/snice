// GENERATED FILE — DO NOT EDIT.
// Source: components/data-card/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the DataCard component
 */
export interface DataCardProps extends SniceBaseProps {
  fields?: any;
  editable?: any;
  variant?: any;
  onFieldChange?: (event: any) => void;
  onFieldSave?: (event: any) => void;
}

/**
 * DataCard - React adapter for snice-data-card
 *
 * This is an auto-generated React wrapper for the Snice data-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/data-card';
 * import { DataCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <DataCard />;
 * }
 * ```
 */
export const DataCard = createReactAdapter<DataCardProps>({
  tagName: 'snice-data-card',
  properties: ["fields","editable","variant"],
  events: {"field-change":"onFieldChange","field-save":"onFieldSave"},
  formAssociated: false
});
