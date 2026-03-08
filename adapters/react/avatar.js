import { createReactAdapter } from './wrapper';
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
export const Avatar = createReactAdapter({
    tagName: 'snice-avatar',
    properties: ["src", "alt", "name", "size", "shape", "fallbackColor", "fallbackBackground", "imageError"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=avatar.js.map