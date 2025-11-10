import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Avatar component
 */
export interface AvatarProps extends SniceBaseProps {
  src?: any;
  alt?: any;
  name?: any;
  size?: any;
  shape?: any;
  fallbackColor?: any;
  fallbackBackground?: any;
  private?: any;

}

/**
 * Avatar - React adapter for snice-avatar
 *
 * This is an auto-generated React wrapper for the Snice avatar component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/avatar';
 * import { Avatar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Avatar />;
 * }
 * ```
 */
export const Avatar = createReactAdapter<AvatarProps>({
  tagName: 'snice-avatar',
  properties: ["src","alt","name","size","shape","fallbackColor","fallbackBackground","private"],
  events: {},
  formAssociated: false
});
