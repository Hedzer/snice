import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/gauge/snice-gauge';
import type { SniceGaugeElement } from '../../components/gauge/snice-gauge.types';

describe('snice-gauge', () => {
  let gauge: SniceGaugeElement;

  afterEach(() => {
    if (gauge) {
      removeComponent(gauge as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render gauge element', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge');

      expect(gauge).toBeTruthy();
      expect(gauge.tagName).toBe('SNICE-GAUGE');
    });

    it('should have default properties', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge');

      expect(gauge.value).toBe(0);
      expect(gauge.min).toBe(0);
      expect(gauge.max).toBe(100);
      expect(gauge.label).toBe('');
      expect(gauge.variant).toBe('default');
      expect(gauge.size).toBe('medium');
      expect(gauge.showValue).toBe(true);
      expect(gauge.thickness).toBe(8);
    });
  });

  describe('value display', () => {
    it('should display value text by default', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 42
      });

      const valueText = queryShadow(gauge as HTMLElement, '.gauge__value-text');
      expect(valueText).toBeTruthy();
      expect(valueText?.textContent?.trim()).toBe('42');
    });

    it('should hide value text when showValue is false', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge');

      const tracker = trackRenders(gauge as HTMLElement);
      gauge.showValue = false;
      await tracker.next();

      const valueText = queryShadow(gauge as HTMLElement, '.gauge__value-text');
      expect(valueText).toBeNull();
    });

    it('should update value display when value changes', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 10
      });

      const tracker = trackRenders(gauge as HTMLElement);
      gauge.value = 75;
      await tracker.next();

      const valueText = queryShadow(gauge as HTMLElement, '.gauge__value-text');
      expect(valueText?.textContent?.trim()).toBe('75');
    });

    it('should display label when provided', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        label: 'CPU Usage'
      });

      const label = queryShadow(gauge as HTMLElement, '.gauge__label');
      expect(label).toBeTruthy();
      expect(label?.textContent?.trim()).toBe('CPU Usage');
    });

    it('should not display label when empty', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50
      });

      const label = queryShadow(gauge as HTMLElement, '.gauge__label');
      expect(label).toBeNull();
    });

    it('should clamp value to min/max range', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 150,
        min: 0,
        max: 100
      });

      const valueText = queryShadow(gauge as HTMLElement, '.gauge__value-text');
      expect(valueText?.textContent?.trim()).toBe('150');

      // The arc fill should be clamped to 100%
      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashOffset = fill?.getAttribute('stroke-dashoffset');
      expect(Number(dashOffset)).toBeCloseTo(0, 0);
    });
  });

  describe('SVG rendering', () => {
    it('should render track and fill arcs', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50
      });

      const track = queryShadow(gauge as HTMLElement, '.gauge__track');
      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      expect(track).toBeTruthy();
      expect(fill).toBeTruthy();
    });

    it('should set stroke-dasharray on fill arc', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50
      });

      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashArray = fill?.getAttribute('stroke-dasharray');
      expect(dashArray).toBeTruthy();
      expect(Number(dashArray)).toBeGreaterThan(0);
    });

    it('should set correct stroke-dashoffset for 0%', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 0,
        min: 0,
        max: 100
      });

      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashArray = Number(fill?.getAttribute('stroke-dasharray'));
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashOffset).toBeCloseTo(dashArray, 0);
    });

    it('should set correct stroke-dashoffset for 100%', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 100,
        min: 0,
        max: 100
      });

      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashOffset).toBeCloseTo(0, 0);
    });

    it('should apply custom thickness to strokes', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        thickness: 12
      });

      const track = queryShadow(gauge as HTMLElement, '.gauge__track');
      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      expect(track?.getAttribute('stroke-width')).toBe('12');
      expect(fill?.getAttribute('stroke-width')).toBe('12');
    });
  });

  describe('variants', () => {
    it('should support different variants', async () => {
      const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'];

      for (const variant of variants) {
        gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
          variant,
          value: 50
        });

        expect(gauge.variant).toBe(variant);
        expect(gauge.getAttribute('variant')).toBe(variant);
        removeComponent(gauge as HTMLElement);
      }
    });
  });

  describe('sizes', () => {
    it('should support different sizes', async () => {
      const sizes = ['small', 'medium', 'large'];

      for (const size of sizes) {
        gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
          size,
          value: 50
        });

        expect(gauge.size).toBe(size);
        expect(gauge.getAttribute('size')).toBe(size);
        removeComponent(gauge as HTMLElement);
      }
    });
  });

  describe('accessibility', () => {
    it('should have role="meter"', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50
      });

      const meterEl = queryShadow(gauge as HTMLElement, '[role="meter"]');
      expect(meterEl).toBeTruthy();
    });

    it('should set aria-valuenow', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 42
      });

      const meterEl = queryShadow(gauge as HTMLElement, '[role="meter"]');
      expect(meterEl?.getAttribute('aria-valuenow')).toBe('42');
    });

    it('should set aria-valuemin and aria-valuemax', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        min: 10,
        max: 200
      });

      const meterEl = queryShadow(gauge as HTMLElement, '[role="meter"]');
      expect(meterEl?.getAttribute('aria-valuemin')).toBe('10');
      expect(meterEl?.getAttribute('aria-valuemax')).toBe('200');
    });

    it('should set aria-label from label property', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        label: 'CPU Usage'
      });

      const meterEl = queryShadow(gauge as HTMLElement, '[role="meter"]');
      expect(meterEl?.getAttribute('aria-label')).toBe('CPU Usage');
    });

    it('should set default aria-label when no label provided', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 75
      });

      const meterEl = queryShadow(gauge as HTMLElement, '[role="meter"]');
      expect(meterEl?.getAttribute('aria-label')).toBe('Gauge: 75');
    });
  });

  describe('custom min/max', () => {
    it('should work with custom min and max', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        min: 0,
        max: 200
      });

      // 50/200 = 25% fill
      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashArray = Number(fill?.getAttribute('stroke-dasharray'));
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      const fillPercentage = 1 - dashOffset / dashArray;
      expect(fillPercentage).toBeCloseTo(0.25, 1);
    });

    it('should handle min equal to max', async () => {
      gauge = await createComponent<SniceGaugeElement>('snice-gauge', {
        value: 50,
        min: 50,
        max: 50
      });

      const fill = queryShadow(gauge as HTMLElement, '.gauge__fill');
      const dashArray = Number(fill?.getAttribute('stroke-dasharray'));
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashOffset).toBeCloseTo(dashArray, 0);
    });
  });
});
