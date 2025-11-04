import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/pagination/snice-pagination';
import type { SnicePaginationElement } from '../../components/pagination/snice-pagination.types';

describe('snice-pagination', () => {
  let pagination: SnicePaginationElement;

  afterEach(() => {
    if (pagination) {
      removeComponent(pagination as HTMLElement);
    }
  });

  it('should render pagination element', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10 });
    expect(pagination).toBeTruthy();
  });

  it('should have default current page of 1', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10 });
    expect(pagination.current).toBe(1);
  });

  it('should render correct number of page buttons', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 5 });

    const pageButtons = queryShadowAll(pagination as HTMLElement, '.pagination-page');
    expect(pageButtons.length).toBe(5);
  });

  it('should show first/prev/next/last buttons by default', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10 });

    expect(queryShadow(pagination as HTMLElement, '.pagination-first')).toBeTruthy();
    expect(queryShadow(pagination as HTMLElement, '.pagination-prev')).toBeTruthy();
    expect(queryShadow(pagination as HTMLElement, '.pagination-next')).toBeTruthy();
    expect(queryShadow(pagination as HTMLElement, '.pagination-last')).toBeTruthy();
  });

  it('should hide first button when showFirst is false', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, showFirst: false });

    expect(queryShadow(pagination as HTMLElement, '.pagination-first')).toBeFalsy();
  });

  it('should hide last button when showLast is false', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, showLast: false });

    expect(queryShadow(pagination as HTMLElement, '.pagination-last')).toBeFalsy();
  });

  it('should disable prev/first buttons on first page', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 10 });

    const firstBtn = queryShadow(pagination as HTMLElement, '.pagination-first') as HTMLButtonElement;
    const prevBtn = queryShadow(pagination as HTMLElement, '.pagination-prev') as HTMLButtonElement;

    expect(firstBtn?.disabled).toBe(true);
    expect(prevBtn?.disabled).toBe(true);
  });

  it('should disable next/last buttons on last page', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 10, total: 10 });

    const nextBtn = queryShadow(pagination as HTMLElement, '.pagination-next') as HTMLButtonElement;
    const lastBtn = queryShadow(pagination as HTMLElement, '.pagination-last') as HTMLButtonElement;

    expect(nextBtn?.disabled).toBe(true);
    expect(lastBtn?.disabled).toBe(true);
  });

  it('should mark current page button as active', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 3, total: 10 });

    const currentBtn = queryShadow(pagination as HTMLElement, '[data-page="3"]') as HTMLElement;
    expect(currentBtn?.classList.contains('active')).toBe(true);
  });

  it('should show ellipsis for large page counts', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 20, siblings: 1 });

    const ellipsis = queryShadow(pagination as HTMLElement, '.pagination-ellipsis');
    expect(ellipsis).toBeTruthy();
  });

  it('should dispatch pagination-change event on page change', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 10 });

    let eventDetail: any = null;
    (pagination as HTMLElement).addEventListener('pagination-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    pagination.goToPage(5);

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.page).toBe(5);
    expect(eventDetail.previousPage).toBe(1);
  });

  it('should change page with goToPage() method', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 10 });

    pagination.goToPage(7);
    expect(pagination.current).toBe(7);
  });

  it('should not change to invalid page number', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 5, total: 10 });

    pagination.goToPage(11); // Out of bounds
    expect(pagination.current).toBe(5); // Should stay the same

    pagination.goToPage(0); // Invalid
    expect(pagination.current).toBe(5); // Should stay the same
  });

  it('should increment page with nextPage() method', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 3, total: 10 });

    pagination.nextPage();
    expect(pagination.current).toBe(4);
  });

  it('should not go beyond last page with nextPage()', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 10, total: 10 });

    pagination.nextPage();
    expect(pagination.current).toBe(10);
  });

  it('should decrement page with previousPage() method', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 5, total: 10 });

    pagination.previousPage();
    expect(pagination.current).toBe(4);
  });

  it('should not go below first page with previousPage()', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 1, total: 10 });

    pagination.previousPage();
    expect(pagination.current).toBe(1);
  });

  it('should jump to first page with firstPage() method', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 8, total: 10 });

    pagination.firstPage();
    expect(pagination.current).toBe(1);
  });

  it('should jump to last page with lastPage() method', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 2, total: 10 });

    pagination.lastPage();
    expect(pagination.current).toBe(10);
  });

  it('should support small size variant', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, size: 'small' });

    expect(pagination.getAttribute('size')).toBe('small');
  });

  it('should support large size variant', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, size: 'large' });

    expect(pagination.getAttribute('size')).toBe('large');
  });

  it('should support rounded variant', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, variant: 'rounded' });

    expect(pagination.getAttribute('variant')).toBe('rounded');
  });

  it('should support text variant', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { total: 10, variant: 'text' });

    expect(pagination.getAttribute('variant')).toBe('text');
  });

  it('should control siblings count', async () => {
    pagination = await createComponent<SnicePaginationElement>('snice-pagination', { current: 10, total: 20, siblings: 3 });

    // With siblings=3, should show pages 7,8,9,10,11,12,13 around current page 10
    const pageButtons = queryShadowAll(pagination as HTMLElement, '[data-page]');
    const visiblePages = Array.from(pageButtons).map(btn => btn.getAttribute('data-page'));

    // Should include pages around current (10) based on siblings
    expect(visiblePages).toContain('10');
    expect(visiblePages.length).toBeGreaterThan(5); // More pages shown with siblings=3
  });
});
