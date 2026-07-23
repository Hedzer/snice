import { type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';
/**
 * Props for the TagInput component
 */
export interface TagInputProps extends SniceFormProps {
    defaultValue?: any;
    suggestions?: any;
    maxTags?: any;
    allowDuplicates?: any;
    placeholder?: any;
    disabled?: any;
    readonly?: any;
    label?: any;
    name?: any;
    value?: any;
    onTagAdd?: (event: any) => void;
    onTagRemove?: (event: any) => void;
    onTagChange?: (event: any) => void;
}
/**
 * TagInput - React adapter for snice-tag-input
 *
 * This is an auto-generated React wrapper for the Snice tag-input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tag-input/snice-tag-input';
 * import { TagInput } from 'snice/react';
 *
 * function MyComponent() {
 *   return <TagInput />;
 * }
 * ```
 */
export declare const TagInput: SniceReactComponent<TagInputProps, SniceFormRef>;
//# sourceMappingURL=tag-input.d.ts.map