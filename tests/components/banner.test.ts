import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/banner/snice-banner';
import type { SniceBannerElement } from '../../components/banner/snice-banner.types';

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

      const iconEl = queryShadow(banner as HTMLElement, '.banner__icon');
      expect(iconEl).toBeTruthy();
      expect(iconEl?.textContent).toBe('✅');
    });

    it('should render custom icon', async () => {
      banner = await createComponent<SniceBannerElement>('snice-banner', {
        icon: '🎉'
      });
      await wait(50);

      const iconEl = queryShadow(banner as HTMLElement, '.banner__icon');
      expect(iconEl?.textContent).toBe('🎉');
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
});
