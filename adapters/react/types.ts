import React from 'react';

/**
 * Base props that all Snice React components extend.
 *
 * The `ref` prop is supplied by `forwardRef` on the adapter component and is
 * typed as `SniceComponentRef`/`SniceFormRef` (see `SniceAdapterRef`) — it is
 * intentionally not redeclared here.
 */
export interface SniceBaseProps extends React.HTMLAttributes<HTMLElement> {
}

/**
 * Props for form-associated Snice components
 */
export interface SniceFormProps extends SniceBaseProps {
  /** The name of the form control */
  name?: string;
  /** The value of the form control */
  value?: any;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Whether the control is required */
  required?: boolean;
  /** Whether the control is readonly */
  readonly?: boolean;
}

/**
 * Imperative handle exposed on a React adapter ref.
 *
 * The ref does NOT point at the custom element itself — reach the element
 * through `.element` (e.g. `ref.current?.element.addEventListener(...)`).
 */
export interface SniceComponentRef {
  /** The underlying custom element */
  element: HTMLElement;
}

/**
 * Imperative handle for form-associated components; adds the live form value.
 */
export interface SniceFormRef extends SniceComponentRef {
  /** The current form value */
  value: any;
}

/**
 * Ref handle type for an adapter, selected by its `formAssociated` config flag:
 * form-associated components expose `SniceFormRef`, all others `SniceComponentRef`.
 */
export type SniceAdapterRef<FormAssociated extends boolean> =
  FormAssociated extends true ? SniceFormRef : SniceComponentRef;

/**
 * Callable handle members for the methods listed in an adapter's `methods`
 * config. Only methods configured on the adapter are callable on the ref.
 */
export type SniceMethodHandle<Methods extends string> = {
  [K in Methods]: (...args: any[]) => any;
};

/**
 * Extract property names from a component's attributes
 */
export type ExtractProps<T extends string> = T extends `${infer Prop}-${infer Rest}`
  ? Prop | ExtractProps<Rest>
  : T;

/**
 * Convert kebab-case to camelCase for property names
 */
export type KebabToCamelCase<S extends string> = S extends `${infer T}-${infer U}`
  ? `${T}${Capitalize<KebabToCamelCase<U>>}`
  : S;

/**
 * Custom event detail type
 */
export interface CustomEventDetail<T = any> {
  detail: T;
}

/**
 * Type-safe custom event
 */
export type SniceCustomEvent<T = any> = CustomEvent<T> & Event;
