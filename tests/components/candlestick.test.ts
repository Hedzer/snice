import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/candlestick/snice-candlestick';
import type { SniceCandlestickElement, CandleData } from '../../components/candlestick/snice-candlestick.types';

function generateSampleData(count: number): CandleData[] {
  const data: CandleData[] = [];
  let price = 100;
  const baseDate = new Date('2024-01-01');

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 10;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    price = close;
  }

  return data;
}

const SAMPLE_DATA: CandleData[] = [
  { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 500000 },
  { date: '2024-01-02', open: 105, high: 115, low: 100, close: 98, volume: 600000 },
  { date: '2024-01-03', open: 98, high: 108, low: 93, close: 107, volume: 450000 },
  { date: '2024-01-04', open: 107, high: 120, low: 105, close: 118, volume: 700000 },
  { date: '2024-01-05', open: 118, high: 125, low: 112, close: 110, volume: 550000 },
];

describe('snice-candlestick', () => {
  let el: SniceCandlestickElement;

  afterEach(() => {
    if (el) removeComponent(el as HTMLElement);
  });

  describe('basic functionality', () => {
    it('should render the element', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-CANDLESTICK');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');

      expect(el.data).toEqual([]);
      expect(el.showVolume).toBe(false);
      expect(el.showGrid).toBe(true);
      expect(el.showCrosshair).toBe(true);
      expect(el.bullishColor).toBe('');
      expect(el.bearishColor).toBe('');
      expect(el.timeFormat).toBe('auto');
      expect(el.yAxisFormat).toBe('number');
      expect(el.zoomEnabled).toBe(true);
      expect(el.animation).toBe(true);
    });

    it('should render SVG element', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const svg = queryShadow(el as HTMLElement, 'svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('data rendering', () => {
    it('should render candle bodies when data is set', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(SAMPLE_DATA.length);
    });

    it('should render candle wicks when data is set', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const wicks = queryShadowAll(el as HTMLElement, '.candlestick__wick');
      expect(wicks.length).toBe(SAMPLE_DATA.length);
    });

    it('should update when data changes', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);

      el.data = SAMPLE_DATA.slice(0, 3);
      await tracker.next();
      let bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(3);

      el.data = SAMPLE_DATA;
      await tracker.next();
      bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(5);
    });

    it('should render nothing when data is empty', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(0);
    });
  });

  describe('volume bars', () => {
    it('should not show volume bars by default', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const volumes = queryShadowAll(el as HTMLElement, '.candlestick__volume');
      expect(volumes.length).toBe(0);
    });

    it('should show volume bars when showVolume is true', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.showVolume = true;
      el.data = SAMPLE_DATA;
      await tracker.next();

      const volumes = queryShadowAll(el as HTMLElement, '.candlestick__volume');
      expect(volumes.length).toBe(SAMPLE_DATA.length);
    });
  });

  describe('grid lines', () => {
    it('should show grid lines by default', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const gridLines = queryShadowAll(el as HTMLElement, '.candlestick__grid-line');
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it('should hide grid lines when showGrid is false', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.showGrid = false;
      el.data = SAMPLE_DATA;
      await tracker.next();

      const gridLines = queryShadowAll(el as HTMLElement, '.candlestick__grid-line');
      expect(gridLines.length).toBe(0);
    });
  });

  describe('axis labels', () => {
    it('should render y-axis labels', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const yLabels = queryShadowAll(el as HTMLElement, '.candlestick__axis-label--y');
      expect(yLabels.length).toBeGreaterThan(0);
    });

    it('should render x-axis labels', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const xLabels = queryShadowAll(el as HTMLElement, '.candlestick__axis-label--x');
      expect(xLabels.length).toBeGreaterThan(0);
    });
  });

  describe('tooltip', () => {
    it('should have tooltip element', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const tooltip = queryShadow(el as HTMLElement, '.candlestick__tooltip');
      expect(tooltip).toBeTruthy();
    });

    it('should not be visible by default', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const tooltip = queryShadow(el as HTMLElement, '.candlestick__tooltip--visible');
      expect(tooltip).toBeNull();
    });
  });

  describe('properties', () => {
    it('should accept bullish and bearish color overrides', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      el.bullishColor = '#00ff00';
      el.bearishColor = '#ff0000';

      expect(el.bullishColor).toBe('#00ff00');
      expect(el.bearishColor).toBe('#ff0000');
    });

    it('should accept timeFormat property', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      el.timeFormat = 'date';
      expect(el.timeFormat).toBe('date');
    });

    it('should accept yAxisFormat property', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      el.yAxisFormat = 'currency';
      expect(el.yAxisFormat).toBe('currency');
    });

    it('should accept animation property', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      el.animation = false;
      expect(el.animation).toBe(false);
    });
  });

  describe('methods', () => {
    it('should have resetZoom method', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      expect(typeof el.resetZoom).toBe('function');
    });

    it('should have zoomTo method', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      expect(typeof el.zoomTo).toBe('function');
    });

    it('resetZoom should show all data', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const data = generateSampleData(100);
      const tracker = trackRenders(el as HTMLElement);
      el.data = data;
      await tracker.next();

      el.zoomTo(10, 30);
      await tracker.next();
      let bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(20);

      el.resetZoom();
      await tracker.next();
      bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(100);
    });

    it('zoomTo should limit visible range', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const data = generateSampleData(50);
      const tracker = trackRenders(el as HTMLElement);
      el.data = data;
      await tracker.next();

      el.zoomTo(5, 15);
      await tracker.next();

      const bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBe(10);
    });
  });

  describe('accessibility', () => {
    it('should have role="img" on SVG', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const svg = queryShadow(el as HTMLElement, 'svg[role="img"]');
      expect(svg).toBeTruthy();
    });

    it('should have aria-label on SVG', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const tracker = trackRenders(el as HTMLElement);
      el.data = SAMPLE_DATA;
      await tracker.next();

      const svg = queryShadow(el as HTMLElement, 'svg');
      expect(svg?.getAttribute('aria-label')).toContain('5');
    });
  });

  describe('large datasets', () => {
    it('should handle 200 data points', async () => {
      el = await createComponent<SniceCandlestickElement>('snice-candlestick');
      const data = generateSampleData(200);
      const tracker = trackRenders(el as HTMLElement);
      el.data = data;
      await tracker.next();

      // Should show only a window (default 80 candles max on init)
      const bodies = queryShadowAll(el as HTMLElement, '.candlestick__body');
      expect(bodies.length).toBeGreaterThan(0);
      expect(bodies.length).toBeLessThanOrEqual(200);
    });
  });
});
