// GENERATED FILE — DO NOT EDIT.
// Source: components/avatar-group/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
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
export const AvatarGroup = createReactAdapter({
    tagName: 'snice-avatar-group',
    properties: ["avatars", "max", "size", "overlap"],
    events: { "avatar-click": "onAvatarClick", "overflow-click": "onOverflowClick" },
    formAssociated: false
});
//# sourceMappingURL=avatar-group.js.map