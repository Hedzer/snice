// Virtualized rows paint once and then blank (or never paint), while the header
// stays correct and a WINDOW RESIZE heals them.
//
// Two defects produce exactly that:
//  1. `update()` recorded `lastStartIndex`/`lastEndIndex` BEFORE the `if (tbody)`
//     paint guard, so a dropped paint was indistinguishable from a completed one
//     and the range guard suppressed every retry. Only a viewport-height change
//     (i.e. a window resize) computed a different range and repainted.
//  2. `scrollContainer` was captured once at `attach()` and never revalidated, so
//     a host template that replaces its structural branch left the virtualizer
//     painting into an ORPHANED tbody while the live one stayed empty.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import { TableVirtualizer } from '../../packages/components/src/table/table-virtualizer';
import '../../packages/components/src/table/snice-table';

describe('TableVirtualizer commits a range only after it paints it', () => {
  const hosts: HTMLElement[] = [];
  const virtualizers: TableVirtualizer[] = [];

  afterEach(() => {
    virtualizers.splice(0).forEach((v) => v.detach());
    hosts.splice(0).forEach((el) => el.remove());
  });

  function makeContainer(withTbody: boolean) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    const container = document.createElement('div');
    host.appendChild(container);
    if (withTbody) container.appendChild(makeTable());
    return { host, container };
  }

  function makeTable() {
    const table = document.createElement('table');
    table.appendChild(document.createElement('tbody'));
    return table;
  }

  function attach(container: HTMLElement, overrides: any = {}) {
    const virtualizer = new TableVirtualizer();
    virtualizers.push(virtualizer);
    virtualizer.attach({
      rowHeight: 20,
      bufferPx: 100,
      totalRows: 100,
      scrollContainer: container,
      renderRange: (start, end) => {
        const fragment = document.createDocumentFragment();
        for (let index = start; index < end; index++) {
          const tr = document.createElement('tr');
          tr.setAttribute('data-index', String(index));
          fragment.appendChild(tr);
        }
        return fragment;
      },
      ...overrides,
    });
    return virtualizer;
  }

  const paintedRows = (root: ParentNode) => root.querySelectorAll('tbody tr[data-index]').length;

  it('does not record a range as painted when there is no tbody to paint into', () => {
    const { container } = makeContainer(false);
    const virtualizer = attach(container);

    // The window was computed but never landed anywhere. Reporting it as the
    // visible range is what makes every subsequent update() short-circuit.
    expect(virtualizer.getVisibleRange()).toEqual({ start: -1, end: -1 });
  });

  it('paints on the next update once the tbody becomes reachable — no resize needed', async () => {
    const { container } = makeContainer(false);
    const virtualizer = attach(container);

    container.appendChild(makeTable());
    // A scroll-driven update recomputes the SAME range: only a commit-after-paint
    // virtualizer knows it still owes that range a paint.
    container.dispatchEvent(new Event('scroll'));
    await wait(50);

    expect(paintedRows(container)).toBeGreaterThan(0);
    expect(virtualizer.getVisibleRange().start).toBe(0);
  });

  it('re-resolves the scroll container so painting follows the live tbody', async () => {
    const { host, container } = makeContainer(true);
    const live = document.createElement('div');
    let current: HTMLElement = container;
    const virtualizer = attach(container, { resolveScrollContainer: () => current });
    expect(paintedRows(container)).toBeGreaterThan(0);

    // The host template flips branches: the captured container is detached and a
    // fresh one takes its place. Its orphaned tbody must not receive the window.
    container.remove();
    live.appendChild(makeTable());
    host.appendChild(live);
    current = live;

    virtualizer.setTotalRows(120);
    await wait(20);

    // The window lands in the live subtree; the detached one keeps only the
    // rows it was painted with before the flip and receives nothing further.
    expect(paintedRows(live)).toBeGreaterThan(0);
    expect((virtualizer as any).options.scrollContainer).toBe(live);
  });
});

describe('snice-table virtualized paint targets the live tbody', () => {
  let table: any;

  afterEach(() => {
    if (table) {
      removeComponent(table as HTMLElement);
      table = null;
    }
  });

  const COLS = [{ key: 'n', label: 'N', type: 'text' }];
  const DATA = (n: number) => Array.from({ length: n }, (_, i) => ({ n: 'r' + i }));

  it('repaints into a structurally replaced .table-frame instead of the detached one', async () => {
    table = await createComponent<any>('snice-table');
    table.columns = COLS;
    table.virtualize = true;
    table.rowHeight = 36;
    table.data = DATA(200);
    await wait(60);

    const stale = table.shadowRoot.querySelector('.table-frame') as HTMLElement;
    expect(stale.querySelectorAll('tbody tr[data-index]').length).toBeGreaterThan(0);

    // A structural re-render swaps the frame; `this.tbody` (@query) already
    // resolves to the new one while the virtualizer still holds the old node.
    const fresh = stale.cloneNode(false) as HTMLElement;
    const freshTable = document.createElement('table');
    freshTable.appendChild(document.createElement('thead'));
    freshTable.appendChild(document.createElement('tbody'));
    fresh.appendChild(freshTable);
    stale.replaceWith(fresh);

    table.data = DATA(220);
    await wait(60);

    expect(fresh.querySelectorAll('tbody tr[data-index]').length).toBeGreaterThan(0);
  });
});
