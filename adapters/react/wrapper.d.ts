import React from 'react';
import type { SniceAdapterRef, SniceFormRef, SniceMethodHandle } from './types';
/**
 * Configuration for creating a React adapter for a Snice component
 */
export interface AdapterConfig {
    /** Tag name of the web component (e.g., 'snice-button') */
    tagName: string;
    /** List of properties to pass to the component */
    properties?: string[];
    /** Map of events to callback props (e.g., { click: 'onClick', change: 'onChange' }) */
    events?: Record<string, string>;
    /** List of methods to expose via ref */
    methods?: string[];
    /** Whether this component is form-associated */
    formAssociated?: boolean;
}
/**
 * The imperative handle a created adapter places in the forwarded ref:
 * `SniceFormRef` for form-associated components, `SniceComponentRef`
 * otherwise, plus one callable member per configured method.
 */
export type AdapterHandle<FormAssociated extends boolean, Methods extends string> = SniceAdapterRef<FormAssociated> & SniceMethodHandle<Methods>;
/**
 * Public component type for a created adapter: props `P` plus a `ref` that
 * receives the imperative handle `R`. Generated adapters annotate their
 * export with this so their declarations name the exact ref type.
 */
export type SniceReactComponent<P, R> = React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<R>>;
/**
 * Props for all React-wrapped Snice components.
 *
 * The `ref` prop comes from `forwardRef` and is typed as `AdapterHandle` —
 * it is intentionally not redeclared here.
 */
export interface SniceComponentProps extends React.HTMLAttributes<HTMLElement> {
    /** Children to render inside the component */
    children?: React.ReactNode;
}
/**
 * Create a React adapter for a Snice web component
 *
 * @param config - Configuration object defining the component's interface
 * @returns A React component that wraps the Snice web component. Its ref
 * receives an imperative handle — use `ref.current?.element` to reach the
 * underlying custom element, never the handle itself.
 *
 * @example
 * ```tsx
 * const Button = createReactAdapter({
 *   tagName: 'snice-button',
 *   properties: ['variant', 'size', 'disabled', 'loading'],
 *   events: { click: 'onClick' },
 *   methods: ['focus', 'blur']
 * });
 *
 * // Usage
 * <Button variant="primary" onClick={(e) => console.log('clicked')}>
 *   Click me
 * </Button>
 * ```
 */
export declare function createReactAdapter<P extends SniceComponentProps = SniceComponentProps, FormAssociated extends boolean = false, Methods extends string = never>(config: AdapterConfig & {
    formAssociated?: FormAssociated;
    methods?: Methods[];
}): SniceReactComponent<P, AdapterHandle<FormAssociated, Methods>>;
/**
 * Hook to access form value from a Snice form component
 *
 * @param ref - Ref to the component (`SniceFormRef` handle)
 * @returns The current form value
 *
 * @example
 * ```tsx
 * const inputRef = useRef<SniceFormRef>(null);
 * const value = useSniceFormValue(inputRef);
 * ```
 */
export declare function useSniceFormValue(ref: {
    current: SniceFormRef | null;
}): any;
//# sourceMappingURL=wrapper.d.ts.map