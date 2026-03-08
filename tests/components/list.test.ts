import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/list/snice-list';
import type { SniceListElement } from '../../components/list/snice-list.types';

describe('snice-list', () => {
  let list: SniceListElement;

  afterEach(() => {
    if (list) {
      removeComponent(list as HTMLElement);
    }
  });

  it('should render', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    expect(list).toBeTruthy();
  });

  it('should have default properties', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    expect(list.dividers).toBe(false);
    expect(list.searchable).toBe(false);
    expect(list.infinite).toBe(false);
    expect(list.loading).toBe(false);
    expect(list.noResults).toBe(false);
  });

  it('should support dividers', async () => {
    list = await createComponent<SniceListElement>('snice-list', { dividers: true });
    expect(list.dividers).toBe(true);
  });

  it('should support searchable mode', async () => {
    list = await createComponent<SniceListElement>('snice-list', { searchable: true });
    expect(list.searchable).toBe(true);
  });

  it('should support infinite scroll mode', async () => {
    list = await createComponent<SniceListElement>('snice-list', { infinite: true });
    expect(list.infinite).toBe(true);
  });

  it('should show loading state', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    list.loading = true;
    await wait(50);
    expect(list.loading).toBe(true);
  });

  it('should render sentinel element when infinite is true', async () => {
    list = await createComponent<SniceListElement>('snice-list', { infinite: true });
    const sentinel = list.shadowRoot?.querySelector('.list__sentinel');
    expect(sentinel).toBeTruthy();
  });

  it('should render search input when searchable', async () => {
    list = await createComponent<SniceListElement>('snice-list', { searchable: true });
    const input = list.shadowRoot?.querySelector('.list__search-input');
    expect(input).toBeTruthy();
  });

  it('should not render search input by default', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    const input = list.shadowRoot?.querySelector('.list__search-input');
    expect(input).toBeFalsy();
  });

  it('should show no-results slot when noResults is true', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    list.noResults = true;
    await wait(50);
    const emptyState = list.shadowRoot?.querySelector('snice-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should show loading skeletons when loading', async () => {
    list = await createComponent<SniceListElement>('snice-list');
    list.loading = true;
    await wait(50);
    const skeletons = list.shadowRoot?.querySelectorAll('snice-skeleton');
    expect(skeletons?.length).toBe(5);
  });

  it('should respect custom skeletonCount', async () => {
    list = await createComponent<SniceListElement>('snice-list', { 'skeleton-count': 3 });
    list.loading = true;
    await wait(50);
    const skeletons = list.shadowRoot?.querySelectorAll('snice-skeleton');
    expect(skeletons?.length).toBe(3);
  });
});
