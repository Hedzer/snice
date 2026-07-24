import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the ActivityItem component
 */
export interface ActivityItemProps extends SniceBaseProps {
    itemId?: any;
    actorName?: any;
    actorAvatar?: any;
    action?: any;
    target?: any;
    timestamp?: any;
    icon?: any;
    type?: any;
}
/**
 * ActivityItem - React adapter for snice-activity-item
 *
 * This is an auto-generated React wrapper for the Snice activity-item component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/activity-feed/snice-activity-item';
 * import { ActivityItem } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ActivityItem />;
 * }
 * ```
 */
export declare const ActivityItem: SniceReactComponent<ActivityItemProps, SniceComponentRef>;
//# sourceMappingURL=activity-item.d.ts.map