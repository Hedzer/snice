import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/sparkline/snice-sparkline';
import type { SniceSparklineElement } from '../../components/sparkline/snice-sparkline.types';

describe('snice-sparkline', () => {
  let sparkline: SniceSparklineElement;

  afterEach(() => {
    if (sparkline) {
      removeComponent(sparkline as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render sparkline element', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline');
      expect(sparkline).toBeTruthy();
      expect(sparkline.tagName.toLowerCase()).toBe('snice-sparkline');
    });

    it('should have default properties', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline');
      expect(sparkline.data).toEqual([]);
      expect(sparkline.type).toBe('line');
      expect(sparkline.color).toBe('primary');
      expect(sparkline.width).toBe(100);
      expect(sparkline.height).toBe(30);
      expect(sparkline.strokeWidth).toBe(2);
      expect(sparkline.showDots).toBe(false);
      expect(sparkline.showArea).toBe(false);
    });

    it('should render SVG element', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline');
      const svg = queryShadow(sparkline, 'svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('data', () => {
    it('should accept data array', async () => {
      const data = [10, 20, 15, 25, 30];
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline');
      sparkline.data = data;
      await wait(10);
      expect(sparkline.data).toEqual(data);
    });

    it('should render with empty data', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline');
      sparkline.data = [];
      await wait(10);
      const svg = queryShadow(sparkline, 'svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('types', () => {
    it('should render line type', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'line'
      });
      sparkline.data = [10, 20, 15];
      await wait(50);
      const line = queryShadow(sparkline, 'polyline');
      expect(line).toBeTruthy();
    });

    it('should render bar type', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'bar'
      });
      sparkline.data = [10, 20, 15];
      await wait(50);
      const bars = queryShadow(sparkline, 'rect');
      expect(bars).toBeTruthy();
    });

    it('should render area type', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'area'
      });
      sparkline.data = [10, 20, 15];
      await wait(50);
      const polygon = queryShadow(sparkline, 'polygon');
      expect(polygon).toBeTruthy();
    });
  });

  describe('colors', () => {
    it('should apply primary color class', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { color: 'primary' });
      const container = queryShadow(sparkline, '.sparkline');
      expect(container?.classList.contains('sparkline--primary')).toBe(true);
    });

    it('should apply success color class', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { color: 'success' });
      const container = queryShadow(sparkline, '.sparkline');
      expect(container?.classList.contains('sparkline--success')).toBe(true);
    });

    it('should apply warning color class', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { color: 'warning' });
      const container = queryShadow(sparkline, '.sparkline');
      expect(container?.classList.contains('sparkline--warning')).toBe(true);
    });

    it('should apply danger color class', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { color: 'danger' });
      const container = queryShadow(sparkline, '.sparkline');
      expect(container?.classList.contains('sparkline--danger')).toBe(true);
    });

    it('should apply muted color class', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { color: 'muted' });
      const container = queryShadow(sparkline, '.sparkline');
      expect(container?.classList.contains('sparkline--muted')).toBe(true);
    });
  });

  describe('dimensions', () => {
    it('should set custom width', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { width: 200 });
      const svg = queryShadow(sparkline, 'svg') as SVGElement;
      expect(svg.getAttribute('width')).toBe('200');
    });

    it('should set custom height', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', { height: 50 });
      const svg = queryShadow(sparkline, 'svg') as SVGElement;
      expect(svg.getAttribute('height')).toBe('50');
    });
  });

  describe('showDots', () => {
    it('should not show dots by default', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'line'
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.showDots).toBe(false);
    });

    it('should show dots when enabled', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'line',
        showDots: true
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.showDots).toBe(true);
    });
  });

  describe('showArea', () => {
    it('should not show area by default', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'line'
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.showArea).toBe(false);
    });

    it('should show area when enabled', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        type: 'line',
        showArea: true
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.showArea).toBe(true);
    });
  });

  describe('min/max', () => {
    it('should allow custom min value', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        min: 0
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.min).toBe(0);
    });

    it('should allow custom max value', async () => {
      sparkline = await createComponent<SniceSparklineElement>('snice-sparkline', {
        max: 100
      });
      sparkline.data = [10, 20, 15];
      await wait(10);
      expect(sparkline.max).toBe(100);
    });
  });
});
