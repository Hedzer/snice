import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/banner/snice-banner';
import type { SniceBannerElement } from '../../packages/components/src/banner/snice-banner.types';

describe('snice-banner', () => {
  let banner: SniceBannerElement;

  afterEach(() => {
    if (banner) {
      removeComponent(banner as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render banner element', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      expect(banner).toBeTruthy();
      expect(banner.tagName).toBe('SNICE-BANNER');
    });

    it('should have default properties', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      expect(banner.variant).toBe('info');
      expect(banner.position).toBe('top');
      expect(banner.message).toBe('');
      expect(banner.dismissible).toBe(true);
      expect(banner.icon).toBe('');
      expect(banner.actionText).toBe('');
      expect(banner.open).toBe(false);
    });

    it('should render banner container', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      await wait(50);

      const bannerEl = queryShadow(banner as HTMLElement, '.banner');
      expect(bannerEl).toBeTruthy();
    });
  });

  describe('variants', () => {
    const variants = ['info', 'success', 'warning', 'error'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        banner = await createComponent<SniceBannerElement>('snice-banner', {
          variant
        });
        await wait(50);

        const bannerEl = queryShadow(banner as HTMLElement, '.banner');
        expect(bannerEl?.classList.contains(`banner--${variant}`)).toBe(true);
      });
    });
  });

  describe('position', () => {
    it('should support top position', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        position: 'top'
      });
      expect(banner.position).toBe('top');
      expect(banner.getAttribute('position')).toBe('top');
    });

    it('should support bottom position', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        position: 'bottom'
      });
      expect(banner.position).toBe('bottom');
      expect(banner.getAttribute('position')).toBe('bottom');
    });
  });

  describe('message', () => {
    it('should render message', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        message: 'This is a notification'
      });
      await wait(50);

      const messageEl = queryShadow(banner as HTMLElement, '.banner__message');
      expect(messageEl).toBeTruthy();
      expect(messageEl?.textContent).toBe('This is a notification');
    });
  });

  describe('icon', () => {
    it('should render default icon for variant', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        variant: 'success'
      });
      await wait(50);

      // Default icons are now inline SVGs (Heroicons), not emoji. Assert the
      // wrapper is present and contains an <svg>.
      const iconEl = queryShadow(banner as HTMLElement, '.banner__icon');
      expect(iconEl).toBeTruthy();
      expect(iconEl?.querySelector('svg')).toBeTruthy();
    });

    it('should render custom icon', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        icon: '🎉'
      });
      await wait(50);

      // Custom icon prop goes through renderIcon which produces a <span>
      // for emoji-like text. Verify the emoji text is somewhere in the
      // banner icon slot.
      const iconSlot = queryShadow(banner as HTMLElement, '.banner__icon-slot');
      expect(iconSlot?.textContent?.trim()).toContain('🎉');
    });
  });

  describe('dismissible', () => {
    it('should show close button when dismissible', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        dismissible: true
      });
      await wait(50);

      const closeBtn = queryShadow(banner as HTMLElement, '.banner__close');
      expect(closeBtn).toBeTruthy();
    });

    it('should not show close button when not dismissible', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        dismissible: false
      });
      await wait(50);

      const closeBtn = queryShadow(banner as HTMLElement, '.banner__close');
      // May exist but should be hidden
      if (closeBtn) {
        expect(closeBtn.offsetParent).toBeFalsy();
      }
    });
  });

  describe('action', () => {
    it('should render action button when actionText provided', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        'action-text': 'Learn More'
      });
      await wait(50);

      const actionBtn = queryShadow(banner as HTMLElement, '.banner__action');
      expect(actionBtn).toBeTruthy();
      expect(actionBtn?.textContent).toBe('Learn More');
    });

    it('should dispatch action event on click', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        'action-text': 'Click Me'
      });
      await wait(50);

      let eventFired = false;
      (banner as HTMLElement).addEventListener('banner-action', () => {
        eventFired = true;
      });

      const actionBtn = queryShadow(banner as HTMLElement, '.banner__action') as HTMLButtonElement;
      actionBtn?.click();

      expect(eventFired).toBe(true);
    });
  });

  describe('open state', () => {
    it('should reflect open attribute', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        open: true
      });
      await wait(50);

      expect(banner.open).toBe(true);
      expect(banner.hasAttribute('open')).toBe(true);
    });

    it('should dispatch open event when opened', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      await wait(50);

      let eventFired = false;
      (banner as HTMLElement).addEventListener('banner-open', () => {
        eventFired = true;
      });

      banner.open = true;
      await wait(50);

      expect(eventFired).toBe(true);
    });

    it('should dispatch close event when closed', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        open: true
      });
      await wait(50);

      let eventFired = false;
      (banner as HTMLElement).addEventListener('banner-close', () => {
        eventFired = true;
      });

      banner.open = false;
      await wait(50);

      expect(eventFired).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should support show method', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      await wait(50);

      banner.show();
      expect(banner.open).toBe(true);
    });

    it('should support hide method', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        open: true
      });
      await wait(50);

      banner.hide();
      expect(banner.open).toBe(false);
    });

    it('should support toggle method', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner');
      await wait(50);

      banner.toggle();
      expect(banner.open).toBe(true);

      banner.toggle();
      expect(banner.open).toBe(false);
    });
  });

  describe('close icon', () => {
    it('should render the close control as a registry SVG, not a text glyph', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true, message: 'Hi' });
      await wait(50);

      const close = queryShadow(banner as HTMLElement, '.banner__close');
      expect(close?.querySelector('svg')).toBeTruthy();
      expect(close?.textContent?.trim()).not.toContain('\u2715');
    });
  });

  describe('accessible label', () => {
    it('should apply a custom label to the banner region', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true, label: 'Maintenance notice' });
      await wait(50);

      expect(queryShadow(banner as HTMLElement, '.banner')?.getAttribute('aria-label')).toBe('Maintenance notice');
    });

    it('should keep the variant-based default label', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true, variant: 'warning' });
      await wait(50);

      expect(queryShadow(banner as HTMLElement, '.banner')?.getAttribute('aria-label')).toBe('warning banner');
    });
  });

  describe('auto-dismiss duration', () => {
    it('should close after the configured duration once open', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true, duration: 80 });
      await wait(400);

      expect(banner.open).toBe(false);
    });

    it('should not auto-close when duration is 0', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true });
      await wait(300);

      expect(banner.open).toBe(true);
    });

    it('should pause the countdown while hovered', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { open: true, duration: 120 });
      await wait(30);
      (banner as HTMLElement).dispatchEvent(new Event('mouseenter'));
      await wait(400);

      expect(banner.open).toBe(true);

      (banner as HTMLElement).dispatchEvent(new Event('mouseleave'));
      await wait(400);

      expect(banner.open).toBe(false);
    });

    it('should restart the countdown when reopened', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', { duration: 80 });
      await wait(50);
      banner.show();
      await wait(400);

      expect(banner.open).toBe(false);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/banner/snice-banner.css');

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