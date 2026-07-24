export interface ActivityActor {
  name: string;
  avatar?: string;
}

export interface Activity {
  id: string;
  actor: ActivityActor;
  action: string;
  target?: string;
  timestamp: string;
  icon?: string;
  type?: string;
  meta?: Record<string, unknown>;
}

export type ActivityGroupBy = 'none' | 'date';

export interface SniceActivityFeedElement extends HTMLElement {
  activities: Activity[];
  filter: string;
  groupBy: ActivityGroupBy;
  hasMore: boolean;
  refreshInterval: number;
  emptyMessage: string;
  loadMoreLabel: string;
  allLabel: string;

  addActivity(activity: Activity): void;
  clearFilter(): void;
}

export interface SniceActivityItemElement extends HTMLElement {
  itemId: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  target: string;
  timestamp: string;
  icon: string;
  type: string;
}

export interface ActivityClickDetail {
  activity: Activity;
}

export interface LoadMoreDetail {
  count: number;
}

export interface SniceActivityFeedEventMap {
  'activity-click': CustomEvent<ActivityClickDetail>;
  'load-more': CustomEvent<LoadMoreDetail>;
}
