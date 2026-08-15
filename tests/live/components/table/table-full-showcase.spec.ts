import { expect, test } from '@playwright/test';

const showcaseUrl = process.env.TABLE_SHOWCASE_URL
  || '/components/table/full-showcase.html';

test.describe('table full showcase', () => {
  let runtimeErrors: string[];

  test.beforeEach(async ({ page }) => {
    runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text());
    });

    await page.goto(showcaseUrl);
    await page.waitForFunction(() => {
      const remote = document.querySelector('#remote-demo') as any;
      const virtual = document.querySelector('#virtual-demo') as any;
      return remote?.data?.length === 5
        && virtual?.shadowRoot?.querySelectorAll('tbody tr[data-index]').length > 0;
    });
    expect(runtimeErrors).toEqual([]);
  });

  test.afterEach(() => {
    expect(runtimeErrors).toEqual([]);
  });

  test('renders every section, rich cell, density, slot, and data state', async ({ page }) => {
    const snapshot = await page.evaluate(() => {
      const tableIds = [
        'pro-table', 'editing-demo', 'virtual-demo', 'detail-demo', 'tree-demo',
        'grouping-demo', 'groups-demo', 'pin-demo', 'fit-squish', 'fit-scroll',
        'dnd-demo', 'pin-row-demo',
        'paginated', 'remote-demo', 'super-header', 'density-compact',
        'density-comfy', 'list-mode', 'loading', 'empty',
      ];
      const table = (id: string) => document.querySelector(`#${id}`) as any;
      const numberText = (id: string, key: string) => {
        const cell = table(id).shadowRoot.querySelector(
          `tbody tr[data-index] td[data-key="${key}"] snice-cell-number`
        ) as any;
        return cell?.shadowRoot?.querySelector('.cell-content')?.textContent?.trim();
      };
      const standaloneCurrency = document.querySelector('#cell-type-grid snice-cell-currency') as any;
      const standaloneProgress = document.querySelector('#cell-type-grid snice-cell-progress') as any;
      const standaloneLocation = document.querySelector('#cell-type-grid snice-cell-location') as any;
      return {
        headings: Array.from(document.querySelectorAll('h2')).map((heading) => heading.textContent?.trim()),
        cellCards: document.querySelectorAll('#cell-type-grid > div').length,
        cellLabels: Array.from(document.querySelectorAll('#cell-type-grid > div > div:first-child'))
          .map((label) => label.textContent?.trim()),
        tableIds: tableIds.filter((id) => table(id)?.shadowRoot?.querySelector('table')),
        customPills: table('editing-demo').shadowRoot.querySelectorAll('.custom-cell, td[data-key="status"] span').length,
        loading: !!table('loading').shadowRoot.querySelector('snice-progress'),
        empty: table('empty').shadowRoot.querySelector('.no-data')?.textContent?.trim(),
        pinned: (table('pin-row-demo').shadowRoot.querySelector(
          '.pinned-row--top [in-table]'
        ) as HTMLElement | null)?.getAttribute('value'),
        superHeader: table('super-header').querySelector('[slot="header"]')?.textContent,
        compact: table('density-compact').density,
        comfortable: table('density-comfy').density,
        // Half-width cards: the columns share the card instead of scrolling.
        columnFit: {
          squish: table('fit-squish').columnFit,
          scroll: table('fit-scroll').columnFit,
          density: table('density-compact').columnFit,
          squishOverflows: (() => {
            const frame = table('fit-squish').shadowRoot.querySelector('.table-frame');
            return frame.scrollWidth > frame.clientWidth;
          })(),
          scrollOverflows: (() => {
            const frame = table('fit-scroll').shadowRoot.querySelector('.table-frame');
            return frame.scrollWidth > frame.clientWidth;
          })(),
        },
        list: table('list-mode').list,
        toolbarControls: {
          sort: !!table('pro-table').shadowRoot.querySelector('.toolbar-sort'),
          filter: !!table('pro-table').shadowRoot.querySelector('.toolbar-filter'),
        },
        listView: {
          rows: table('list-mode').shadowRoot.querySelectorAll('.list-view-cell').length,
          dataCells: table('list-mode').shadowRoot.querySelectorAll('td[data-key]').length,
        },
        densityPadding: {
          compact: getComputedStyle(table('density-compact').shadowRoot.querySelector('tbody td')).paddingTop,
          comfortable: getComputedStyle(table('density-comfy').shadowRoot.querySelector('tbody td')).paddingTop,
        },
        listBorder: getComputedStyle(table('list-mode').shadowRoot.querySelector('tbody td')).borderRightWidth,
        remoteTotal: table('remote-demo').totalItems,
        standaloneBehavior: {
          progressPercentage: standaloneProgress.shadowRoot.querySelector('snice-table-progress')?.showPercentage,
          locationHasLink: !!standaloneLocation.shadowRoot.querySelector('a'),
          locationShowMapLink: standaloneLocation.showMapLink,
        },
        currencyText: {
          standalone: standaloneCurrency.shadowRoot.querySelector('.cell-content')?.textContent?.trim(),
          virtual: numberText('virtual-demo', 'revenue'),
          remote: numberText('remote-demo', 'arr'),
        },
      };
    });

    expect(snapshot.headings).toEqual(expect.arrayContaining([
      'Rich Cell Types',
      'Inline Editing + Custom Renderers',
      'Virtualization + Lazy Loading',
      'Row Grouping + Aggregation',
      'Remote Data + Server Pagination',
      'Loading + Empty States',
    ]));
    expect(snapshot.cellCards).toBe(24);
    expect(snapshot.cellLabels).toEqual([
      'Text', 'Number', 'Currency', 'Accounting', 'Scientific', 'Fraction',
      'Percentage', 'Date', 'Boolean', 'Rating', 'Progress', 'Sparkline',
      'Duration', 'File Size', 'Tags', 'Status', 'Email', 'Phone', 'Link',
      'Color', 'Image', 'JSON', 'Location', 'Actions',
    ]);
    expect(snapshot.tableIds).toHaveLength(20);
    expect(snapshot.customPills).toBeGreaterThan(0);
    expect(snapshot.loading).toBe(true);
    expect(snapshot.empty).toContain('No employees match this view.');
    expect(snapshot.pinned).toContain('Team Lead');
    expect(snapshot.superHeader).toContain('Employee Directory');
    expect(snapshot.compact).toBe('compact');
    expect(snapshot.comfortable).toBe('comfortable');
    expect(snapshot.columnFit.squish).toBe('squish');
    expect(snapshot.columnFit.scroll).toBe('scroll');
    expect(snapshot.columnFit.density).toBe('squish');
    expect(snapshot.columnFit.squishOverflows).toBe(false);
    // The same columns in the same card: the default policy is what squish
    // opted out of, so the contrast the section demonstrates is real.
    expect(snapshot.columnFit.scrollOverflows).toBe(true);
    expect(snapshot.list).toBe(true);
    expect(snapshot.toolbarControls).toEqual({ sort: true, filter: true });
    expect(snapshot.listView).toEqual({ rows: 12, dataCells: 0 });
    expect(parseFloat(snapshot.densityPadding.comfortable)).toBeGreaterThan(
      parseFloat(snapshot.densityPadding.compact)
    );
    expect(snapshot.listBorder).toBe('0px');
    expect(snapshot.remoteTotal).toBe(42);
    expect(snapshot.standaloneBehavior).toEqual({
      progressPercentage: true,
      locationHasLink: false,
      locationShowMapLink: false,
    });
    expect(snapshot.currencyText).toEqual({
      standalone: '$95,000',
      virtual: '$1,200',
      remote: '$12,000',
    });

    await page.evaluate(() => {
      const cell = document.querySelector('#cell-type-grid snice-cell-actions') as any;
      (cell.shadowRoot.querySelector('button') as HTMLButtonElement).click();
    });
    await expect(page.locator('#cell-action-status')).toContainText('inspect · Alice Johnson · Actions');

    await page.evaluate(() => {
      const json = document.querySelector('#cell-type-grid snice-cell-json') as any;
      (json.shadowRoot.querySelector('.json-toggle') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => (document.querySelector('#cell-type-grid snice-cell-json') as any).collapsed === false);
  });

  test('pro grid search, sorting, filter panel, selection modes, and actions work', async ({ page }) => {
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.toolbar-sort') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      const panel = table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement;
      return panel && !panel.hidden
        && panel.querySelector('.tt-filter-empty')?.textContent?.includes('No sorting applied')
        && panel.querySelector('.tt-filter-add');
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.tt-sort-panel .tt-filter-add') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      const panel = table.shadowRoot.querySelector('.tt-sort-panel') as HTMLElement;
      return table.currentSort.length === 1
        && panel.querySelectorAll('.tt-sort-row snice-select').length === 2;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.tt-sort-panel .tt-filter-clear') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.currentSort.length === 0;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.toolbar-sort') as HTMLButtonElement).click();
      (table.shadowRoot.querySelector('.toolbar-filter') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      const panel = table.shadowRoot.querySelector('.tt-filter-panel') as HTMLElement;
      return panel && !panel.hidden;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.tt-filter-corner-close') as HTMLButtonElement).click();
    });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const search = table.shadowRoot.querySelector('snice-input.toolbar-search') as any;
      search.value = 'Alice';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 1;
    });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const search = table.shadowRoot.querySelector('snice-input.toolbar-search') as any;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 12;
    });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement).click();
      (table.shadowRoot.querySelector('th[data-key="age"]') as HTMLElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.currentSort.map((sort: any) => sort.column).join(',') === 'name,age';
    });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const input = table.shadowRoot.querySelector('.header-filter-row snice-input[data-column="name"]') as any;
      input.value = 'Diana';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      const rows = table.shadowRoot.querySelectorAll('tbody tr[data-index]');
      return rows.length === 1 && table.data[Number(rows[0].getAttribute('data-index'))]?.name === 'Diana Prince';
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const input = table.shadowRoot.querySelector('.header-filter-row snice-input[data-column="name"]') as any;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 12;
    });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const header = table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement;
      const rect = header.getBoundingClientRect();
      header.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, composed: true, cancelable: true,
        clientX: rect.left + 8, clientY: rect.top + 8,
      }));
      const filter = Array.from(table.shadowRoot.querySelectorAll('.column-menu-item'))
        .find((item) => item.textContent?.includes('Filter')) as HTMLButtonElement;
      filter.click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      const panel = table.shadowRoot.querySelector('.tt-filter-panel') as HTMLElement;
      return panel && !panel.hidden && panel.querySelectorAll('.tt-filter-row').length > 0;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const value = table.shadowRoot.querySelector('.tt-filter-val-wrap snice-input') as any;
      value.value = 'Alice';
      value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 1;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      (table.shadowRoot.querySelector('.tt-filter-clear') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length === 12;
    });

    await page.locator('[data-selection-mode="none"]').click();
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.selectionMode === 'none' && !table.shadowRoot.querySelector('.select-column');
    });
    const noneCursor = await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      return getComputedStyle(table.shadowRoot.querySelector('tbody tr[data-index]')).cursor;
    });
    expect(noneCursor).not.toBe('pointer');

    await page.locator('[data-selection-mode="single"]').click();
    await page.waitForFunction(() => {
      const table = document.querySelector('#pro-table') as any;
      return table.selectionMode === 'single'
        && !table.shadowRoot.querySelector('snice-checkbox.select-all')
        && table.shadowRoot.querySelectorAll('snice-checkbox.row-select').length === 12;
    });

    await page.locator('[data-selection-mode="multiple"]').click();
    const locked = await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const checkbox = table.shadowRoot.querySelector('tr[data-index="11"] snice-checkbox.row-select') as any;
      return { host: checkbox.disabled, input: checkbox.shadowRoot.querySelector('input').disabled };
    });
    expect(locked).toEqual({ host: true, input: true });

    const selected = await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const first = table.shadowRoot.querySelector('tr[data-index="0"] snice-checkbox.row-select') as any;
      first.checked = true;
      first.dispatchEvent(new Event('change', { bubbles: true }));
      const all = table.shadowRoot.querySelector('snice-checkbox.select-all') as any;
      all.checked = true;
      all.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        count: table.selectedRows.length,
        containsLocked: table.selectedRows.some((index: number) => table.data[index].canSelect === false),
      };
    });
    expect(selected).toEqual({ count: 11, containsLocked: false });

    await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const action = table.shadowRoot.querySelector('tbody snice-cell-actions') as any;
      (action.shadowRoot.querySelector('button') as HTMLButtonElement).click();
    });
    await expect(page.locator('#selection-status')).toContainText('inspect:');

    const download = page.waitForEvent('download');
    await page.locator('#pro-table button[aria-label="Export CSV"]').click();
    expect((await download).suggestedFilename()).toBe('export.csv');

    await page.locator('#pro-table button[aria-label="Fullscreen"]').click();
    await page.waitForFunction(() => document.querySelector('#pro-table')?.classList.contains('table-fullscreen'));
    await page.evaluate(async () => {
      const table = document.querySelector('#pro-table') as any;
      await table.toggleFullscreen();
    });
    await page.waitForFunction(() => !document.querySelector('#pro-table')?.classList.contains('table-fullscreen'));

    const resize = await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const before = table.columnManager.getState('name').width;
      const handle = table.shadowRoot.querySelector('th[data-key="name"] .resize-handle') as HTMLElement;
      handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100 }));
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 145 }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 145 }));
      return { before, after: table.columnManager.getState('name').width };
    });
    expect(resize.after - resize.before).toBe(45);

    const keyboard = await page.evaluate(() => {
      const table = document.querySelector('#pro-table') as any;
      const grid = table.shadowRoot.querySelector('table') as HTMLElement;
      grid.focus();
      grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
      const focused = table.shadowRoot.querySelector('[data-grid-focus]') as HTMLElement;
      return {
        role: grid.getAttribute('role'),
        rowCount: grid.getAttribute('aria-rowcount'),
        focusedRole: focused?.getAttribute('role'),
        tabindex: focused?.getAttribute('tabindex'),
      };
    });
    expect(keyboard).toEqual({ role: 'grid', rowCount: '13', focusedRole: 'gridcell', tabindex: '0' });
  });

  test('cell, select, custom, and full-row editing commit real data', async ({ page }) => {
    await page.locator('#edit-name').click();
    await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const input = table.shadowRoot.querySelector('tr[data-index="0"] td[data-key="name"] input') as HTMLInputElement;
      input.value = 'Alicia Johnson';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.blur();
    });
    await page.waitForFunction(() => (document.querySelector('#editing-demo') as any).data[0].name === 'Alicia Johnson');

    await page.locator('#edit-role').click();
    const options = await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const select = table.shadowRoot.querySelector('tr[data-index="0"] td[data-key="role"] select') as HTMLSelectElement;
      return Array.from(select.options).map((option) => option.value);
    });
    expect(options).toEqual(['Engineer', 'Designer', 'Manager']);
    await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const select = table.shadowRoot.querySelector('tr[data-index="0"] td[data-key="role"] select') as HTMLSelectElement;
      select.value = 'Manager';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.waitForFunction(() => (document.querySelector('#editing-demo') as any).data[0].role === 'Manager');

    await page.locator('#edit-status').click();
    await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const select = table.shadowRoot.querySelector('tr[data-index="0"] td[data-key="status"] select') as HTMLSelectElement;
      select.value = 'On leave';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => (document.querySelector('#editing-demo') as any).data[0].status === 'On leave');

    await page.locator('#edit-name').click();
    await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const input = table.shadowRoot.querySelector('tr[data-index="0"] td[data-key="name"] input') as HTMLInputElement;
      input.value = 'Canceled value';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await expect(page.locator('#edit-status-text')).toContainText('Cell edit canceled');
    expect(await page.evaluate(() => (document.querySelector('#editing-demo') as any).data[0].name)).toBe('Alicia Johnson');

    await page.locator('#edit-row').click();
    const editorTypes = await page.evaluate(() => {
      const table = document.querySelector('#editing-demo') as any;
      const row = table.shadowRoot.querySelector('tr[data-index="1"]');
      const input = (key: string) => row.querySelector(`td[data-key="${key}"] input`) as HTMLInputElement;
      const name = input('name');
      const startDate = input('startDate');
      const salary = input('salary');
      const active = input('active');
      name.value = 'Diana Trevor';
      startDate.value = '2024-01-19';
      salary.value = '123456';
      active.checked = false;
      for (const editor of [name, startDate, salary, active]) {
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        name: name.type,
        role: (row.querySelector('td[data-key="role"] select') as HTMLSelectElement)?.tagName,
        date: startDate.type,
        salary: salary.type,
        active: active.type,
        customReadOnly: !row.querySelector('td[data-key="status"] select'),
      };
    });
    expect(editorTypes).toEqual({
      name: 'text', role: 'SELECT', date: 'date', salary: 'number', active: 'checkbox', customReadOnly: true,
    });
    await page.locator('#save-edit').click();
    await page.waitForFunction(() => (document.querySelector('#editing-demo') as any).data[1].name === 'Diana Trevor');
    await expect(page.locator('#edit-status-text')).toContainText('Saved Diana Trevor');
    const editedRow = await page.evaluate(() => (document.querySelector('#editing-demo') as any).data[1]);
    expect(editedRow).toMatchObject({
      name: 'Diana Trevor', startDate: '2024-01-19', salary: 123456, active: false,
    });
  });

  test('virtualization windows rows and lazy loading appends a batch', async ({ page }) => {
    const initial = await page.evaluate(() => {
      const table = document.querySelector('#virtual-demo') as any;
      return {
        data: table.data.length,
        mounted: table.shadowRoot.querySelectorAll('tbody tr[data-index]').length,
        top: table.getScrollPosition().top,
      };
    });
    expect(initial.data).toBe(1200);
    expect(initial.mounted).toBeGreaterThan(0);
    expect(initial.mounted).toBeLessThan(100);
    expect(initial.top).toBe(0);

    await page.locator('#jump-virtual').click();
    await page.waitForFunction(() => (document.querySelector('#virtual-demo') as any).getScrollPosition().top > 0);

    await page.evaluate(() => {
      const table = document.querySelector('#virtual-demo') as any;
      const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
      frame.scrollTop = frame.scrollHeight;
      frame.dispatchEvent(new Event('scroll'));
    });
    await page.waitForFunction(() => (document.querySelector('#virtual-demo') as any).data.length === 1600);

    const after = await page.evaluate(() => {
      const table = document.querySelector('#virtual-demo') as any;
      return {
        data: table.data.length,
        mounted: table.shadowRoot.querySelectorAll('tbody tr[data-index]').length,
      };
    });
    expect(after).toMatchObject({ data: 1600 });
    expect(after.mounted).toBeLessThan(100);
  });

  test('detail, tree, grouping, and column groups are interactive', async ({ page }) => {
    await page.evaluate(() => {
      const table = document.querySelector('#detail-demo') as any;
      (table.shadowRoot.querySelector('.detail-toggle') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => !!(document.querySelector('#detail-demo') as any).shadowRoot.querySelector('.detail-row'));
    await expect(page.locator('#detail-demo')).toBeAttached();

    const treeBefore = await page.evaluate(() => {
      const table = document.querySelector('#tree-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length;
    });
    await page.evaluate(() => {
      const table = document.querySelector('#tree-demo') as any;
      (table.shadowRoot.querySelector('.tree-toggle') as HTMLButtonElement).click();
    });
    await page.waitForFunction((before) => {
      const table = document.querySelector('#tree-demo') as any;
      return table.shadowRoot.querySelectorAll('tbody tr[data-index]').length < before;
    }, treeBefore);

    await page.locator('#group-nested').click();
    await page.waitForFunction(() => {
      const table = document.querySelector('#grouping-demo') as any;
      return Array.isArray(table.groupBy)
        && table.groupBy.length === 2
        && table.shadowRoot.querySelectorAll('tr.group-header-row').length > 3;
    });
    const engineeringGroup = page.locator('#grouping-demo .group-header-row')
      .filter({ hasText: 'Engineering' }).first();
    await engineeringGroup.hover();
    const darkHover = await engineeringGroup.evaluate((row) => getComputedStyle(row).backgroundColor);
    const darkChannels = darkHover.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) || [];
    expect(Math.max(...darkChannels)).toBeLessThan(160);

    const grouping = await page.evaluate(() => {
      const table = document.querySelector('#grouping-demo') as any;
      const salary = table.shadowRoot.querySelector(
        'tr.group-aggregate-row[data-agg-scope="table"] td[data-key="salary"]'
      );
      return {
        total: salary?.getAttribute('data-agg-value'),
        bonusRows: table.shadowRoot.querySelectorAll('td[data-key="bonus"]').length,
      };
    });
    expect(grouping.total).toBe('816000');
    expect(grouping.bonusRows).toBeGreaterThan(0);

    const groupHeaders = await page.evaluate(() => {
      const table = document.querySelector('#groups-demo') as any;
      return Array.from(table.shadowRoot.querySelectorAll('.column-group-header'))
        .map((header: Element) => header.textContent?.trim());
    });
    expect(groupHeaders).toEqual(['Personal Info', 'Work Info']);
  });

  test('column tools, both drag paths, pinning, and local/remote pagination work', async ({ page }) => {
    await page.locator('#toggle-email').click();
    await page.waitForFunction(() => {
      const table = document.querySelector('#pin-demo') as any;
      return table.getColumnVisibility().email === false
        && !table.shadowRoot.querySelector('th[data-key="email"]');
    });

    await page.locator('#toggle-salary-pin').click();
    const pinned = await page.evaluate(() => {
      const table = document.querySelector('#pin-demo') as any;
      const state = table.columnManager.getState('salary');
      const header = table.shadowRoot.querySelector('th[data-key="salary"]') as HTMLElement;
      return { state: state.pinned, className: header.className, right: header.style.right };
    });
    expect(pinned.state).toBe('right');
    expect(pinned.className).toContain('pinned-cell');
    expect(pinned.right).not.toBe('');

    await page.locator('#autosize-columns').click();
    await expect(page.locator('#column-status')).toContainText('auto-sized');

    const columnOrder = await page.evaluate(() => {
      const table = document.querySelector('#pin-demo') as any;
      const source = table.shadowRoot.querySelector('th[data-key="location"]') as HTMLElement;
      const target = table.shadowRoot.querySelector('th[data-key="department"]') as HTMLElement;
      const transfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
      return Array.from(table.shadowRoot.querySelectorAll('tr.column-header-row th[data-key]'))
        .map((header: Element) => header.getAttribute('data-key'));
    });
    expect(columnOrder.indexOf('location')).toBeLessThan(columnOrder.indexOf('department'));

    const rowOrder = await page.evaluate(() => {
      const table = document.querySelector('#dnd-demo') as any;
      const rows = table.shadowRoot.querySelectorAll('tbody tr[data-index]');
      const source = rows[0] as HTMLElement;
      const target = rows[2] as HTMLElement;
      const transfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
      return table.data.map((row: any) => row.name);
    });
    expect(rowOrder.slice(0, 3)).toEqual(['Bob Smith', 'Charlie Brown', 'Alice Johnson']);

    await page.evaluate(() => {
      const table = document.querySelector('#paginated') as any;
      (table.shadowRoot.querySelector('.pagination__next') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => (document.querySelector('#paginated') as any).currentPage === 2);

    await page.evaluate(() => {
      const table = document.querySelector('#remote-demo') as any;
      (table.shadowRoot.querySelector('.pagination__next') as HTMLButtonElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#remote-demo') as any;
      return table.currentPage === 2 && table.data[0]?.id === 6 && table.loading === false;
    });

    await page.evaluate(() => {
      const table = document.querySelector('#remote-demo') as any;
      const search = table.shadowRoot.querySelector('snice-input.toolbar-search') as any;
      search.value = 'Wayne';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#remote-demo') as any;
      return table.loading === false
        && table.totalItems === 7
        && table.data.every((row: any) => row.company.includes('Wayne'));
    });

    await page.evaluate(() => {
      const table = document.querySelector('#remote-demo') as any;
      (table.shadowRoot.querySelector('th[data-key="arr"]') as HTMLElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#remote-demo') as any;
      return table.loading === false && table.currentSort.some((sort: any) => sort.column === 'arr');
    });
    const remoteArr = await page.evaluate(() => (document.querySelector('#remote-demo') as any).data.map((row: any) => row.arr));
    expect(remoteArr).toEqual([...remoteArr].sort((left, right) => left - right));

    await page.evaluate(() => {
      const table = document.querySelector('#remote-demo') as any;
      const search = table.shadowRoot.querySelector('snice-input.toolbar-search') as any;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      table.currentSort = [
        { column: 'region', direction: 'asc' },
        { column: 'arr', direction: 'desc' },
      ];
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#remote-demo') as any;
      return table.loading === false
        && table.totalItems === 42
        && table.currentSort.map((sort: any) => sort.column).join(',') === 'region,arr'
        && table.data.length === 5;
    });
    const remoteMultiSort = await page.evaluate(() => {
      const rows = (document.querySelector('#remote-demo') as any).data;
      return { regions: rows.map((row: any) => row.region), arr: rows.map((row: any) => row.arr) };
    });
    expect(new Set(remoteMultiSort.regions).size).toBe(1);
    expect(remoteMultiSort.arr).toEqual([...remoteMultiSort.arr].sort((left, right) => right - left));

    await page.evaluate(() => {
      const table = document.querySelector('#pin-row-demo') as any;
      (table.shadowRoot.querySelector('th[data-key="salary"]') as HTMLElement).click();
    });
    await page.waitForFunction(() => {
      const table = document.querySelector('#pin-row-demo') as any;
      return !!table.shadowRoot.querySelector('.pinned-row--top')
        && table.shadowRoot.querySelector('.pinned-row--top') === table.shadowRoot.querySelector('tbody')?.firstElementChild;
    });
  });
});
