import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/spinner/snice-spinner';
import type { SniceSpinnerElement } from '../../components/spinner/snice-spinner.types';

describe('snice-spinner', () => {
  let spinner: SniceSpinnerElement;

  afterEach(() => {
    if (spinner) {
      removeComponent(spinner as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render spinner element', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      expect(spinner).toBeTruthy();
      expect(spinner.tagName).toBe('SNICE-SPINNER');
    });

    it('should have default properties', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      expect(spinner.size).toBe('medium');
      expect(spinner.color).toBe('primary');
      expect(spinner.label).toBe('');
      expect(spinner.thickness).toBe(4);
    });

    it('should render SVG circle', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      await wait(50);

      const circle = queryShadow(spinner as HTMLElement, '.spinner__circle');
      expect(circle).toBeTruthy();
      expect(circle?.tagName.toLowerCase()).toBe('svg');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large', 'xl'];

    sizes.forEach(size => {
      it(`should apply ${size} size`, async () => {
        spinner = await createComponent<SniceSpinnerElement>('snice-spinner', {
          size
        });
        await wait(50);

        expect(spinner.size).toBe(size);
        expect(spinner.getAttribute('size')).toBe(size);
      });
    });
  });

  describe('colors', () => {
    const colors = ['primary', 'success', 'warning', 'error', 'info'];

    colors.forEach(color => {
      it(`should apply ${color} color`, async () => {
        spinner = await createComponent<SniceSpinnerElement>('snice-spinner', {
          color
        });
        await wait(50);

        expect(spinner.color).toBe(color);
        expect(spinner.getAttribute('color')).toBe(color);
      });
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner', {
        label: 'Loading...'
      });
      await wait(50);

      const labelEl = queryShadow(spinner as HTMLElement, '.spinner__label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toBe('Loading...');
    });

    it('should not render label when not provided', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      await wait(50);

      const labelEl = queryShadow(spinner as HTMLElement, '.spinner__label');
      // The element may exist but should be empty when no label is provided
      if (labelEl) {
        expect(labelEl.textContent?.trim()).toBe('');
      }
    });
  });

  describe('thickness', () => {
    it('should set custom thickness', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner', {
        thickness: 6
      });
      await wait(50);

      expect(spinner.thickness).toBe(6);
    });
  });

  describe('aria attributes', () => {
    it('should have role status', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      await wait(50);

      const spinnerDiv = queryShadow(spinner as HTMLElement, '.spinner');
      expect(spinnerDiv?.getAttribute('role')).toBe('status');
    });

    it('should have default aria-label', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner');
      await wait(50);

      const spinnerDiv = queryShadow(spinner as HTMLElement, '.spinner');
      expect(spinnerDiv?.getAttribute('aria-label')).toBe('Loading');
    });

    it('should use custom aria-label when label provided', async () => {
      spinner = await createComponent<SniceSpinnerElement>('snice-spinner', {
        label: 'Processing'
      });
      await wait(50);

      const spinnerDiv = queryShadow(spinner as HTMLElement, '.spinner');
      expect(spinnerDiv?.getAttribute('aria-label')).toBe('Processing');
    });
  });
});
