import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/table/snice-table';
import { Table } from '../../adapters/react/table';

// React 18 only flushes passive effects through act() when the environment
// explicitly opts in. The adapter attaches CustomEvent listeners in an effect,
// so this test must exercise the same post-commit lifecycle as an application.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React table grouping adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('forwards typed grouping properties and the group-toggle event', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onGroupToggle = vi.fn();
    const columns = [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'level', label: 'Level', type: 'text' },
      // Text avoids Happy DOM's typed-cell constructor bug; aggregation still
      // receives the numeric row values and the real-browser suite covers the
      // number/currency formatter path.
      { key: 'salary', label: 'Salary', type: 'text', aggregate: 'sum' },
    ];
    const data = [
      { name: 'Alice', department: 'Engineering', level: 'Senior', salary: 100 },
      { name: 'Bob', department: 'Engineering', level: 'Junior', salary: 80 },
      { name: 'Eve', department: 'Sales', level: 'Senior', salary: 70 },
    ];

    await act(async () => {
      root!.render(
        <Table
          ref={ref}
          columns={columns}
          data={data}
          groupBy={['department', 'level']}
          groupDefaults={{ expanded: false }}
          onGroupToggle={onGroupToggle}
        />
      );
    });

    const element = ref.current.element as any;
    expect(element.groupBy).toEqual(['department', 'level']);
    expect(element.groupDefaults).toEqual({ expanded: false });
    await act(async () => { await element.ready; });
    expect(element.shadowRoot.querySelectorAll('tr.group-header-row')).toHaveLength(2);
    expect(element.shadowRoot.querySelectorAll('tr[data-index]')).toHaveLength(0);

    const detail = { key: 'opaque-key', value: 'Engineering', expanded: true };
    element.dispatchEvent(new CustomEvent('group-toggle', { detail }));
    expect(onGroupToggle).toHaveBeenCalledTimes(1);
    expect(onGroupToggle.mock.calls[0][0].detail).toEqual(detail);
  });
});
