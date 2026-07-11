import { expect, test } from '@playwright/test';

const showcaseUrl = 'http://127.0.0.1:5566/components/table/full-showcase.html';

test.describe('snice-table grouping and aggregation', () => {
  test.beforeEach(async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(showcaseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return table?.shadowRoot?.querySelectorAll('tr.group-header-row').length === 3;
    });
    expect(pageErrors).toEqual([]);
  });

  test('real chevron/label clicks toggle once and group selection uses the real checkbox', async ({ page }) => {
    await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      (window as any).__groupEvents = [];
      table.addEventListener('group-toggle', (event: CustomEvent) => {
        (window as any).__groupEvents.push({
          detail: event.detail,
          targetIsHost: event.target === table,
        });
      });
      const headers = Array.from(table.shadowRoot.querySelectorAll('tr.group-header-row')) as HTMLElement[];
      const engineering = headers.find((header) =>
        header.querySelector('.group-header-label')?.textContent === 'Engineering'
      )!;
      (engineering.querySelector('.tree-toggle') as HTMLButtonElement).click();
    });

    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 4;
    });
    const collapsed = await page.evaluate(() => (window as any).__groupEvents);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]).toMatchObject({
      detail: { value: 'Engineering', expanded: false },
      targetIsHost: true,
    });

    await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      const headers = Array.from(table.shadowRoot.querySelectorAll('tr.group-header-row')) as HTMLElement[];
      const engineering = headers.find((header) =>
        header.querySelector('.group-header-label')?.textContent === 'Engineering'
      )!;
      (engineering.querySelector('.group-header-label') as HTMLElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 7;
    });
    expect(await page.evaluate(() => (window as any).__groupEvents.length)).toBe(2);

    // After grid navigation has left an internal focus position behind, native
    // button Enter/Space must still click the group chevron (the root keyboard
    // delegate must not prevent them).
    await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      table.keyboard?.setFocus?.(0, 0);
      const headers = Array.from(table.shadowRoot.querySelectorAll('tr.group-header-row')) as HTMLElement[];
      const engineering = headers.find((header) =>
        header.querySelector('.group-header-label')?.textContent === 'Engineering'
      )!;
      (engineering.querySelector('.tree-toggle') as HTMLButtonElement).focus();
    });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 4;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      const headers = Array.from(table.shadowRoot.querySelectorAll('tr.group-header-row')) as HTMLElement[];
      const engineering = headers.find((header) =>
        header.querySelector('.group-header-label')?.textContent === 'Engineering'
      )!;
      (engineering.querySelector('.tree-toggle') as HTMLButtonElement).focus();
    });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 7;
    });
    expect(await page.evaluate(() => (window as any).__groupEvents.length)).toBe(4);

    await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      const headers = Array.from(table.shadowRoot.querySelectorAll('tr.group-header-row')) as HTMLElement[];
      const engineering = headers.find((header) =>
        header.querySelector('.group-header-label')?.textContent === 'Engineering'
      )!;
      const checkbox = engineering.querySelector('snice-checkbox.group-select') as any;
      (checkbox.shadowRoot.querySelector('input') as HTMLInputElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return JSON.stringify([...table.selectedRows].sort((a, b) => a - b)) === '[0,1,2]';
    });
  });

  test('totals use the number formatter and remain readable/focusable in light and dark themes', async ({ page }) => {
    const total = await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      const cell = table.shadowRoot.querySelector(
        'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]'
      );
      const number = cell.querySelector('snice-cell-number');
      return {
        raw: cell.getAttribute('data-agg-value'),
        formatted: number.shadowRoot.querySelector('.cell-content')?.textContent?.trim(),
        label: table.shadowRoot.querySelector(
          'tr.group-aggregate-row[data-agg-scope="table"] .aggregate-label'
        )?.textContent,
      };
    });
    expect(total).toEqual({ raw: '816000', formatted: '$816,000', label: 'Total' });

    for (const theme of ['light', 'dark']) {
      const colors = await page.evaluate((activeTheme) => {
        document.documentElement.setAttribute('data-theme', activeTheme);
        const table = document.querySelector('#grouping-demo') as any;
        const row = table.shadowRoot.querySelector('tr.group-header-row') as HTMLElement;
        const cell = row.querySelector('.group-header-cell') as HTMLElement;
        const button = row.querySelector('.tree-toggle') as HTMLButtonElement;
        button.focus();
        return {
          background: getComputedStyle(row).backgroundColor,
          color: getComputedStyle(cell).color,
          outline: getComputedStyle(button).outlineStyle,
        };
      }, theme);
      expect(colors.background).not.toBe('rgba(0, 0, 0, 0)');
      expect(colors.color).not.toBe('rgba(0, 0, 0, 0)');
      expect(colors.outline).not.toBe('none');
    }
  });

  test('pre-connect grouping and grouped virtual keyboard navigation work in Chromium', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const table = document.createElement('snice-table') as any;
      table.style.height = '20rem';
      table.virtualize = true;
      table.rowHeight = 40;
      table.groupBy = 'department';
      table.columns = [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'department', label: 'Department', type: 'text' },
      ];
      table.data = [
        { name: 'Last by grouped order', department: 'Z' },
        ...Array.from({ length: 80 }, (_, index) => ({ name: `A ${index}`, department: 'A' })),
      ];
      document.body.appendChild(table);
      await table.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const initialGroups = table.shadowRoot.querySelectorAll('tr.group-header-row').length;
      const grid = table.shadowRoot.querySelector('table');
      grid.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'End', ctrlKey: true, bubbles: true, composed: true,
      }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const focused = table.shadowRoot.querySelector('[data-grid-focus]')?.closest('tr');
      const result = { initialGroups, focusedDataIndex: focused?.getAttribute('data-index') };
      table.remove();
      return result;
    });

    expect(result).toEqual({ initialGroups: 1, focusedDataIndex: '0' });
  });
});
