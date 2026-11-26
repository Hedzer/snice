import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getRegisteredCellTagName,
  resolveCellTagName,
  createTableFeature,
  _resetTableRegistryWarnings,
} from '../../packages/components/src/table/table-registry';

describe('BS-11: Modular snice-table runtime behavior, native fallbacks, graceful degradation & upgrade safety', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    _resetTableRegistryWarnings();
    vi.restoreAllMocks();
  });

  it('AC-5(unit): resolves canonical cells and aliases, falls back to snice-cell-text with dev-only warning when unregistered, and provides non-throwing feature no-op stubs', async () => {
    expect(resolveCellTagName('percent')).toBe('snice-cell-percentage');
    expect(resolveCellTagName('fraction')).toBe('snice-cell');
    expect(resolveCellTagName('accounting', true)).toBe('snice-cell-number');
    expect(resolveCellTagName('url', true)).toBe('snice-cell-link');
    expect(resolveCellTagName('money', true)).toBe('snice-cell-currency');
    expect(resolveCellTagName('tags', true)).toBe('snice-cell-tag');
    expect(resolveCellTagName('avatar', true)).toBe('snice-cell-image');
    expect(resolveCellTagName('tel', true)).toBe('snice-cell-phone');
    expect(resolveCellTagName('object', true)).toBe('snice-cell-json');
    expect(resolveCellTagName('address', true)).toBe('snice-cell-location');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Unregistered cell tag falls back cleanly to snice-cell-text + dev warning
    const fallbackTag = getRegisteredCellTagName('rating');
    expect(fallbackTag).toBe('snice-cell-text');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('snice-cell-rating');

    // Unregistered optional feature stubs never throw TypeError and warn on active API calls
    const exportStub = createTableFeature('export');
    expect(() => exportStub.exportCSV([], [])).not.toThrow();
    expect(await exportStub.copyToClipboard([], [])).toBe(false);
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('Feature "export"'))).toBe(true);

    const groupStub = createTableFeature('grouping');
    expect(groupStub.hasGrouping()).toBe(false);
    expect(() => groupStub.configure({ groupBy: ['dept'] })).not.toThrow();
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('Feature "grouping"'))).toBe(true);
  });

  it('AC-2/AC-5: built snice-table-core renders, sorts, selects (native checkbox), shows loading/empty/pagination fallbacks, and handles unregistered cells & feature calls cleanly', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Import ONLY the built slim core entry (no optional cells, no optional features, no optional siblings)
    await import('../../dist/components/table/snice-table-core.js');

    expect(customElements.get('snice-table')).toBeDefined();
    expect(customElements.get('snice-cell-text')).toBeDefined();
    // Optional cells & siblings were NOT registered by snice-table-core
    expect(customElements.get('snice-cell-rating')).toBeUndefined();
    expect(customElements.get('snice-checkbox')).toBeUndefined();
    expect(customElements.get('snice-select')).toBeUndefined();
    expect(customElements.get('snice-progress')).toBeUndefined();
    expect(customElements.get('snice-empty-state')).toBeUndefined();

    // 1. Empty state native fallback
    const table = document.createElement('snice-table') as any;
    table.sortable = true;
    table.selectable = true;
    table.pagination = true;
    table.pageSize = 2;
    table.columns = [
      { key: 'name', label: 'Name', type: 'text', sortable: true },
      { key: 'stars', label: 'Stars', type: 'rating' }, // unregistered -> falls back to snice-cell-text
    ];
    table.data = [];
    document.body.appendChild(table);
    await table.ready;
    await new Promise((r) => setTimeout(r, 25));

    expect(table.shadowRoot.querySelector('.table-empty-state-fallback')?.textContent).toContain('No data');

    // 2. Loading native spinner fallback
    table.loading = true;
    await new Promise((r) => setTimeout(r, 25));
    expect(table.shadowRoot.querySelector('.table-loading-spinner-fallback')).toBeTruthy();

    // 3. Populate data -> renders text + unregistered rating fallback + native checkbox + native pagination <select>
    table.loading = false;
    table.data = [
      { name: 'Charlie', stars: 5 },
      { name: 'Alice', stars: 3 },
      { name: 'Bob', stars: 4 },
    ];
    await new Promise((r) => setTimeout(r, 30));

    // Native fallback checkbox works for select-all and row-select
    const selectAll = table.shadowRoot.querySelector('input.select-all') as HTMLInputElement;
    expect(selectAll).toBeTruthy();
    selectAll.checked = true;
    selectAll.dispatchEvent(new Event('change', { bubbles: true }));
    expect(table.selectedRows.length).toBe(3);

    // Native pagination <select> renders and changes pageSize
    const pageSizeSelect = table.shadowRoot.querySelector('select.pagination__size-select') as HTMLSelectElement;
    expect(pageSizeSelect).toBeTruthy();
    pageSizeSelect.value = '10';
    pageSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    expect(table.pageSize).toBe(10);

    // Sorting works in core
    table.toggleSort('name');
    await new Promise((r) => setTimeout(r, 25));
    expect(table.currentSort).toEqual([{ column: 'name', direction: 'asc' }]);

    // Unregistered rating column fell back to snice-cell-text (zero throw + dev warning)
    expect(table.shadowRoot.querySelectorAll('snice-cell-text').length).toBeGreaterThanOrEqual(6);
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('snice-cell-rating'))).toBe(true);

    // Calling unregistered feature API (exportCSV) no-ops cleanly + warns (zero TypeError)
    expect(() => table.exportCSV()).not.toThrow();
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('Feature "export"'))).toBe(true);

    // 4. Declarative <snice-row> also falls back safely to snice-cell-text for unregistered cell types
    const row = document.createElement('snice-row') as any;
    row.columns = [{ key: 'stars', label: 'Stars', type: 'rating' }];
    row.data = { stars: 5 };
    document.body.appendChild(row);
    await row.ready;
    expect(row.shadowRoot.querySelector('snice-cell-text')).toBeTruthy();
  });
});
