import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/heatmap/snice-heatmap';
import type { SniceHeatmapElement } from '../../components/heatmap/snice-heatmap.types';

function generateData(days: number, maxValue = 10): { date: string; value: number }[] {
  const data = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    data.push({ date: `${y}-${m}-${day}`, value: Math.floor(Math.random() * (maxValue + 1)) });
  }
  return data;
}

describe('snice-heatmap', () => {
  let heatmap: SniceHeatmapElement;

  afterEach(() => {
    if (heatmap) {
      removeComponent(heatmap as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render heatmap element', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      expect(heatmap).toBeTruthy();
      expect(heatmap.tagName).toBe('SNICE-HEATMAP');
    });

    it('should have default properties', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      expect(heatmap.data).toEqual([]);
      expect(heatmap.colorScheme).toBe('green');
      expect(heatmap.showLabels).toBe(true);
      expect(heatmap.cellSize).toBe(12);
      expect(heatmap.cellGap).toBe(3);
      expect(heatmap.showTooltip).toBe(true);
      expect(heatmap.weeks).toBe(52);
    });
  });

  describe('data rendering', () => {
    it('should render grid cells', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const cells = queryShadowAll(heatmap as HTMLElement, '.heatmap__cell');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should render cells with correct levels when data is provided', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const tracker = trackRenders(heatmap as HTMLElement);
      heatmap.data = generateData(30, 10);
      await tracker.next();

      const cells = queryShadowAll(heatmap as HTMLElement, '.heatmap__cell');
      expect(cells.length).toBeGreaterThan(0);

      const hasLevels = Array.from(cells).some(cell =>
        cell.classList.contains('heatmap__cell--level-1') ||
        cell.classList.contains('heatmap__cell--level-2') ||
        cell.classList.contains('heatmap__cell--level-3') ||
        cell.classList.contains('heatmap__cell--level-4')
      );
      expect(hasLevels).toBe(true);
    });

    it('should render day labels when showLabels is true', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const labels = queryShadowAll(heatmap as HTMLElement, '.heatmap__day-label');
      expect(labels.length).toBe(7);
    });

    it('should not render day labels when showLabels is false', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
        'show-labels': false
      });

      const labels = queryShadowAll(heatmap as HTMLElement, '.heatmap__day-label');
      expect(labels.length).toBe(0);
    });

    it('should render month labels', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const monthLabels = queryShadowAll(heatmap as HTMLElement, '.heatmap__month-label');
      expect(monthLabels.length).toBeGreaterThan(0);
    });

    it('should have aria-labels on cells', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const tracker = trackRenders(heatmap as HTMLElement);
      heatmap.data = [{ date: '2026-01-15', value: 5 }];
      await tracker.next();

      const cells = queryShadowAll(heatmap as HTMLElement, '.heatmap__cell');
      const hasAriaLabel = Array.from(cells).every(cell =>
        cell.getAttribute('aria-label') !== null
      );
      expect(hasAriaLabel).toBe(true);
    });
  });

  describe('color schemes', () => {
    it('should support different color schemes', async () => {
      const schemes = ['green', 'blue', 'purple', 'orange', 'red'];

      for (const scheme of schemes) {
        heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
          'color-scheme': scheme
        });

        expect(heatmap.colorScheme).toBe(scheme);
        removeComponent(heatmap as HTMLElement);
      }
    });
  });

  describe('cell click events', () => {
    it('should dispatch cell-click event when cell is clicked', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap');

      const tracker = trackRenders(heatmap as HTMLElement);
      heatmap.data = generateData(7, 5);
      await tracker.next();

      const cells = queryShadowAll(heatmap as HTMLElement, '.heatmap__cell');
      expect(cells.length).toBeGreaterThan(0);

      let eventFired = false;
      let eventDetail: { date: string; value: number } | null = null;

      heatmap.addEventListener('cell-click', ((e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      }) as EventListener);

      (cells[cells.length - 1] as HTMLElement).click();

      expect(eventFired).toBe(true);
      expect(eventDetail).toBeTruthy();
      expect(eventDetail!.date).toBeTruthy();
      expect(typeof eventDetail!.value).toBe('number');
    });
  });

  describe('custom sizing', () => {
    it('should apply custom cell size', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
        'cell-size': 16
      });

      expect(heatmap.cellSize).toBe(16);
    });

    it('should apply custom cell gap', async () => {
      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
        'cell-gap': 5
      });

      expect(heatmap.cellGap).toBe(5);
    });
  });

  describe('weeks configuration', () => {
    it('should render fewer cells with smaller weeks value', async () => {
      const fullHeatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
        weeks: 52
      });
      const fullCells = queryShadowAll(fullHeatmap as HTMLElement, '.heatmap__cell');

      removeComponent(fullHeatmap as HTMLElement);

      heatmap = await createComponent<SniceHeatmapElement>('snice-heatmap', {
        weeks: 12
      });
      const smallCells = queryShadowAll(heatmap as HTMLElement, '.heatmap__cell');

      expect(smallCells.length).toBeLessThan(fullCells.length);
    });
  });
});
