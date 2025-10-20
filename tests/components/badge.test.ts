import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/badge/snice-badge';
import type { SniceBadgeElement } from '../../components/badge/snice-badge.types';

describe('snice-badge', () => {
  let badge: SniceBadgeElement;

  afterEach(() => {
    if (badge) {
      removeComponent(badge as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render badge element', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      expect(badge).toBeTruthy();
      expect(badge.tagName).toBe('SNICE-BADGE');
    });

    it('should have default properties', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      expect(badge.content).toBe('');
      expect(badge.count).toBe(0);
      expect(badge.max).toBe(99);
      expect(badge.dot).toBe(false);
      expect(badge.variant).toBe('default');
      expect(badge.position).toBe('top-right');
      expect(badge.inline).toBe(false);
      expect(badge.size).toBe('medium');
      expect(badge.pulse).toBe(false);
      expect(badge.offset).toBe(0);
    });
  });

  describe('content display', () => {
    it('should display text content', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      const tracker = trackRenders(badge as HTMLElement);
      badge.content = 'New';
      await tracker.next();

      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl).toBeTruthy();
      expect(badgeEl?.textContent?.trim()).toBe('New');
    });

    it('should display count', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      const tracker = trackRenders(badge as HTMLElement);
      badge.count = 5;
      await tracker.next();

      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl?.textContent?.trim()).toBe('5');
    });

    it('should display max+ when count exceeds max', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      const tracker = trackRenders(badge as HTMLElement);
      badge.count = 150;
      badge.max = 99;
      await tracker.next();

      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl?.textContent?.trim()).toBe('99+');
    });

    it('should display dot badge', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      const tracker = trackRenders(badge as HTMLElement);
      badge.dot = true;
      await tracker.next();

      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl).toBeTruthy();
      expect(badgeEl?.classList.contains('badge--dot')).toBe(true);
    });

    it('should not show badge when no content, count, or dot', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');


      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl).toBeNull();
    });
  });

  describe('variants', () => {
    it('should support different variants', async () => {
      const variants = ['default', 'primary', 'success', 'warning', 'danger'];

      for (const variant of variants) {
        badge = await createComponent<SniceBadgeElement>('snice-badge', {
          variant,
          content: 'Test'
        });

        expect(badge.variant).toBe(variant);
        removeComponent(badge as HTMLElement);
      }
    });
  });

  describe('pulse effect', () => {
    it('should add pulse class when pulse is true', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      const tracker = trackRenders(badge as HTMLElement);
      badge.dot = true;
      badge.pulse = true;
      await tracker.next();

      const badgeEl = queryShadow(badge as HTMLElement, '.badge');
      expect(badgeEl?.classList.contains('badge--pulse')).toBe(true);
    });
  });

  describe('API methods', () => {
    beforeEach(async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');
    });

    it('should set badge content', async () => {
      badge.setBadgeContent('New');

      expect(badge.content).toBe('New');
      expect(badge.count).toBe(0);
      expect(badge.dot).toBe(false);
    });

    it('should set badge count', async () => {
      badge.setBadgeCount(5);

      expect(badge.count).toBe(5);
      expect(badge.content).toBe('');
      expect(badge.dot).toBe(false);
    });

    it('should show dot', async () => {
      badge.showDot();

      expect(badge.dot).toBe(true);
      expect(badge.content).toBe('');
      expect(badge.count).toBe(0);
    });

    it('should hide badge', async () => {
      badge.setBadgeContent('Test');

      badge.hide();

      expect(badge.dot).toBe(false);
      expect(badge.content).toBe('');
      expect(badge.count).toBe(0);
    });
  });

  describe('offset', () => {
    it('should apply offset custom property', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', {
        offset: 10
      });


      const offsetValue = (badge as HTMLElement).style.getPropertyValue('--badge-offset');
      expect(offsetValue).toBe('10px');
    });

    it('should update offset when property changes', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge');

      badge.offset = 20;

      const offsetValue = (badge as HTMLElement).style.getPropertyValue('--badge-offset');
      expect(offsetValue).toBe('20px');
    });
  });
});
