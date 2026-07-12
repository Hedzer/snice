/**
 * Phase 0 · Task 4 — polish bug batch (sonnet-tier).
 *
 * Four independent surgical fixes, one describe each:
 *   a. Action-button hover paints a real tint, not the solid text color.
 *   b. row-clicked is bubbles+composed (crosses the shadow boundary).
 *   c. Remote-mode load failure surfaces an error (message + event), not just
 *      a console.error swallowed into the generic "No data" empty state.
 *   d. thead th sticks to the top of the .table-frame scroller on the
 *      primary (non-slotted) path, composing with pinned columns.
 *
 * happy-dom can't do scroll layout or getComputedStyle box painting for (a)/(d),
 * so those two read the CSS source text directly — same approach as the
 * existing `table-fill-container.test.ts` regression test.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/table/snice-table';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSource(relPath: string): string {
  return readFileSync(resolve(__dirname, relPath), 'utf8');
}

/**
 * Match a rule body where the selector starts at line beginning (after
 * indentation) so substrings of longer selectors don't shadow the plain one.
 */
function ruleBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const m = css.match(re);
  if (!m) throw new Error(`selector ${selector} not found at rule start`);
  return m[1];
}

/** Extract the body of the @styles() css`...` template literal in snice-table.ts. */
function getTableStylesTemplate(): string {
  const src = readSource('../../components/table/snice-table.ts');
  const start = src.indexOf('css/*css*/`');
  if (start < 0) throw new Error('css template literal not found');
  const open = src.indexOf('`', start);
  const close = src.indexOf('`', open + 1);
  if (close < 0) throw new Error('unterminated css template');
  return src.slice(open + 1, close);
}

// Standard columns/data for the live-DOM tests (b, c, d).
const TEST_COLUMNS = [
  { key: 'id', label: 'ID', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'age', label: 'Age', type: 'text' },
];
const TEST_DATA = [
  { id: '1', name: 'Alice', age: '30' },
  { id: '2', name: 'Bob', age: '25' },
];

async function createTable(opts: {
  columns?: any[];
  data?: any[];
  attrs?: Record<string, any>;
} = {}) {
  const table = await createComponent<any>('snice-table', opts.attrs || {});
  const columns = opts.columns || TEST_COLUMNS;
  const data = opts.data || TEST_DATA;

  table.columns = columns;
  table.data = data;
  table.unsortedData = [...data];
  (table as any).columnManager.initialize(columns, table);

  await wait(10);
  table.renderHeader();
  table.renderBody();
  await wait(50);
  return table;
}

describe('table phase 0 — task 4 polish fixes', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  // ── a. Action-button hover color ──

  describe('a. action-button hover color', () => {
    it('does not paint the hover background with the text-color token', () => {
      const css = readSource('../../components/table/snice-cell-actions.css');
      const rule = ruleBlock(css, '.action-button:hover');
      expect(rule).not.toMatch(/background:\s*var\(--snice-color-text\b/);
    });

    it('uses a real hover-wash token with the exact theme.css-default fallback', () => {
      const css = readSource('../../components/table/snice-cell-actions.css');
      const rule = ruleBlock(css, '.action-button:hover');
      // Matches the fallback already used for this exact token elsewhere in
      // the table component (e.g. th.sortable:hover, tbody row hover).
      expect(rule).toMatch(/background:\s*var\(--snice-color-surface-hover,\s*rgb\(243 244 246\)\)/);
    });
  });

  // ── b. row-clicked composed ──

  describe('b. row-clicked is composed', () => {
    it('is observable on document from a click on a row (crosses the shadow boundary)', async () => {
      table = await createTable({ attrs: { clickable: true } });
      const events: any[] = [];
      const handler = (e: Event) => events.push((e as CustomEvent).detail);
      document.addEventListener('row-clicked', handler);

      try {
        const tr = table.shadowRoot.querySelector('tbody tr') as HTMLElement;
        tr.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await wait(10);

        expect(events.length).toBe(1);
        expect(events[0].rowIndex).toBe(0);
        expect(events[0].rowData).toEqual(TEST_DATA[0]);
      } finally {
        document.removeEventListener('row-clicked', handler);
      }
    });

    it('action cells receive the originating row in their event payload', async () => {
      const actionColumns = [
        { key: 'name', label: 'Name', type: 'text' },
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          actionsFormat: { actions: [{ action: 'inspect', label: 'Inspect' }] },
        },
      ];
      table = await createTable({ columns: actionColumns });
      const events: any[] = [];
      table.addEventListener('cell-action', (event: CustomEvent) => events.push(event.detail));

      const actionCell = table.shadowRoot.querySelector(
        'tbody tr[data-index="0"] td[data-key="actions"] snice-cell-actions'
      ) as any;
      const button = actionCell.shadowRoot.querySelector('button') as HTMLButtonElement;
      button.click();
      await wait(10);

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        action: 'inspect',
        rowData: TEST_DATA[0],
        column: actionColumns[1],
      });
    });
  });

  // ── c. Error state ──

  describe('c. remote load error state', () => {
    it('shows a visible error message and fires table-load-error on reject; clears on next success', async () => {
      // getTableData's own catch block intentionally console.errors the
      // rejection (unchanged pre-existing behavior) — silence the expected
      // noise for this deliberately-failing-request test.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      table = await createComponent<any>('snice-table', { mode: 'remote' });
      table.columns = TEST_COLUMNS;
      table.data = [];
      table.unsortedData = [];
      (table as any).columnManager.initialize(TEST_COLUMNS, table);
      await wait(10);
      table.renderHeader();
      table.renderBody();
      await wait(10);

      const errors: any[] = [];
      table.addEventListener('table-load-error', (e: any) => errors.push(e.detail));

      const reject = (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.reject(new Error('network down'));
      };
      table.addEventListener('@request/table/data', reject);

      table.getTableData();
      await wait(50);

      expect(errors.length).toBe(1);
      expect(String(errors[0].error)).toContain('network down');

      const msg = table.shadowRoot.querySelector('.table-error-message');
      expect(msg).toBeTruthy();
      expect(msg!.textContent).toContain('network down');
      expect(table.classList.contains('table--error')).toBe(true);

      // Next successful load clears the error.
      table.removeEventListener('@request/table/data', reject);
      table.addEventListener('@request/table/data', (e: any) => {
        e.detail.discovery.resolve();
        e.detail.data.resolve({ data: [{ id: '1', name: 'Alice', age: '30' }] });
      });

      table.getTableData();
      await wait(50);

      expect(table.shadowRoot.querySelector('.table-error-message')).toBeFalsy();
      expect(table.classList.contains('table--error')).toBe(false);

      errorSpy.mockRestore();
    });
  });

  // ── d. Sticky header ──

  describe('d. sticky header on the primary table path', () => {
    it('thead th sticks to the top of the .table-frame scroller', () => {
      const styles = getTableStylesTemplate();
      const rule = ruleBlock(styles, 'thead th');
      expect(rule).toMatch(/position:\s*sticky/);
      expect(rule).toMatch(/top:\s*0/);
    });

    it('composes with pinned columns — a pinned header cell keeps its left/right sticky styles', async () => {
      table = await createTable();
      table.pinColumn('name', 'left');
      await wait(20);

      const th = table.shadowRoot.querySelector('th[data-key="name"]') as HTMLElement;
      expect(th.classList.contains('pinned-cell')).toBe(true);
      expect(th.style.position).toBe('sticky');
      expect(th.style.left).not.toBe('');
    });
  });
});
