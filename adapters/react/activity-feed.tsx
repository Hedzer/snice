import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the ActivityFeed component
 */
export interface ActivityFeedProps extends SniceBaseProps {
  activities?: any;
  filter?: any;
  groupBy?: any;

}

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
export const ActivityFeed = createReactAdapter<ActivityFeedProps>({
  tagName: 'snice-activity-feed',
  properties: ["activities","filter","groupBy"],
  events: {},
  formAssociated: false
});
