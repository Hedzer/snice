import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createComponent, removeComponent } from './test-utils';
import '../../components/table/snice-table';
import type { SniceTableElement } from '../../components/table/snice-table.types';

describe('Table Attribute Reflection', () => {
  let table: SniceTableElement;

  beforeEach(async () => {
    table = await createComponent<SniceTableElement>('snice-table');
  });

  afterEach(() => {
    if (table) {
      removeComponent(table);
    }
  });

  it('should not reflect data property to attribute', async () => {
    const testData = [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Test Item 2' }
    ];

    table.data = testData;
    await new Promise(resolve => setTimeout(resolve, 100));

    // data should NOT appear as an attribute
    expect(table.hasAttribute('data')).toBe(false);

    // But the property should still be accessible
    expect(table.data).toEqual(testData);
  });

  it('should not reflect columns property to attribute', async () => {
    const testColumns = [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'name', label: 'Name', type: 'text' }
    ];

    table.columns = testColumns;
    await new Promise(resolve => setTimeout(resolve, 100));

    // columns should NOT appear as an attribute
    expect(table.hasAttribute('columns')).toBe(false);

    // But the property should still be accessible
    expect(table.columns).toEqual(testColumns);
  });

  it('should have clean HTML output without data/columns attributes', async () => {
    table.data = [{ id: 1 }];
    table.columns = [{ key: 'id', label: 'ID' }];
    await new Promise(resolve => setTimeout(resolve, 100));

    const outerHTML = table.outerHTML;

    // Should not contain stringified data/columns in attributes
    expect(outerHTML).not.toContain('data="');
    expect(outerHTML).not.toContain('columns="');
    expect(outerHTML).not.toContain('&quot;');
  });
});
