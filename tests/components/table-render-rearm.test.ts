// "The header paints, the rows never do."
//
// `scheduleRender()` clears BOTH pending flags before it renders, so a queued
// body render that lands while the shadow template has not committed a <tbody>
// yet — or that is skipped because renderHeader() threw — is consumed and lost.
// Nothing re-arms it, and the two header-only re-render paths (`table/config`'s
// post-rAF pass, and the flush after a header failure) leave the body stale
// forever.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait, queryShadowAll } from './test-utils';
import '../../packages/components/src/table/snice-table';

describe('snice-table body renders are never silently consumed', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  const COLS = [{ key: 'name', label: 'Name', type: 'text' }];
  const ROWS = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Eve' }];

  const bodyRows = (el: any) => queryShadowAll(el, 'tbody tr[data-index]').length;

  it('re-arms a body render that ran before the template committed a <tbody>', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);
    expect(bodyRows(table)).toBe(3);

    // Reproduce the pre-template state: no <tbody> for @query to resolve.
    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    const parent = frame.parentElement!;
    frame.remove();
    (frame.querySelector('tbody') as HTMLElement).innerHTML = '';

    table.renderBody(); // consumed against a null tbody

    parent.appendChild(frame); // the structural template commits
    await wait(60);

    expect(bodyRows(table)).toBe(3);
  });

  it('keeps re-arming while the template takes more than one frame to commit', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    const parent = frame.parentElement!;
    frame.remove();
    (frame.querySelector('tbody') as HTMLElement).innerHTML = '';

    table.renderBody(); // consumed against a null tbody

    // A re-arm that does not CHAIN spends its whole budget on one frame: the
    // retry finds no tbody either, gives up silently, and the rows stay blank
    // for every slow template commit.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.appendChild(frame);
    await wait(60);

    expect(bodyRows(table)).toBe(3);
  });

  it('gives a newly scheduled body render a fresh retry budget', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    const parent = frame.parentElement!;
    frame.remove();
    (frame.querySelector('tbody') as HTMLElement).innerHTML = '';

    // Burn the whole budget against a template that has no <tbody> at all (the
    // slotted-rows branch is exactly this shape).
    for (let i = 0; i < 6; i++) {
      table.renderBody();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    // A LATER state change must still be able to paint. A budget that is only
    // ever reset by a successful render disqualifies the table permanently.
    table.data = [...ROWS, { name: 'Mallory' }];
    // Drain the flush against the still-missing tbody, then commit the template
    // inside the fresh budget's window.
    for (let i = 0; i < 12; i++) await Promise.resolve();
    parent.appendChild(frame);
    await wait(80);

    expect(bodyRows(table)).toBe(4);
  });

  it('paints thead AND tbody when table/config lands before the template commits', async () => {
    table = await createComponent<any>('snice-table');
    table.data = ROWS;
    await wait(40);

    // The config response resolves in a microtask, so its columns flush can run
    // while the shadow template has not committed its <table> yet. Its post-rAF
    // re-render must not be header-only.
    const frame = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    const parent = frame.parentElement!;
    frame.remove();
    (frame.querySelector('tbody') as HTMLElement).innerHTML = '';

    table.addEventListener('@request/table/config', (e: any) => {
      e.detail.discovery.resolve();
      e.detail.data.resolve({ columns: COLS });
    }, { once: true });
    table.getTableConfig();

    // Drain microtasks only: the columns flush runs against the missing tbody,
    // then the template commits, and only then does the config rAF fire.
    for (let i = 0; i < 12; i++) await Promise.resolve();
    parent.appendChild(frame);
    await wait(80);

    expect(queryShadowAll(table, 'thead th').length).toBeGreaterThan(0);
    expect(bodyRows(table)).toBe(3);
  });

  it('still renders the body when renderHeader throws during the flush', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.data = ROWS;
    await wait(40);

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const renderHeader = table.renderHeader.bind(table);
    let thrown = false;
    table.renderHeader = () => {
      if (!thrown) {
        thrown = true;
        throw new Error('header boom');
      }
      return renderHeader();
    };

    // Schedules 'both': the flush consumes the body flag before it calls the
    // throwing header render.
    table.columns = [{ key: 'name', label: 'Name', type: 'text' }, { key: 'age', label: 'Age', type: 'text' }];
    await wait(60);

    expect(thrown).toBe(true);
    expect(queryShadowAll(table, 'tbody td[data-key="age"]').length).toBe(3);
    errors.mockRestore();
  });
});
