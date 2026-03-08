import type { SniceBaseProps } from './types';
/**
 * Props for the Mentions component
 */
export interface MentionsProps extends SniceBaseProps {
    value?: any;
    users?: any;
    placeholder?: any;
    readonly?: any;
    trigger?: any;
}
/**
 * Mentions - React adapter for snice-mentions
 *
 * This is an auto-generated React wrapper for the Snice mentions component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/mentions';
 * import { Mentions } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Mentions />;
 * }
 * ```
 */
export declare const Mentions: import("react").ForwardRefExoticComponent<Omit<MentionsProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=mentions.d.ts.map