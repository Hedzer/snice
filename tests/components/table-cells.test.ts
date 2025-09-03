import { beforeEach, describe, it, expect } from 'vitest';
import '../../components/theme/theme.css';
import '../../components/table/snice-cell-text';
import '../../components/table/snice-cell-number';
import '../../components/table/snice-cell-date';
import '../../components/table/snice-row';

describe('Snice Table Cell Components', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render text cell with value', async () => {
    const cell = document.createElement('snice-cell-text') as any;
    cell.value = 'Hello World';
    container.appendChild(cell);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(cell.shadowRoot).toBeTruthy();
    const content = cell.shadowRoot?.querySelector('.cell-content');
    expect(content).toBeTruthy();
    expect(content?.textContent?.trim()).toBe('Hello World');
  });

  it('should render number cell with formatted value', async () => {
    const cell = document.createElement('snice-cell-number') as any;
    cell.value = 1234.56;
    cell.decimals = 2;
    cell.thousandsSeparator = true;
    container.appendChild(cell);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(cell.shadowRoot).toBeTruthy();
    const content = cell.shadowRoot?.querySelector('.cell-content');
    expect(content).toBeTruthy();
    expect(content?.textContent?.trim()).toBe('1,234.56');
  });

  it('should render date cell with formatted date', async () => {
    const cell = document.createElement('snice-cell-date') as any;
    cell.value = '2023-12-25';
    container.appendChild(cell);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(cell.shadowRoot).toBeTruthy();
    const content = cell.shadowRoot?.querySelector('.cell-content');
    expect(content).toBeTruthy();
    // Date format might vary, just check it's not empty
    expect(content?.textContent?.trim()).toBeTruthy();
  });

  it('should render row with cells based on column types', async () => {
    const row = document.createElement('snice-row') as any;
    row.data = { name: 'John', age: 30, date: '2023-01-01' };
    row.columns = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'age', label: 'Age', type: 'number' },
      { key: 'date', label: 'Date', type: 'date' }
    ];
    container.appendChild(row);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(row.shadowRoot).toBeTruthy();
    const cellsContainer = row.shadowRoot?.querySelector('.cells-container');
    expect(cellsContainer).toBeTruthy();
    
    // Check that different cell types are created
    const textCell = row.shadowRoot?.querySelector('snice-cell-text');
    const numberCell = row.shadowRoot?.querySelector('snice-cell-number');
    const dateCell = row.shadowRoot?.querySelector('snice-cell-date');
    
    expect(textCell).toBeTruthy();
    expect(numberCell).toBeTruthy();
    expect(dateCell).toBeTruthy();
  });
});