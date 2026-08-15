/**
 * Smoke slice of the snice-activity-feed matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full activity-feed matrix (92 combos) runs only via
 * `npm run test:matrix`. This file deliberately lives at `smoke.test.ts` so
 * it stays collected by the everyday loop.
 *
 * One marquee combo per feature family:
 *   · structure  — parts, `role="feed"`, `role="article"` + posinset/setsize;
 *   · entry      — actor, action, target, relative timestamp, icon;
 *   · filtering  — a type button keeps only its rows and reports aria-pressed;
 *   · grouping   — grouped mode sorts newest first under day headings;
 *   · dual API   — slotted items take precedence over `activities`;
 *   · events     — `activity-click` and `load-more`.
 *
 * Every assertion routes through the matrix's own oracle module
 * (matrix/activity-feed/activity-feed-support.ts).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  cleanup, part, parts, all, one, text, click, record, settle,
} from './matrix-utils';
import {
  feed, feedOf, mountFeed, filtered, newestFirst, dayGroups, typesOf, ago,
} from './activity-feed-support';

describe('activity-feed matrix smoke', () => {
  afterEach(() => cleanup());

  it('structure: the list is a feed of articles that know their position', async () => {
    const activities = feed();
    const el = await mountFeed({ activities });

    expect(part(el, 'list')?.getAttribute('role')).toBe('feed');
    const entries = parts(el, 'entry');
    expect(entries).toHaveLength(activities.length);
    expect(entries.map(e => e.getAttribute('role'))).toEqual(activities.map(() => 'article'));
    expect(entries.map(e => e.getAttribute('aria-posinset')))
      .toEqual(activities.map((_, i) => String(i + 1)));
    expect(entries[0].getAttribute('aria-setsize')).toBe(String(activities.length));
  });

  it('entry: actor, action, target, icon and a relative timestamp', async () => {
    const timestamp = ago(2 * 3_600_000);
    const el = await mountFeed({
      activities: [{
        id: 'a1', actor: { name: 'Alice Ray' }, action: 'created',
        target: 'Project Alpha', timestamp, type: 'create',
      }],
    });

    const entry = parts(el, 'entry')[0];
    expect(text(entry)).toContain('Alice Ray');
    expect(text(entry)).toContain('created');
    expect(text(entry)).toContain('Project Alpha');
    expect(part(el, 'icon')?.innerHTML.trim().length).toBeGreaterThan(0);
    expect(text(part(el, 'timestamp'))).not.toBe(timestamp);
  });

  it('filtering: a type button keeps only its rows', async () => {
    const activities = feed();
    const el = await mountFeed({ activities });

    const create = all<HTMLButtonElement>(el, '.feed__filter').find(b => text(b) === 'create')!;
    click(create);
    await settle();

    expect(el.filter).toBe('create');
    expect(parts(el, 'entry')).toHaveLength(filtered(activities, 'create').length);
    expect(all(el, '.feed__filter').map(b => b.getAttribute('aria-pressed')))
      .toEqual(['All', ...typesOf(activities)].map(label => String(label === 'create')));
  });

  it('grouping: date mode heads each day and lists the newest first', async () => {
    const activities = feed();
    const el = await mountFeed({ activities, groupBy: 'date' });

    expect(parts(el, 'group-header')).toHaveLength(dayGroups(activities).length);
    expect(text(parts(el, 'entry')[0])).toContain(newestFirst(activities)[0].actor.name);
  });

  it('dual API: slotted items take precedence over the activities array', async () => {
    const declared = feedOf(5);
    const el = await mountFeed({ activities: declared, source: 'slot' });

    el.activities = [{ id: 'zz', actor: { name: 'Imperative' }, action: 'wrote', timestamp: ago(0) }];
    await settle();

    expect(parts(el, 'entry')).toHaveLength(declared.length);
    expect(parts(el, 'entry').map(text).join(' ')).not.toContain('Imperative');
  });

  it('events: activity-click reports the activity, load-more the count', async () => {
    const activities = feedOf(5);
    const el = await mountFeed({ activities, hasMore: true });

    const clicks = record(el, ['activity-click']);
    click(parts(el, 'entry')[2]);
    clicks.stop();
    expect(clicks.events).toEqual([{ type: 'activity-click', detail: { activity: activities[2] } }]);

    const more = record(el, ['load-more']);
    click(one(el, '.feed__load-more-btn'));
    more.stop();
    expect(more.events).toEqual([{ type: 'load-more', detail: { count: activities.length } }]);
  });
});
