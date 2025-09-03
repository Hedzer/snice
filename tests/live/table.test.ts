import { test, expect } from '@playwright/test';

test.describe('Snice Table Component', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming vite dev server is running on port 5173
    await page.goto('http://localhost:5173/components/table/demo.html');
    await page.waitForSelector('snice-table');
  });

  test('renders table with data', async ({ page }) => {
    // Check table exists
    const table = page.locator('snice-table').first().locator('table');
    await expect(table).toBeVisible();
    
    // Check headers are present
    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(8); // 1 checkbox + 7 data columns
    
    // Check specific header text
    await expect(page.locator('th:has-text("Full Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Salary")')).toBeVisible();
    
    // Check data rows exist
    const dataRows = page.locator('tbody tr');
    await expect(dataRows).toHaveCount(5);
    
    // Check specific data is present
    await expect(page.locator('tbody:has-text("John Doe")')).toBeVisible();
    await expect(page.locator('tbody:has-text("jane.smith@example.com")')).toBeVisible();
  });

  test('select all checkbox functionality', async ({ page }) => {
    const selectAllCheckbox = page.locator('thead .select-all');
    const rowCheckboxes = page.locator('tbody .row-select');
    
    // Initially no rows selected
    await expect(selectAllCheckbox).not.toBeChecked();
    await expect(rowCheckboxes.first()).not.toBeChecked();
    
    // Select all rows
    await selectAllCheckbox.click();
    await expect(selectAllCheckbox).toBeChecked();
    
    // All row checkboxes should be checked
    const checkboxCount = await rowCheckboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await expect(rowCheckboxes.nth(i)).toBeChecked();
    }
    
    // Deselect all rows
    await selectAllCheckbox.click();
    await expect(selectAllCheckbox).not.toBeChecked();
    
    // All row checkboxes should be unchecked
    for (let i = 0; i < checkboxCount; i++) {
      await expect(rowCheckboxes.nth(i)).not.toBeChecked();
    }
  });

  test('individual row selection', async ({ page }) => {
    const selectAllCheckbox = page.locator('thead .select-all');
    const firstRowCheckbox = page.locator('tbody .row-select').first();
    const secondRowCheckbox = page.locator('tbody .row-select').nth(1);
    
    // Select first row
    await firstRowCheckbox.click();
    await expect(firstRowCheckbox).toBeChecked();
    
    // Select all should be indeterminate (partially selected)
    const selectAllIndeterminate = await selectAllCheckbox.evaluate((el: HTMLInputElement) => el.indeterminate);
    expect(selectAllIndeterminate).toBe(true);
    
    // Select second row
    await secondRowCheckbox.click();
    await expect(secondRowCheckbox).toBeChecked();
    
    // Deselect first row
    await firstRowCheckbox.click();
    await expect(firstRowCheckbox).not.toBeChecked();
    await expect(secondRowCheckbox).toBeChecked();
  });

  test('sorting functionality', async ({ page }) => {
    const nameHeader = page.locator('th:has-text("Full Name")');
    
    // Click to sort by name
    await nameHeader.click();
    
    // Check first row after sort
    const firstRowAfterSort = page.locator('tbody tr').first();
    await expect(firstRowAfterSort).toContainText('Alice Brown'); // Alphabetically first
    
    // Click again to reverse sort
    await nameHeader.click();
    
    // Check first row after reverse sort
    const firstRowAfterReverse = page.locator('tbody tr').first();
    await expect(firstRowAfterReverse).toContainText('John Doe'); // Alphabetically last
  });

  test('cell components render correctly', async ({ page }) => {
    // Check that cell components are rendered
    const textCells = page.locator('snice-cell-text');
    const textCellCount = await textCells.count();
    expect(textCellCount).toBeGreaterThan(0);
    
    const numberCells = page.locator('snice-cell-number');
    const numberCellCount = await numberCells.count();
    expect(numberCellCount).toBeGreaterThan(0);
    
    const dateCells = page.locator('snice-cell-date');
    const dateCellCount = await dateCells.count();
    expect(dateCellCount).toBeGreaterThan(0);
    
    const booleanCells = page.locator('snice-cell-boolean');
    const booleanCellCount = await booleanCells.count();
    expect(booleanCellCount).toBeGreaterThan(0);
    
    // Check specific formatted content
    const currencyCells = page.locator('snice-cell-number:has-text("$")');
    const currencyCount = await currencyCells.count();
    expect(currencyCount).toBeGreaterThan(0); // Currency formatting
    
    const booleanSymbolCells = page.locator('snice-cell-boolean:has-text("✅")');
    const symbolCount = await booleanSymbolCells.count();
    expect(symbolCount).toBeGreaterThan(0); // Boolean symbols
  });

  test('hover effects work', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    
    // Hover over row
    await firstRow.hover();
    
    // Check row has hover styling
    const backgroundColor = await firstRow.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Should have background color
  });

  test('selected rows have visual indicators', async ({ page }) => {
    const firstRowCheckbox = page.locator('tbody .row-select').first();
    const firstRow = page.locator('tbody tr').first();
    
    // Select first row
    await firstRowCheckbox.click();
    
    // Check row has selected styling
    const borderLeft = await firstRow.evaluate((el) => getComputedStyle(el).borderLeftColor);
    expect(borderLeft).not.toBe('rgba(0, 0, 0, 0)'); // Should have colored border
    
    const dataSelected = await firstRow.getAttribute('data-selected');
    expect(dataSelected).toBe('true');
  });

  test('table responds to theme changes', async ({ page }) => {
    const table = page.locator('snice-table table');
    const header = page.locator('thead th').first();
    const cell = page.locator('tbody td').first();
    
    // Check initial light theme colors
    const initialHeaderBg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    const initialTextColor = await header.evaluate((el) => getComputedStyle(el).color);
    const initialCellText = await cell.evaluate((el) => getComputedStyle(el).color);
    
    // Switch to dark theme using proper theme attribute
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    // Check colors changed appropriately
    const darkHeaderBg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    const darkTextColor = await header.evaluate((el) => getComputedStyle(el).color);
    const darkCellText = await cell.evaluate((el) => getComputedStyle(el).color);
    
    // Verify backgrounds and text colors changed
    expect(darkHeaderBg).not.toBe(initialHeaderBg);
    expect(darkTextColor).not.toBe(initialTextColor);
    expect(darkCellText).not.toBe(initialCellText);
    
    // Verify text is light in dark mode (should contain high RGB values)
    expect(darkTextColor).toMatch(/rgb\(\s*2[0-5]\d\s*,\s*2[0-5]\d\s*,\s*2[0-5]\d\s*\)/);
    expect(darkCellText).toMatch(/rgb\(\s*2[0-5]\d\s*,\s*2[0-5]\d\s*,\s*2[0-5]\d\s*\)/);
  });

  test('events are dispatched correctly', async ({ page }) => {
    let rowSelectionEvents = 0;
    let selectAllEvents = 0;
    
    // Listen for custom events on the table element
    await page.evaluate(() => {
      const table = document.querySelector('snice-table');
      if (table) {
        table.addEventListener('@snice/table/row-selection-changed', () => {
          (window as any).rowSelectionEvents = ((window as any).rowSelectionEvents || 0) + 1;
        });
        table.addEventListener('@snice/table/select-all-changed', () => {
          (window as any).selectAllEvents = ((window as any).selectAllEvents || 0) + 1;
        });
      }
    });
    
    // Select a row
    await page.locator('tbody .row-select').first().click();
    
    // Check event was dispatched
    rowSelectionEvents = await page.evaluate(() => (window as any).rowSelectionEvents || 0);
    expect(rowSelectionEvents).toBe(1);
    
    // Select all
    await page.locator('thead .select-all').click();
    
    // Check select all event was dispatched
    selectAllEvents = await page.evaluate(() => (window as any).selectAllEvents || 0);
    expect(selectAllEvents).toBe(1);
  });
});