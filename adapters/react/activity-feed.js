import { createReactAdapter } from './wrapper';
/**
 * ActivityFeed - React adapter for snice-activity-feed
 *
 * This is an auto-generated React wrapper for the Snice activity-feed component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/activity-feed';
 * import { ActivityFeed } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActivityFeed />;
 * }
 * ```
 */
export const ActivityFeed = createReactAdapter({
    tagName: 'snice-activity-feed',
    properties: ["activities", "filter", "groupBy"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=activity-feed.js.map