import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll, triggerKeyboardEvent } from './test-utils';
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
      const page = document.createElement('div');
      page.textContent = `Page ${i + 1}`;
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
    expect(book.mode).toBe('spread');
    expect(book.coverImage).toBe('');
    expect(book.title).toBe('');
    expect(book.author).toBe('');
  });

  it('should report total pages from children', async () => {
    book = await createWithPages(6);
    expect(book.totalPages).toBe(6);
  });

  it('should navigate to next page in spread mode', async () => {
    book = await createWithPages(6);
    book.nextPage();
    await wait(100);
    expect(book.currentPage).toBe(2);
  });

  it('should navigate to previous page', async () => {
    book = await createWithPages(6);
    book.nextPage();
    await wait(700);
    book.prevPage();
    await wait(100);
    expect(book.currentPage).toBe(0);
  });

  it('should go to specific page', async () => {
    book = await createWithPages(6);
    book.goToPage(4);
    await wait(100);
    expect(book.currentPage).toBe(4);
  });

  it('should go to first page', async () => {
    book = await createWithPages(6);
    book.goToPage(4);
    await wait(700);
    book.firstPage();
    await wait(100);
    expect(book.currentPage).toBe(0);
  });

  it('should go to last page', async () => {
    book = await createWithPages(6);
    book.lastPage();
    await wait(100);
    expect(book.currentPage).toBeGreaterThanOrEqual(4);
  });

  it('should not go past end', async () => {
    book = await createWithPages(4);
    book.goToPage(2);
    await wait(700);
    book.nextPage();
    await wait(100);
    // In spread mode with 4 pages, from page 2, next would be 4 which is out of bounds
    expect(book.currentPage).toBe(2);
  });

  it('should not go before start', async () => {
    book = await createWithPages(4);
    book.prevPage();
    await wait(100);
    expect(book.currentPage).toBe(0);
  });

  it('should support single mode', async () => {
    book = await createWithPages(4, { mode: 'single' });
    expect(book.mode).toBe('single');
    book.nextPage();
    await wait(100);
    expect(book.currentPage).toBe(1);
  });

  it('should navigate by step of 1 in single mode', async () => {
    book = await createWithPages(6, { mode: 'single' });
    book.nextPage();
    await wait(700);
    book.nextPage();
    await wait(100);
    expect(book.currentPage).toBe(2);
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

  it('should render navigation buttons', async () => {
    book = await createWithPages(4);
    const nav = queryShadow(book as HTMLElement, '.book__nav');
    expect(nav).toBeTruthy();
    const buttons = queryShadowAll(book as HTMLElement, '.book__nav-button');
    expect(buttons.length).toBe(4);
  });

  it('should render spine', async () => {
    book = await createWithPages(4);
    const spine = queryShadow(book as HTMLElement, '.book__spine');
    expect(spine).toBeTruthy();
  });

  it('should emit page-turn event', async () => {
    book = await createWithPages(6);
    let eventDetail: any = null;
    (book as HTMLElement).addEventListener('page-turn', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });
    book.nextPage();
    await wait(200);
    expect(eventDetail).toBeTruthy();
    expect(eventDetail.page).toBe(2);
    expect(eventDetail.direction).toBe('forward');
  });

  it('should emit page-flip-start event', async () => {
    book = await createWithPages(6);
    let fired = false;
    (book as HTMLElement).addEventListener('page-flip-start', () => {
      fired = true;
    });
    book.nextPage();
    await wait(100);
    expect(fired).toBe(true);
  });

  it('should emit page-flip-end event', async () => {
    book = await createWithPages(6);
    let fired = false;
    (book as HTMLElement).addEventListener('page-flip-end', () => {
      fired = true;
    });
    book.nextPage();
    await wait(800);
    expect(fired).toBe(true);
  });

  it('should respond to ArrowRight key', async () => {
    book = await createWithPages(6);
    (book as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(100);
    expect(book.currentPage).toBe(2);
  });

  it('should respond to ArrowLeft key', async () => {
    book = await createWithPages(6);
    book.goToPage(2);
    await wait(700);
    (book as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await wait(100);
    expect(book.currentPage).toBe(0);
  });

  it('should render cover when title is set', async () => {
    book = await createWithPages(4);
    book.title = 'Test Book';
    await wait(100);
    const cover = queryShadow(book as HTMLElement, '.book__cover-title');
    expect(cover).toBeTruthy();
    expect(cover!.textContent).toBe('Test Book');
  });

  it('should have accessible role', async () => {
    book = await createComponent<SniceBookElement>('snice-book');
    const container = queryShadow(book as HTMLElement, '.book');
    expect(container?.getAttribute('role')).toBe('document');
  });

  it('should show nav info', async () => {
    book = await createWithPages(6);
    const info = queryShadow(book as HTMLElement, '.book__nav-info');
    expect(info).toBeTruthy();
    expect(info!.textContent).toContain('/');
  });

  it('should block double-flip while animating', async () => {
    book = await createWithPages(10);
    book.nextPage();
    book.nextPage(); // Should be ignored while flipping
    await wait(100);
    expect(book.currentPage).toBe(2);
  });
});
