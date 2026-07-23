// GENERATED FILE — DO NOT EDIT.
// Source: components/form-layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the FormLayout component
 */
export interface FormLayoutProps extends SniceBaseProps {
  columns?: any;
  labelPosition?: any;
  labelWidth?: any;
  gap?: any;
  variant?: any;

}

/**
 * FormLayout - React adapter for snice-form-layout
 *
 * This is an auto-generated React wrapper for the Snice form-layout component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/form-layout/snice-form-layout';
 * import { FormLayout } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FormLayout />;
 * }
 * ```
 */
export const FormLayout: SniceReactComponent<FormLayoutProps, SniceComponentRef> = createReactAdapter<FormLayoutProps, false>({
  tagName: 'snice-form-layout',
  properties: ["columns","labelPosition","labelWidth","gap","variant"],
  events: {},
  formAssociated: false
});
