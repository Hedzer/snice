import { createReactAdapter } from './wrapper';
/**
 * UserCard - React adapter for snice-user-card
 *
 * This is an auto-generated React wrapper for the Snice user-card component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/user-card';
 * import { UserCard } from 'snice/react';
 *
 * function MyComponent() {
 *   return <UserCard />;
 * }
 * ```
 */
export const UserCard = createReactAdapter({
    tagName: 'snice-user-card',
    properties: ["name", "avatar", "role", "company", "email", "phone", "location", "social", "status", "variant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=user-card.js.map