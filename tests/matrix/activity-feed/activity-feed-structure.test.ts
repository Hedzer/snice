/**
 * Matrix slice ACTIVITY-FEED / STRUCTURE — the documented parts, the empty
 * state and the load-more affordance, crossed with grouping and both halves of
 * the dual API.
 *
 * Dimensions: groupBy (2) x source (2) x hasMore (2) x count (0/1/5) = 24
 * combos, plus the four label properties (4). 28 cases.
 *
 * Contract asserted (docs/ai/components/activity-feed.md):
 *   · Parts `base`, `filters`, `list`, `entry`, `icon`, `content`, `timestamp`,
 *     `group-header`.
 *   · One `entry` per activity; the list carries `role="feed"`, entries
 *     `role="article"` with 1-based `aria-posinset` and a shared `aria-setsize`,
 *     and are focusable.
 *   · `hasMore` "shows the load-more button", and the button "only renders when
 *     `has-more` is set".
 *   · An empty feed shows `emptyMessage` (default "No activity to display.").
 *   · `loadMoreLabel` / `allLabel` label their buttons.
 *   · "Slotted items take precedence over the `activities` array."
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, cross, part, parts, all, one, text, Problems, expectClean } from './matrix-utils';
import {
  GROUPINGS, SOURCES, COUNTS, feedOf, feed, mountFeed, typesOf, dayGroups, newestFirst,
} from './activity-feed-support';

describe('activity-feed matrix: structure', () => {
  afterEach(() => cleanup());

  for (const combo of cross({
    groupBy: GROUPINGS, source: SOURCES, hasMore: [false, true], count: COUNTS,
  })) {
    it(`${combo.id}: the documented parts, list roles and load-more affordance`, async () => {
      const activities = feedOf(combo.count);
      const el = await mountFeed({
        activities, source: combo.source, groupBy: combo.groupBy, hasMore: combo.hasMore,
      });
      const p = new Problems();
      const hasActivities = activities.length > 0;

      p.ok(part(el, 'base') !== null, 'no part="base"');

      // The list exists exactly when there is something to list, and carries
      // the documented feed role.
      const list = part(el, 'list');
      p.ok((list !== null) === hasActivities,
        `part="list" ${list ? 'present' : 'absent'} for ${activities.length} activities`);
      if (list) p.eq('list role', list.getAttribute('role'), 'feed');

      // One entry per activity, each a focusable article with its position.
      const entries = parts(el, 'entry');
      p.eq('entry count', entries.length, activities.length);
      p.eq('entry roles', entries.map(e => e.getAttribute('role')),
        activities.map(() => 'article'));
      p.eq('aria-posinset', entries.map(e => e.getAttribute('aria-posinset')),
        activities.map((_, i) => String(i + 1)));
      p.eq('aria-setsize', entries.map(e => e.getAttribute('aria-setsize')),
        activities.map(() => String(activities.length)));
      p.eq('entry tabindex', entries.map(e => e.getAttribute('tabindex')),
        activities.map(() => '0'));

      // Each entry owns the documented icon / content / timestamp parts. The
      // assertion is per-entry PRESENCE rather than a global count: the shared
      // icon helper exposes `part="icon"` on the glyph it renders as well, so a
      // count would be measuring that helper rather than this component.
      for (const [i, entry] of entries.entries()) {
        for (const name of ['icon', 'content', 'timestamp']) {
          p.ok(entry.querySelector(`[part~="${name}"]`) !== null,
            `entry ${i} has no part="${name}"`);
        }
      }

      // The filter bar exists exactly when the feed has typed activities.
      const filters = part(el, 'filters');
      const types = typesOf(activities);
      p.ok((filters !== null) === (types.length > 0),
        `part="filters" ${filters ? 'present' : 'absent'} for types [${types}]`);

      // Group headers: one per calendar day, and only in the grouped mode.
      const headers = parts(el, 'group-header');
      const wantHeaders = combo.groupBy === 'date' ? dayGroups(activities).length : 0;
      p.eq('group headers', headers.length, wantHeaders);

      // The load-more button only renders when `has-more` is set.
      const loadMore = one<HTMLButtonElement>(el, '.feed__load-more-btn');
      if (loadMore) {
        p.ok(combo.hasMore, 'load-more button rendered without has-more');
      } else if (combo.hasMore && hasActivities) {
        p.say('has-more set on a non-empty feed rendered no load-more button');
      }

      // The empty state is the zero-activity state, and only that.
      const empty = one(el, '.feed__empty');
      p.ok((empty !== null) === !hasActivities,
        `empty message ${empty ? 'present' : 'absent'} for ${activities.length} activities`);
      if (empty) p.eq('default empty message', text(empty), 'No activity to display.');

      expectClean(p, combo.id);
    });
  }

  // ── The documented labels ─────────────────────────────────────────────────

  it('empty-message replaces the default empty text', async () => {
    const el = await mountFeed({ activities: [], emptyMessage: 'Nothing happened yet' });
    const p = new Problems();
    p.eq('empty message', text(one(el, '.feed__empty')), 'Nothing happened yet');
    expectClean(p, 'empty-message');
  });

  it('load-more-label labels the load-more button', async () => {
    const el = await mountFeed({ activities: feed(), hasMore: true, loadMoreLabel: 'Older' });
    const p = new Problems();
    p.eq('load-more label', text(one(el, '.feed__load-more-btn')), 'Older');
    expectClean(p, 'load-more-label');
  });

  it('all-label labels the reset-filter button', async () => {
    const el = await mountFeed({ activities: feed(), allLabel: 'Everything' });
    const p = new Problems();
    p.eq('first filter button', text(all(el, '.feed__filter')[0]), 'Everything');
    expectClean(p, 'all-label');
  });

  it('grouped mode lists the newest activity first', async () => {
    const activities = feed();
    const el = await mountFeed({ activities, groupBy: 'date' });
    const p = new Problems();

    // The feed is delivered out of order on purpose; grouping sorts it.
    const rendered = parts(el, 'entry').map(text);
    const expected = newestFirst(activities);
    p.eq('grouped entry count', rendered.length, expected.length);
    for (const [i, activity] of expected.entries()) {
      p.ok((rendered[i] ?? '').includes(activity.actor.name),
        `position ${i + 1} reads "${rendered[i]}", expected ${activity.actor.name}`);
    }

    expectClean(p, 'grouped-order');
  });
});
