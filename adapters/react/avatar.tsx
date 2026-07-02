// GENERATED FILE — DO NOT EDIT.
// Source: components/avatar/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
  properties: ["src","alt","name","size","shape","fallbackColor","fallbackBackground"],
  events: {},
  formAssociated: false
});
