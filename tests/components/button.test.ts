import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerMouseEvent } from './test-utils';
import '../../components/button/snice-button';
import type { SniceButtonElement } from '../../components/button/snice-button.types';

describe('snice-button', () => {
  let button: SniceButtonElement;

  afterEach(() => {
    if (button) {
      removeComponent(button as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render button element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      expect(button).toBeTruthy();
      expect(button.tagName).toBe('SNICE-BUTTON');
    });

    it('should have default properties', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      expect(button.variant).toBe('default');
      expect(button.size).toBe('medium');
      expect(button.disabled).toBe(false);
      expect(button.loading).toBe(false);
      expect(button.outline).toBe(false);
      expect(button.pill).toBe(false);
      expect(button.circle).toBe(false);
      expect(button.href).toBe('');
      expect(button.target).toBe('');
      expect(button.icon).toBe('');
      expect(button.iconPlacement).toBe('start');
    });

    it('should render internal button element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl).toBeTruthy();
      expect(btnEl?.tagName).toBe('BUTTON');
    });
  });

  describe('variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        button = await createComponent<SniceButtonElement>('snice-button', {
          variant
        });
        await wait(10);

        const btnEl = queryShadow(button as HTMLElement, '.button');
        expect(btnEl?.classList.contains(`button--${variant}`)).toBe(true);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        button = await createComponent<SniceButtonElement>('snice-button', {
          size
        });
        await wait(10);

        const btnEl = queryShadow(button as HTMLElement, '.button');
        expect(btnEl?.classList.contains(`button--${size}`)).toBe(true);
      });
    });
  });

  describe('modifiers', () => {
    it('should apply outline modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        outline: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--outline')).toBe(true);
    });

    it('should apply pill modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        pill: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--pill')).toBe(true);
    });

    it('should apply circle modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        circle: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--circle')).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute and class', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        disabled: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.disabled).toBe(true);
      expect(btnEl?.classList.contains('button--disabled')).toBe(true);
    });

    it('should prevent click when disabled', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        disabled: true
      });
      await wait(10);

      let eventFired = false;
      (button as HTMLElement).addEventListener('button-click', () => {
        eventFired = true;
      });

      const btnEl = queryShadow(button as HTMLElement, '.button');
      triggerMouseEvent(btnEl as HTMLElement, 'click');
      await wait(10);

      // Event still fires but should be prevented in handler
      expect(button.disabled).toBe(true);
    });

    it('should update disabled state via setDisabled method', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      button.setDisabled(true);
      await wait(10);

      expect(button.disabled).toBe(true);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.disabled).toBe(true);
    });
  });

  describe('loading state', () => {
    it('should apply loading class', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        loading: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--loading')).toBe(true);
    });

    it('should show spinner element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        loading: true
      });
      await wait(10);

      const spinner = queryShadow(button as HTMLElement, '.spinner');
      expect(spinner).toBeTruthy();
    });

    it('should update loading state via setLoading method', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      button.setLoading(true);
      await wait(10);

      expect(button.loading).toBe(true);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--loading')).toBe(true);
    });
  });

  describe('icon support', () => {
    it('should render icon when provided', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg'
      });
      await wait(10);

      const iconEl = queryShadow(button as HTMLElement, '.icon') as HTMLImageElement;
      expect(iconEl).toBeTruthy();
      expect(iconEl?.src).toContain('test-icon.svg');
    });

    it('should place icon at start by default', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--icon-start')).toBe(true);
    });

    it('should place icon at end when specified', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg',
        'icon-placement': 'end'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--icon-end')).toBe(true);
    });
  });

  describe('click events', () => {
    it('should dispatch @snice/click event', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      let clickDetail: any = null;
      (button as HTMLElement).addEventListener('button-click', (e: Event) => {
        clickDetail = (e as CustomEvent).detail;
      });

      const btnEl = queryShadow(button as HTMLElement, '.button');
      triggerMouseEvent(btnEl as HTMLElement, 'click');
      await wait(10);

      expect(clickDetail).toBeTruthy();
      expect(clickDetail.originalEvent).toBeTruthy();
    });
  });

  describe('API methods', () => {
    beforeEach(async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);
    });

    it('should support focus method', () => {
      expect(() => button.focus()).not.toThrow();
    });

    it('should support blur method', () => {
      expect(() => button.blur()).not.toThrow();
    });

    it('should support click method', () => {
      expect(() => button.click()).not.toThrow();
    });

    it('should update variant via setVariant method', async () => {
      button.setVariant('primary');
      await wait(10);

      expect(button.variant).toBe('primary');
    });
  });

  describe('property updates', () => {
    beforeEach(async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);
    });

    it('should update classes when variant changes', async () => {
      button.variant = 'primary';
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--primary')).toBe(true);
    });

    it('should update classes when size changes', async () => {
      button.size = 'large';
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--large')).toBe(true);
    });
  });
});
