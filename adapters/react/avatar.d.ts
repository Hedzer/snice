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
    imageError?: any;
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
export declare const Avatar: import("react").ForwardRefExoticComponent<Omit<AvatarProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=avatar.d.ts.map