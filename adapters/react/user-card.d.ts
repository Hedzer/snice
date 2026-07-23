import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the UserCard component
 */
export interface UserCardProps extends SniceBaseProps {
    name?: any;
    avatar?: any;
    role?: any;
    company?: any;
    email?: any;
    phone?: any;
    location?: any;
    social?: any;
    status?: any;
    variant?: any;
    onSocialClick?: (event: any) => void;
    onActionClick?: (event: any) => void;
}
/**
 * UserCard - React adapter for snice-user-card
 *
 * This is an auto-generated React wrapper for the Snice user-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/user-card/snice-user-card';
 * import { UserCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <UserCard />;
 * }
 * ```
 */
export declare const UserCard: SniceReactComponent<UserCardProps, SniceComponentRef>;
//# sourceMappingURL=user-card.d.ts.map