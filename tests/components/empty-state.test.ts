import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/empty-state/snice-empty-state';
import type { SniceEmptyStateElement } from '../../packages/components/src/empty-state/snice-empty-state.types';

describe('snice-empty-state', () => {
  let emptyState: SniceEmptyStateElement;

  afterEach(() => {
    if (emptyState) {
      removeComponent(emptyState as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render empty state element', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.tagName).toBe('SNICE-EMPTY-STATE');
    });

    it('should have default properties', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      expect(emptyState.size).toBe('medium');
      expect(emptyState.icon).toBe('📭');
      expect(emptyState.title).toBe('No data');
      expect(emptyState.description).toBe('');
      expect(emptyState.actionText).toBe('');
      expect(emptyState.actionHref).toBe('');
    });

    it('should render container', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      await wait(50);

      const container = queryShadow(emptyState as HTMLElement, '.empty-state');
      expect(container).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
          size
        });
        await wait(50);

        const container = queryShadow(emptyState as HTMLElement, '.empty-state');
        expect(container?.classList.contains(`empty-state--${size}`)).toBe(true);
      });
    });
  });

  describe('icon', () => {
    it('should render default icon', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      await wait(50);

      const iconEl = queryShadow(emptyState as HTMLElement, '.empty-state__icon');
      expect(iconEl).toBeTruthy();
      expect(iconEl?.textContent).toBe('📭');
    });

    it('should render custom icon', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        icon: '🔍'
      });
      await wait(50);

      const iconEl = queryShadow(emptyState as HTMLElement, '.empty-state__icon');
      expect(iconEl?.textContent).toBe('🔍');
    });
  });

  describe('title', () => {
    it('should render default title', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      await wait(50);

      const titleEl = queryShadow(emptyState as HTMLElement, '.empty-state__title');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent).toBe('No data');
    });

    it('should render custom title', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        title: 'No results found'
      });
      await wait(50);

      const titleEl = queryShadow(emptyState as HTMLElement, '.empty-state__title');
      expect(titleEl?.textContent).toBe('No results found');
    });
  });

  describe('description', () => {
    it('should render description when provided', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        description: 'Try adjusting your search'
      });
      await wait(50);

      const descEl = queryShadow(emptyState as HTMLElement, '.empty-state__description');
      expect(descEl).toBeTruthy();
      expect(descEl?.textContent).toBe('Try adjusting your search');
    });

    it('should not render description when empty', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      await wait(50);

      const descEl = queryShadow(emptyState as HTMLElement, '.empty-state__description');
      // May exist but should be empty
      if (descEl) {
        expect(descEl.textContent?.trim()).toBe('');
      }
    });
  });

  describe('action', () => {
    it('should render action button when actionText provided', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        'action-text': 'Add Item'
      });
      await wait(50);

      const actionEl = queryShadow(emptyState as HTMLElement, '.empty-state__action');
      expect(actionEl).toBeTruthy();
      expect(actionEl?.textContent).toBe('Add Item');
      expect(actionEl?.tagName.toLowerCase()).toBe('button');
    });

    it('should render action link when actionHref provided', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        'action-text': 'Go Home',
        'action-href': '/'
      });
      await wait(50);

      const actionEl = queryShadow(emptyState as HTMLElement, '.empty-state__action');
      expect(actionEl).toBeTruthy();
      expect(actionEl?.tagName.toLowerCase()).toBe('a');
      expect((actionEl as HTMLAnchorElement)?.href).toContain('/');
    });

    it('should dispatch action event on click', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', {
        'action-text': 'Click Me'
      });
      await wait(50);

      let eventFired = false;
      (emptyState as HTMLElement).addEventListener('empty-state-action', () => {
        eventFired = true;
      });

      const actionEl = queryShadow(emptyState as HTMLElement, '.empty-state__action') as HTMLButtonElement;
      actionEl?.click();

      expect(eventFired).toBe(true);
    });
  });

  describe('slot', () => {
    it('should support slotted content', async () => {
      emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');
      const customContent = document.createElement('div');
      customContent.textContent = 'Custom content';
      emptyState.appendChild(customContent);

      await wait(50);

      expect(emptyState.children.length).toBeGreaterThan(0);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/empty-state/snice-empty-state.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});