import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, trackRenders, wait } from './test-utils';
import '../../packages/components/src/badge/snice-badge';
import type { SniceBadgeElement } from '../../packages/components/src/badge/snice-badge.types';

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

  describe('accessible label', () => {
    it('should use the label property for the aria-label when provided', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', { count: 5, label: '5 unread messages' });
      await wait(50);

      expect(queryShadow(badge as HTMLElement, '.badge')?.getAttribute('aria-label')).toBe('5 unread messages');
    });

    it('should fall back to the display content without a label', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', { count: 5 });
      await wait(50);

      expect(queryShadow(badge as HTMLElement, '.badge')?.getAttribute('aria-label')).toBe('5');
    });
  });

  describe('show-zero', () => {
    it('should render a zero count when show-zero is set', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', { count: 0, 'show-zero': true });
      await wait(50);

      const el = queryShadow(badge as HTMLElement, '.badge');
      expect(el).toBeTruthy();
      expect(el?.textContent?.trim()).toBe('0');
    });

    it('should keep hiding a zero count without show-zero', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', { count: 0 });
      await wait(50);

      expect(queryShadow(badge as HTMLElement, '.badge')).toBeFalsy();
    });
  });

  describe('count-change bump', () => {
    it('should replay the bump animation class when the count changes', async () => {
      badge = await createComponent<SniceBadgeElement>('snice-badge', { count: 2 });
      await wait(80);

      badge.count = 3;
      await wait(120);

      expect(queryShadow(badge as HTMLElement, '.badge')?.classList.contains('badge--bump')).toBe(true);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/badge/snice-badge.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should disable the infinite pulse animations under prefers-reduced-motion', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
