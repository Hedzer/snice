import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/alert/snice-alert';
import type { SniceAlertElement } from '../../components/alert/snice-alert.types';

describe('snice-alert', () => {
  let alert: SniceAlertElement;

  afterEach(() => {
    if (alert) {
      removeComponent(alert as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render alert element', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');

      expect(alert).toBeTruthy();
      expect(alert.tagName).toBe('SNICE-ALERT');
    });

    it('should have default properties', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');

      expect(alert.variant).toBe('info');
      expect(alert.size).toBe('medium');
      expect(alert.title).toBe('');
      expect(alert.dismissible).toBe(false);
      expect(alert.icon).toBe('');
    });

    it('should render internal alert element', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      const alertEl = queryShadow(alert as HTMLElement, '.alert');
      expect(alertEl).toBeTruthy();
      expect(alertEl?.getAttribute('role')).toBe('alert');
    });
  });

  describe('variants', () => {
    const variants = ['info', 'success', 'warning', 'error'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant styles`, async () => {
        alert = await createComponent<SniceAlertElement>('snice-alert', {
          variant
        });
        await wait(200);

        expect(alert.variant).toBe(variant);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should support ${size} size`, async () => {
        alert = await createComponent<SniceAlertElement>('snice-alert', {
          size
        });

        expect(alert.size).toBe(size);
      });
    });
  });

  describe('title', () => {
    it('should render title when provided', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        title: 'Alert Title'
      });
      await wait(200);

      const titleEl = queryShadow(alert as HTMLElement, '.alert-title');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent).toBe('Alert Title');
    });

    it('should not render title element when not provided', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      const titleEl = queryShadow(alert as HTMLElement, '.alert-title');
      expect(titleEl).toBeFalsy();
    });
  });

  describe('content', () => {
    it('should render slotted content', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      alert.innerHTML = 'This is an alert message';
      await wait(200);

      const descEl = queryShadow(alert as HTMLElement, '.alert-description');
      expect(descEl).toBeTruthy();
    });
  });

  describe('icon', () => {
    it('should render custom icon when provided', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        icon: '⚠️'
      });
      await wait(200);

      const iconEl = queryShadow(alert as HTMLElement, '.alert-icon');
      expect(iconEl).toBeTruthy();
      expect(iconEl?.textContent).toContain('⚠️');
    });

    it('should show default icon for variants', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        variant: 'warning'
      });
      await wait(200);

      const iconEl = queryShadow(alert as HTMLElement, '.alert-icon');
      expect(iconEl).toBeTruthy();
    });

    it('should hide icon when set to "none"', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        icon: 'none'
      });
      await wait(200);

      const iconEl = queryShadow(alert as HTMLElement, '.alert-icon');
      expect(iconEl).toBeFalsy();
    });
  });

  describe('dismissible', () => {
    it('should show dismiss button when dismissible', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        dismissible: true
      });
      await wait(200);

      const dismissBtn = queryShadow(alert as HTMLElement, '.alert-dismiss');
      expect(dismissBtn).toBeTruthy();
      expect(dismissBtn?.getAttribute('aria-label')).toBe('Dismiss alert');
    });

    it('should hide dismiss button when not dismissible', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        dismissible: false
      });
      await wait(200);

      const dismissBtn = queryShadow(alert as HTMLElement, '.alert-dismiss');
      expect(dismissBtn).toBeFalsy();
    });

    it('should dispatch alert-dismiss event when dismiss button clicked', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        dismissible: true,
        title: 'Test Alert',
        variant: 'info'
      });
      await wait(200);

      let dismissDetail: any = null;
      (alert as HTMLElement).addEventListener('alert-dismiss', (e: Event) => {
        dismissDetail = (e as CustomEvent).detail;
      });

      const dismissBtn = queryShadow(alert as HTMLElement, '.alert-dismiss') as HTMLButtonElement;
      dismissBtn?.click();

      expect(dismissDetail).toBeTruthy();
      expect(dismissDetail.variant).toBe('info');
      expect(dismissDetail.title).toBe('Test Alert');
    });
  });

  describe('API methods', () => {
    it('should support hide method', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      expect(() => alert.hide()).not.toThrow();
    });

    it('should support show method', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      expect(() => alert.show()).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      const alertEl = queryShadow(alert as HTMLElement, '.alert');
      expect(alertEl?.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite"', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      const alertEl = queryShadow(alert as HTMLElement, '.alert');
      expect(alertEl?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('property updates', () => {
    it('should update variant dynamically', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        variant: 'info'
      });
      await wait(200);

      alert.variant = 'error';

      expect(alert.variant).toBe('error');
    });

    it('should update title dynamically', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert');
      await wait(200);

      alert.title = 'New Title';
      await wait(10);

      const titleEl = queryShadow(alert as HTMLElement, '.alert-title');
      expect(titleEl?.textContent).toBe('New Title');
    });

    it('should update dismissible dynamically', async () => {
      alert = await createComponent<SniceAlertElement>('snice-alert', {
        dismissible: false
      });
      await wait(200);

      alert.dismissible = true;
      await wait(10);

      const dismissBtn = queryShadow(alert as HTMLElement, '.alert-dismiss');
      expect(dismissBtn).toBeTruthy();
    });
  });
});
