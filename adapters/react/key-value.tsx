// GENERATED FILE — DO NOT EDIT.
// Source: components/key-value/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';


/**
 * Props for the KeyValue component
 */
export interface KeyValueProps extends SniceFormProps {
  label?: string;
  autoExpand?: boolean;
  rows?: number;
  showDescription?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  name?: string;
  variant?: 'default' | 'compact';
  mode?: 'edit' | 'view';
  showCopy?: boolean;
  defaultValue?: string;
  placeholders?: Array<{ key: string; value: string }>;
  value?: string;
  onKvAdd?: (event: CustomEvent<{ item: { key: string; value: string; description?: string }; index: number }>) => void;
  onKvRemove?: (event: CustomEvent<{ item: { key: string; value: string; description?: string }; index: number }>) => void;
  onKvChange?: (event: CustomEvent<{ items: Array<{ key: string; value: string; description?: string }> }>) => void;
  onKvCopy?: (event: CustomEvent<{ items: Array<{ key: string; value: string; description?: string }> }>) => void;
}

/**
 * KeyValue - React adapter for snice-key-value
 *
 * This is an auto-generated React wrapper for the Snice key-value component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/key-value/snice-key-value';
 * import { KeyValue } from 'snice/react';
 *
 * function MyComponent() {
 *   return <KeyValue />;
 * }
 * ```
 */
export const KeyValue: SniceReactComponent<KeyValueProps, SniceFormRef> = createReactAdapter<KeyValueProps, true>({
  tagName: 'snice-key-value',
  properties: ["label","autoExpand","rows","showDescription","keyPlaceholder","valuePlaceholder","disabled","readonly","required","name","variant","mode","showCopy","defaultValue","placeholders","value"],
  events: {"kv-add":"onKvAdd","kv-remove":"onKvRemove","kv-change":"onKvChange","kv-copy":"onKvCopy"},
  formAssociated: true
});
