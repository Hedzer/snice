import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/kpi/snice-kpi';
import type { SniceKpiElement } from '../../components/kpi/snice-kpi.types';

describe('snice-kpi', () => {
  let kpi: SniceKpiElement;

  afterEach(() => {
    if (kpi) {
      removeComponent(kpi as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render kpi element', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      expect(kpi).toBeTruthy();
      expect(kpi.tagName.toLowerCase()).toBe('snice-kpi');
    });

    it('should have default properties', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      expect(kpi.label).toBe('');
      expect(kpi.value).toBe('');
      expect(kpi.size).toBe('medium');
      expect(kpi.showSparkline).toBe(true);
    });

    it('should render container', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      const container = queryShadow(kpi, '.kpi');
      expect(container).toBeTruthy();
    });
  });

  describe('label and value', () => {
    it('should display label', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        label: 'Total Revenue'
      });
      await wait(10);
      const label = queryShadow(kpi, '.kpi__label');
      expect(label?.textContent).toBe('Total Revenue');
    });

    it('should display numeric value', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      kpi.value = 12345;
      await wait(10);
      const value = queryShadow(kpi, '.kpi__value');
      expect(value?.textContent).toBe('12345');
    });

    it('should display string value', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      kpi.value = '$12,345';
      await wait(10);
      const value = queryShadow(kpi, '.kpi__value');
      expect(value?.textContent).toBe('$12,345');
    });
  });

  describe('trend', () => {
    it('should display trend value', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      kpi.trendValue = '+12.5%';
      await wait(10);
      const trend = queryShadow(kpi, '.kpi__trend');
      expect(trend).toBeTruthy();
    });

    it('should show up sentiment icon', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'up'
      });
      await wait(10);
      const icon = queryShadow(kpi, '.kpi__trend-icon');
      expect(icon?.textContent).toBe('↑');
    });

    it('should show down sentiment icon', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'down'
      });
      await wait(10);
      const icon = queryShadow(kpi, '.kpi__trend-icon');
      expect(icon?.textContent).toBe('↓');
    });

    it('should show neutral sentiment icon', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'neutral'
      });
      await wait(10);
      const icon = queryShadow(kpi, '.kpi__trend-icon');
      expect(icon?.textContent).toBe('→');
    });

    it('should apply up sentiment class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'up'
      });
      await wait(10);
      const trend = queryShadow(kpi, '.kpi__trend--up');
      expect(trend).toBeTruthy();
    });

    it('should apply down sentiment class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'down'
      });
      await wait(10);
      const trend = queryShadow(kpi, '.kpi__trend--down');
      expect(trend).toBeTruthy();
    });

    it('should apply neutral sentiment class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        sentiment: 'neutral'
      });
      await wait(10);
      const trend = queryShadow(kpi, '.kpi__trend--neutral');
      expect(trend).toBeTruthy();
    });
  });

  describe('sparkline', () => {
    it('should render sparkline when data provided', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      kpi.trendData = [10, 20, 15, 25, 30];
      await wait(50);
      const sparkline = queryShadow(kpi, 'snice-sparkline');
      expect(sparkline).toBeTruthy();
    });

    it('should not render sparkline when showSparkline is false', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        showSparkline: false
      });
      kpi.trendData = [10, 20, 15, 25, 30];
      await wait(50);
      const sparkline = queryShadow(kpi, 'snice-sparkline');
      expect(sparkline).toBeFalsy();
    });

    it('should not render sparkline when no data', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi');
      await wait(10);
      const sparkline = queryShadow(kpi, 'snice-sparkline');
      expect(sparkline).toBeFalsy();
    });
  });

  describe('sizes', () => {
    it('should apply small size class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        size: 'small'
      });
      const container = queryShadow(kpi, '.kpi--small');
      expect(container).toBeTruthy();
    });

    it('should apply medium size class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        size: 'medium'
      });
      const container = queryShadow(kpi, '.kpi--medium');
      expect(container).toBeTruthy();
    });

    it('should apply large size class', async () => {
      kpi = await createComponent<SniceKpiElement>('snice-kpi', {
        size: 'large'
      });
      const container = queryShadow(kpi, '.kpi--large');
      expect(container).toBeTruthy();
    });
  });
});
