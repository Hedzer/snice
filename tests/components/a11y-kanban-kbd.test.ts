import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

describe('kanban: keyboard DnD', () => {
  async function makeBoard() {
    await import('../../components/kanban/snice-kanban');
    const el = document.createElement('snice-kanban') as any;
    el.columns = [
      { id: 'todo', title: 'To Do', cards: [
        { id: 'c1', title: 'Card 1' },
        { id: 'c2', title: 'Card 2' },
      ]},
      { id: 'doing', title: 'Doing', cards: [{ id: 'c3', title: 'Card 3' }]},
    ];
    document.body.appendChild(el);
    await el.ready;
    await wait(40);
    return el;
  }

  it('cards expose role=button, tabindex=0, accessible name', async () => {
    const el = await makeBoard();
    const cards = el.shadowRoot.querySelectorAll('.card');
    expect(cards.length).toBe(3);
    const first = cards[0] as HTMLElement;
    expect(first.getAttribute('role')).toBe('button');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('aria-label')).toContain('Card 1');
  });

  it('Space picks up card then ArrowRight moves it to the next column', async () => {
    const el = await makeBoard();
    const card = el.shadowRoot.querySelector('[data-card-id="c1"]') as HTMLElement;
    expect(card).toBeTruthy();

    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await wait(20);
    expect(el.kbGrabbedCardId).toBe('c1');

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await wait(40);

    // After move, "Doing" column should now contain Card 1
    const doingCol = el.columns.find((c: any) => c.id === 'doing');
    expect(doingCol.cards.some((c: any) => c.id === 'c1')).toBe(true);
    const todoCol = el.columns.find((c: any) => c.id === 'todo');
    expect(todoCol.cards.some((c: any) => c.id === 'c1')).toBe(false);
  });

  it('Escape cancels grabbed state', async () => {
    const el = await makeBoard();
    const card = el.shadowRoot.querySelector('[data-card-id="c1"]') as HTMLElement;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await wait(20);
    expect(el.kbGrabbedCardId).toBe('c1');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(20);
    expect(el.kbGrabbedCardId).toBe(null);
  });

  it('live region exists for announcements', async () => {
    const el = await makeBoard();
    const live = el.shadowRoot.querySelector('[role="status"][aria-live="polite"]');
    expect(live).toBeTruthy();
  });
});
