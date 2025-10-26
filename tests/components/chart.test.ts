import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/chart/snice-chart';
import type { SniceChartElement, ChartDataset } from '../../components/chart/snice-chart.types';

describe('snice-chart', () => {
  let chart: SniceChartElement;

  afterEach(() => {
    if (chart) {
      removeComponent(chart as HTMLElement);
    }
  });

  it('should render', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart');
    expect(chart).toBeTruthy();
  });

  it('should have default properties', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart');
    expect(chart.type).toBe('line');
    expect(chart.datasets).toEqual([]);
    expect(chart.labels).toEqual([]);
  });

  it('should support line charts', async () => {
    const datasets: ChartDataset[] = [
      {
        label: 'Series 1',
        data: [10, 20, 30, 40],
        borderColor: '#2196f3'
      }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.type = 'line';
    chart.datasets = datasets;
    chart.labels = ['A', 'B', 'C', 'D'];
    await wait();

    expect(chart.type).toBe('line');
    expect(chart.datasets.length).toBe(1);
  });

  it('should support bar charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'bar'
    });
    expect(chart.type).toBe('bar');
  });

  it('should support pie charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'pie'
    });
    expect(chart.type).toBe('pie');
  });

  it('should support donut charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'donut'
    });
    expect(chart.type).toBe('donut');
  });

  it('should support area charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'area'
    });
    expect(chart.type).toBe('area');
  });

  it('should support scatter plots', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'scatter'
    });
    expect(chart.type).toBe('scatter');
  });

  it('should support bubble charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'bubble'
    });
    expect(chart.type).toBe('bubble');
  });

  it('should support radar charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'radar'
    });
    expect(chart.type).toBe('radar');
  });

  it('should support horizontal bar charts', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      type: 'horizontal-bar'
    });
    expect(chart.type).toBe('horizontal-bar');
  });

  it('should add dataset', async () => {
    const dataset: ChartDataset = {
      label: 'Test',
      data: [1, 2, 3]
    };

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.addDataset(dataset);
    await wait();

    expect(chart.datasets.length).toBe(1);
    expect(chart.datasets[0].label).toBe('Test');
  });

  it('should remove dataset', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Series 1', data: [1, 2, 3] },
      { label: 'Series 2', data: [4, 5, 6] }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    await wait();

    chart.removeDataset(0);
    await wait();

    expect(chart.datasets.length).toBe(1);
    expect(chart.datasets[0].label).toBe('Series 2');
  });

  it.skip('should toggle dataset visibility', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Series 1', data: [1, 2, 3] }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    await wait();

    chart.toggleDataset(0);
    await wait();

    // Dataset should be hidden but still in array
    expect(chart.datasets.length).toBe(1);
  });

  it('should update datasets', async () => {
    const newDatasets: ChartDataset[] = [
      { label: 'Updated', data: [10, 20, 30] }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.update(newDatasets);
    await wait();

    expect(chart.datasets.length).toBe(1);
    expect(chart.datasets[0].label).toBe('Updated');
  });

  it('should get chart data', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Test', data: [1, 2, 3] }
    ];
    const labels = ['A', 'B', 'C'];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    chart.labels = labels;
    await wait();

    const data = chart.getData();
    expect(data.datasets.length).toBe(1);
    expect(data.labels.length).toBe(3);
  });

  it('should support custom width and height', async () => {
    chart = await createComponent<SniceChartElement>('snice-chart', {
      width: 800,
      height: 600
    });

    expect(chart.width).toBe(800);
    expect(chart.height).toBe(600);
  });

  it('should support multiple datasets', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Series 1', data: [1, 2, 3] },
      { label: 'Series 2', data: [4, 5, 6] },
      { label: 'Series 3', data: [7, 8, 9] }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    await wait();

    expect(chart.datasets.length).toBe(3);
  });

  it('should support custom colors', async () => {
    const datasets: ChartDataset[] = [
      {
        label: 'Colored',
        data: [1, 2, 3],
        backgroundColor: '#ff0000',
        borderColor: '#00ff00'
      }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    await wait();

    expect(chart.datasets[0].backgroundColor).toBe('#ff0000');
    expect(chart.datasets[0].borderColor).toBe('#00ff00');
  });

  it('should export SVG', async () => {
    const datasets: ChartDataset[] = [
      { label: 'Test', data: [1, 2, 3] }
    ];

    chart = await createComponent<SniceChartElement>('snice-chart');
    chart.datasets = datasets;
    await wait();

    const svg = chart.exportImage('svg');
    expect(svg).toContain('svg');
  });
});
