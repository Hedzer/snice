import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Icon component
 */
export interface IconProps extends SniceBaseProps {
  name?: any;
  src?: any;
  size?: any;
  color?: any;
  label?: any;

}

/**
 * Icon - React adapter for snice-icon
 *
 * This is an auto-generated React wrapper for the Snice icon component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/icon';
 * import { Icon } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Icon />;
 * }
 * ```
 */
export const Icon = createReactAdapter<IconProps>({
  tagName: 'snice-icon',
  properties: ["name","src","size","color","label"],
  events: {},
  formAssociated: false
});
