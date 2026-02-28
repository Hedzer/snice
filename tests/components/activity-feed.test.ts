import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/activity-feed/snice-activity-feed';
import type { SniceActivityFeedElement, Activity } from '../../components/activity-feed/snice-activity-feed.types';

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
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
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
    it('should render load more button when activities exist', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      const tracker = trackRenders(el as HTMLElement);
      el.activities = sampleActivities;
      await tracker.next();

      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      expect(btn).toBeTruthy();
    });

    it('should not render load more button when no activities', async () => {
      el = await createComponent<SniceActivityFeedElement>('snice-activity-feed');
      await wait(50);
      const btn = queryShadow(el as HTMLElement, '.feed__load-more-btn');
      expect(btn).toBeFalsy();
    });
  });
});
