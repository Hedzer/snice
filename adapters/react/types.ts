import React from 'react';

/**
 * Base props that all Snice React components extend
 */
export interface SniceBaseProps extends React.HTMLAttributes<HTMLElement> {
  /** Ref to the underlying web component element */
  ref?: React.Ref<any>;
  /** Children to render inside the component */
  children?: React.ReactNode;
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
  /** Callback when value changes */
  onChange?: (event: Event) => void;
  /** Callback on input */
  onInput?: (event: Event) => void;
  /** Callback on blur */
  onBlur?: (event: FocusEvent) => void;
  /** Callback on focus */
  onFocus?: (event: FocusEvent) => void;
}

/**
 * Ref type for components with methods
 */
export interface SniceComponentRef {
  /** The underlying HTML element */
  element: HTMLElement;
  /** Focus the component */
  focus?: () => void;
  /** Blur the component */
  blur?: () => void;
  /** Any other component-specific methods */
  [key: string]: any;
}

/**
 * Ref type for form-associated components
 */
export interface SniceFormRef extends SniceComponentRef {
  /** The current form value */
  value: any;
}

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
