import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Button component
 */
export interface ButtonProps extends SniceBaseProps {
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

}

/**
 * Button - React adapter for snice-button
 *
 * This is an auto-generated React wrapper for the Snice button component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/button';
 * import { Button } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Button />;
 * }
 * ```
 */
export const Button = createReactAdapter<ButtonProps>({
  tagName: 'snice-button',
  properties: ["variant","size","type","disabled","loading","outline","pill","circle","href","target","download","icon","iconPlacement"],
  events: {},
  formAssociated: false
});
