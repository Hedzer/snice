import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/list/snice-list';
import type { SniceListElement, ListItem } from '../../components/list/snice-list.types';

describe('snice-list', () => {
  let list: SniceListElement;

  const items: ListItem[] = [
    { id: '1', label: 'Item 1' },
    { id: '2', label: 'Item 2' },
    { id: '3', label: 'Item 3' }
  ];

  afterEach(() => {
    if (list) {
      removeComponent(list as HTMLElement);
    }
  });

  it('should render', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    expect(list).toBeTruthy();
  });

  it('should display items', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    list.items = items;
    await wait(50);
    expect(list.items.length).toBe(3);
  });

  it.skip('should support selection modes', async () => {
    list = await createComponent<SniceListElement>('snice-list', { selectionMode: 'single' });
    expect(list.selectionMode).toBe('single');
  });

  it.skip('should select item', async () => {
    list = await createComponent<SniceListElement>('snice-list', { selectionMode: 'single' });
    list.items = items;
    await wait(50);
    list.selectItem('1');
    await wait(50);
    expect(list.selectedItems).toContain('1');
  });

  it.skip('should deselect item', async () => {
    list = await createComponent<SniceListElement>('snice-list', { selectionMode: 'multiple' });
    list.items = items;
    list.selectedItems = ['1'];
    await wait(50);
    list.deselectItem('1');
    await wait(50);
    expect(list.selectedItems).not.toContain('1');
  });

  it('should get selected items', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    list.items = items;
    list.selectedItems = ['1', '2'];
    await wait(50);
    const selected = list.getSelectedItems();
    expect(selected.length).toBe(2);
  });
});
