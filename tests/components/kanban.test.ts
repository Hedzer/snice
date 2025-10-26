import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/kanban/snice-kanban';
import type { SniceKanbanElement, KanbanColumn, KanbanCard } from '../../components/kanban/snice-kanban.types';

describe('snice-kanban', () => {
  let kanban: SniceKanbanElement;

  afterEach(() => {
    if (kanban) {
      removeComponent(kanban as HTMLElement);
    }
  });

  it('should render', async () => {
    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    expect(kanban).toBeTruthy();
  });

  it('should have default properties', async () => {
    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    expect(kanban.columns).toEqual([]);
    expect(kanban.allowDragDrop).toBe(true);
    expect(kanban.showCardCount).toBe(true);
  });

  it('should add column', async () => {
    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    const column: KanbanColumn = {
      id: 1,
      title: 'To Do',
      cards: []
    };

    kanban.addColumn(column);
    await wait();

    expect(kanban.columns.length).toBe(1);
    expect(kanban.columns[0].title).toBe('To Do');
  });

  it('should remove column', async () => {
    const columns: KanbanColumn[] = [
      { id: 1, title: 'To Do', cards: [] },
      { id: 2, title: 'Done', cards: [] }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    kanban.removeColumn(1);
    await wait();

    expect(kanban.columns.length).toBe(1);
    expect(kanban.columns[0].id).toBe(2);
  });

  it('should add card to column', async () => {
    const columns: KanbanColumn[] = [
      { id: 1, title: 'To Do', cards: [] }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    const card: KanbanCard = {
      id: 1,
      title: 'Test Card'
    };

    kanban.addCard(1, card);
    await wait();

    expect(kanban.columns[0].cards.length).toBe(1);
    expect(kanban.columns[0].cards[0].title).toBe('Test Card');
  });

  it('should remove card', async () => {
    const columns: KanbanColumn[] = [
      {
        id: 1,
        title: 'To Do',
        cards: [
          { id: 1, title: 'Card 1' },
          { id: 2, title: 'Card 2' }
        ]
      }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    kanban.removeCard(1);
    await wait();

    expect(kanban.columns[0].cards.length).toBe(1);
    expect(kanban.columns[0].cards[0].id).toBe(2);
  });

  it('should move card between columns', async () => {
    const columns: KanbanColumn[] = [
      {
        id: 1,
        title: 'To Do',
        cards: [{ id: 1, title: 'Card 1' }]
      },
      {
        id: 2,
        title: 'Done',
        cards: []
      }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    kanban.moveCard(1, 2);
    await wait();

    expect(kanban.columns[0].cards.length).toBe(0);
    expect(kanban.columns[1].cards.length).toBe(1);
    expect(kanban.columns[1].cards[0].id).toBe(1);
  });

  it('should get column by id', async () => {
    const columns: KanbanColumn[] = [
      { id: 1, title: 'To Do', cards: [] },
      { id: 2, title: 'Done', cards: [] }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    const column = kanban.getColumn(1);
    expect(column?.title).toBe('To Do');
  });

  it('should get card by id', async () => {
    const columns: KanbanColumn[] = [
      {
        id: 1,
        title: 'To Do',
        cards: [{ id: 1, title: 'Test Card' }]
      }
    ];

    kanban = await createComponent<SniceKanbanElement>('snice-kanban');
    kanban.columns = columns;
    await wait();

    const card = kanban.getCard(1);
    expect(card?.title).toBe('Test Card');
  });

  it('should support drag and drop toggle', async () => {
    kanban = await createComponent<SniceKanbanElement>('snice-kanban', {
      'allow-drag-drop': false
    });
    expect(kanban.allowDragDrop).toBe(false);
  });

  it('should support card count toggle', async () => {
    kanban = await createComponent<SniceKanbanElement>('snice-kanban', {
      'show-card-count': false
    });
    expect(kanban.showCardCount).toBe(false);
  });
});
