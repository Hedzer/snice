// Defect guard: snice-table must honour column.valueGetter for body cells in the
// "bare" assignment path — `columns` / `data` set as plain properties on a
// freshly created element, with no manual columnManager.initialize /
// renderHeader / renderBody calls to prime the pipeline.
//
// The cases below walk every ordering of that path (assign before append, after
// append, data before columns, and a data replacement), because the getter is
// resolved during column initialization and a body render that happens before
// initialization would silently fall back to the raw row field.
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from './test-utils';
import '../../packages/components/src/table/snice-table';

describe('snice-table — valueGetter in the bare assignment path', () => {
  let table: any;

  afterEach(() => {
    if (table) removeComponent(table);
    table = undefined;
  });

  function bodyText(el: any, key: string): string[] {
    const cells = [...el.shadowRoot.querySelectorAll(`tbody td[data-key="${key}"]`)] as HTMLElement[];
    return cells.map(td => (td.querySelector('[value]')?.getAttribute('value')
      ?? td.textContent?.trim() ?? ''));
  }

  function headerText(el: any, key: string): string {
    const th = el.shadowRoot.querySelector(`thead th[data-key="${key}"]`) as HTMLElement | null;
    return th?.textContent?.trim() ?? '';
  }

  // Create, assign properties, THEN append — nothing is in the DOM while the
  // columns/data land, so initialization has to run at connect time.
  it('renders valueGetter output when columns/data are assigned before append', async () => {
    table = document.createElement('snice-table');
    table.columns = [{ key: 'name', label: 'Name', valueGetter: (_v: any, row: any) => row.realName }];
    table.data = [{ realName: 'Acme' }];
    document.body.appendChild(table);
    await table.ready;
    await wait(20);

    expect(headerText(table, 'name')).toContain('Name');
    expect(bodyText(table, 'name')).toEqual(['Acme']);
  });

  // Adjacent variant: properties assigned AFTER append (post-upgrade).
  it('renders valueGetter output when columns/data are assigned after append', async () => {
    table = document.createElement('snice-table');
    document.body.appendChild(table);
    await table.ready;
    table.columns = [{ key: 'name', label: 'Name', valueGetter: (_v: any, row: any) => row.realName }];
    table.data = [{ realName: 'Acme' }];
    await wait(20);

    expect(headerText(table, 'name')).toContain('Name');
    expect(bodyText(table, 'name')).toEqual(['Acme']);
  });

  // Adjacent variant: data assigned before columns.
  it('renders valueGetter output when data is assigned before columns', async () => {
    table = document.createElement('snice-table');
    document.body.appendChild(table);
    await table.ready;
    table.data = [{ realName: 'Acme' }];
    table.columns = [{ key: 'name', label: 'Name', valueGetter: (_v: any, row: any) => row.realName }];
    await wait(20);

    expect(bodyText(table, 'name')).toEqual(['Acme']);
  });

  // Adjacent variant: re-delivery of data after the first render.
  it('renders valueGetter output after data is replaced', async () => {
    table = document.createElement('snice-table');
    table.columns = [{ key: 'name', label: 'Name', valueGetter: (_v: any, row: any) => row.realName }];
    table.data = [{ realName: 'Acme' }];
    document.body.appendChild(table);
    await table.ready;
    await wait(20);

    table.data = [{ realName: 'Globex' }, { realName: 'Initech' }];
    await wait(20);

    expect(bodyText(table, 'name')).toEqual(['Globex', 'Initech']);
  });
});
