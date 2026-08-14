import { type SniceReactComponent } from './wrapper';
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
export declare const Avatar: SniceReactComponent<AvatarProps, SniceComponentRef>;
//# sourceMappingURL=avatar.d.ts.map