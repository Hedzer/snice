import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders, wait } from './test-utils';
import '../../components/timeline/snice-timeline';
import type { SniceTimelineElement } from '../../components/timeline/snice-timeline.types';

describe('snice-timeline', () => {
  let timeline: SniceTimelineElement;

  afterEach(() => {
    if (timeline) {
      removeComponent(timeline as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render timeline element', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      expect(timeline).toBeTruthy();
      expect(timeline.tagName).toBe('SNICE-TIMELINE');
    });

    it('should have default properties', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      expect(timeline.orientation).toBe('vertical');
      expect(timeline.position).toBe('left');
      expect(timeline.items).toEqual([]);
      expect(timeline.reverse).toBe(false);
    });

    it('should render timeline container', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container).toBeTruthy();
    });
  });

  describe('orientation', () => {
    it('should support vertical orientation', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        orientation: 'vertical'
      });
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--vertical')).toBe(true);
    });

    it('should support horizontal orientation', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        orientation: 'horizontal'
      });
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--horizontal')).toBe(true);
    });
  });

  describe('position', () => {
    it('should support left position', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        position: 'left'
      });
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--left')).toBe(true);
    });

    it('should support right position', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        position: 'right'
      });
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--right')).toBe(true);
    });

    it('should support alternate position', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        position: 'alternate'
      });
      await wait(50);

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--alternate')).toBe(true);
    });
  });

  describe('items', () => {
    it('should render timeline items', async () => {
      const items = [
        { title: 'Event 1', timestamp: '2024-01-01' },
        { title: 'Event 2', timestamp: '2024-01-02' },
        { title: 'Event 3', timestamp: '2024-01-03' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const itemElements = queryShadowAll(timeline as HTMLElement, '.timeline-item');
      expect(itemElements.length).toBe(3);
    });

    it('should render item titles', async () => {
      const items = [
        { title: 'First Event' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const title = queryShadow(timeline as HTMLElement, '.timeline-item__title');
      expect(title?.textContent).toBe('First Event');
    });

    it('should render item timestamps', async () => {
      const items = [
        { title: 'Event', timestamp: '2024-01-01 10:00' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const timestamp = queryShadow(timeline as HTMLElement, '.timeline-item__timestamp');
      expect(timestamp?.textContent).toBe('2024-01-01 10:00');
    });

    it('should render item descriptions', async () => {
      const items = [
        { title: 'Event', description: 'This is a description' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const description = queryShadow(timeline as HTMLElement, '.timeline-item__description');
      expect(description?.textContent).toBe('This is a description');
    });

    it('should not render timestamp when not provided', async () => {
      const items = [
        { title: 'Event' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const timestamp = queryShadow(timeline as HTMLElement, '.timeline-item__timestamp');
      if (timestamp) {
        expect(timestamp.textContent?.trim()).toBe('');
      }
    });

    it('should not render description when not provided', async () => {
      const items = [
        { title: 'Event' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const description = queryShadow(timeline as HTMLElement, '.timeline-item__description');
      if (description) {
        expect(description.textContent?.trim()).toBe('');
      }
    });
  });

  describe('item variants', () => {
    const variants = ['default', 'success', 'warning', 'error', 'info'];

    variants.forEach(variant => {
      it(`should support ${variant} variant`, async () => {
        const items = [
          { title: 'Event', variant: variant as any }
        ];

        timeline = await createComponent<SniceTimelineElement>('snice-timeline');
        const tracker = trackRenders(timeline as HTMLElement);
        timeline.items = items;
        await tracker.next();

        const item = queryShadow(timeline as HTMLElement, '.timeline-item');
        expect(item?.classList.contains(`timeline-item--${variant}`)).toBe(true);
      });
    });
  });

  describe('icons', () => {
    it('should render default icon for variant', async () => {
      const items = [
        { title: 'Event', variant: 'success' as any }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const icon = queryShadow(timeline as HTMLElement, '.timeline-item__icon');
      expect(icon?.textContent).toBe('✓');
    });

    it('should render custom icon when provided', async () => {
      const items = [
        { title: 'Event', icon: '🎉' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const icon = queryShadow(timeline as HTMLElement, '.timeline-item__icon');
      expect(icon?.textContent).toBe('🎉');
    });
  });

  describe('reverse', () => {
    it('should reverse items when reverse is true', async () => {
      const items = [
        { title: 'Event 1' },
        { title: 'Event 2' },
        { title: 'Event 3' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline', {
        reverse: true
      });
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const container = queryShadow(timeline as HTMLElement, '.timeline');
      expect(container?.classList.contains('timeline--reverse')).toBe(true);
    });
  });

  describe('marker', () => {
    it('should render marker for each item', async () => {
      const items = [
        { title: 'Event 1' },
        { title: 'Event 2' }
      ];

      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      const tracker = trackRenders(timeline as HTMLElement);
      timeline.items = items;
      await tracker.next();

      const markers = queryShadowAll(timeline as HTMLElement, '.timeline-item__marker');
      expect(markers.length).toBe(2);
    });
  });

  describe('empty state', () => {
    it('should render without items', async () => {
      timeline = await createComponent<SniceTimelineElement>('snice-timeline');
      await wait(50);

      const items = queryShadowAll(timeline as HTMLElement, '.timeline-item');
      expect(items.length).toBe(0);
    });
  });
});
