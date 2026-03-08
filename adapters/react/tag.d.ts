import type { SniceBaseProps } from './types';
/**
 * Props for the Tag component
 */
export interface TagProps extends SniceBaseProps {
    variant?: any;
    size?: any;
    removable?: any;
    outline?: any;
    pill?: any;
}
/**
 * Tag - React adapter for snice-tag
 *
 * This is an auto-generated React wrapper for the Snice tag component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tag';
 * import { Tag } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tag />;
 * }
 * ```
 */
export declare const Tag: import("react").ForwardRefExoticComponent<Omit<TagProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=tag.d.ts.map