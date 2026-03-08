import type { SniceBaseProps } from './types';
/**
 * Props for the AvatarGroup component
 */
export interface AvatarGroupProps extends SniceBaseProps {
    avatars?: any;
    max?: any;
    size?: any;
    overlap?: any;
}
/**
 * AvatarGroup - React adapter for snice-avatar-group
 *
 * This is an auto-generated React wrapper for the Snice avatar-group component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/avatar-group';
 * import { AvatarGroup } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AvatarGroup />;
 * }
 * ```
 */
export declare const AvatarGroup: import("react").ForwardRefExoticComponent<Omit<AvatarGroupProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=avatar-group.d.ts.map