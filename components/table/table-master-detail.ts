/**
 * Master-detail (row expansion) for snice-table.
 * Expand a row to reveal a detail panel below it.
 */

export interface DetailPanelOptions {
  /** Render detail content for a row. Return HTML string or HTMLElement. */
  getDetailContent: (row: any, rowIndex: number) => string | HTMLElement;
  /** Detail panel height. 'auto' for content-based. Default: 'auto' */
  detailHeight?: string | number;
  /** Lazy: create on expand, destroy on collapse. Default: true */
  lazy?: boolean;
  /** Expand icon (collapsed state) */
  expandIcon?: string;
  /** Collapse icon (expanded state) */
  collapseIcon?: string;
}

export class TableMasterDetail {
  private expandedRows: Set<number> = new Set();
  private options: DetailPanelOptions | null = null;
  private tableElement: HTMLElement | null = null;

  attach(tableEl: HTMLElement, options: DetailPanelOptions) {
    this.tableElement = tableEl;
    this.options = options;
  }

  /** Check if a row is expanded */
  isExpanded(rowIndex: number): boolean {
    return this.expandedRows.has(rowIndex);
  }

  /** Toggle expansion of a row */
  toggle(rowIndex: number) {
    if (this.expandedRows.has(rowIndex)) {
      this.collapse(rowIndex);
    } else {
      this.expand(rowIndex);
    }
  }

  /** Expand a row */
  expand(rowIndex: number) {
    this.expandedRows.add(rowIndex);
    this.tableElement?.dispatchEvent(new CustomEvent('row-expand', {
      detail: { rowIndex },
      bubbles: true,
      composed: true,
    }));
  }

  /** Collapse a row */
  collapse(rowIndex: number) {
    this.expandedRows.delete(rowIndex);
    this.tableElement?.dispatchEvent(new CustomEvent('row-collapse', {
      detail: { rowIndex },
      bubbles: true,
      composed: true,
    }));
  }

  /** Expand all rows */
  expandAll(totalRows: number) {
    for (let i = 0; i < totalRows; i++) {
      this.expandedRows.add(i);
    }
  }

  /** Collapse all rows */
  collapseAll() {
    this.expandedRows.clear();
  }

  /** Get set of expanded row indices */
  getExpandedRows(): Set<number> {
    return new Set(this.expandedRows);
  }

  /** Create the expand/collapse toggle button */
  createToggleButton(rowIndex: number): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'detail-toggle';
    btn.setAttribute('aria-expanded', String(this.isExpanded(rowIndex)));
    btn.setAttribute('aria-label', this.isExpanded(rowIndex) ? 'Collapse row' : 'Expand row');
    btn.type = 'button';

    const expanded = this.isExpanded(rowIndex);
    const expandIcon = this.options?.expandIcon || '▶';
    const collapseIcon = this.options?.collapseIcon || '▼';
    btn.textContent = expanded ? collapseIcon : expandIcon;
    btn.className = `detail-toggle${expanded ? ' detail-toggle--expanded' : ''}`;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(rowIndex);
      // Re-render is handled by the table
      this.tableElement?.dispatchEvent(new CustomEvent('detail-toggle', {
        detail: { rowIndex, expanded: this.isExpanded(rowIndex) },
        bubbles: true,
        composed: true,
      }));
    });

    return btn;
  }

  /** Create the detail panel row (a <tr> with a single <td> spanning all columns) */
  createDetailRow(row: any, rowIndex: number, colSpan: number): HTMLTableRowElement | null {
    if (!this.options || !this.isExpanded(rowIndex)) return null;

    const tr = document.createElement('tr');
    tr.className = 'detail-row';
    tr.setAttribute('data-detail-for', String(rowIndex));

    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.className = 'detail-cell';

    const content = this.options.getDetailContent(row, rowIndex);
    if (typeof content === 'string') {
      td.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      td.appendChild(content);
    }

    tr.appendChild(td);
    return tr;
  }

  isEnabled(): boolean {
    return this.options !== null;
  }
}
