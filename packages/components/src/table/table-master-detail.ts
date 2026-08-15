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
  private contentCache = new Map<any, string | HTMLElement>();
  /** Last value signature seen per row, so in-place mutations evict the cache. */
  private fingerprints = new Map<any, string>();
  private rowByIndex = new Map<number, any>();
  private measuredHeights = new Map<any, number>();
  onHeightChange: (() => void) | null = null;

  attach(tableEl: HTMLElement, options: DetailPanelOptions) {
    this.tableElement = tableEl;
    this.options = options;
    this.contentCache.clear();
    this.fingerprints.clear();
    this.rowByIndex.clear();
    this.measuredHeights.clear();
  }

  /**
   * Eagerly construct detail content when lazy=false.
   *
   * `fingerprint` (the table's per-row value signature) also evicts rows whose
   * fields were mutated in place: the cache is keyed by row identity, so an
   * unchanged identity would otherwise keep serving a panel built from the
   * pre-mutation values.
   */
  prepare(rows: any[], fingerprint?: (row: any) => string) {
    if (!this.options) return;
    this.rowByIndex = new Map(rows.map((row, index) => [index, row]));
    const currentRows = new Set(rows);
    for (const row of [...this.contentCache.keys()]) {
      if (!currentRows.has(row)) this.contentCache.delete(row);
      else if (fingerprint && this.fingerprints.get(row) !== fingerprint(row)) {
        this.contentCache.delete(row);
        this.measuredHeights.delete(row);
      }
    }
    if (fingerprint) {
      this.fingerprints = new Map(rows.map(row => [row, fingerprint(row)]));
    }
    for (const row of this.measuredHeights.keys()) {
      if (!currentRows.has(row)) this.measuredHeights.delete(row);
    }
    if (this.options.lazy === false) rows.forEach((row, index) => this.getContent(row, index));
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
    if (this.options?.lazy !== false) {
      const row = this.rowByIndex.get(rowIndex);
      if (row !== undefined) {
        this.contentCache.delete(row);
        this.measuredHeights.delete(row);
      }
    }
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
    if (this.options?.lazy !== false) {
      this.contentCache.clear();
      this.measuredHeights.clear();
    }
  }

  /** Get set of expanded row indices */
  getExpandedRows(): Set<number> {
    return new Set(this.expandedRows);
  }

  /** Replace expansion indices without emitting user-action events. */
  setExpandedRows(rowIndices: Iterable<number>) {
    const next = new Set(rowIndices);
    if (this.options?.lazy !== false) {
      for (const index of this.expandedRows) {
        if (next.has(index)) continue;
        const row = this.rowByIndex.get(index);
        if (row !== undefined) {
          this.contentCache.delete(row);
          this.measuredHeights.delete(row);
        }
      }
    }
    this.expandedRows = next;
  }

  /** Create the expand/collapse toggle button — uses same chevron SVG as snice-accordion */
  createToggleButton(rowIndex: number): HTMLElement {
    const expanded = this.isExpanded(rowIndex);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `detail-toggle${expanded ? ' detail-toggle--expanded' : ''}`;
    btn.setAttribute('aria-expanded', String(expanded));
    btn.setAttribute('aria-label', expanded ? 'Collapse row' : 'Expand row');
    const customIcon = expanded ? this.options?.collapseIcon : this.options?.expandIcon;
    if (customIcon) {
      if (customIcon.trim().startsWith('<')) btn.innerHTML = customIcon;
      else btn.textContent = customIcon;
    } else {
      btn.innerHTML = `<svg class="detail-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle(rowIndex);
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
    td.style.padding = '0';
    td.style.border = 'none';

    // Animated wrapper — same pattern as snice-accordion
    const wrapper = document.createElement('div');
    wrapper.className = 'detail-content';

    const inner = document.createElement('div');
    inner.className = 'detail-content-inner';

    const content = this.getContent(row, rowIndex);
    if (typeof content === 'string') {
      inner.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      inner.appendChild(content);
    }

    wrapper.appendChild(inner);
    td.appendChild(wrapper);

    // Trigger animation after insertion
    requestAnimationFrame(() => {
      const configuredHeight = this.options?.detailHeight;
      const height = configuredHeight === undefined || configuredHeight === 'auto'
        ? `${inner.scrollHeight}px`
        : (typeof configuredHeight === 'number' ? `${configuredHeight}px` : configuredHeight);
      if (configuredHeight !== undefined && configuredHeight !== 'auto') {
        inner.style.height = height;
        inner.style.overflow = 'auto';
      }
      wrapper.style.setProperty('--detail-max-height', height);
      wrapper.classList.add('detail-content--open');
      const measuredHeight = inner.getBoundingClientRect().height || inner.scrollHeight;
      const previousHeight = this.measuredHeights.get(row);
      if (measuredHeight > 0 && measuredHeight !== previousHeight) {
        this.measuredHeights.set(row, measuredHeight);
        this.onHeightChange?.();
      }
    });

    tr.appendChild(td);
    return tr;
  }

  isEnabled(): boolean {
    return this.options !== null;
  }

  /** Extra height contributed by an expanded detail row. Auto/non-pixel
   * panels use the most recent browser measurement. */
  getFixedAdditionalHeight(rowIndex: number): number {
    if (!this.isExpanded(rowIndex)) return 0;
    const configured = this.options?.detailHeight;
    if (typeof configured === 'number') return Math.max(0, configured);
    if (typeof configured === 'string' && /^\d+(?:\.\d+)?px$/.test(configured.trim())) {
      return Math.max(0, Number.parseFloat(configured));
    }
    const row = this.rowByIndex.get(rowIndex);
    return row === undefined ? 0 : (this.measuredHeights.get(row) || 0);
  }

  private getContent(row: any, rowIndex: number): string | HTMLElement {
    if (!this.options) return '';
    this.rowByIndex.set(rowIndex, row);
    if (!this.contentCache.has(row)) {
      this.contentCache.set(row, this.options.getDetailContent(row, rowIndex));
    }
    return this.contentCache.get(row)!;
  }
}
