export interface KanbanLabel {
  text: string;
  color?: string;
  background?: string;
  icon?: string; // emoji or text icon
  iconPosition?: 'left' | 'right';
}

export interface KanbanCard {
  id: string | number;
  title: string;
  description?: string;
  assignee?: string;
  labels?: (string | KanbanLabel)[];
  color?: string;
  data?: any;
}

export interface KanbanColumn {
  id: string | number;
  title: string;
  cards: KanbanCard[];
  color?: string;
  limit?: number;
  collapsed?: boolean;
}

export interface SniceKanbanElement extends HTMLElement {
  columns: KanbanColumn[];
  allowDragDrop: boolean;
  showCardCount: boolean;

  addColumn(column: KanbanColumn): void;
  removeColumn(id: string | number): void;
  addCard(columnId: string | number, card: KanbanCard): void;
  removeCard(cardId: string | number): void;
  moveCard(cardId: string | number, targetColumnId: string | number): void;
  getColumn(id: string | number): KanbanColumn | undefined;
  getCard(id: string | number): KanbanCard | undefined;

  filterByLabels(labels: string[]): void;
  search(query: string): void;
  clearFilters(): void;
}
