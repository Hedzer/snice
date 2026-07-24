// Draft: tests/components/popover.test.ts (NEW — component has zero tests)
// Cover: render/defaults, trigger click toggle, Enter+Space keys, escape dismiss
// (+focus return), outside-click dismiss, no-outside-dismiss, no-escape-dismiss,
// open/close events, NO phantom popover-close on mount (modal-style watch bug),
// placement attr, distance number attr, CSS contracts (fallbacks + reduced-motion).
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/popover/snice-popover';
import type { SnicePopoverElement } from '../../packages/components/src/popover/snice-popover.types';

const cssPath = resolve(process.cwd(), 'packages/components/src/popover/snice-popover.css');

describe('snice-popover', () => {
  let popover: SnicePopoverElement;

  afterEach(() => {
    if (popover) removeComponent(popover as HTMLElement);
  });

  describe('basic functionality', () => {
    it('renders with closed defaults', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      expect(popover.open).toBe(false);
      expect(popover.placement).toBe('bottom-end');
      expect(popover.distance).toBe(6);
    });

    it('reflects expanded state on the trigger', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      const trigger = queryShadow(popover as HTMLElement, '.popover__trigger');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');

      popover.show();
      await wait(50);
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('trigger interaction', () => {
    it('toggles on trigger click', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      const trigger = queryShadow(popover as HTMLElement, '.popover__trigger') as HTMLElement;

      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(50);
      expect(popover.open).toBe(true);

      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(50);
      expect(popover.open).toBe(false);
    });

    it.each([['Enter'], [' ']])('toggles on %s keydown', async (key) => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      const trigger = queryShadow(popover as HTMLElement, '.popover__trigger') as HTMLElement;

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
      await wait(50);
      expect(popover.open).toBe(true);
    });
  });

  describe('dismissal', () => {
    it('closes on Escape', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      popover.show();
      await wait(50);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await wait(50);
      expect(popover.open).toBe(false);
    });

    it('honors no-escape-dismiss', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover', { 'no-escape-dismiss': true });
      popover.show();
      await wait(50);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await wait(50);
      expect(popover.open).toBe(true);
    });

    it('closes on outside mousedown', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      popover.show();
      await wait(50);

      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await wait(50);
      expect(popover.open).toBe(false);
    });

    it('honors no-outside-dismiss', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover', { 'no-outside-dismiss': true });
      popover.show();
      await wait(50);

      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await wait(50);
      expect(popover.open).toBe(true);
    });
  });

  describe('events', () => {
    it('does not dispatch popover-close when a closed popover mounts', async () => {
      const events: string[] = [];
      const listener = () => events.push('close');
      document.addEventListener('popover-close', listener);

      const el = document.createElement('snice-popover');
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 100));

      document.removeEventListener('popover-close', listener);
      el.remove();
      expect(events).toEqual([]);
    });

    it('dispatches popover-open and popover-close around show/hide', async () => {
      popover = await createComponent<SnicePopoverElement>('snice-popover');
      const events: string[] = [];
      (popover as HTMLElement).addEventListener('popover-open', () => events.push('open'));
      (popover as HTMLElement).addEventListener('popover-close', () => events.push('close'));

      popover.show();
      await wait(50);
      popover.hide();
      await wait(50);

      expect(events).toEqual(['open', 'close']);
    });
  });

  describe('stylesheet contracts', () => {
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
