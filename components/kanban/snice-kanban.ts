import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { SniceKanbanElement, KanbanColumn, KanbanCard } from './snice-kanban.types';
import cssContent from './snice-kanban.css?inline';

@element('snice-kanban')
export class SniceKanban extends HTMLElement implements SniceKanbanElement {
  @property({ type: Array })
  columns: KanbanColumn[] = [];

  @property({ type: Boolean, attribute: 'allow-drag-drop' })
  allowDragDrop = true;

  @property({ type: Boolean, attribute: 'show-card-count' })
  showCardCount = true;

  private draggedCard: KanbanCard | null = null;
  private sourceColumnId: string | number | null = null;

  @dispatch('@snice/kanban-card-move', { bubbles: true, composed: true })
  private dispatchCardMove(card: KanbanCard, fromColumn: string | number, toColumn: string | number) {
    return { card, fromColumn, toColumn, kanban: this };
  }

  @dispatch('@snice/kanban-card-click', { bubbles: true, composed: true })
  private dispatchCardClick(card: KanbanCard) {
    return { card, kanban: this };
  }

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  addColumn(column: KanbanColumn): void {
    this.columns = [...this.columns, column];
  }

  removeColumn(id: string | number): void {
    this.columns = this.columns.filter(col => col.id !== id);
  }

  addCard(columnId: string | number, card: KanbanCard): void {
    this.columns = this.columns.map(col => {
      if (col.id === columnId) {
        return { ...col, cards: [...col.cards, card] };
      }
      return col;
    });
  }

  removeCard(cardId: string | number): void {
    this.columns = this.columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => card.id !== cardId)
    }));
  }

  moveCard(cardId: string | number, targetColumnId: string | number): void {
    let cardToMove: KanbanCard | null = null;
    let sourceColId: string | number | null = null;

    // Find and remove card from source column
    this.columns = this.columns.map(col => {
      const cardIndex = col.cards.findIndex(c => c.id === cardId);
      if (cardIndex !== -1) {
        cardToMove = col.cards[cardIndex];
        sourceColId = col.id;
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== cardId)
        };
      }
      return col;
    });

    // Add card to target column
    if (cardToMove && sourceColId) {
      this.columns = this.columns.map(col => {
        if (col.id === targetColumnId) {
          return { ...col, cards: [...col.cards, cardToMove!] };
        }
        return col;
      });

      this.dispatchCardMove(cardToMove, sourceColId, targetColumnId);
    }
  }

  getColumn(id: string | number): KanbanColumn | undefined {
    return this.columns.find(col => col.id === id);
  }

  getCard(id: string | number): KanbanCard | undefined {
    for (const column of this.columns) {
      const card = column.cards.find(c => c.id === id);
      if (card) return card;
    }
    return undefined;
  }

  private handleCardDragStart(card: KanbanCard, columnId: string | number, e: DragEvent) {
    if (!this.allowDragDrop) return;

    this.draggedCard = card;
    this.sourceColumnId = columnId;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', '');
    }

    // Add dragging class
    (e.target as HTMLElement).classList.add('card--dragging');
  }

  private handleCardDragEnd(e: DragEvent) {
    (e.target as HTMLElement).classList.remove('card--dragging');
  }

  private handleColumnDragOver(e: DragEvent) {
    if (!this.allowDragDrop || !this.draggedCard) return;

    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private handleColumnDragEnter(e: DragEvent) {
    if (!this.allowDragDrop || !this.draggedCard) return;

    const target = (e.currentTarget as HTMLElement).querySelector('.column__cards');
    target?.classList.add('column__cards--drag-over');
  }

  private handleColumnDragLeave(e: DragEvent) {
    const target = (e.currentTarget as HTMLElement).querySelector('.column__cards');
    target?.classList.remove('column__cards--drag-over');
  }

  private handleColumnDrop(columnId: string | number, e: DragEvent) {
    e.preventDefault();

    const target = (e.currentTarget as HTMLElement).querySelector('.column__cards');
    target?.classList.remove('column__cards--drag-over');

    if (!this.draggedCard || !this.sourceColumnId) return;

    if (this.sourceColumnId !== columnId) {
      this.moveCard(this.draggedCard.id, columnId);
    }

    this.draggedCard = null;
    this.sourceColumnId = null;
  }

  private handleCardClick(card: KanbanCard) {
    this.dispatchCardClick(card);
  }

  @render()
  template() {
    return html`
      <div class="kanban">
        ${this.columns.map(column => {
          const isOverLimit = column.limit && column.cards.length > column.limit;

          return html`
            <div
              class="column ${column.collapsed ? 'column--collapsed' : ''}"
              @dragover=${(e: DragEvent) => this.handleColumnDragOver(e)}
              @dragenter=${(e: DragEvent) => this.handleColumnDragEnter(e)}
              @dragleave=${(e: DragEvent) => this.handleColumnDragLeave(e)}
              @drop=${(e: DragEvent) => this.handleColumnDrop(column.id, e)}>
              <div class="column__header" style="${column.color ? `border-color: ${column.color}` : ''}">
                <div class="column__title">
                  ${column.title}
                  <if ${this.showCardCount}>
                    <span class="column__count">${column.cards.length}</span>
                  </if>
                  <if ${column.limit}>
                    <span class="column__limit ${isOverLimit ? 'column__limit--exceeded' : ''}">
                      / ${column.limit}
                    </span>
                  </if>
                </div>
              </div>

              <div class="column__cards ${column.cards.length === 0 ? 'column__cards--empty' : ''}">
                <if ${column.cards.length === 0}>
                  <div>No cards</div>
                </if>

                ${column.cards.map(card => html`
                  <div
                    class="card"
                    draggable="${this.allowDragDrop}"
                    style="${card.color ? `border-left-color: ${card.color}` : ''}"
                    @dragstart=${(e: DragEvent) => this.handleCardDragStart(card, column.id, e)}
                    @dragend=${(e: DragEvent) => this.handleCardDragEnd(e)}
                    @click=${() => this.handleCardClick(card)}>
                    <div class="card__title">${card.title}</div>
                    <if ${card.description}>
                      <div class="card__description">${card.description}</div>
                    </if>
                    <div class="card__meta">
                      <if ${card.assignee}>
                        <div class="card__assignee">
                          👤 ${card.assignee}
                        </div>
                      </if>
                      <if ${card.labels && card.labels.length > 0}>
                        <div class="card__labels">
                          ${card.labels.map(label => html`
                            <span class="card__label">${label}</span>
                          `)}
                        </div>
                      </if>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-kanban': SniceKanban;
  }
}
