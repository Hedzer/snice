import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/message-strip/snice-message-strip';
import type { SniceMessageStripElement } from '../../components/message-strip/snice-message-strip.types';

describe('snice-message-strip', () => {
  let strip: SniceMessageStripElement;

  afterEach(() => {
    if (strip) {
      removeComponent(strip as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render message strip element', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');

      expect(strip).toBeTruthy();
      expect(strip.tagName).toBe('SNICE-MESSAGE-STRIP');
    });

    it('should have default properties', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');

      expect(strip.variant).toBe('info');
      expect(strip.dismissable).toBe(false);
      expect(strip.icon).toBe('');
    });

    it('should render internal message strip element', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      const stripEl = queryShadow(strip as HTMLElement, '.message-strip');
      expect(stripEl).toBeTruthy();
    });
  });

  describe('variants', () => {
    const variants = ['info', 'success', 'warning', 'danger'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant`, async () => {
        strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
          variant
        });

        expect(strip.variant).toBe(variant);
      });
    });
  });

  describe('dismissable', () => {
    it('should show dismiss button when dismissable', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        dismissable: true
      });
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn).toBeTruthy();
    });

    it('should not show dismiss button when not dismissable', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn).toBeFalsy();
    });

    it('should dispatch dismiss event when dismiss button clicked', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        dismissable: true,
        variant: 'warning'
      });
      await wait(200);

      let dismissDetail: any = null;
      (strip as HTMLElement).addEventListener('dismiss', (e: Event) => {
        dismissDetail = (e as CustomEvent).detail;
      });

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss') as HTMLButtonElement;
      dismissBtn?.click();

      expect(dismissDetail).toBeTruthy();
      expect(dismissDetail.variant).toBe('warning');
    });
  });

  describe('icon', () => {
    it('should show default icon', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        variant: 'info'
      });
      await wait(200);

      const iconEl = queryShadow(strip as HTMLElement, '.message-strip-icon');
      expect(iconEl).toBeTruthy();
    });

    it('should hide icon when icon="none"', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        icon: 'none'
      });
      await wait(200);

      const iconEl = queryShadow(strip as HTMLElement, '.message-strip-icon');
      expect(iconEl).toBeFalsy();
    });

    it('should show custom icon', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        icon: '🔔'
      });
      await wait(200);

      const iconEl = queryShadow(strip as HTMLElement, '.message-strip-icon');
      expect(iconEl).toBeTruthy();
    });
  });

  describe('show/hide API', () => {
    it('should hide the strip', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      strip.hide();

      const stripEl = queryShadow(strip as HTMLElement, '.message-strip');
      expect(stripEl?.classList.contains('message-strip--hiding')).toBe(true);
    });

    it('should show the strip after hiding', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      strip.hide();
      strip.show();

      const stripEl = queryShadow(strip as HTMLElement, '.message-strip');
      expect(stripEl?.classList.contains('message-strip--hidden')).toBe(false);
      expect(stripEl?.classList.contains('message-strip--hiding')).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should have status role', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      const stripEl = queryShadow(strip as HTMLElement, '.message-strip');
      expect(stripEl?.getAttribute('role')).toBe('status');
    });

    it('should have aria-live polite', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      const stripEl = queryShadow(strip as HTMLElement, '.message-strip');
      expect(stripEl?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have accessible dismiss button', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        dismissable: true
      });
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss');
    });
  });
});
