import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/color-picker/snice-color-picker';
import type { SniceColorPickerElement } from '../../components/color-picker/snice-color-picker.types';

describe('snice-color-picker', () => {
  let colorPicker: SniceColorPickerElement;

  afterEach(() => {
    if (colorPicker) {
      removeComponent(colorPicker as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render color picker element', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      expect(colorPicker).toBeTruthy();
      expect(colorPicker.tagName).toBe('SNICE-COLOR-PICKER');
    });

    it('should have default properties', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      expect(colorPicker.size).toBe('medium');
      expect(colorPicker.value).toBe('#000000');
      expect(colorPicker.format).toBe('hex');
      expect(colorPicker.disabled).toBe(false);
      expect(colorPicker.required).toBe(false);
      expect(colorPicker.invalid).toBe(false);
      expect(colorPicker.showInput).toBe(true);
      expect(colorPicker.showPresets).toBe(false);
    });

    it('should render color swatch', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch).toBeTruthy();
    });

    it('should render color input when showInput is true', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
          size
        });
        await wait(50);

        const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
        expect(swatch?.classList.contains(`color-swatch--${size}`)).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000'
      });
      await wait(50);

      expect(colorPicker.value).toBe('#ff0000');
    });

    it('should update value dynamically', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      colorPicker.value = '#00ff00';

      expect(colorPicker.value).toBe('#00ff00');
    });
  });

  describe('formats', () => {
    it('should support hex format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'hex'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('#ff0000');
    });

    it('should support rgb format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'rgb'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('rgb(255, 0, 0)');
    });

    it('should support hsl format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'hsl'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        label: 'Choose Color'
      });
      await wait(50);

      const labelEl = queryShadow(colorPicker as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Choose Color');
    });

    it('should show required indicator', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        label: 'Color',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(colorPicker as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'helper-text': 'Select a color'
      });
      await wait(50);

      const helperEl = queryShadow(colorPicker as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Select a color');
    });

    it('should show error text', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'error-text': 'Invalid color'
      });
      await wait(50);

      const errorEl = queryShadow(colorPicker as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('Invalid color');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        disabled: true
      });
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch?.classList.contains('color-swatch--disabled')).toBe(true);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });

    it('should apply invalid class', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        invalid: true
      });
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch?.classList.contains('color-swatch--invalid')).toBe(true);
    });
  });

  describe('show input', () => {
    it('should show input by default', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeTruthy();
    });

    it('should hide input when showInput is false', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'show-input': false
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeFalsy();
    });
  });

  describe('presets', () => {
    it('should not show presets by default', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const presets = queryShadow(colorPicker as HTMLElement, '.presets');
      expect(presets).toBeFalsy();
    });

    it('should show presets when showPresets is true', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'show-presets': true
      });
      await wait(50);

      const presets = queryShadow(colorPicker as HTMLElement, '.presets');
      expect(presets).toBeTruthy();
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      expect(() => colorPicker.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      expect(() => colorPicker.blur()).not.toThrow();
    });
  });
});
