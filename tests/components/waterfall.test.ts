import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/waterfall/snice-waterfall';
import type { SniceWaterfallElement } from '../../components/waterfall/snice-waterfall.types';

describe('snice-waterfall', () => {
  let waterfall: SniceWaterfallElement;

  const sampleData = [
    { label: 'Revenue', value: 100000, type: 'increase' },
    { label: 'COGS', value: -40000, type: 'decrease' },
    { label: 'Gross Profit', value: 60000, type: 'total' },
    { label: 'OpEx', value: -20000, type: 'decrease' },
    { label: 'Net Income', value: 40000, type: 'total' }
  ];

  afterEach(() => {
    if (waterfall) {
      removeComponent(waterfall as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render waterfall element', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');

      expect(waterfall).toBeTruthy();
      expect(waterfall.tagName).toBe('SNICE-WATERFALL');
    });

    it('should have default properties', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');

      expect(waterfall.data).toEqual([]);
      expect(waterfall.orientation).toBe('vertical');
      expect(waterfall.showValues).toBe(true);
      expect(waterfall.showConnectors).toBe(true);
      expect(waterfall.animated).toBe(false);
    });

    it('should render waterfall structure', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');
      await wait(10);

      const base = queryShadow(waterfall as HTMLElement, '.waterfall');
      expect(base).toBeTruthy();

      const chart = queryShadow(waterfall as HTMLElement, '.waterfall__chart');
      expect(chart).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept data array', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');
      waterfall.data = sampleData;

      expect(waterfall.data).toEqual(sampleData);
    });

    it('should accept orientation attribute', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall', {
        orientation: 'horizontal'
      });

      expect(waterfall.orientation).toBe('horizontal');
    });

    it('should accept show-values attribute', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall', {
        'show-values': false
      });

      expect(waterfall.showValues).toBe(false);
    });

    it('should accept show-connectors attribute', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall', {
        'show-connectors': false
      });

      expect(waterfall.showConnectors).toBe(false);
    });

    it('should accept animated attribute', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall', {
        animated: true
      });

      expect(waterfall.animated).toBe(true);
    });
  });

  describe('events', () => {
    it('should dispatch bar-click event', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');
      waterfall.data = sampleData;
      await wait(50);

      let eventFired = false;
      waterfall.addEventListener('bar-click', (e: Event) => {
        eventFired = true;
        expect((e as CustomEvent).detail.item).toBeDefined();
        expect((e as CustomEvent).detail.index).toBeDefined();
      });

      expect(waterfall).toBeTruthy();
    });

    it('should dispatch bar-hover event', async () => {
      waterfall = await createComponent<SniceWaterfallElement>('snice-waterfall');
      waterfall.data = sampleData;
      await wait(50);

      let eventFired = false;
      waterfall.addEventListener('bar-hover', (e: Event) => {
        eventFired = true;
        expect((e as CustomEvent).detail.item).toBeDefined();
        expect((e as CustomEvent).detail.index).toBeDefined();
      });

      expect(waterfall).toBeTruthy();
    });
  });
});
