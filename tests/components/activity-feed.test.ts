import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../packages/components/src/activity-feed/snice-activity-feed';
import type { SniceActivityFeedElement, Activity } from '../../packages/components/src/activity-feed/snice-activity-feed.types';

const sampleActivities: Activity[] = [
  {
    id: '1',
    actor: { name: 'Alice Johnson', avatar: 'https://example.com/alice.jpg' },
    action: 'created',
    target: 'Project Alpha',
    timestamp: new Date().toISOString(),
    icon: '+',
    type: 'create',
  },
  {
    id: '2',
    actor: { name: 'Bob Smith' },
    action: 'commented on',
    target: 'Issue #42',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'comment',
  },
  {
    id: '3',
    actor: { name: 'Charlie' },
    action: 'deployed',
    target: 'v2.0.0',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'deploy',
  },
];

describe('snice-activity-feed', () => {
  let el: SniceActivityFeedElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-ACTIVITY-FEED');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      expect(el.activities).toEqual([]);
      expect(el.filter).toBe('');
      expect(el.groupBy).toBe('none');
    });

    it('should render feed container', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      await wait(50);
      const feed = queryShadow(el as HTMLElement, '.feed');
      expect(feed).toBeTruthy();
    });
  });

  describe('activities', () => {
    it('should render activity entries', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(3);
    });

    it('should render actor name', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const actor = queryShadow(el as HTMLElement, '.feed__actor');
      expect(actor?.textContent).toContain('Alice Johnson');
    });

    it('should render action text', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const action = queryShadow(el as HTMLElement, '.feed__action');
      expect(action?.textContent).toContain('created');
    });

    it('should render target', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const target = queryShadow(el as HTMLElement, '.feed__target');
      expect(target?.textContent).toContain('Project Alpha');
    });

    it('should render icon', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const icon = queryShadow(el as HTMLElement, '.feed__icon');
      expect(icon).toBeTruthy();
      expect(icon?.textContent?.trim()).toBe('+');
    });

    it('should render timestamp', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const timestamp = queryShadow(el as HTMLElement, '.feed__timestamp');
      expect(timestamp).toBeTruthy();
      expect(timestamp?.textContent?.trim()).toBeTruthy();
    });

    it('should render type badge when type is set', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const badge = queryShadow(el as HTMLElement, '.feed__type-badge');
      expect(badge?.textContent?.trim()).toBe('create');
    });
  });

  describe('empty state', () => {
    it('should show empty state when no activities', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      await wait(50);
      const empty = queryShadow(el as HTMLElement, '.feed__empty');
      expect(empty).toBeTruthy();
    });

    it('should hide empty state when activities exist', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const list = queryShadow(el as HTMLElement, '.feed__list');
      expect(list).toBeTruthy();
    });
  });

  describe('filtering', () => {
    it('should render filter buttons when types exist', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const filters = queryShadowAll(el as HTMLElement, '.feed__filter');
      // "All" + unique types (create, comment, deploy)
      expect(filters.length).toBe(4);
    });

    it('should filter activities by type', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      el.filter = 'create';
      await tracker.next();

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(1);
    });

    it('should clear filter via clearFilter()', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      el.filter = 'create';
      await tracker.next();

      el.clearFilter();
      await tracker.next();

      expect(el.filter).toBe('');
      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(3);
    });
  });

  describe('grouping', () => {
    it('should render group headers when group-by is date', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      el.groupBy = 'date';
      await tracker.next();

      const headers = queryShadowAll(el as HTMLElement, '.feed__group-header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should not render group headers when group-by is none', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      el.groupBy = 'none';
      await tracker.next();

      const headers = queryShadowAll(el as HTMLElement, '.feed__group-header');
      expect(headers.length).toBe(0);
    });
  });

  describe('addActivity()', () => {
    it('should add activity to the beginning', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      el.activities = sampleActivities;

      const newActivity: Activity = {
        id: '99',
        actor: { name: 'New User' },
        action: 'joined',
        timestamp: new Date().toISOString(),
      };
      el.addActivity(newActivity);

      expect(el.activities.length).toBe(4);
      expect(el.activities[0].id).toBe('99');
    });
  });

  describe('events', () => {
    it('should emit activity-click on entry click', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      let detail: any = null;
      (el as HTMLElement).addEventListener('activity-click', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      const entry = queryShadow(el as HTMLElement, '.feed__entry');
      entry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(50);

      expect(detail).toBeTruthy();
      expect(detail.activity.id).toBe('1');
    });

    it('should emit load-more on button click', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed', { 'has-more': true });
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      let detail: any = null;
      (el as HTMLElement).addEventListener('load-more', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      btn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(50);

      expect(detail).toBeTruthy();
      expect(detail.count).toBe(3);
    });
  });

  describe('avatars', () => {
    it('should render avatar image when provided', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]];
      await tracker.next();

      const img = queryShadow(el as HTMLElement, '.feed__actor-avatar img');
      expect(img).toBeTruthy();
    });

    it('should render initials when no avatar', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[1]];
      await tracker.next();

      const avatar = queryShadow(el as HTMLElement, '.feed__actor-avatar');
      expect(avatar?.textContent?.trim()).toBe('BS');
    });
  });

  describe('load more', () => {
    it('should not render load more by default even when activities exist', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      expect(btn).toBeFalsy();
    });

    it('should render load more button when has-more is set', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed', { 'has-more': true });
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      expect(btn).toBeTruthy();
    });

    it('should not render load more button when no activities', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed', { 'has-more': true });
      await wait(50);
      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      expect(btn).toBeFalsy();
    });
  });

  describe('declarative children (dual API)', () => {
    function makeItem(attrs: Record<string, string>): HTMLElement {
      const item = document.createElement('snice-activity-item');
      for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, value);
      return item;
    }

    it('should render entries from slotted snice-activity-item children', async () => {
      const feed = document.createElement('snice-activity-feed') as SniceActivityFeedElement;
      feed.appendChild(makeItem({ 'item-id': 'd1', 'actor-name': 'Slot Alice', action: 'created', target: 'Doc A', timestamp: new Date().toISOString() }));
      feed.appendChild(makeItem({ 'item-id': 'd2', 'actor-name': 'Slot Bob', action: 'deleted', target: 'Doc B', timestamp: new Date().toISOString() }));
      document.body.appendChild(feed);
      el = feed;

      await (feed as any).ready;
      await wait(80);

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(2);
      const text = (queryShadow(el as HTMLElement, '.feed__list') as HTMLElement)?.textContent ?? '';
      expect(text).toContain('Slot Alice');
      expect(text).toContain('Slot Bob');
    });

    it('should prefer slotted children over the activities array', async () => {
      const feed = document.createElement('snice-activity-feed') as SniceActivityFeedElement;
      feed.appendChild(makeItem({ 'item-id': 'd3', 'actor-name': 'Slot Carol', action: 'updated', timestamp: new Date().toISOString() }));
      document.body.appendChild(feed);
      el = feed;

      await (feed as any).ready;
      feed.activities = sampleActivities;
      await wait(80);

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(1);
      expect((queryShadow(el as HTMLElement, '.feed__list') as HTMLElement)?.textContent).toContain('Slot Carol');
    });
  });

  describe('keyed rendering', () => {
    it('should preserve entry DOM nodes when an activity is prepended', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const before = queryShadowAll(el as HTMLElement, '.feed__entry')[0];
      expect(before).toBeTruthy();

      el.addActivity({ id: 'new-1', actor: { name: 'Fresh User' }, action: 'joined', timestamp: new Date().toISOString() });
      await tracker.next();

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      expect(entries.length).toBe(4);
      // The entry that was first is now second — and must be the same node.
      expect(entries[1]).toBe(before);
    });
  });

  describe('timestamp robustness', () => {
    it('should show the raw string for an unparseable timestamp', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [{ id: 'bad', actor: { name: 'Nobody' }, action: 'did', timestamp: 'not-a-date' }];
      await tracker.next();

      const ts = queryShadow(el as HTMLElement, '.feed__timestamp');
      expect(ts?.textContent?.trim()).toBe('not-a-date');
      expect(ts?.textContent).not.toContain('Invalid');
    });

    it('should not render an Invalid Date group header', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [{ id: 'bad', actor: { name: 'Nobody' }, action: 'did', timestamp: ' garbage' }];
      el.groupBy = 'date';
      await tracker.next();

      const header = queryShadow(el as HTMLElement, '.feed__group-header');
      expect(header?.textContent).not.toContain('Invalid');
    });
  });

  describe('group ordering', () => {
    it('should order date groups newest first regardless of input order', async () => {
      const now = Date.now();
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [
        { id: 'y1', actor: { name: 'Y' }, action: 'acted', timestamp: new Date(now - 86400000).toISOString() },
        { id: 't1', actor: { name: 'T' }, action: 'acted', timestamp: new Date(now).toISOString() },
      ];
      el.groupBy = 'date';
      await tracker.next();

      const headers = queryShadowAll(el as HTMLElement, '.feed__group-header');
      expect(headers[0]?.textContent?.trim()).toBe('Today');
      expect(headers[1]?.textContent?.trim()).toBe('Yesterday');
    });
  });

  describe('accessibility', () => {
    it('should mark the active filter with aria-pressed', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const buttons = queryShadowAll<HTMLButtonElement>(el as HTMLElement, '.feed__filter');
      expect(buttons[0].getAttribute('aria-pressed')).toBe('true'); // "All" active by default

      buttons[1].click();
      await tracker.next();

      const after = queryShadowAll<HTMLButtonElement>(el as HTMLElement, '.feed__filter');
      expect(after[0].getAttribute('aria-pressed')).toBe('false');
      expect(after[1].getAttribute('aria-pressed')).toBe('true');
    });

    it('should expose the ARIA feed pattern on the list and entries', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const list = queryShadow(el as HTMLElement, '.feed__list');
      expect(list?.getAttribute('role')).toBe('feed');

      const entries = queryShadowAll(el as HTMLElement, '.feed__entry');
      entries.forEach((entry, i) => {
        expect(entry.getAttribute('role')).toBe('article');
        expect(entry.getAttribute('aria-posinset')).toBe(String(i + 1));
        expect(entry.getAttribute('aria-setsize')).toBe(String(entries.length));
      });
    });
  });

  describe('labels', () => {
    it('should apply custom empty, load-more, and all labels', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed', {
        'empty-message': 'Nichts hier',
        'load-more-label': 'Mehr laden',
        'all-label': 'Alle',
        'has-more': true,
      });
      await wait(50);
      expect(queryShadow(el as HTMLElement, '.feed__empty')?.textContent?.trim()).toBe('Nichts hier');

      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();
      expect(queryShadow(el as HTMLElement, '.feed__load-more-btn')?.textContent?.trim()).toBe('Mehr laden');
      expect(queryShadowAll(el as HTMLElement, '.feed__filter')[0]?.textContent?.trim()).toBe('Alle');
    });
  });

  describe('avatar fallback', () => {
    it('should fall back to initials when the avatar image fails to load', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [sampleActivities[0]]; // Alice Johnson with avatar URL
      await tracker.next();

      const img = queryShadow<HTMLImageElement>(el as HTMLElement, '.feed__actor-avatar img');
      expect(img).toBeTruthy();
      img!.dispatchEvent(new Event('error'));
      await wait(80);

      const avatar = queryShadow(el as HTMLElement, '.feed__actor-avatar');
      expect(avatar?.querySelector('img')).toBeFalsy();
      expect(avatar?.textContent?.trim()).toBe('AJ');
    });
  });

  describe('default icons', () => {
    it('should render registry SVGs for known types instead of text glyphs', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [
        { id: 'c', actor: { name: 'A' }, action: 'made', timestamp: new Date().toISOString(), type: 'create' },
        { id: 'd', actor: { name: 'B' }, action: 'shipped', timestamp: new Date().toISOString(), type: 'deploy' },
        { id: 'm', actor: { name: 'C' }, action: 'said', timestamp: new Date().toISOString(), type: 'comment' },
      ];
      await tracker.next();

      const icons = queryShadowAll(el as HTMLElement, '.feed__icon');
      icons.forEach(iconEl => {
        expect(iconEl.querySelector('svg')).toBeTruthy();
      });
    });

    it('should still honor an explicit emoji icon override', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = [
        { id: 'e', actor: { name: 'A' }, action: 'partied', timestamp: new Date().toISOString(), icon: '🎉' },
      ];
      await tracker.next();

      expect(queryShadow(el as HTMLElement, '.feed__icon')?.textContent).toContain('🎉');
    });
  });

  describe('live timestamps', () => {
    it('should refresh relative timestamps on the configured interval', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed', { 'refresh-interval': 50 });
      const tracker = trackRenders(el as HTMLElement);
      const activity: Activity = {
        id: 'tick', actor: { name: 'A' }, action: 'acted',
        timestamp: new Date(Date.now() - 30000).toISOString(),
      };
      el.activities = [activity];
      await tracker.next();

      expect(queryShadow(el as HTMLElement, '.feed__timestamp')?.textContent?.trim()).toBe('just now');

      // Age the activity in place; only the component's own refresh tick can
      // surface the change since no property assignment happens here.
      activity.timestamp = new Date(Date.now() - 5 * 60000).toISOString();
      await wait(250);

      expect(queryShadow(el as HTMLElement, '.feed__timestamp')?.textContent?.trim()).toBe('5m ago');
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/activity-feed/snice-activity-feed.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('should not rely on text-shadow outlines for filter contrast', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).not.toContain('text-shadow');
    });
  });
});
