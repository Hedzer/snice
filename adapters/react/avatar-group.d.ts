import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the AvatarGroup component
 */
export interface AvatarGroupProps extends SniceBaseProps {
    avatars?: any;
    max?: any;
    size?: any;
    overlap?: any;
    onAvatarClick?: (event: any) => void;
    onOverflowClick?: (event: any) => void;
}
/**
 * AvatarGroup - React adapter for snice-avatar-group
 *
 * This is an auto-generated React wrapper for the Snice avatar-group component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/avatar-group/snice-avatar-group';
 * import { AvatarGroup } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AvatarGroup />;
 * }
 * ```
 */
export declare const AvatarGroup: SniceReactComponent<AvatarGroupProps, SniceComponentRef>;
//# sourceMappingURL=avatar-group.d.ts.map