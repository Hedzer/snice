import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

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
export function createReactAdapter<P extends SniceComponentProps = SniceComponentProps>(
  config: AdapterConfig
) {
  const { tagName, properties = [], events = {}, methods = [], formAssociated = false } = config;

  const Component = forwardRef<any, P>((props, ref) => {
    const elementRef = useRef<HTMLElement>(null);
    const eventHandlersRef = useRef<Map<string, (e: Event) => void>>(new Map());

    // Ensure the component is registered before using it
    useEffect(() => {
      if (!customElements.get(tagName)) {
        console.warn(
          `Web component "${tagName}" is not registered. Make sure to import the component before using it.`
        );
      }
    }, []);

    // Set up properties
    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      // Update properties on the element
      properties.forEach((propName) => {
        const value = (props as any)[propName];
        if (value !== undefined) {
          (element as any)[propName] = value;
        }
      });
    }, [props]);

    // Set up event listeners
    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      // Clean up old event listeners
      eventHandlersRef.current.forEach((handler, eventName) => {
        element.removeEventListener(eventName, handler);
      });
      eventHandlersRef.current.clear();

      // Add new event listeners
      Object.entries(events).forEach(([eventName, propName]) => {
        const callback = (props as any)[propName];
        if (callback && typeof callback === 'function') {
          const handler = (e: Event) => {
            // For CustomEvents, pass the detail as the event data
            if ('detail' in e) {
              callback(e);
            } else {
              callback(e);
            }
          };
          element.addEventListener(eventName, handler);
          eventHandlersRef.current.set(eventName, handler);
        }
      });

      // Cleanup on unmount
      return () => {
        eventHandlersRef.current.forEach((handler, eventName) => {
          element.removeEventListener(eventName, handler);
        });
        eventHandlersRef.current.clear();
      };
    }, [props]);

    // Expose methods via ref
    useImperativeHandle(ref, () => {
      const element = elementRef.current;
      if (!element) return {};

      const exposedMethods: any = { element };

      // Expose specified methods
      methods.forEach((methodName) => {
        if (typeof (element as any)[methodName] === 'function') {
          exposedMethods[methodName] = (...args: any[]) =>
            (element as any)[methodName](...args);
        }
      });

      // For form-associated components, expose form-related properties
      if (formAssociated) {
        Object.defineProperty(exposedMethods, 'value', {
          get: () => (element as any).value,
          set: (value) => {
            (element as any).value = value;
          }
        });
      }

      return exposedMethods;
    }, []);

    // Filter out custom props to avoid React warnings
    const nativeProps: any = {};
    Object.keys(props).forEach((key) => {
      if (
        !properties.includes(key) &&
        !Object.values(events).includes(key) &&
        key !== 'children' &&
        key !== 'ref'
      ) {
        nativeProps[key] = (props as any)[key];
      }
    });

    return React.createElement(
      tagName,
      {
        ...nativeProps,
        ref: elementRef
      },
      props.children
    );
  });

  // Set display name for better debugging
  Component.displayName = `Snice(${tagName})`;

  return Component;
}

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
export function useSniceFormValue(ref: React.RefObject<any>): any {
  const [value, setValue] = React.useState<any>();

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current.element;
    if (!element) return;

    // Set initial value
    setValue(element.value);

    // Listen for changes
    const handleChange = () => {
      setValue(element.value);
    };

    element.addEventListener('change', handleChange);
    element.addEventListener('input', handleChange);

    return () => {
      element.removeEventListener('change', handleChange);
      element.removeEventListener('input', handleChange);
    };
  }, [ref]);

  return value;
}
