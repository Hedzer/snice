/**
 * snice-activity-feed matrix — oracle module.
 *
 * Every expectation is transcribed from `docs/ai/components/activity-feed.md`
 * and `snice-activity-feed.types.ts`:
 *
 *   · "Activity/audit log feed with vertical timeline, filtering, and grouping."
 *   · `groupBy: 'none'|'date'` — "grouped mode sorts newest first".
 *   · `hasMore` — "shows the load-more button"; `load-more` → `{ count }`,
 *     "button only renders when `has-more` is set".
 *   · `filter: string` — the filter bar offers one button per activity type
 *     plus `allLabel`, and filter buttons expose `aria-pressed`.
 *   · `timestamp` — "unparseable values display as-is".
 *   · `avatar` — "falls back to initials if the image fails to load".
 *   · "Slotted items take precedence over the `activities` array."
 *   · `addActivity(activity)` — "Prepend activity to feed"; `clearFilter()` —
 *     "Reset filter to show all".
 *   · Parts: `base`, `filters`, `list`, `entry`, `icon`, `content`,
 *     `timestamp`, `group-header`.
 *   · a11y: list `role="feed"`; entries `role="article"` with
 *     `aria-posinset`/`aria-setsize`, focusable, Enter/Space activates.
 *
 * Where the docs name a feature but not its wording — the relative timestamp
 * ("2h ago"), the date-group heading ("Today") — the oracle asserts the
 * DOCUMENTED fact (a parseable timestamp is rendered relatively, i.e. NOT as
 * the raw string; one heading per calendar day) rather than transcribing the
 * component's private formatting and calling that a specification.
 */
import type {
  Activity,
  ActivityGroupBy,
} from '../../../packages/components/src/activity-feed/snice-activity-feed.types';
import '../../../packages/components/src/activity-feed/snice-activity-feed';
import { mount, settle } from './matrix-utils';

/** The documented `groupBy` union. */
export const GROUPINGS: readonly ActivityGroupBy[] = ['none', 'date'] as const;

/** The two halves of the documented dual API. */
export const SOURCES = ['slot', 'array'] as const;
export type Source = typeof SOURCES[number];

/** The documented type tokens that map to registry icons. */
export const TYPES = ['create', 'update', 'delete', 'comment', 'deploy', 'login', 'upload', 'download'] as const;

export const AVATAR = 'https://example.test/alice.png';

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** An ISO timestamp `ms` in the past — relative, so the feed is never stale. */
export function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

/**
 * Five activities spanning three calendar days, delivered OUT of chronological
 * order so "grouped mode sorts newest first" is a claim the fixture can falsify.
 * Types repeat (two `create`s) so a filter has more than one row to keep, and
 * one activity has neither `target` nor `type`.
 */
export function feed(): Activity[] {
  return [
    { id: 'a2', actor: { name: 'Bob Stone' }, action: 'commented on', target: 'Issue #42', timestamp: ago(2 * HOUR), type: 'comment' },
    { id: 'a1', actor: { name: 'Alice Ray', avatar: AVATAR }, action: 'created', target: 'Project Alpha', timestamp: ago(30 * 60_000), type: 'create' },
    { id: 'a4', actor: { name: 'Dana' }, action: 'signed in', timestamp: ago(3 * DAY) },
    { id: 'a3', actor: { name: 'Cy Green' }, action: 'created', target: 'Task 9', timestamp: ago(DAY + HOUR), type: 'create' },
    { id: 'a5', actor: { name: 'Eve' }, action: 'deployed', target: 'v3.0', timestamp: ago(4 * HOUR), type: 'deploy' },
  ];
}

/** The documented feed sizes a combo has to survive. */
export const COUNTS = [0, 1, 5] as const;
export type Count = typeof COUNTS[number];

export function feedOf(count: Count): Activity[] {
  return feed().slice(0, count);
}

/** Newest first — the documented order of the grouped mode. */
export function newestFirst(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** The distinct types in delivery order — the filter bar's buttons. */
export function typesOf(activities: Activity[]): string[] {
  const seen: string[] = [];
  for (const activity of activities) {
    if (activity.type && !seen.includes(activity.type)) seen.push(activity.type);
  }
  return seen;
}

/** "filter: string" keeps only the activities of that type. */
export function filtered(activities: Activity[], filter: string): Activity[] {
  return filter ? activities.filter(a => a.type === filter) : activities;
}

/** The local calendar day an activity falls on — one group header each. */
export function dayKey(activity: Activity): string {
  const date = new Date(activity.timestamp);
  return Number.isNaN(date.getTime())
    ? activity.timestamp
    : new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

/** Distinct calendar days, newest first — the documented grouping. */
export function dayGroups(activities: Activity[]): string[] {
  const keys: string[] = [];
  for (const activity of newestFirst(activities)) {
    const key = dayKey(activity);
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

// ── Declarative markup ──────────────────────────────────────────────────────

/**
 * The documented declarative form: `<snice-activity-item>` with `item-id`,
 * `actor-name`, `actor-avatar`, `action`, `target`, `timestamp`, `icon`, `type`.
 */
export function slotMarkup(activities: Activity[]): string {
  return activities.map(activity => {
    const attrs = [
      `item-id="${activity.id}"`,
      `actor-name="${activity.actor.name}"`,
      activity.actor.avatar ? `actor-avatar="${activity.actor.avatar}"` : '',
      `action="${activity.action}"`,
      activity.target ? `target="${activity.target}"` : '',
      `timestamp="${activity.timestamp}"`,
      activity.icon ? `icon="${activity.icon}"` : '',
      activity.type ? `type="${activity.type}"` : '',
    ].filter(Boolean).join(' ');
    return `<snice-activity-item ${attrs}></snice-activity-item>`;
  }).join('');
}

/**
 * The activities as the component reports them back through `activity-click`.
 * The declarative channel is attribute-borne, so every optional field is either
 * its string or `undefined`, and the object carries exactly the documented keys.
 */
export function asDelivered(activities: Activity[], source: Source): Activity[] {
  if (source === 'array') return activities;
  return activities.map(activity => ({
    id: activity.id,
    actor: { name: activity.actor.name, avatar: activity.actor.avatar },
    action: activity.action,
    target: activity.target,
    timestamp: activity.timestamp,
    icon: activity.icon,
    type: activity.type,
  }));
}

// ── Mounting one combo ──────────────────────────────────────────────────────

export interface FeedCombo {
  activities?: Activity[];
  source?: Source;
  groupBy?: ActivityGroupBy;
  hasMore?: boolean;
  filter?: string;
  emptyMessage?: string;
  loadMoreLabel?: string;
  allLabel?: string;
  refreshInterval?: number;
}

export interface FeedElement extends HTMLElement {
  activities: Activity[];
  filter: string;
  addActivity(activity: Activity): void;
  clearFilter(): void;
}

/**
 * Mount one combo. Everything the docs give an attribute name for crosses the
 * ATTRIBUTE channel (`group-by`, `has-more`, `empty-message`, …), because that
 * is the form the docs write; `activities` has no attribute form and crosses
 * the property channel, which is exactly what the docs' own example does.
 */
export async function mountFeed(combo: FeedCombo = {}): Promise<FeedElement> {
  const {
    activities = [], source = 'array', groupBy, hasMore, filter,
    emptyMessage, loadMoreLabel, allLabel, refreshInterval,
  } = combo;

  const attrs: Record<string, string | boolean> = {};
  if (groupBy) attrs['group-by'] = groupBy;
  if (hasMore) attrs['has-more'] = true;
  if (filter) attrs.filter = filter;
  if (emptyMessage !== undefined) attrs['empty-message'] = emptyMessage;
  if (loadMoreLabel !== undefined) attrs['load-more-label'] = loadMoreLabel;
  if (allLabel !== undefined) attrs['all-label'] = allLabel;
  // 0 disables the relative-timestamp refresh timer. Every combo asks for that:
  // a matrix that leaves interval timers running leaks them across 50 mounts.
  attrs['refresh-interval'] = String(refreshInterval ?? 0);

  const el = await mount<FeedElement>('snice-activity-feed', {
    attrs,
    html: source === 'slot' ? slotMarkup(activities) : '',
    ...(source === 'array' ? { props: { activities } } : {}),
  });
  await settle();
  return el;
}
