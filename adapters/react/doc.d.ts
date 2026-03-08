import type { SniceBaseProps } from './types';
/**
 * Props for the Doc component
 */
export interface DocProps extends SniceBaseProps {
    placeholder?: any;
    readonly?: any;
    icons?: any;
}
/**
 * Doc - React adapter for snice-doc
 *
 * This is an auto-generated React wrapper for the Snice doc component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/doc';
 * import { Doc } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Doc />;
 * }
 * ```
 */
export declare const Doc: import("react").ForwardRefExoticComponent<Omit<DocProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=doc.d.ts.map