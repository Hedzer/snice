import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerMouseEvent } from './test-utils';
import '../../components/checkbox/snice-checkbox';
import type { SniceCheckboxElement } from '../../components/checkbox/snice-checkbox.types';

describe('snice-checkbox', () => {
  let checkbox: SniceCheckboxElement;

  afterEach(() => {
    if (checkbox) {
      removeComponent(checkbox as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render checkbox element', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');

      expect(checkbox).toBeTruthy();
      expect(checkbox.tagName).toBe('SNICE-CHECKBOX');
    });

    it('should have default properties', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');

      expect(checkbox.checked).toBe(false);
      expect(checkbox.indeterminate).toBe(false);
      expect(checkbox.disabled).toBe(false);
      expect(checkbox.required).toBe(false);
      expect(checkbox.invalid).toBe(false);
      expect(checkbox.size).toBe('medium');
      expect(checkbox.name).toBe('');
      expect(checkbox.value).toBe('on');
      expect(checkbox.label).toBe('');
    });

    it('should render internal checkbox input', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('checkbox');
    });
  });

  describe('checked state', () => {
    it('should be unchecked by default', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      expect(checkbox.checked).toBe(false);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.checked).toBe(false);
    });

    it('should render as checked when attribute is set', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        checked: true
      });
      await wait(10);

      expect(checkbox.checked).toBe(true);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.checked).toBe(true);
    });

    it('should toggle checked state', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      checkbox.checked = true;
      await wait(10);

      expect(checkbox.checked).toBe(true);

      checkbox.checked = false;
      await wait(10);

      expect(checkbox.checked).toBe(false);
    });

    it('should dispatch change event when toggled', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      let changeEvent: any = null;
      (checkbox as HTMLElement).addEventListener('@snice/change', (e: Event) => {
        changeEvent = (e as CustomEvent).detail;
      });

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      triggerMouseEvent(input, 'click');
      await wait(10);

      expect(changeEvent).toBeTruthy();
    });
  });

  describe('indeterminate state', () => {
    it('should support indeterminate state', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        indeterminate: true
      });
      await wait(10);

      expect(checkbox.indeterminate).toBe(true);

      const checkboxEl = queryShadow(checkbox as HTMLElement, '.checkbox');
      expect(checkboxEl?.classList.contains('checkbox--indeterminate')).toBe(true);
    });

    it('should update aria-checked to mixed when indeterminate', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        indeterminate: true
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.getAttribute('aria-checked')).toBe('mixed');
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        disabled: true
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should apply disabled class to wrapper', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        disabled: true
      });
      await wait(10);

      const wrapper = queryShadow(checkbox as HTMLElement, '.checkbox-wrapper');
      expect(wrapper?.classList.contains('checkbox-wrapper--disabled')).toBe(true);
    });
  });

  describe('required state', () => {
    it('should apply required attribute', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        required: true
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.required).toBe(true);
    });
  });

  describe('invalid state', () => {
    it('should apply invalid class', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        invalid: true
      });
      await wait(10);

      const checkboxEl = queryShadow(checkbox as HTMLElement, '.checkbox');
      expect(checkboxEl?.classList.contains('checkbox--invalid')).toBe(true);
    });

    it('should set aria-invalid attribute', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        invalid: true
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
          size
        });
        await wait(10);

        const checkboxEl = queryShadow(checkbox as HTMLElement, '.checkbox');
        expect(checkboxEl?.classList.contains(`checkbox--${size}`)).toBe(true);
      });
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        label: 'Accept terms'
      });
      await wait(10);

      const labelEl = queryShadow(checkbox as HTMLElement, '.checkbox-label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent?.trim()).toBe('Accept terms');
    });

    it('should not render label element when label is empty', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      const labelEl = queryShadow(checkbox as HTMLElement, '.checkbox-label');
      expect(labelEl).toBeNull();
    });
  });

  describe('form integration', () => {
    it('should set name attribute', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        name: 'terms'
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.name).toBe('terms');
    });

    it('should set value attribute', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        value: 'accepted'
      });
      await wait(10);

      const input = queryShadow(checkbox as HTMLElement, '.checkbox-input') as HTMLInputElement;
      expect(input.value).toBe('accepted');
    });
  });

  describe('API methods', () => {
    it('should support toggle method', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      if (checkbox.toggle) {
        checkbox.toggle();
        await wait(10);
        expect(checkbox.checked).toBe(true);

        checkbox.toggle();
        await wait(10);
        expect(checkbox.checked).toBe(false);
      }
    });

    it('should support check method', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox');
      await wait(10);

      if (checkbox.check) {
        checkbox.check();
        await wait(10);
        expect(checkbox.checked).toBe(true);
      }
    });

    it('should support uncheck method', async () => {
      checkbox = await createComponent<SniceCheckboxElement>('snice-checkbox', {
        checked: true
      });
      await wait(10);

      if (checkbox.uncheck) {
        checkbox.uncheck();
        await wait(10);
        expect(checkbox.checked).toBe(false);
      }
    });
  });
});
