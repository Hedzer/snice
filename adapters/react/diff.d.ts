import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Diff component
 */
export interface DiffProps extends SniceBaseProps {
    oldText?: any;
    newText?: any;
    language?: any;
    mode?: any;
    lineNumbers?: any;
    contextLines?: any;
    markers?: any;
    onDiffComputed?: (event: any) => void;
}
/**
 * Diff - React adapter for snice-diff
 *
 * This is an auto-generated React wrapper for the Snice diff component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/diff/snice-diff';
 * import { Diff } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Diff />;
 * }
 * ```
 */
export declare const Diff: SniceReactComponent<DiffProps, SniceComponentRef>;
//# sourceMappingURL=diff.d.ts.map