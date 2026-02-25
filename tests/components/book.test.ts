import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow } from './test-utils';
import '../../components/book/snice-book';
import type { SniceBookElement } from '../../components/book/snice-book.types';

describe('snice-book', () => {
  let book: SniceBookElement;

  async function createWithPages(count: number, attrs: Record<string, any> = {}) {
    const el = document.createElement('snice-book') as SniceBookElement;
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, String(value));
    }
    for (let i = 0; i < count; i++) {
      const page = document.createElement('snice-book-page');
      const front = document.createElement('div');
      front.slot = 'front';
      front.textContent = `Page ${i + 1} Front`;
      page.appendChild(front);
      el.appendChild(page);
    }
    document.body.appendChild(el);
    await (el as any).ready;
    await wait(50);
    return el;
  }

  afterEach(() => {
    if (book) {
      removeComponent(book as HTMLElement);
    }
  });

  it('should render', async () => {
    book = await createComponent<SniceBookElement>('snice-book');
    expect(book).toBeTruthy();
    expect(book.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    book = await createComponent<SniceBookElement>('snice-book');
    expect(book.currentPage).toBe(0);
    expect(book.coverImage).toBe('');
    expect(book.title).toBe('');
    expect(book.author).toBe('');
  });

  it('should report total pages from children', async () => {
    book = await createWithPages(6);
    expect(book.totalPages).toBe(6);
  });

  it('should navigate to next page', async () => {
    book = await createWithPages(6);
    book.nextPage();
    await wait(50);
    expect(book.currentPage).toBe(1);
  });

  it('should navigate to previous page', async () => {
    book = await createWithPages(6);
    book.nextPage();
    await wait(50);
    book.prevPage();
    await wait(50);
    expect(book.currentPage).toBe(0);
  });

  it('should go to specific page', async () => {
    book = await createWithPages(6);
    book.goToPage(4);
    await wait(50);
    expect(book.currentPage).toBe(4);
  });

  it('should go to first page', async () => {
    book = await createWithPages(6);
    book.goToPage(4);
    await wait(50);
    book.firstPage();
    await wait(50);
    expect(book.currentPage).toBe(0);
  });

  it('should go to last page', async () => {
    book = await createWithPages(6);
    book.lastPage();
    await wait(50);
    expect(book.currentPage).toBe(6);
  });

  it('should not go past end', async () => {
    book = await createWithPages(4);
    book.goToPage(4);
    await wait(50);
    book.nextPage();
    await wait(50);
    expect(book.currentPage).toBe(4);
  });

  it('should not go before start', async () => {
    book = await createWithPages(4);
    book.prevPage();
    await wait(50);
    expect(book.currentPage).toBe(0);
  });

  it('should set cover-image attribute', async () => {
    book = await createComponent<SniceBookElement>('snice-book', { 'cover-image': 'test.jpg' });
    expect(book.coverImage).toBe('test.jpg');
  });

  it('should set title', async () => {
    book = await createComponent<SniceBookElement>('snice-book');
    book.title = 'My Book';
    await wait(50);
    expect(book.title).toBe('My Book');
  });

  it('should set author', async () => {
    book = await createComponent<SniceBookElement>('snice-book');
    book.author = 'Author Name';
    await wait(50);
    expect(book.author).toBe('Author Name');
  });

  it('should emit page-turn event on nextPage', async () => {
    book = await createWithPages(6);
    let eventDetail: any = null;
    (book as HTMLElement).addEventListener('page-turn', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });
    book.nextPage();
    await wait(50);
    expect(eventDetail).toBeTruthy();
    expect(eventDetail.page).toBe(1);
    expect(eventDetail.direction).toBe('forward');
  });

  it('should emit page-turn event on prevPage', async () => {
    book = await createWithPages(6);
    book.goToPage(3);
    await wait(50);
    let eventDetail: any = null;
    (book as HTMLElement).addEventListener('page-turn', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });
    book.prevPage();
    await wait(50);
    expect(eventDetail).toBeTruthy();
    expect(eventDetail.page).toBe(2);
    expect(eventDetail.direction).toBe('backward');
  });

  it('should respond to ArrowRight key', async () => {
    book = await createWithPages(6);
    (book as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(50);
    expect(book.currentPage).toBe(1);
  });

  it('should respond to ArrowLeft key', async () => {
    book = await createWithPages(6);
    book.goToPage(2);
    await wait(50);
    (book as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await wait(50);
    expect(book.currentPage).toBe(1);
  });

  it('should render cover and book container in shadow DOM', async () => {
    book = await createWithPages(4);
    const cover = queryShadow(book as HTMLElement, '.cover');
    expect(cover).toBeTruthy();
    const bookDiv = queryShadow(book as HTMLElement, '.book');
    expect(bookDiv).toBeTruthy();
  });

  it('should have a hidden slot container for light DOM pages', async () => {
    book = await createWithPages(4);
    const hiddenDiv = queryShadow(book as HTMLElement, '[hidden]');
    expect(hiddenDiv).toBeTruthy();
    const slot = hiddenDiv!.querySelector('slot');
    expect(slot).toBeTruthy();
  });

  it('should set tabindex for keyboard navigation', async () => {
    book = await createWithPages(4);
    expect((book as HTMLElement).getAttribute('tabindex')).toBe('0');
  });

  it('should not emit page-turn when page does not change', async () => {
    book = await createWithPages(4);
    let eventFired = false;
    (book as HTMLElement).addEventListener('page-turn', () => {
      eventFired = true;
    });
    book.prevPage(); // already at 0
    await wait(50);
    expect(eventFired).toBe(false);
  });

  it('should clamp goToPage to valid range', async () => {
    book = await createWithPages(4);
    book.goToPage(100);
    await wait(50);
    expect(book.currentPage).toBe(4);
    book.goToPage(-5);
    await wait(50);
    expect(book.currentPage).toBe(0);
  });
});
