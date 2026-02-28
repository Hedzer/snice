import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/metric-table/snice-metric-table';
import type { SniceMetricTableElement, MetricColumn } from '../../components/metric-table/snice-metric-table.types';

const sampleColumns: MetricColumn[] = [
  { key: 'name', label: 'Metric', type: 'text' },
  { key: 'value', label: 'Value', type: 'number' },
  { key: 'change', label: 'Change', type: 'percent' },
  { key: 'revenue', label: 'Revenue', type: 'currency' },
  { key: 'trend', label: 'Trend', sparkline: true }
];

const sampleData = [
  { name: 'Page Views', value: 124500, change: 12.3, revenue: 4521.50, trend: [100, 120, 115, 130, 150] },
  { name: 'Visitors', value: 45200, change: -2.5, revenue: 2310.00, trend: [50, 48, 45, 42, 40] },
  { name: 'Conversions', value: 1823, change: 15.7, revenue: 89450.00, trend: [1200, 1400, 1500, 1700, 1823] }
];

describe('snice-metric-table', () => {
  let el: SniceMetricTableElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    expect(el.columns).toEqual([]);
    expect(el.data).toEqual([]);
    expect(el.sortBy).toBe('');
    expect(el.sortDirection).toBe('desc');
  });

  it('should render table headers', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const headers = queryShadowAll(el as HTMLElement, '.mt__header');
    expect(headers.length).toBe(5);
  });

  it('should render header labels', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const headers = queryShadowAll(el as HTMLElement, '.mt__header');
    expect(headers[0].textContent).toContain('Metric');
    expect(headers[1].textContent).toContain('Value');
  });

  it('should render data rows', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const rows = queryShadowAll(el as HTMLElement, '.mt__row');
    expect(rows.length).toBe(3);
  });

  it('should render numeric cells with right alignment', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const numericCells = queryShadowAll(el as HTMLElement, '.mt__cell--numeric');
    expect(numericCells.length).toBeGreaterThan(0);
  });

  it('should render positive values with success color', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const positiveCells = queryShadowAll(el as HTMLElement, '.mt__cell--positive');
    expect(positiveCells.length).toBeGreaterThan(0);
  });

  it('should render negative values with danger color', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const negativeCells = queryShadowAll(el as HTMLElement, '.mt__cell--negative');
    expect(negativeCells.length).toBeGreaterThan(0);
  });

  it('should render sparklines', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const sparklines = queryShadowAll(el as HTMLElement, '.mt__sparkline');
    expect(sparklines.length).toBe(3);
  });

  it('should render sparkline with positive class when trending up', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const positiveSparklines = queryShadowAll(el as HTMLElement, '.mt__sparkline--positive');
    expect(positiveSparklines.length).toBeGreaterThan(0);
  });

  it('should render sparkline with negative class when trending down', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);
    const negativeSparklines = queryShadowAll(el as HTMLElement, '.mt__sparkline--negative');
    expect(negativeSparklines.length).toBeGreaterThan(0);
  });

  it('should sort data when header is clicked', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);

    let detail: any = null;
    (el as HTMLElement).addEventListener('sort-change', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });

    const headers = queryShadowAll(el as HTMLElement, '.mt__header');
    (headers[1] as HTMLElement).click(); // Click "Value" header
    await wait(50);

    expect(detail).toBeTruthy();
    expect(detail.sortBy).toBe('value');
    expect(detail.sortDirection).toBe('desc');
  });

  it('should toggle sort direction on same column click', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    el.sortBy = 'value';
    el.sortDirection = 'desc';
    await wait(50);

    let detail: any = null;
    (el as HTMLElement).addEventListener('sort-change', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });

    const headers = queryShadowAll(el as HTMLElement, '.mt__header');
    (headers[1] as HTMLElement).click(); // Click "Value" header again
    await wait(50);

    expect(detail).toBeTruthy();
    expect(detail.sortDirection).toBe('asc');
  });

  it('should emit row-click event', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    await wait(50);

    let detail: any = null;
    (el as HTMLElement).addEventListener('row-click', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });

    const rows = queryShadowAll(el as HTMLElement, '.mt__row');
    (rows[0] as HTMLElement).click();
    await wait(50);

    expect(detail).toBeTruthy();
    expect(detail.row.name).toBe('Page Views');
    expect(detail.index).toBe(0);
  });

  it('should format percent values', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = [{ key: 'pct', label: 'Pct', type: 'percent' }];
    el.data = [{ pct: 12.3 }];
    await wait(50);
    const cells = queryShadowAll(el as HTMLElement, '.mt__cell');
    expect(cells[0].textContent?.trim()).toBe('12.3%');
  });

  it('should format number values with locale', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = [{ key: 'num', label: 'Num', type: 'number' }];
    el.data = [{ num: 124500 }];
    await wait(50);
    const cells = queryShadowAll(el as HTMLElement, '.mt__cell');
    expect(cells[0].textContent?.trim()).toBe('124,500');
  });

  it('should show sort indicator on active column', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = sampleColumns;
    el.data = sampleData;
    el.sortBy = 'value';
    await wait(50);
    const activeSort = queryShadow(el as HTMLElement, '.mt__sort-icon--active');
    expect(activeSort).toBeTruthy();
  });

  it('should handle null values gracefully', async () => {
    el = await createComponent<SniceMetricTableElement>('snice-metric-table');
    el.columns = [{ key: 'val', label: 'Val', type: 'number' }];
    el.data = [{ val: null }];
    await wait(50);
    const cells = queryShadowAll(el as HTMLElement, '.mt__cell');
    expect(cells[0].textContent?.trim()).toBe('\u2014');
  });
});
