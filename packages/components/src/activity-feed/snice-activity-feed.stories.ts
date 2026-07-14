import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-activity-feed';
import type { Activity, ActivityGroupBy } from './snice-activity-feed.types';

type Args = {
  filter?: string;
  groupBy?: ActivityGroupBy;
};

const now = Date.now();

const SAMPLE_ACTIVITIES: Activity[] = [
  { id: '1', actor: { name: 'Alice Park' }, action: 'created', target: 'Project Alpha', type: 'create', timestamp: new Date(now - 600000).toISOString() },
  { id: '2', actor: { name: 'Bob Lee' }, action: 'commented on', target: 'Issue #42', type: 'comment', timestamp: new Date(now - 1800000).toISOString() },
  { id: '3', actor: { name: 'Carol Diaz' }, action: 'deployed', target: 'v2.1.0 to production', type: 'deploy', timestamp: new Date(now - 3600000).toISOString() },
  { id: '4', actor: { name: 'Dave Kim' }, action: 'updated', target: 'README.md', type: 'update', timestamp: new Date(now - 86400000).toISOString() },
  { id: '5', actor: { name: 'Alice Park' }, action: 'deleted', target: 'temp-branch', type: 'delete', timestamp: new Date(now - 90000000).toISOString() },
];

function makeFeed(activities: Activity[], attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-activity-feed');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).activities = activities;
  return el;
}

function wrap(el: HTMLElement) {
  const w = document.createElement('div');
  w.style.cssText = 'width:100%;max-width:560px;';
  w.appendChild(el);
  return w;
}

const meta: Meta<Args> = {
  title: 'ActivityFeed',
  component: 'snice-activity-feed',
  tags: ['autodocs'],
  argTypes: {
    filter:  { control: 'text' },
    groupBy: { control: 'select', options: ['none', 'date'] },
  },
  render: (args) => {
    const el = document.createElement('snice-activity-feed');
    if (args.filter  !== undefined) el.setAttribute('filter',   String(args.filter));
    if (args.groupBy !== undefined) el.setAttribute('group-by', String(args.groupBy));
    (el as any).activities = SAMPLE_ACTIVITIES;
    return wrap(el);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { groupBy: 'none' },
};

// h2: group-by: none (default) — mixed activity types
export const GroupByNone: Story = {
  render: () => wrap(makeFeed(SAMPLE_ACTIVITIES, { 'group-by': 'none' })),
};

// h2: group-by: date
export const GroupByDate: Story = {
  render: () => wrap(makeFeed(SAMPLE_ACTIVITIES, { 'group-by': 'date' })),
};

// h2: filter property — showing only "create" type
export const FilterProperty: Story = {
  render: () => wrap(makeFeed(SAMPLE_ACTIVITIES, { filter: 'create' })),
};

// h2: Empty state — no activities
export const EmptyState: Story = {
  render: () => wrap(makeFeed([])),
};

// h2: Single activity
export const SingleActivity: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'Alice Park' }, action: 'created', target: 'Project Alpha', type: 'create', timestamp: new Date(now - 300000).toISOString() },
  ])),
};

// h2: Activities with actor avatars
export const ActivitiesWithActorAvatars: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'Alice Park', avatar: 'https://i.pravatar.cc/32?img=1' }, action: 'created', target: 'Project Beta', type: 'create', timestamp: new Date(now - 300000).toISOString() },
    { id: '2', actor: { name: 'Bob Lee', avatar: 'https://i.pravatar.cc/32?img=2' }, action: 'commented', target: 'Issue #10', type: 'comment', timestamp: new Date(now - 900000).toISOString() },
    { id: '3', actor: { name: 'Carol Diaz', avatar: 'https://i.pravatar.cc/32?img=3' }, action: 'deployed', target: 'v3.0.0', type: 'deploy', timestamp: new Date(now - 1800000).toISOString() },
  ])),
};

// h2: Activities with custom icons per entry
export const ActivitiesWithCustomIcons: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'Alice Park' }, action: 'starred', target: 'Repository', type: 'create', icon: '⭐', timestamp: new Date(now - 300000).toISOString() },
    { id: '2', actor: { name: 'Bob Lee' }, action: 'forked', target: 'snice/core', type: 'update', icon: '🔀', timestamp: new Date(now - 900000).toISOString() },
    { id: '3', actor: { name: 'Carol Diaz' }, action: 'tagged', target: 'v4.0.0', type: 'deploy', icon: '🏷️', timestamp: new Date(now - 1800000).toISOString() },
  ])),
};

// h2: All built-in type icons (create, update, delete, comment, deploy, login, upload, download)
export const AllBuiltInTypeIcons: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'User' }, action: 'item', type: 'create',   timestamp: new Date(now - 60000).toISOString() },
    { id: '2', actor: { name: 'User' }, action: 'item', type: 'update',   timestamp: new Date(now - 120000).toISOString() },
    { id: '3', actor: { name: 'User' }, action: 'item', type: 'delete',   timestamp: new Date(now - 180000).toISOString() },
    { id: '4', actor: { name: 'User' }, action: 'item', type: 'comment',  timestamp: new Date(now - 240000).toISOString() },
    { id: '5', actor: { name: 'User' }, action: 'item', type: 'deploy',   timestamp: new Date(now - 300000).toISOString() },
    { id: '6', actor: { name: 'User' }, action: 'item', type: 'login',    timestamp: new Date(now - 360000).toISOString() },
    { id: '7', actor: { name: 'User' }, action: 'item', type: 'upload',   timestamp: new Date(now - 420000).toISOString() },
    { id: '8', actor: { name: 'User' }, action: 'item', type: 'download', timestamp: new Date(now - 480000).toISOString() },
  ])),
};

// h2: Edge case: very long actor name and target
export const EdgeCaseVeryLongActorNameAndTarget: Story = {
  render: () => wrap(makeFeed([
    {
      id: '1',
      actor: { name: 'Alexander Bartholomew Constantine the Third' },
      action: 'updated and then immediately reverted',
      target: 'the-longest-repository-name-that-anyone-has-ever-created-in-the-entire-history-of-version-control',
      type: 'update',
      timestamp: new Date(now - 120000).toISOString(),
    },
  ])),
};

// h2: Side by side: group-by none vs group-by date
export const SideBySideGroupByNoneVsDate: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;width:100%;';

    const leftLabel = document.createElement('div');
    leftLabel.style.cssText = 'font-size:.75rem;color:#888;margin-bottom:.25rem;';
    leftLabel.textContent = 'group-by: none';
    const leftWrap = document.createElement('div');
    leftWrap.appendChild(leftLabel);
    leftWrap.appendChild(makeFeed(SAMPLE_ACTIVITIES, { 'group-by': 'none' }));

    const rightLabel = document.createElement('div');
    rightLabel.style.cssText = 'font-size:.75rem;color:#888;margin-bottom:.25rem;';
    rightLabel.textContent = 'group-by: date';
    const rightWrap = document.createElement('div');
    rightWrap.appendChild(rightLabel);
    rightWrap.appendChild(makeFeed(SAMPLE_ACTIVITIES, { 'group-by': 'date' }));

    container.appendChild(leftWrap);
    container.appendChild(rightWrap);
    return container;
  },
};

// h2: Activities without type (no filter tabs)
export const ActivitiesWithoutType: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'Alice' }, action: 'did something', timestamp: new Date(now - 300000).toISOString() },
    { id: '2', actor: { name: 'Bob' }, action: 'did another thing', timestamp: new Date(now - 600000).toISOString() },
  ])),
};

// h2: Activities without target
export const ActivitiesWithoutTarget: Story = {
  render: () => wrap(makeFeed([
    { id: '1', actor: { name: 'Alice' }, action: 'logged in', type: 'login', timestamp: new Date(now - 300000).toISOString() },
    { id: '2', actor: { name: 'Bob' }, action: 'logged out', type: 'login', timestamp: new Date(now - 600000).toISOString() },
  ])),
};

// h2: CSS Parts Styling
// Parts: base, filters, list, entry, icon, content, timestamp, group-header
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-activity-feed exposes the following CSS parts:
         ::part(base)         — the root feed wrapper
         ::part(filters)      — the filter tabs bar
         ::part(list)         — the activity list container
         ::part(entry)        — each individual activity row
         ::part(icon)         — the activity icon element
         ::part(content)      — the text content div per entry
         ::part(timestamp)    — the timestamp div per entry
         ::part(group-header) — the group date header */
      .parts-demo .styled-feed::part(base) {
        border: 2px solid #059669;
        border-radius: 12px;
        overflow: hidden;
        background: #022c22;
      }
      .parts-demo .styled-feed::part(filters) {
        background: #064e3b;
        border-bottom: 1px solid #059669;
        padding: 6px 12px;
      }
      .parts-demo .styled-feed::part(list) {
        padding: 8px 0;
      }
      .parts-demo .styled-feed::part(entry) {
        border-left: 3px solid transparent;
        transition: border-color .15s, background .15s;
        padding: 8px 16px;
      }
      .parts-demo .styled-feed::part(entry):hover {
        border-left-color: #10b981;
        background: #064e3b44;
      }
      .parts-demo .styled-feed::part(icon) {
        background: #065f46;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        border: 1px solid #10b981;
      }
      .parts-demo .styled-feed::part(content) {
        color: #6ee7b7;
        font-size: .875rem;
      }
      .parts-demo .styled-feed::part(timestamp) {
        color: #34d399;
        font-size: .7rem;
        font-weight: 600;
        letter-spacing: .04em;
      }
      .parts-demo .styled-feed::part(group-header) {
        background: #064e3b;
        color: #6ee7b7;
        font-size: .7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .1em;
        padding: 4px 16px;
        border-top: 1px solid #05966944;
        border-bottom: 1px solid #05966944;
      }
    `;

    const activities: Activity[] = [
      { id: '1', actor: { name: 'Alice Park' }, action: 'created', target: 'Project Alpha', type: 'create', timestamp: new Date(now - 600000).toISOString() },
      { id: '2', actor: { name: 'Bob Lee' }, action: 'commented on', target: 'Issue #42', type: 'comment', timestamp: new Date(now - 1800000).toISOString() },
      { id: '3', actor: { name: 'Carol Diaz' }, action: 'deployed', target: 'v2.1.0', type: 'deploy', timestamp: new Date(now - 86400000).toISOString() },
    ];

    const outer = document.createElement('div');
    outer.className = 'parts-demo';
    outer.style.cssText = 'display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;';

    const col1 = document.createElement('div');
    col1.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;flex:1;min-width:280px;';
    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const defaultFeed = makeFeed(activities);
    col1.appendChild(lbl1);
    col1.appendChild(defaultFeed);

    const col2 = document.createElement('div');
    col2.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;flex:1;min-width:280px;';
    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(base/filters/list/entry/icon/content/timestamp/group-header)';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const styledFeed = makeFeed(activities);
    styledFeed.className = 'styled-feed';
    col2.appendChild(lbl2);
    col2.appendChild(styledFeed);

    outer.appendChild(style);
    outer.appendChild(col1);
    outer.appendChild(col2);
    return outer;
  },
};
