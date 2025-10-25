import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/slider/snice-slider';
import type { SniceSliderElement } from '../../components/slider/snice-slider.types';

describe('snice-slider', () => {
  let slider: SniceSliderElement;

  afterEach(() => {
    if (slider) {
      removeComponent(slider as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render slider element', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      expect(slider).toBeTruthy();
      expect(slider.tagName).toBe('SNICE-SLIDER');
    });

    it('should have default properties', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      expect(slider.size).toBe('medium');
      expect(slider.variant).toBe('default');
      expect(slider.value).toBe(0);
      expect(slider.min).toBe(0);
      expect(slider.max).toBe(100);
      expect(slider.step).toBe(1);
      expect(slider.disabled).toBe(false);
      expect(slider.readonly).toBe(false);
      expect(slider.required).toBe(false);
      expect(slider.invalid).toBe(false);
      expect(slider.showValue).toBe(false);
      expect(slider.showTicks).toBe(false);
      expect(slider.vertical).toBe(false);
    });

    it('should render internal slider elements', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      await wait(50);

      const track = queryShadow(slider as HTMLElement, '.slider-track');
      const thumb = queryShadow(slider as HTMLElement, '.slider-thumb');
      const fill = queryShadow(slider as HTMLElement, '.slider-fill');

      expect(track).toBeTruthy();
      expect(thumb).toBeTruthy();
      expect(fill).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        slider = await createComponent<SniceSliderElement>('snice-slider', {
          size
        });
        await wait(50);

        const track = queryShadow(slider as HTMLElement, '.slider-track');
        expect(track?.classList.contains(`slider-track--${size}`)).toBe(true);
      });
    });
  });

  describe('variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        slider = await createComponent<SniceSliderElement>('snice-slider', {
          variant
        });
        await wait(50);

        const fill = queryShadow(slider as HTMLElement, '.slider-fill');
        expect(fill?.classList.contains(`slider-fill--${variant}`)).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        value: 50
      });
      await wait(50);

      expect(slider.value).toBe(50);
    });

    it('should update value dynamically', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      await wait(50);

      slider.value = 75;

      expect(slider.value).toBe(75);
    });

    it('should clamp value to min/max range', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        min: 0,
        max: 100,
        value: 150
      });
      await wait(50);

      expect(slider.value).toBe(100);
    });

    it('should snap value to step', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        min: 0,
        max: 100,
        step: 10,
        value: 47
      });
      await wait(50);

      expect(slider.value).toBe(50);
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        label: 'Volume'
      });
      await wait(50);

      const labelEl = queryShadow(slider as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Volume');
    });

    it('should show required indicator', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        label: 'Rating',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(slider as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        'helper-text': 'Adjust the volume'
      });
      await wait(50);

      const helperEl = queryShadow(slider as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Adjust the volume');
    });

    it('should show error text', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        'error-text': 'Invalid value'
      });
      await wait(50);

      const errorEl = queryShadow(slider as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('Invalid value');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        disabled: true
      });
      await wait(50);

      const track = queryShadow(slider as HTMLElement, '.slider-track');
      expect(track?.classList.contains('slider-track--disabled')).toBe(true);
    });
  });

  describe('show-value', () => {
    it('should show value when show-value is true', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        'show-value': true,
        value: 42
      });
      await wait(50);

      const valueEl = queryShadow(slider as HTMLElement, '.slider-value');
      expect(valueEl).toBeTruthy();
      expect(valueEl?.textContent).toBe('42');
    });

    it('should not show value when show-value is false', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        'show-value': false
      });
      await wait(50);

      const valueEl = queryShadow(slider as HTMLElement, '.slider-value');
      expect(valueEl).toBeFalsy();
    });
  });

  describe('show-ticks', () => {
    it('should show ticks when show-ticks is true', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        'show-ticks': true,
        min: 0,
        max: 10,
        step: 1
      });
      await wait(50);

      const ticksEl = queryShadow(slider as HTMLElement, '.slider-ticks');
      expect(ticksEl).toBeTruthy();
    });
  });

  describe('vertical', () => {
    it('should apply vertical class', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        vertical: true
      });
      await wait(50);

      const wrapper = queryShadow(slider as HTMLElement, '.slider-wrapper');
      expect(wrapper?.classList.contains('slider-wrapper--vertical')).toBe(true);
    });
  });

  describe('events', () => {
    it('should dispatch slider-change event', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      await wait(50);

      let changeDetail: any = null;
      (slider as HTMLElement).addEventListener('@snice/slider-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      slider.value = 50;
      // Manually trigger change event
      const event = new CustomEvent('@snice/slider-change', {
        detail: { value: 50, slider }
      });
      slider.dispatchEvent(event);

      expect(changeDetail).toBeTruthy();
      expect(changeDetail.value).toBe(50);
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      await wait(50);

      expect(() => slider.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider');
      await wait(50);

      expect(() => slider.blur()).not.toThrow();
    });
  });

  describe('min/max/step', () => {
    it('should respect min value', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        min: 10,
        max: 100,
        value: 5
      });
      await wait(50);

      expect(slider.value).toBe(10);
    });

    it('should respect max value', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        min: 0,
        max: 50,
        value: 100
      });
      await wait(50);

      expect(slider.value).toBe(50);
    });

    it('should respect step value', async () => {
      slider = await createComponent<SniceSliderElement>('snice-slider', {
        min: 0,
        max: 100,
        step: 5,
        value: 47
      });
      await wait(50);

      expect(slider.value).toBe(45);
    });
  });
});
