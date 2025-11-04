import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { SniceKanbanElement, KanbanColumn, KanbanCard, KanbanLabel } from './snice-kanban.types';
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
  private dragOverCard: KanbanCard | null = null;
  private dropIndex: number | null = null;
  private labelFilters: string[] = [];
  private searchQuery: string = '';

  @dispatch('kanban-card-move', { bubbles: true, composed: true })
  private dispatchCardMove(card: KanbanCard, fromColumn: string | number, toColumn: string | number) {
    return { card, fromColumn, toColumn, kanban: this };
  }

  @dispatch('kanban-card-click', { bubbles: true, composed: true })
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

  moveCard(cardId: string | number, targetColumnId: string | number, targetIndex?: number): void {
    let cardToMove: KanbanCard | null = null;
    let sourceColId: string | number | null = null;

    const updateColumns = () => {
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

      // Add card to target column at specified index
      if (cardToMove && sourceColId) {
        this.columns = this.columns.map(col => {
          if (col.id === targetColumnId) {
            const newCards = [...col.cards];
            const insertIndex = targetIndex !== undefined ? targetIndex : newCards.length;
            newCards.splice(insertIndex, 0, cardToMove!);
            return { ...col, cards: newCards };
          }
          return col;
        });

        this.dispatchCardMove(cardToMove, sourceColId, targetColumnId);
      }
    };

    // Use View Transitions API if available
    if ('startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        updateColumns();
      });
    } else {
      updateColumns();
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

  filterByLabels(labels: string[]): void {
    this.labelFilters = labels;
    // Trigger re-render by reassigning columns
    this.columns = this.columns;
  }

  search(query: string): void {
    this.searchQuery = query.toLowerCase();
    // Trigger re-render by reassigning columns
    this.columns = this.columns;
  }

  clearFilters(): void {
    this.labelFilters = [];
    this.searchQuery = '';
    // Trigger re-render by reassigning columns
    this.columns = this.columns;
  }

  private getLabelText(label: string | KanbanLabel): string {
    return typeof label === 'string' ? label : label.text;
  }

  private get filteredColumns(): KanbanColumn[] {
    if (this.labelFilters.length === 0 && !this.searchQuery) {
      return this.columns;
    }

    return this.columns.map(column => {
      const filteredCards = column.cards.filter(card => {
        // Label filter
        if (this.labelFilters.length > 0) {
          const hasMatchingLabel = card.labels?.some(label =>
            this.labelFilters.includes(this.getLabelText(label))
          );
          if (!hasMatchingLabel) return false;
        }

        // Search filter
        if (this.searchQuery) {
          const titleMatch = card.title.toLowerCase().includes(this.searchQuery);
          const descMatch = card.description?.toLowerCase().includes(this.searchQuery);
          if (!titleMatch && !descMatch) return false;
        }

        return true;
      });

      return {
        ...column,
        cards: filteredCards
      };
    });
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
    this.dragOverCard = null;
    this.dropIndex = null;
  }

  private handleCardDragOver(card: KanbanCard, columnId: string | number, e: DragEvent) {
    if (!this.allowDragDrop || !this.draggedCard || this.draggedCard.id === card.id) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    // Determine if we should insert before or after based on mouse position
    const cardElement = e.currentTarget as HTMLElement;
    const rect = cardElement.getBoundingClientRect();

    // Use 40% threshold instead of 50% to make it easier to target between cards
    const upperThreshold = rect.top + rect.height * 0.4;
    const lowerThreshold = rect.top + rect.height * 0.6;

    this.dragOverCard = card;

    // Calculate drop index
    const column = this.getColumn(columnId);
    if (!column) return;

    const cardIndex = column.cards.findIndex(c => c.id === card.id);
    let visualCardIndex = cardIndex; // Which card to show the indicator on

    if (e.clientY < upperThreshold) {
      this.dropIndex = cardIndex;
      visualCardIndex = cardIndex;
    } else if (e.clientY > lowerThreshold) {
      this.dropIndex = cardIndex + 1;
      visualCardIndex = cardIndex + 1; // Show on next card
    } else {
      // In the middle zone, prefer inserting after
      this.dropIndex = cardIndex + 1;
      visualCardIndex = cardIndex + 1;
    }

    // Adjust if dragging within same column
    if (this.sourceColumnId === columnId) {
      const draggedIndex = column.cards.findIndex(c => c.id === this.draggedCard!.id);
      // If dragged card is before the drop position, indices shift down after removal
      if (draggedIndex < this.dropIndex) {
        this.dropIndex = this.dropIndex - 1;
      }
      // Adjust visual indicator too
      if (draggedIndex < visualCardIndex) {
        visualCardIndex = visualCardIndex - 1;
      }
    }

    // Remove drag-over class from all cards
    this.shadowRoot?.querySelectorAll('.card--drag-over').forEach(el => {
      el.classList.remove('card--drag-over');
    });

    // Add indicator to the card at the drop position
    if (visualCardIndex >= 0 && visualCardIndex < column.cards.length) {
      const targetCard = column.cards[visualCardIndex];
      const allCards = Array.from(this.shadowRoot?.querySelectorAll('.card') || []);
      allCards.forEach((el: Element) => {
        const cardEl = el as HTMLElement;
        // Find the matching card element by checking nearby content
        if (cardEl.textContent?.includes(targetCard.title)) {
          cardEl.classList.add('card--drag-over');
        }
      });
    }
  }

  private handleCardDragEnter(e: DragEvent) {
    if (!this.allowDragDrop || !this.draggedCard) return;
    // Drag over handles the visual feedback
  }

  private handleCardDragLeave(e: DragEvent) {
    // Don't remove here - let dragover handle it for smoother transitions
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

    // Remove drag-over class from all cards
    this.shadowRoot?.querySelectorAll('.card--drag-over').forEach(el => {
      el.classList.remove('card--drag-over');
    });

    if (!this.draggedCard || !this.sourceColumnId) return;

    // Move card to new position
    if (this.sourceColumnId !== columnId || this.dropIndex !== null) {
      this.moveCard(this.draggedCard.id, columnId, this.dropIndex ?? undefined);
    }

    this.draggedCard = null;
    this.sourceColumnId = null;
    this.dragOverCard = null;
    this.dropIndex = null;
  }

  private handleCardClick(card: KanbanCard) {
    this.dispatchCardClick(card);
  }

  @render()
  template() {
    return html/*html*/`
      <div class="kanban">
        ${this.filteredColumns.map(column => html/*html*/`
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
                    style="${card.color ? `border-left-color: ${card.color}; view-transition-name: card-${card.id}` : `view-transition-name: card-${card.id}`}"
                    @dragstart=${(e: DragEvent) => this.handleCardDragStart(card, column.id, e)}
                    @dragend=${(e: DragEvent) => this.handleCardDragEnd(e)}
                    @dragover=${(e: DragEvent) => this.handleCardDragOver(card, column.id, e)}
                    @dragenter=${(e: DragEvent) => this.handleCardDragEnter(e)}
                    @dragleave=${(e: DragEvent) => this.handleCardDragLeave(e)}
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
                          ${card.labels?.map(label => {
                            const labelText = this.getLabelText(label);
                            const labelObj = typeof label === 'string' ? null : label;
                            const style = labelObj ?
                              `${labelObj.color ? `color: ${labelObj.color};` : ''} ${labelObj.background ? `background: ${labelObj.background};` : ''}` : '';
                            const icon = labelObj?.icon || '';
                            const iconPosition = labelObj?.iconPosition || 'left';

                            return html`
                              <span class="card__label" style="${style}">
                                <if ${icon && iconPosition === 'left'}>
                                  <span class="card__label-icon">${icon}</span>
                                </if>
                                ${labelText}
                                <if ${icon && iconPosition === 'right'}>
                                  <span class="card__label-icon">${icon}</span>
                                </if>
                              </span>
                            `;
                          })}
                        </div>
                      </if>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-kanban': SniceKanban;
  }
}
