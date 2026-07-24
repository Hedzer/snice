import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';

const cssPath = resolve(process.cwd(), 'packages/components/src/message-strip/snice-message-strip.css');
import '../../packages/components/src/message-strip/snice-message-strip';
import type { SniceMessageStripElement } from '../../packages/components/src/message-strip/snice-message-strip.types';

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
      expect(strip.dismissible).toBe(false);
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

  describe('dismissible', () => {
    it('should show dismiss button when dismissible', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        dismissible: true
      });
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn).toBeTruthy();
    });

    it('should not show dismiss button when not dismissible', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip');
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn).toBeFalsy();
    });

    it('should dispatch dismiss event when dismiss button clicked', async () => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', {
        dismissible: true,
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
        dismissible: true
      });
      await wait(200);

      const dismissBtn = queryShadow(strip as HTMLElement, '.message-strip-dismiss');
      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss');
    });
  });

  describe('default icons', () => {
    it.each([
      ['info'],
      ['success'],
      ['warning'],
      ['danger'],
    ])('renders a registry SVG default icon for the %s variant', async (variant) => {
      strip = await createComponent<SniceMessageStripElement>('snice-message-strip', { variant });
      await wait(200);

      const icon = queryShadow(strip as HTMLElement, '.message-strip-icon--default');
      expect(icon?.querySelector('svg')).toBeTruthy();
    });

    it('does not draw default icons with unicode ::before glyphs', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).not.toMatch(/content:\s*"\\2[0-9A-Fa-f]{3}"/);
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
