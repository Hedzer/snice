// GENERATED FILE — DO NOT EDIT.
// Source: components/button/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceFormProps, SniceFormRef } from './types';


/**
 * Props for the Button component
 */
export interface ButtonProps extends SniceFormProps {
  variant?: any;
  size?: any;
  type?: any;
  disabled?: any;
  loading?: any;
  outline?: any;
  pill?: any;
  circle?: any;
  href?: any;
  target?: any;
  download?: any;
  icon?: any;
  iconPlacement?: any;
  justifyText?: any;
  onButtonClick?: (event: any) => void;
}

/**
 * Button - React adapter for snice-button
 *
 * This is an auto-generated React wrapper for the Snice button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/button/snice-button';
 * import { Button } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Button />;
 * }
 * ```
 */
export const Button: SniceReactComponent<ButtonProps, SniceFormRef> = createReactAdapter<ButtonProps, true>({
  tagName: 'snice-button',
  properties: ["variant","size","type","disabled","loading","outline","pill","circle","href","target","download","icon","iconPlacement","justifyText"],
  events: {"button-click":"onButtonClick"},
  formAssociated: true
});
