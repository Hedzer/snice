import { afterEach, describe, expect, it, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';
import '../../packages/components/src/table/snice-row';
import '../../packages/components/src/table/snice-cell-color';
import '../../packages/components/src/table/snice-cell-image';
import '../../packages/components/src/table/snice-cell-json';
import '../../packages/components/src/table/snice-cell-location';
import '../../packages/components/src/table/snice-cell-percentage';
import '../../packages/components/src/table/snice-cell-rating';
import '../../packages/components/src/table/snice-cell-sparkline';

const columns = [
  { key: 'name', label: 'Name', type: 'text' as const },
  { key: 'amount', label: 'Amount', type: 'currency' as const },
];

const rows = [
  { name: 'Alpha', amount: 1234.5 },
  { name: 'Beta', amount: -20 },
  { name: 'Gamma', amount: 99 },
];

const originalGetContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext');
const originalToDataURL = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'toDataURL');

async function createTable(attrs: Record<string, any> = {}, tableColumns: any[] = columns, data: any[] = rows) {
  const table = await createComponent<any>('snice-table', attrs);
  table.columns = tableColumns;
  table.data = data;
  await wait(40);
  return table;
}

describe('Table public API gap regressions', () => {
  let element: HTMLElement | null = null;

  afterEach(() => {
    if (element) removeComponent(element);
    element = null;
    vi.restoreAllMocks();
    if (originalGetContext) Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', originalGetContext);
    else delete (HTMLCanvasElement.prototype as any).getContext;
    if (originalToDataURL) Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', originalToDataURL);
    else delete (HTMLCanvasElement.prototype as any).toDataURL;
  });

  it('quickFilter renders a working local quick-filter control', async () => {
    const table = await createTable({ quickFilter: true });
    element = table;

    const input = table.shadowRoot.querySelector('.quick-filter-input') as any;
    expect(input).toBeTruthy();
    input.value = 'Beta';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(200);

    const rendered = table.shadowRoot.querySelectorAll('tbody tr[data-index]');
    expect(rendered).toHaveLength(1);
    expect(rendered[0].getAttribute('data-index')).toBe('1');
  });

  it('the legacy searchable control filters locally and keeps request search in remote mode', async () => {
    const local = await createTable({ searchable: true });
    element = local;
    const localInput = local.shadowRoot.querySelector('.search-input') as any;
    localInput.value = 'Gamma';
    localInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(local.searchDebounce + 40);
    expect(local.shadowRoot.querySelectorAll('tbody tr[data-index]')).toHaveLength(1);

    removeComponent(local);
    element = null;

    const remote = await createTable({ searchable: true, mode: 'remote' });
    element = remote;
    const request = vi.spyOn(remote, 'getTableData').mockResolvedValue(undefined);
    const remoteInput = remote.shadowRoot.querySelector('.search-input') as any;
    remoteInput.value = 'Alpha';
    remoteInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(remote.searchDebounce + 40);
    expect(remote.searchText).toBe('Alpha');
    expect(request).toHaveBeenCalled();
  });

  it('uses the real currency cell and honors its complete format', async () => {
    const table = await createTable({}, [{
      key: 'amount', label: 'Amount', type: 'currency',
      currencyFormat: {
        currency: 'EUR', locale: 'de-DE', display: 'code', decimals: 1,
        thousandsSeparator: false, negativeStyle: 'parentheses',
      },
    }], [{ amount: -1234.5 }]);
    element = table;

    const cell = table.shadowRoot.querySelector('snice-cell-currency') as any;
    expect(cell).toBeTruthy();
    expect(Number(cell.value)).toBe(-1234.5);
    await wait(20);
    const text = cell.shadowRoot.querySelector('[part="content"]')?.textContent || '';
    expect(text).toContain('EUR');
    expect(text).toContain('1234,5');
    expect(text).toContain('(');
  });

  it('formats negative and whole-number fractions without non-terminating conversion', async () => {
    const table = await createTable({}, [
      { key: 'fraction', label: 'Fraction', type: 'fraction' },
    ], [{ fraction: -0.5 }, { fraction: 2 }]);
    element = table;
    await wait(20);
    const cells = Array.from(table.shadowRoot.querySelectorAll('snice-cell')) as any[];
    expect(cells.map((cell) => cell.shadowRoot.querySelector('[part="content"]')?.textContent.trim()))
      .toEqual(['-1/2', '2/1']);
  });

  it('applies valueFormatter, tooltip, base style, and conditional style to every cell type', async () => {
    const table = await createTable({}, [{
      key: 'amount', label: 'Amount', type: 'currency',
      valueFormatter: (value: number) => `USD ${value}`,
      tooltip: (value: number, row: any) => `${row.name}: ${value}`,
      style: { color: 'rgb(1, 2, 3)' },
      conditionalFormats: [{
        condition: (value: number) => value > 100,
        style: { fontWeight: 'bold' },
        className: 'large-value',
      }],
    }], [{ name: 'Alpha', amount: 1234.5 }]);
    element = table;

    const td = table.shadowRoot.querySelector('td[data-key="amount"]') as HTMLElement;
    expect(td.title).toBe('Alpha: 1234.5');
    expect(td.style.color).toBe('rgb(1, 2, 3)');
    expect(td.style.fontWeight).toBe('bold');
    expect(td.classList.contains('large-value')).toBe(true);
    const currency = td.querySelector('snice-cell-currency') as any;
    expect(currency.shadowRoot.querySelector('[part="content"]')?.textContent).toContain('USD 1234.5');
  });

  it('renders the configured list-view callback', async () => {
    const table = await createTable({ list: true });
    element = table;
    table.setListViewRenderer((row: any, index: number) => `${index}: ${row.name}`);
    await wait(30);

    const listCells = table.shadowRoot.querySelectorAll('.list-view-cell');
    expect(listCells).toHaveLength(rows.length);
    expect(listCells[1].textContent).toBe('1: Beta');
    expect(table.shadowRoot.querySelector('td[data-key="amount"]')).toBeNull();
  });

  it('emits density-change after a post-mount density assignment', async () => {
    const table = await createTable();
    element = table;
    const events: any[] = [];
    table.addEventListener('density-change', (event: CustomEvent) => events.push(event.detail));
    table.density = 'compact';
    await wait(20);
    expect(events).toEqual([{ density: 'compact' }]);
  });

  it('resolves selected rows by raw identity before filtered CSV and clipboard export', async () => {
    const table = await createTable();
    element = table;
    table.selectedRows = [1];
    table.setQuickFilter('Beta');

    const csv = vi.spyOn((table as any).exporter, 'exportCSV').mockImplementation(() => {});
    table.exportCSV({ selectedOnly: true });
    expect(csv.mock.calls[0][0]).toEqual([rows[1]]);

    const copy = vi.spyOn((table as any).exporter, 'copyToClipboard').mockResolvedValue(true);
    await table.copyToClipboard();
    expect(copy.mock.calls[0][0]).toEqual([rows[1]]);
  });

  it('reacts when row reorder, column reorder, and lazy loading are toggled post-mount', async () => {
    const table = await createTable();
    element = table;
    table.rowReorder = true;
    table.columnReorder = true;
    table.lazyLoad = true;
    await wait(40);
    expect((table as any).rowDnD.isEnabled()).toBe(true);
    expect((table as any).columnDnD.isEnabled()).toBe(true);
    expect((table as any).lazyLoadHandler).toBeTypeOf('function');

    table.rowReorder = false;
    table.columnReorder = false;
    table.lazyLoad = false;
    await wait(40);
    expect((table as any).rowDnD.isEnabled()).toBe(false);
    expect((table as any).columnDnD.isEnabled()).toBe(false);
    expect((table as any).lazyLoadHandler).toBeNull();
  });

  it('uses per-row heights in virtual spacer and scroll calculations', async () => {
    const table = await createTable({ virtualize: true, 'virtual-buffer': 0 });
    element = table;
    table.setRowHeightCallback((_row: any, index: number) => [100, 50, 25][index] || 40);
    await wait(50);

    const bottomSpacer = table.shadowRoot.querySelector('.virtual-spacer--bottom td') as HTMLElement;
    expect(bottomSpacer.style.height).toBe('75px');
    table.scrollToRow(2);
    expect((table.shadowRoot.querySelector('.table-frame') as HTMLElement).scrollTop).toBe(150);
  });

  it('toggles the focused selection with plain Space', async () => {
    const table = await createTable({ selectable: true });
    element = table;
    (table as any).keyboard.setFocus(0, 0);
    table.shadowRoot.querySelector('table').dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    expect(table.selectedRows).toEqual([0]);
  });

  it('emits row-hover when a standalone row is entered', async () => {
    const row = await createComponent<any>('snice-row');
    element = row;
    row.data = { name: 'Alpha' };
    row.index = 4;
    const events: any[] = [];
    row.addEventListener('row-hover', (event: CustomEvent) => events.push(event.detail));
    row.dispatchEvent(new MouseEvent('mouseenter'));
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual({ name: 'Alpha' });
    expect(events[0].index).toBe(4);
    expect(events[0].element === row).toBe(true);
  });

  it('honors every source-compatible specialized format alias', async () => {
    const table = await createTable({}, [
      { key: 'rating', label: 'Rating', type: 'rating', ratingFormat: { symbol: '★', emptySymbol: '·', max: 5 } },
      { key: 'percent', label: 'Percent', type: 'percentage', percentageFormat: { showTrend: true, trendValue: 2 } },
      { key: 'color', label: 'Color', type: 'color', colorFormat: { size: 'large', displayFormat: 'hsl' } },
      { key: 'image', label: 'Image', type: 'image', imageFormat: { shape: 'circle' } },
      { key: 'json', label: 'JSON', type: 'json', jsonFormat: { expanded: true } },
      { key: 'location', label: 'Location', type: 'location', locationFormat: { lat: 40.7, lng: -74 } },
    ], [{ rating: 3, percent: 12.5, color: '#ff0000', image: '/avatar.png', json: { ok: true }, location: '' }]);
    element = table;
    await wait(40);

    const rating = table.shadowRoot.querySelector('snice-cell-rating') as any;
    const ratingControl = rating.shadowRoot.querySelector('snice-rating') as any;
    expect(ratingControl.emptyIcon).toBe('·');

    const percent = table.shadowRoot.querySelector('snice-cell-percentage') as any;
    expect(percent.shadowRoot.querySelector('.percentage-trend')).toBeTruthy();

    const color = table.shadowRoot.querySelector('snice-cell-color') as any;
    expect(color.swatchSize).toBe('large');
    expect(color.shadowRoot.textContent).toContain('hsl(0, 100%, 50%)');

    const image = table.shadowRoot.querySelector('snice-cell-image') as any;
    expect(image.variant).toBe('circle');
    expect(image.shadowRoot.querySelector('img')?.classList.contains('image--circle')).toBe(true);

    const json = table.shadowRoot.querySelector('snice-cell-json') as any;
    expect(json.collapsed).toBe(false);
    expect(json.value).toEqual({ ok: true });
    expect(json.shadowRoot.querySelector('.json-viewer--expanded')).toBeTruthy();

    const location = table.shadowRoot.querySelector('snice-cell-location') as any;
    expect(location.latitude).toBe('40.7');
    expect(location.longitude).toBe('-74');
    expect(location.shadowRoot.querySelector('a')?.href).toContain('40.7,-74');
  });

  it('preserves object progress values through the table cell pipeline', async () => {
    const table = await createTable({}, [{
      key: 'progress', label: 'Progress', type: 'progress',
      progressFormat: { showPercentage: true },
    }], [{ progress: { value: 72, color: '#123456' } }]);
    element = table;
    await wait(30);
    const cell = table.shadowRoot.querySelector('snice-cell-progress') as any;
    const progress = cell.shadowRoot.querySelector('snice-table-progress') as any;
    expect(cell.value).toEqual({ value: 72, color: '#123456' });
    expect(progress.value).toBe(72);
    expect(progress.color).toBe('#123456');
  });

  it('applies the common formatter, style, conditional format, and tooltip contract to standalone rich cells', async () => {
    const cell = await createComponent<any>('snice-cell-image');
    element = cell;
    cell.value = '/avatar.png';
    cell.rowData = { name: 'Alpha' };
    cell.column = {
      key: 'image', label: 'Image', type: 'image',
      formatter: (_value: string, row: any) => `Avatar for ${row.name}`,
      tooltip: (_value: string, row: any) => `Open ${row.name}`,
      style: { color: 'rgb(1, 2, 3)' },
      conditionalFormats: [{
        condition: () => true,
        style: { fontWeight: 'bold' },
        className: 'formatted-avatar',
      }],
    };
    await wait(30);

    expect(cell.shadowRoot.querySelector('[part="content"]')?.textContent).toBe('Avatar for Alpha');
    expect(cell.title).toBe('Open Alpha');
    expect(cell.style.color).toBe('rgb(1, 2, 3)');
    expect(cell.style.fontWeight).toBe('bold');
    expect(cell.classList.contains('formatted-avatar')).toBe(true);
  });

  it('draws the sparkline baseline and accepts all sparkline format controls', async () => {
    const context = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      stroke: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), arc: vi.fn(), closePath: vi.fn(),
      save: vi.fn(), restore: vi.fn(),
      strokeStyle: '', fillStyle: '', lineWidth: 0, lineCap: '', lineJoin: '', globalAlpha: 1,
    };
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => context),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,test'),
    });

    const sparkline = await createComponent<any>('snice-cell-sparkline');
    element = sparkline;
    sparkline.value = [-5, 0, 5];
    sparkline.column = {
      key: 'trend', label: 'Trend', type: 'sparkline',
      sparklineFormat: { showBaseline: true, showDots: true, strokeWidth: 3, minValue: -10, maxValue: 10 },
    };
    await wait(30);

    expect(context.save).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalled();
    expect(context.arc.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(context.stroke.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves object sparkline values, including per-row color', async () => {
    const context = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      stroke: vi.fn(), fill: vi.fn(), fillRect: vi.fn(), arc: vi.fn(), closePath: vi.fn(),
      save: vi.fn(), restore: vi.fn(),
      strokeStyle: '', fillStyle: '', lineWidth: 0, lineCap: '', lineJoin: '', globalAlpha: 1,
    };
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true, value: vi.fn(() => context),
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
      configurable: true, value: vi.fn(() => 'data:image/png;base64,test'),
    });
    const table = await createTable({}, [
      { key: 'trend', label: 'Trend', type: 'sparkline' },
    ], [{ trend: { values: [1, 3, 2], color: '#123456' } }]);
    element = table;
    await wait(30);
    const cell = table.shadowRoot.querySelector('snice-cell-sparkline') as any;
    expect(cell.value).toContain('"values":[1,3,2]');
    expect(context.strokeStyle).toBe('#123456');
    expect(context.lineTo).toHaveBeenCalled();
  });

  it('implements eager/fixed-height detail panels and custom toggle icons', async () => {
    const table = await createTable();
    element = table;
    const renderDetail = vi.fn((row: any) => `<strong>${row.name}</strong>`);
    table.setDetailPanel({
      getDetailContent: renderDetail,
      lazy: false,
      detailHeight: 96,
      expandIcon: '+',
      collapseIcon: '−',
    });
    expect(renderDetail).toHaveBeenCalledTimes(rows.length);
    expect(table.shadowRoot.querySelector('.detail-toggle')?.textContent).toBe('+');

    table.expandRow(0);
    await wait(40);
    const detail = table.shadowRoot.querySelector('.detail-content') as HTMLElement;
    expect(detail.style.getPropertyValue('--detail-max-height')).toBe('96px');
    expect(table.shadowRoot.querySelector('.detail-content-inner')?.getAttribute('style')).toContain('height: 96px');
    expect(table.shadowRoot.querySelector('.detail-toggle')?.textContent).toBe('−');

    table.collapseRow(0);
    table.expandRow(0);
    await wait(30);
    expect(renderDetail).toHaveBeenCalledTimes(rows.length);
  });

  it('creates lazy detail content once per expansion and destroys it on collapse', async () => {
    const table = await createTable();
    element = table;
    const renderDetail = vi.fn((row: any) => row.name);
    table.setDetailPanel({ getDetailContent: renderDetail });
    expect(renderDetail).not.toHaveBeenCalled();

    table.expandRow(0);
    await wait(20);
    expect(renderDetail).toHaveBeenCalledTimes(1);
    table.renderBody();
    expect(renderDetail).toHaveBeenCalledTimes(1);

    table.collapseRow(0);
    table.expandRow(0);
    await wait(20);
    expect(renderDetail).toHaveBeenCalledTimes(2);
  });

  it('feeds measured auto detail height back into virtual row offsets', async () => {
    const table = await createTable({ virtualize: true, 'virtual-buffer': 0 });
    element = table;
    table.setDetailPanel({ getDetailContent: (row: any) => row.name });
    table.expandRow(0);
    const detail = table.shadowRoot.querySelector('.detail-content-inner') as HTMLElement;
    Object.defineProperty(detail, 'scrollHeight', { configurable: true, value: 80 });
    await wait(40);
    table.scrollToRow(1);
    expect((table.shadowRoot.querySelector('.table-frame') as HTMLElement).scrollTop)
      .toBe(table.rowHeight + 80);
  });

  it('renders functional toolbar sort and filter controls', async () => {
    const table = await createTable();
    element = table;
    table.setToolbar({ showSearch: false, showSort: true, showFilter: true });

    const sortButton = table.shadowRoot.querySelector('.toolbar-sort') as HTMLButtonElement;
    const filterButton = table.shadowRoot.querySelector('.toolbar-filter') as HTMLButtonElement;
    expect(sortButton).toBeTruthy();
    expect(filterButton).toBeTruthy();

    const sortEvents: any[] = [];
    table.addEventListener('sort-change', (event: CustomEvent) => sortEvents.push(event.detail));
    sortButton.click();
    const sortPanel = table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement;
    expect(sortPanel.hidden).toBe(false);
    (sortPanel.querySelector('.tt-filter-add') as HTMLButtonElement).click();
    await wait(30);
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);
    expect(sortEvents.at(-1)).toEqual({ sort: [{ column: 'name', direction: 'asc' }] });

    filterButton.click();
    const filterPanel = table.shadowRoot.querySelector('.tt-filter-panel') as HTMLElement;
    expect(filterPanel.hidden).toBe(false);
    expect((table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement).hidden).toBe(true);
  });

  it('uses formatted clipboard values only when requested', async () => {
    const table = await createTable({}, [{
      key: 'amount', label: 'Amount', type: 'currency',
      valueFormatter: (value: number) => `formatted:${value}`,
    }], [{ amount: 12.5 }]);
    element = table;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    await table.copyToClipboard();
    expect(writeText).toHaveBeenLastCalledWith('formatted:12.5');
    await table.copyToClipboard({ useFormatted: false });
    expect(writeText).toHaveBeenLastCalledWith('12.5');
  });

  it('prints rendered cell text and obeys toolbar/footer/checkbox options', async () => {
    const table = await createTable({ selectable: true, pagination: true });
    element = table;
    table.setToolbar({ showSearch: false, showExport: true });
    let printed = '';
    const printWindow: any = {
      document: { write: (html: string) => { printed = html; }, close: vi.fn() },
      print: vi.fn(), close: vi.fn(), onload: null,
    };
    vi.spyOn(window, 'open').mockReturnValue(printWindow);

    table.printTable({ includeCheckboxes: false });
    expect(printed).toContain('Alpha');
    expect(printed).toContain('Export CSV');
    expect(printed).toContain('Rows per page');
    expect(printed).not.toContain('select-column');

    table.printTable({ includeCheckboxes: true, hideToolbar: true, hideFooter: true });
    expect(printed).toContain('select-column');
    expect(printed).not.toContain('<div class="print-toolbar">');
    expect(printed).not.toContain('<div class="print-footer">');
  });
});
