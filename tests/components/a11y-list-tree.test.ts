import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('list-item: role=listitem', () => {
  it('every list item has role=listitem', async () => {
    await import('../../packages/components/src/list/snice-list');
    await import('../../packages/components/src/list/snice-list-item');

    const el = document.createElement('snice-list') as any;
    const a = document.createElement('snice-list-item') as any;
    a.setAttribute('heading', 'One');
    const b = document.createElement('snice-list-item') as any;
    b.setAttribute('heading', 'Two');
    el.appendChild(a);
    el.appendChild(b);
    document.body.appendChild(el);
    await Promise.all([a.ready, b.ready, el.ready]);
    await wait(30);

    const aInner = a.shadowRoot.querySelector('[role="listitem"]');
    const bInner = b.shadowRoot.querySelector('[role="listitem"]');
    expect(aInner).toBeTruthy();
    expect(bInner).toBeTruthy();
  });
});

describe('tree-item: aria-level, aria-setsize, aria-posinset', () => {
  it('root-level items expose the right aria positional attributes', async () => {
    await import('../../packages/components/src/tree/snice-tree');
    await import('../../packages/components/src/tree/snice-tree-item');

    const el = document.createElement('snice-tree') as any;
    el.nodes = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', children: [{ id: 'b1', label: 'B1' }] },
      { id: 'c', label: 'C' },
    ];
    document.body.appendChild(el);
    await el.ready;
    await wait(50);

    const rootItems = el.shadowRoot.querySelectorAll('.tree__content > snice-tree-item');
    expect(rootItems.length).toBe(3);

    // Each root item's own content element has the aria attributes
    const firstContent = (rootItems[0] as any).shadowRoot.querySelector('[role="treeitem"]') as HTMLElement;
    const secondContent = (rootItems[1] as any).shadowRoot.querySelector('[role="treeitem"]') as HTMLElement;

    expect(firstContent.getAttribute('aria-level')).toBe('1');
    expect(firstContent.getAttribute('aria-setsize')).toBe('3');
    expect(firstContent.getAttribute('aria-posinset')).toBe('1');

    expect(secondContent.getAttribute('aria-posinset')).toBe('2');
    expect(secondContent.getAttribute('aria-setsize')).toBe('3');
  });
});
