// GENERATED FILE — DO NOT EDIT.
// Source: components/key-value/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the KvPair component
 */
export interface KvPairProps extends SniceBaseProps {
  key?: any;
  value?: any;
  description?: any;

}

/**
 * KvPair - React adapter for snice-kv-pair
 *
 * This is an auto-generated React wrapper for the Snice kv-pair component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/key-value/snice-kv-pair';
 * import { KvPair } from 'snice/react';
 *
 * function MyComponent() {
 *   return <KvPair />;
 * }
 * ```
 */
export const KvPair: SniceReactComponent<KvPairProps, SniceComponentRef> = createReactAdapter<KvPairProps, false>({
  tagName: 'snice-kv-pair',
  properties: ["key","value","description"],
  events: {},
  formAssociated: false
});
