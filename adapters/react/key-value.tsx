import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the KeyValue component
 */
export interface KeyValueProps extends SniceBaseProps {
  label?: any;
  autoExpand?: any;
  rows?: any;
  showDescription?: any;
  keyPlaceholder?: any;
  valuePlaceholder?: any;
  disabled?: any;
  readonly?: any;
  name?: any;
  variant?: any;
  mode?: any;
  showCopy?: any;
  items?: any;

}

/**
 * KeyValue - React adapter for snice-key-value
 *
 * This is an auto-generated React wrapper for the Snice key-value component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/key-value';
 * import { KeyValue } from 'snice/react';
 *
 * function MyComponent() {
 *   return <KeyValue />;
 * }
 * ```
 */
export const KeyValue = createReactAdapter<KeyValueProps>({
  tagName: 'snice-key-value',
  properties: ["label","autoExpand","rows","showDescription","keyPlaceholder","valuePlaceholder","disabled","readonly","name","variant","mode","showCopy","items"],
  events: {},
  formAssociated: false
});
