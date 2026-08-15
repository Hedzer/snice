/**
 * Matrix slice ACTIVITY-FEED / BEHAVIOUR — filtering, the dual-API precedence
 * rule, and every documented event.
 *
 * Dimensions: source (2) x filter target (4: none + three types) = 8 combos for
 * the filter bar, plus grouping x filter (4), the precedence rule (2), and one
 * case per documented method and event (8). 22 cases.
 *
 * Contract asserted (docs/ai/components/activity-feed.md):
 *   · The filter bar offers `allLabel` plus one button per activity type, and
 *     "filter buttons expose `aria-pressed`".
 *   · `filter` keeps only the activities of that type; `clearFilter()` "Reset
 *     filter to show all"; clicking the active filter clears it too.
 *   · Filtering composes with grouping.
 *   · `addActivity(activity)` — "Prepend activity to feed".
 *   · "Slotted items take precedence over the `activities` array."
 *   · `activity-click` → `{ activity }`, from a click and from Enter/Space
 *     ("Entries: focusable, Enter/Space activates").
 *   · `load-more` → `{ count: number }`.
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach } from 'vitest';
import {
  cleanup, cross, all, one, parts, part, text, click, key, record, settle,
  Problems, expectClean,
} from './matrix-utils';
import {
  GROUPINGS, SOURCES, feed, feedOf, mountFeed, typesOf, filtered, asDelivered, ago,
} from './activity-feed-support';

/** The filter bar's buttons, in rendered order. */
const filterButtons = (el: HTMLElement) => all<HTMLButtonElement>(el, '.feed__filter');

/** The actor names the feed currently shows, in rendered order. */
const shownActors = (el: HTMLElement) => parts(el, 'entry').map(text);

describe('activity-feed matrix: behaviour', () => {
  afterEach(() => cleanup());

  // ── The filter bar ────────────────────────────────────────────────────────

  for (const combo of cross({ source: SOURCES, filter: ['', 'create', 'comment', 'deploy'] as const })) {
    it(`${combo.id}: the filter bar keeps only the chosen type`, async () => {
      const activities = feed();
      const el = await mountFeed({
        activities, source: combo.source, ...(combo.filter ? { filter: combo.filter } : {}),
      });
      const p = new Problems();

      // One button per distinct type, behind the reset button.
      const types = typesOf(activities);
      const buttons = filterButtons(el);
      p.eq('filter buttons', buttons.map(text), ['All', ...types]);

      // aria-pressed marks the active filter, and only it.
      p.eq('aria-pressed', buttons.map(b => b.getAttribute('aria-pressed')),
        ['All', ...types].map(label =>
          String(combo.filter ? label === combo.filter : label === 'All')));

      // The rows the filter admits, in delivery order.
      const kept = filtered(activities, combo.filter);
      const shown = shownActors(el);
      p.eq('entry count', shown.length, kept.length);
      for (const [i, activity] of kept.entries()) {
        p.ok((shown[i] ?? '').includes(activity.actor.name),
          `row ${i} reads "${shown[i]}", expected ${activity.actor.name}`);
      }

      expectClean(p, combo.id);
    });
  }

  for (const combo of cross({ groupBy: GROUPINGS, filter: ['create', 'comment'] as const })) {
    it(`${combo.id}: filtering composes with grouping`, async () => {
      const activities = feed();
      const el = await mountFeed({ activities, groupBy: combo.groupBy, filter: combo.filter });
      const p = new Problems();

      const kept = filtered(activities, combo.filter);
      p.eq('entry count', parts(el, 'entry').length, kept.length);
      // A group header only exists for a day that still has a row in it.
      if (combo.groupBy === 'date') {
        const days = new Set(kept.map(a => new Date(a.timestamp).toDateString()));
        p.eq('group headers', parts(el, 'group-header').length, days.size);
      } else {
        p.eq('group headers', parts(el, 'group-header').length, 0);
      }

      expectClean(p, combo.id);
    });
  }

  it('clicking a filter button filters, clicking it again clears', async () => {
    const activities = feed();
    const el = await mountFeed({ activities });
    const p = new Problems();

    const create = filterButtons(el).find(b => text(b) === 'create')!;
    click(create);
    await settle();
    p.eq('filter after click', el.filter, 'create');
    p.eq('rows after click', parts(el, 'entry').length, filtered(activities, 'create').length);

    click(filterButtons(el).find(b => text(b) === 'create')!);
    await settle();
    p.eq('filter after second click', el.filter, '');
    p.eq('rows after second click', parts(el, 'entry').length, activities.length);

    expectClean(p, 'filter-toggle');
  });

  it('the All button and clearFilter() both reset the feed', async () => {
    const activities = feed();
    const p = new Problems();

    const byButton = await mountFeed({ activities, filter: 'create' });
    click(filterButtons(byButton)[0]);
    await settle();
    p.eq('filter after All', byButton.filter, '');
    p.eq('rows after All', parts(byButton, 'entry').length, activities.length);
    cleanup();

    const byMethod = await mountFeed({ activities, filter: 'create' });
    byMethod.clearFilter();
    await settle();
    p.eq('filter after clearFilter()', byMethod.filter, '');
    p.eq('rows after clearFilter()', parts(byMethod, 'entry').length, activities.length);

    expectClean(p, 'filter-reset');
  });

  // ── The dual API ──────────────────────────────────────────────────────────

  for (const groupBy of GROUPINGS) {
    it(`group-by=${groupBy}: slotted items take precedence over the activities array`, async () => {
      const declared = feedOf(5);
      const el = await mountFeed({ activities: declared, source: 'slot', groupBy });
      const p = new Problems();

      el.activities = [{
        id: 'zz', actor: { name: 'Imperative' }, action: 'wrote', timestamp: ago(0),
      }];
      await settle();

      const shown = shownActors(el);
      p.eq('entry count after assignment', shown.length, declared.length);
      p.eq('imperative rows', shown.filter(row => row.includes('Imperative')).length, 0);

      expectClean(p, `group-by=${groupBy}`);
    });
  }

  it('addActivity prepends to the feed', async () => {
    const activities = feedOf(5);
    const el = await mountFeed({ activities });
    const p = new Problems();

    const fresh = {
      id: 'new', actor: { name: 'System' }, action: 'deployed',
      target: 'v3.0', timestamp: ago(0), type: 'deploy',
    };
    el.addActivity(fresh);
    await settle();

    const shown = shownActors(el);
    p.eq('entry count', shown.length, activities.length + 1);
    p.ok((shown[0] ?? '').includes('System'),
      `addActivity put "${shown[0]}" first, expected the new activity`);
    p.eq('activities property', el.activities.length, activities.length + 1);

    expectClean(p, 'addActivity');
  });

  // ── Events ────────────────────────────────────────────────────────────────

  for (const source of SOURCES) {
    it(`source=${source}: activity-click reports the clicked activity`, async () => {
      const activities = feedOf(5);
      const el = await mountFeed({ activities, source });
      const p = new Problems();
      const expected = asDelivered(activities, source);

      for (const [i, entry] of parts(el, 'entry').entries()) {
        const seen = record(el, ['activity-click']);
        click(entry);
        seen.stop();
        p.eq(`entry ${i} events`, seen.events.length, 1);
        p.eq(`entry ${i} activity`, seen.events[0]?.detail?.activity, expected[i]);
      }

      expectClean(p, `source=${source}`);
    });
  }

  for (const pressed of ['Enter', ' ']) {
    it(`an entry activates on ${pressed === ' ' ? 'Space' : 'Enter'}`, async () => {
      const activities = feedOf(1);
      const el = await mountFeed({ activities });
      const p = new Problems();

      const seen = record(el, ['activity-click']);
      const defaultAllowed = key(parts(el, 'entry')[0], pressed);
      seen.stop();

      p.eq('events', seen.events.length, 1);
      p.eq('activity', seen.events[0]?.detail?.activity, activities[0]);
      p.ok(defaultAllowed === false,
        `${pressed} activation did not preventDefault, so the page would also scroll`);

      expectClean(p, `key=${pressed}`);
    });
  }

  it('load-more reports the current activity count', async () => {
    const activities = feed();
    const el = await mountFeed({ activities, hasMore: true });
    const p = new Problems();

    const seen = record(el, ['load-more']);
    click(one(el, '.feed__load-more-btn'));
    seen.stop();

    p.eq('events', seen.events.length, 1);
    p.eq('count', seen.events[0]?.detail?.count, activities.length);

    expectClean(p, 'load-more');
  });

  it('no load-more button, no load-more event', async () => {
    const el = await mountFeed({ activities: feed(), hasMore: false });
    const p = new Problems();
    p.ok(one(el, '.feed__load-more-btn') === null,
      'a feed without has-more still rendered the load-more button');
    p.ok(part(el, 'base') !== null, 'no part="base"');
    expectClean(p, 'no-load-more');
  });
});
