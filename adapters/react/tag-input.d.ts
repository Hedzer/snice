import type { SniceBaseProps } from './types';
/**
 * Props for the TagInput component
 */
export interface TagInputProps extends SniceBaseProps {
    value?: any;
    suggestions?: any;
    maxTags?: any;
    allowDuplicates?: any;
    placeholder?: any;
    disabled?: any;
    readonly?: any;
    label?: any;
    name?: any;
}
/**
 * TagInput - React adapter for snice-tag-input
 *
 * This is an auto-generated React wrapper for the Snice tag-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tag-input';
 * import { TagInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TagInput />;
 * }
 * ```
 */
export declare const TagInput: import("react").ForwardRefExoticComponent<Omit<TagInputProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=tag-input.d.ts.map