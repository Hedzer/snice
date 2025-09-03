import { beforeEach, describe, it, expect } from 'vitest';
import '../../components/theme/theme.css'; // Import theme CSS first
import '../../components/table/snice-table';
import '../../components/table/snice-column';
import '../../components/table/snice-row';
import '../../components/table/snice-cell';
import '../../components/table/snice-cell-text';
import '../../components/table/snice-cell-number';

describe('Snice Table Components', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should render table with columns and display cell values', async () => {
    // Create table programmatically to avoid data-* attribute issues in happy-dom
    const table = document.createElement('snice-table') as any;
    table.id = 'test-table';
    
    // Create columns
    const nameCol = document.createElement('snice-column') as any;
    nameCol.setAttribute('key', 'name');
    nameCol.setAttribute('label', 'Name');
    nameCol.setAttribute('type', 'text');
    
    const ageCol = document.createElement('snice-column') as any;
    ageCol.setAttribute('key', 'age');
    ageCol.setAttribute('label', 'Age');
    ageCol.setAttribute('type', 'number');
    
    const emailCol = document.createElement('snice-column') as any;
    emailCol.setAttribute('key', 'email');
    emailCol.setAttribute('label', 'Email');
    emailCol.setAttribute('type', 'text');
    
    // Create rows and set data programmatically
    const row1 = document.createElement('snice-row') as any;
    row1.setAttribute('slot', 'rows');
    row1.data = { name: 'John Doe', age: '30', email: 'john@example.com' };
    
    const row2 = document.createElement('snice-row') as any;
    row2.setAttribute('slot', 'rows');
    row2.data = { name: 'Jane Smith', age: '25', email: 'jane@example.com' };
    
    // Assemble the table
    table.appendChild(nameCol);
    table.appendChild(ageCol);
    table.appendChild(emailCol);
    table.appendChild(row1);
    table.appendChild(row2);
    
    container.appendChild(table);

    // Wait for table to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if columns were detected
    expect(table.columns).toBeDefined();
    expect(table.columns.length).toBe(3);
    expect(table.columns[0].key).toBe('name');
    expect(table.columns[1].key).toBe('age');
    expect(table.columns[2].key).toBe('email');

    // Check if rows exist in either light or shadow DOM using @queryAll
    expect(table.rowElements).toBeTruthy();
    expect(table.rowElements?.length).toBe(2);
    
    // Measure table dimensions
    console.log('Table size:', table.getBoundingClientRect());
    console.log('Table offsetHeight:', table.offsetHeight);
    console.log('Table offsetWidth:', table.offsetWidth);
    
    // Check if CSS is being applied
    const computedStyle = window.getComputedStyle(table);
    console.log('Table display:', computedStyle.display);
    console.log('Table width:', computedStyle.width);
    console.log('Table height:', computedStyle.height);
    console.log('Table background:', computedStyle.background);
    
    // Check shadow root and container
    const shadowRoot = table.shadowRoot;
    console.log('Has shadow root:', !!shadowRoot);
    if (shadowRoot) {
      const container = shadowRoot.querySelector('.table-container');
      console.log('Has container:', !!container);
      if (container) {
        const containerStyle = window.getComputedStyle(container);
        console.log('Container display:', containerStyle.display);
        console.log('Container width:', containerStyle.width);
        console.log('Container height:', containerStyle.height);
      }
    }

    // Check if row data is accessible
    const firstRow = table.rowElements?.[0] as any;
    expect(firstRow.data).toBeDefined();
    expect(firstRow.data.name).toBe('John Doe');
    expect(firstRow.data.age).toBe('30');
    expect(firstRow.data.email).toBe('john@example.com');
    
    // Measure first row dimensions
    console.log('First row size:', firstRow.getBoundingClientRect());
    console.log('First row offsetHeight:', firstRow.offsetHeight);
    console.log('First row offsetWidth:', firstRow.offsetWidth);

    // Wait for cell configuration
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check if cells are rendered and have values
    const firstRowCells = firstRow?.shadowRoot?.querySelectorAll('[data-column-index]');
    expect(firstRowCells).toBeTruthy();
    expect(firstRowCells?.length).toBe(3);

    // Check if cell values are set
    const nameCell = firstRow?.shadowRoot?.querySelector('[data-column-index="0"]') as any;
    const ageCell = firstRow?.shadowRoot?.querySelector('[data-column-index="1"]') as any;
    const emailCell = firstRow?.shadowRoot?.querySelector('[data-column-index="2"]') as any;

    expect(nameCell).toBeTruthy();
    expect(ageCell).toBeTruthy();
    expect(emailCell).toBeTruthy();

    console.log('Name cell value:', nameCell?.value);
    console.log('Age cell value:', ageCell?.value);
    console.log('Email cell value:', emailCell?.value);

    expect(nameCell.value).toBe('John Doe');
    expect(ageCell.value).toBe('30');
    expect(emailCell.value).toBe('john@example.com');
    
    // Measure cell dimensions
    console.log('Name cell size:', nameCell?.getBoundingClientRect());
    console.log('Name cell offsetHeight:', nameCell?.offsetHeight);
    console.log('Age cell size:', ageCell?.getBoundingClientRect());
    console.log('Email cell size:', emailCell?.getBoundingClientRect());
  });

  it('should render cells with proper content', async () => {
    const table = document.createElement('snice-table') as any;
    
    const nameCol = document.createElement('snice-column') as any;
    nameCol.setAttribute('key', 'name');
    nameCol.setAttribute('label', 'Name');
    nameCol.setAttribute('type', 'text');
    
    const row = document.createElement('snice-row') as any;
    row.setAttribute('slot', 'rows');
    row.data = { name: 'Test User' };
    
    table.appendChild(nameCol);
    table.appendChild(row);
    container.appendChild(table);

    await new Promise(resolve => setTimeout(resolve, 100));

    const firstRow = table.rowElements?.[0] as any;
    expect(firstRow).toBeTruthy();
    
    // Measure second test table and row dimensions
    console.log('Second test - Table size:', table.getBoundingClientRect());
    console.log('Second test - Table offsetHeight:', table.offsetHeight);
    console.log('Second test - Row size:', firstRow?.getBoundingClientRect());
    console.log('Second test - Row offsetHeight:', firstRow?.offsetHeight);
    
    await new Promise(resolve => setTimeout(resolve, 50));

    const cell = firstRow?.shadowRoot?.querySelector('[data-column-index="0"]') as any;
    expect(cell).toBeTruthy();
    expect(cell.value).toBe('Test User');

    // Check if cell actually displays the content
    const cellContent = cell?.shadowRoot?.querySelector('.cell-content');
    expect(cellContent).toBeTruthy();
    expect(cellContent?.textContent?.trim()).toBe('Test User');
    
    // Measure content element dimensions
    console.log('Second test - Cell size:', cell?.getBoundingClientRect());
    console.log('Second test - Cell offsetHeight:', cell?.offsetHeight);
    console.log('Second test - Cell content size:', cellContent?.getBoundingClientRect());
    console.log('Second test - Cell content offsetHeight:', (cellContent as any)?.offsetHeight);
  });
});