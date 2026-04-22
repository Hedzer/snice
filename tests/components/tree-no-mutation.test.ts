import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('tree: selection does not mutate caller-supplied node objects', () => {
  it('selectNode updates internal state only, not input.selected', async () => {
    await import('../../components/tree/snice-tree');

    const input = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ] as any[];

    const el = document.createElement('snice-tree') as any;
    el.selectable = true;
    el.selectionMode = 'single';
    el.nodes = input;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    expect((input[0] as any).selected).toBeUndefined();

    el.selectNode('a');
    await wait(20);

    // Internal state updated
    expect(el.selectedNodes).toContain('a');
    // Caller's object NOT mutated
    expect((input[0] as any).selected).toBeUndefined();
  });

  it('checkedNodes change does not mutate caller objects', async () => {
    await import('../../components/tree/snice-tree');

    const input = [
      { id: 'x', label: 'X' },
      { id: 'y', label: 'Y' },
    ] as any[];

    const el = document.createElement('snice-tree') as any;
    el.checkable = true;
    el.nodes = input;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    expect((input[0] as any).checked).toBeUndefined();

    el.checkedNodes = ['x'];
    await wait(20);

    expect((input[0] as any).checked).toBeUndefined();
  });
});
