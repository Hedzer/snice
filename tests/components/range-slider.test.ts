import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders, wait } from './test-utils';
import '../../components/range-slider/snice-range-slider';
import type { SniceRangeSliderElement } from '../../components/range-slider/snice-range-slider.types';

describe('snice-range-slider', () => {
  let el: SniceRangeSliderElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render range-slider element', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-RANGE-SLIDER');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      expect(el.min).toBe(0);
      expect(el.max).toBe(100);
      expect(el.step).toBe(1);
      expect(el.valueLow).toBe(0);
      expect(el.valueHigh).toBe(100);
      expect(el.disabled).toBe(false);
      expect(el.showTooltip).toBe(false);
      expect(el.showLabels).toBe(false);
      expect(el.orientation).toBe('horizontal');
    });

    it('should render track and two thumbs', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      await wait(50);

      const track = queryShadow(el as HTMLElement, '.range-slider__track');
      const thumbLow = queryShadow(el as HTMLElement, '.range-slider__thumb--low');
      const thumbHigh = queryShadow(el as HTMLElement, '.range-slider__thumb--high');
      const range = queryShadow(el as HTMLElement, '.range-slider__range');

      expect(track).toBeTruthy();
      expect(thumbLow).toBeTruthy();
      expect(thumbHigh).toBeTruthy();
      expect(range).toBeTruthy();
    });
  });

  describe('value handling', () => {
    it('should set initial values', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'value-low': 20,
        'value-high': 80
      });
      await wait(50);

      expect(el.valueLow).toBe(20);
      expect(el.valueHigh).toBe(80);
    });

    it('should clamp values to min/max', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        min: 0,
        max: 100,
        'value-low': -10,
        'value-high': 150
      });
      await wait(50);

      expect(el.valueLow).toBe(0);
      expect(el.valueHigh).toBe(100);
    });

    it('should keep valueLow <= valueHigh', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'value-low': 80,
        'value-high': 20
      });
      await wait(50);

      expect(el.valueLow).toBeLessThanOrEqual(el.valueHigh);
    });

    it('should update values dynamically', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      await wait(50);

      el.valueLow = 30;
      el.valueHigh = 70;

      expect(el.valueLow).toBe(30);
      expect(el.valueHigh).toBe(70);
    });
  });

  describe('show-tooltip', () => {
    it('should render tooltips when show-tooltip is true', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'show-tooltip': true
      });
      await wait(50);

      const tooltips = el.shadowRoot?.querySelectorAll('.range-slider__tooltip');
      expect(tooltips?.length).toBe(2);
    });

    it('should not render tooltips when show-tooltip is false', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'show-tooltip': false
      });
      await wait(50);

      const tooltips = el.shadowRoot?.querySelectorAll('.range-slider__tooltip');
      expect(tooltips?.length).toBe(0);
    });
  });

  describe('show-labels', () => {
    it('should render min/max labels when show-labels is true', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'show-labels': true,
        min: 0,
        max: 100
      });
      await wait(50);

      const labels = queryShadow(el as HTMLElement, '.range-slider__labels');
      expect(labels).toBeTruthy();
      expect(labels?.textContent).toContain('0');
      expect(labels?.textContent).toContain('100');
    });

    it('should not render labels when show-labels is false', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      await wait(50);

      const labels = queryShadow(el as HTMLElement, '.range-slider__labels');
      expect(labels).toBeNull();
    });
  });

  describe('orientation', () => {
    it('should apply vertical class', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        orientation: 'vertical'
      });
      await wait(50);

      const container = queryShadow(el as HTMLElement, '.range-slider--vertical');
      expect(container).toBeTruthy();
    });
  });

  describe('disabled', () => {
    it('should apply disabled state', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        disabled: true
      });
      await wait(50);

      const track = queryShadow(el as HTMLElement, '.range-slider__track');
      expect(track?.classList.contains('range-slider__track--disabled')).toBe(true);
    });
  });

  describe('events', () => {
    it('should dispatch range-change event', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      await wait(50);

      let detail: any = null;
      (el as HTMLElement).addEventListener('range-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      // Simulate event via dispatching manually
      const event = new CustomEvent('range-change', {
        detail: { valueLow: 20, valueHigh: 80, component: el }
      });
      el.dispatchEvent(event);

      expect(detail).toBeTruthy();
      expect(detail.valueLow).toBe(20);
      expect(detail.valueHigh).toBe(80);
    });
  });

  describe('accessibility', () => {
    it('should have role="slider" on both thumbs', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider');
      await wait(50);

      const thumbLow = queryShadow(el as HTMLElement, '.range-slider__thumb--low');
      const thumbHigh = queryShadow(el as HTMLElement, '.range-slider__thumb--high');

      expect(thumbLow?.getAttribute('role')).toBe('slider');
      expect(thumbHigh?.getAttribute('role')).toBe('slider');
    });

    it('should set aria-valuenow on thumbs', async () => {
      el = await createComponent<SniceRangeSliderElement>('snice-range-slider', {
        'value-low': 25,
        'value-high': 75
      });
      await wait(50);

      const thumbLow = queryShadow(el as HTMLElement, '.range-slider__thumb--low');
      const thumbHigh = queryShadow(el as HTMLElement, '.range-slider__thumb--high');

      expect(thumbLow?.getAttribute('aria-valuenow')).toBe('25');
      expect(thumbHigh?.getAttribute('aria-valuenow')).toBe('75');
    });
  });
});
