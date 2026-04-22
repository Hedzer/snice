import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('chart: canvas/svg is announced to screen readers', () => {
  it('line chart canvas has role=img and aria-label summary', async () => {
    await import('../../components/chart/snice-chart');
    const el = document.createElement('snice-chart') as any;
    el.type = 'line';
    el.datasets = [{ label: 'Sales', data: [1, 2, 3] }];
    el.labels = ['Jan', 'Feb', 'Mar'];
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const canvas = el.shadowRoot.querySelector('canvas');
    expect(canvas?.getAttribute('role')).toBe('img');
    expect(canvas?.getAttribute('aria-label')).toMatch(/chart/i);
  });
});

describe('sparkline: SVG has role=img + aria-label', () => {
  it('svg with data has role=img and a summary label', async () => {
    await import('../../components/sparkline/snice-sparkline');
    const el = document.createElement('snice-sparkline') as any;
    el.data = [1, 2, 3, 4, 5];
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const svg = el.shadowRoot.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    const label = svg?.getAttribute('aria-label') || '';
    expect(label).toMatch(/sparkline/i);
    expect(label).toMatch(/trend/i);
  });
});

describe('spreadsheet: role=grid with rowindex/colindex/aria-sort', () => {
  it('table uses role=grid and cells carry aria-rowindex/aria-colindex', async () => {
    await import('../../components/spreadsheet/snice-spreadsheet');
    const el = document.createElement('snice-spreadsheet') as any;
    el.columns = [{ key: 'a' }, { key: 'b' }];
    el.data = [['1', '2'], ['3', '4']];
    document.body.appendChild(el);
    await el.ready;
    await wait(60);

    const table = el.shadowRoot.querySelector('table');
    expect(table?.getAttribute('role')).toBe('grid');
    expect(table?.getAttribute('aria-rowcount')).toBeTruthy();

    const cell = el.shadowRoot.querySelector('[role="gridcell"]') as HTMLElement;
    expect(cell).toBeTruthy();
    expect(cell.getAttribute('aria-colindex')).toBeTruthy();
    const row = cell.closest('[role="row"]');
    expect(row?.getAttribute('aria-rowindex')).toBeTruthy();
  });

  it('column headers have scope="col" and aria-sort', async () => {
    await import('../../components/spreadsheet/snice-spreadsheet');
    const el = document.createElement('snice-spreadsheet') as any;
    el.columns = [{ key: 'a' }];
    el.data = [['1']];
    document.body.appendChild(el);
    await el.ready;
    await wait(60);

    const th = el.shadowRoot.querySelector('.spreadsheet-th') as HTMLElement;
    expect(th).toBeTruthy();
    expect(th.getAttribute('scope')).toBe('col');
    expect(['none', 'ascending', 'descending']).toContain(th.getAttribute('aria-sort'));
  });
});

describe('calendar: role=grid + roving tabindex + arrow keys', () => {
  it('grid has role=grid, exactly one cell has tabindex=0, ArrowRight advances focus', async () => {
    await import('../../components/calendar/snice-calendar');
    const el = document.createElement('snice-calendar') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(60);

    const grid = el.shadowRoot.querySelector('[role="grid"]') as HTMLElement;
    expect(grid).toBeTruthy();

    const cells = Array.from(el.shadowRoot.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
    expect(cells.length).toBe(42);
    const tabbable = cells.filter(c => c.getAttribute('tabindex') === '0');
    expect(tabbable.length).toBe(1);

    const focused = tabbable[0];
    const before = focused.getAttribute('aria-label');
    focused.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(30);

    // After ArrowRight, the newly-tabbable cell should be different.
    const newTabbable = (Array.from(el.shadowRoot.querySelectorAll('[role="gridcell"]')) as HTMLElement[])
      .filter(c => c.getAttribute('tabindex') === '0');
    expect(newTabbable.length).toBe(1);
    expect(newTabbable[0].getAttribute('aria-label')).not.toBe(before);
  });
});
