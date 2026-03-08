import React from 'react';
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
 * Props for all React-wrapped Snice components
 */
export interface SniceComponentProps extends React.HTMLAttributes<HTMLElement> {
    /** Ref to the underlying web component */
    ref?: React.Ref<any>;
    /** Children to render inside the component */
    children?: React.ReactNode;
}
/**
 * Create a React adapter for a Snice web component
 *
 * @param config - Configuration object defining the component's interface
 * @returns A React component that wraps the Snice web component
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
export declare function createReactAdapter<P extends SniceComponentProps = SniceComponentProps>(config: AdapterConfig): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<any>>;
/**
 * Hook to access form value from a Snice form component
 *
 * @param ref - Ref to the component
 * @returns The current form value
 *
 * @example
 * ```tsx
 * const inputRef = useRef();
 * const value = useSniceFormValue(inputRef);
 * ```
 */
export declare function useSniceFormValue(ref: React.RefObject<any>): any;
//# sourceMappingURL=wrapper.d.ts.map