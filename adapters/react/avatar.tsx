// GENERATED FILE — DO NOT EDIT.
// Source: components/avatar/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Avatar component
 */
export interface AvatarProps extends SniceBaseProps {
  src?: any;
  alt?: any;
  name?: any;
  size?: any;
  shape?: any;
  loading?: any;
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
 * import 'snice/components/avatar/snice-avatar';
 * import { Avatar } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Avatar />;
 * }
 * ```
 */
export const Avatar: SniceReactComponent<AvatarProps, SniceComponentRef> = createReactAdapter<AvatarProps, false>({
  tagName: 'snice-avatar',
  properties: ["src","alt","name","size","shape","loading","fallbackColor","fallbackBackground"],
  events: {},
  formAssociated: false
});
