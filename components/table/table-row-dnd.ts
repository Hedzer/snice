/**
 * Row and column drag-and-drop for snice-table.
 * Uses native HTML5 Drag & Drop API.
 */

export class TableRowDnD {
  private enabled = false;
  private tableElement: HTMLElement | null = null;
  private dragSourceIndex = -1;
  private dropTargetIndex = -1;
  private dropIndicator: HTMLElement | null = null;

  attach(tableEl: HTMLElement) {
    this.tableElement = tableEl;
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Make a row draggable. Call when rendering each row. */
  makeRowDraggable(tr: HTMLTableRowElement, rowIndex: number, reorderable: boolean = true) {
    if (!reorderable) return;

    tr.draggable = true;
    tr.style.cursor = 'grab';

    tr.addEventListener('dragstart', (e) => {
      this.dragSourceIndex = rowIndex;
      tr.style.opacity = '0.5';
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(rowIndex));
    });

    tr.addEventListener('dragend', () => {
      tr.style.opacity = '1';
      tr.style.cursor = 'grab';
      this.removeDropIndicator();
      this.dragSourceIndex = -1;
    });

    tr.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      this.dropTargetIndex = rowIndex;
      this.showDropIndicator(tr);
    });

    tr.addEventListener('dragleave', () => {
      this.removeDropIndicator();
    });

    tr.addEventListener('drop', (e) => {
      e.preventDefault();
      this.removeDropIndicator();

      if (this.dragSourceIndex !== -1 && this.dragSourceIndex !== rowIndex) {
        this.tableElement?.dispatchEvent(new CustomEvent('row-reorder', {
          detail: {
            fromIndex: this.dragSourceIndex,
            toIndex: rowIndex,
          },
          bubbles: true,
          composed: true,
        }));
      }
      this.dragSourceIndex = -1;
    });
  }

  /** Create a drag handle cell */
  createDragHandle(): HTMLTableCellElement {
    const td = document.createElement('td');
    td.className = 'drag-handle-cell';
    td.textContent = '⠿';
    td.setAttribute('aria-label', 'Drag to reorder');
    return td;
  }

  private showDropIndicator(targetRow: HTMLElement) {
    this.removeDropIndicator();
    this.dropIndicator = document.createElement('div');
    this.dropIndicator.className = 'drop-indicator';
    this.dropIndicator.style.cssText = `
      position: absolute; left: 0; right: 0; height: 2px;
      background: var(--snice-color-primary, rgb(37 99 235));
      z-index: 10; pointer-events: none;
    `;

    const rect = targetRow.getBoundingClientRect();
    const parentRect = targetRow.parentElement?.getBoundingClientRect();
    if (parentRect) {
      const top = (this.dropTargetIndex > this.dragSourceIndex)
        ? rect.bottom - parentRect.top
        : rect.top - parentRect.top;
      this.dropIndicator.style.top = `${top}px`;
      targetRow.parentElement!.style.position = 'relative';
      targetRow.parentElement!.appendChild(this.dropIndicator);
    }
  }

  private removeDropIndicator() {
    this.dropIndicator?.remove();
    this.dropIndicator = null;
  }
}

export class TableColumnDnD {
  private enabled = false;
  private tableElement: HTMLElement | null = null;
  private dragSourceKey: string | null = null;

  attach(tableEl: HTMLElement) {
    this.tableElement = tableEl;
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Make a header cell draggable */
  makeHeaderDraggable(th: HTMLElement, columnKey: string, reorderable: boolean = true) {
    if (!reorderable) return;

    th.draggable = true;

    th.addEventListener('dragstart', (e) => {
      this.dragSourceKey = columnKey;
      th.style.opacity = '0.5';
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', columnKey);
    });

    th.addEventListener('dragend', () => {
      th.style.opacity = '1';
      this.dragSourceKey = null;
    });

    th.addEventListener('dragover', (e) => {
      if (!this.dragSourceKey || this.dragSourceKey === columnKey) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      th.style.borderLeft = '2px solid var(--snice-color-primary, rgb(37 99 235))';
    });

    th.addEventListener('dragleave', () => {
      th.style.borderLeft = '';
    });

    th.addEventListener('drop', (e) => {
      e.preventDefault();
      th.style.borderLeft = '';

      if (this.dragSourceKey && this.dragSourceKey !== columnKey) {
        this.tableElement?.dispatchEvent(new CustomEvent('column-reorder', {
          detail: {
            fromKey: this.dragSourceKey,
            toKey: columnKey,
          },
          bubbles: true,
          composed: true,
        }));
      }
      this.dragSourceKey = null;
    });
  }
}
