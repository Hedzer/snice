import type { SniceFormProps } from './types';
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
    placeholders?: Array<{
        key: string;
        value: string;
    }>;
    value?: string;
    onKvAdd?: (event: CustomEvent<{
        item: {
            key: string;
            value: string;
            description?: string;
        };
        index: number;
    }>) => void;
    onKvRemove?: (event: CustomEvent<{
        item: {
            key: string;
            value: string;
            description?: string;
        };
        index: number;
    }>) => void;
    onKvChange?: (event: CustomEvent<{
        items: Array<{
            key: string;
            value: string;
            description?: string;
        }>;
    }>) => void;
    onKvCopy?: (event: CustomEvent<{
        items: Array<{
            key: string;
            value: string;
            description?: string;
        }>;
    }>) => void;
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
export declare const KeyValue: import("react").ForwardRefExoticComponent<Omit<KeyValueProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=key-value.d.ts.map