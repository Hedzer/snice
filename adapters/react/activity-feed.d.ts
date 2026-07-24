import { type SniceReactComponent } from './wrapper';
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
export declare const ActivityFeed: SniceReactComponent<ActivityFeedProps, SniceComponentRef>;
//# sourceMappingURL=activity-feed.d.ts.map