import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/org-chart/snice-org-chart';
import type { SniceOrgChartElement } from '../../components/org-chart/snice-org-chart.types';

describe('snice-org-chart', () => {
  let chart: SniceOrgChartElement;

  const sampleData = {
    id: '1',
    name: 'CEO',
    title: 'Chief Executive Officer',
    children: [
      {
        id: '2',
        name: 'CTO',
        title: 'Chief Technology Officer',
        children: [
          { id: '4', name: 'Dev Manager', title: 'Development Manager' },
          { id: '5', name: 'QA Manager', title: 'Quality Assurance Manager' }
        ]
      },
      {
        id: '3',
        name: 'CFO',
        title: 'Chief Financial Officer',
        children: [
          { id: '6', name: 'Accountant', title: 'Senior Accountant' }
        ]
      }
    ]
  };

  afterEach(() => {
    if (chart) {
      removeComponent(chart as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render org-chart element', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(chart).toBeTruthy();
      expect(chart.tagName).toBe('SNICE-ORG-CHART');
    });

    it('should have default properties', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(chart.data).toBe(null);
      expect(chart.direction).toBe('top-down');
      expect(chart.compact).toBe(false);
    });

    it('should render empty state when no data', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');
      await wait(10);

      const container = queryShadow(chart as HTMLElement, '.org-container');
      expect(container).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept data object', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');
      chart.data = sampleData;
      await wait(10);

      expect(chart.data).toEqual(sampleData);
    });

    it('should accept direction attribute', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart', {
        direction: 'left-right'
      });

      expect(chart.direction).toBe('left-right');
    });

    it('should accept compact attribute', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart', {
        compact: true
      });

      expect(chart.compact).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should have collapseNode method', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(typeof chart.collapseNode).toBe('function');
    });

    it('should have expandNode method', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(typeof chart.expandNode).toBe('function');
    });

    it('should have expandAll method', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(typeof chart.expandAll).toBe('function');
    });

    it('should have collapseAll method', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');

      expect(typeof chart.collapseAll).toBe('function');
    });
  });

  describe('events', () => {
    it('should dispatch node-click event', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');
      chart.data = sampleData;
      await wait(50);

      let eventFired = false;
      chart.addEventListener('node-click', (e: Event) => {
        eventFired = true;
        expect((e as CustomEvent).detail.node).toBeDefined();
      });

      const node = queryShadow(chart as HTMLElement, '.org-node');
      node?.click();
      await wait(10);

      expect(eventFired).toBe(true);
    });

    it('should dispatch node-expand event', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');
      chart.data = sampleData;
      await wait(50);

      // First collapse
      chart.collapseNode('1');

      let eventFired = false;
      chart.addEventListener('node-expand', () => {
        eventFired = true;
      });

      chart.expandNode('1');
      await wait(10);

      expect(eventFired).toBe(true);
    });

    it('should dispatch node-collapse event', async () => {
      chart = await createComponent<SniceOrgChartElement>('snice-org-chart');
      chart.data = sampleData;
      await wait(50);

      let eventFired = false;
      chart.addEventListener('node-collapse', () => {
        eventFired = true;
      });

      chart.collapseNode('1');
      await wait(10);

      expect(eventFired).toBe(true);
    });
  });
});
