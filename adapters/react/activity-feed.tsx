// GENERATED FILE — DO NOT EDIT.
// Source: components/activity-feed/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the ActivityFeed component
 */
export interface ActivityFeedProps extends SniceBaseProps {
  activities?: any;
  filter?: any;
  groupBy?: any;
  hasMore?: any;
  refreshInterval?: any;
  emptyMessage?: any;
  loadMoreLabel?: any;
  allLabel?: any;
  onActivityClick?: (event: any) => void;
  onLoadMore?: (event: any) => void;
}

/**
 * ActivityFeed - React adapter for snice-activity-feed
 *
 * This is an auto-generated React wrapper for the Snice activity-feed component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/activity-feed/snice-activity-feed';
 * import { ActivityFeed } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActivityFeed />;
 * }
 * ```
 */
export const ActivityFeed: SniceReactComponent<ActivityFeedProps, SniceComponentRef> = createReactAdapter<ActivityFeedProps, false>({
  tagName: 'snice-activity-feed',
  properties: ["activities","filter","groupBy","hasMore","refreshInterval","emptyMessage","loadMoreLabel","allLabel"],
  events: {"activity-click":"onActivityClick","load-more":"onLoadMore"},
  formAssociated: false
});
