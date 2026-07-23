import { type SniceReactComponent } from './wrapper';
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
export declare const KvPair: SniceReactComponent<KvPairProps, SniceComponentRef>;
//# sourceMappingURL=kv-pair.d.ts.map