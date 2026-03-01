import { element, property, watch, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-metric-table.css?inline';
import type { SniceMetricTableElement, MetricColumn, SortDirection, SortChangeDetail, RowClickDetail } from './snice-metric-table.types';

@element('snice-metric-table')
export class SniceMetricTable extends HTMLElement implements SniceMetricTableElement {
  @property({ type: Array, attribute: false })
  columns: MetricColumn[] = [];

  @property({ type: Array, attribute: false })
  data: Record<string, any>[] = [];

  @property()
  sortBy = '';

  @property()
  sortDirection: SortDirection = 'desc';

  @watch('columns')
  handleColumnsChange() {
    // Re-render
  }

  @watch('data')
  handleDataChange() {
    // Re-render
  }

  @watch('sortBy')
  handleSortByChange() {
    // Re-render
  }

  @watch('sortDirection')
  handleSortDirectionChange() {
    // Re-render
  }

  private handleSort(columnKey: string) {
    if (this.sortBy === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = columnKey;
      this.sortDirection = 'desc';
    }
    this.emitSortChange({ sortBy: this.sortBy, sortDirection: this.sortDirection });
  }

  @dispatch('sort-change', { bubbles: true, composed: true })
  private emitSortChange(detail?: SortChangeDetail): SortChangeDetail {
    return detail!;
  }

  private handleRowClick(row: Record<string, any>, index: number) {
    this.emitRowClick({ row, index });
  }

  @dispatch('row-click', { bubbles: true, composed: true })
  private emitRowClick(detail?: RowClickDetail): RowClickDetail {
    return detail!;
  }

  private getSortedData(): Record<string, any>[] {
    if (!this.sortBy) return this.data;

    const col = this.columns.find(c => c.key === this.sortBy);
    const sorted = [...this.data];

    sorted.sort((a, b) => {
      const aVal = a[this.sortBy];
      const bVal = b[this.sortBy];

      // Handle sparkline arrays: sort by last value
      if (Array.isArray(aVal) && Array.isArray(bVal)) {
        const aLast = aVal[aVal.length - 1] || 0;
        const bLast = bVal[bVal.length - 1] || 0;
        return this.sortDirection === 'asc' ? aLast - bLast : bLast - aLast;
      }

      // Numeric comparison
      if (col?.type === 'number' || col?.type === 'percent' || col?.type === 'currency' || (typeof aVal === 'number' && typeof bVal === 'number')) {
        const numA = typeof aVal === 'number' ? aVal : parseFloat(String(aVal).replace(/[^0-9.-]/g, '')) || 0;
        const numB = typeof bVal === 'number' ? bVal : parseFloat(String(bVal).replace(/[^0-9.-]/g, '')) || 0;
        return this.sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison
      const strA = String(aVal || '');
      const strB = String(bVal || '');
      const cmp = strA.localeCompare(strB);
      return this.sortDirection === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }

  private formatValue(value: any, column: MetricColumn): string {
    if (value === null || value === undefined) return '\u2014';
    if (Array.isArray(value)) return ''; // Sparkline handled separately

    if (column.type === 'currency') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString(undefined, { style: 'currency', currency: column.format || 'USD' });
    }

    if (column.type === 'percent') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return String(value);
      return `${num.toFixed(1)}%`;
    }

    if (column.type === 'number') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString();
    }

    return String(value);
  }

  private getValueColorClass(value: any, column: MetricColumn): string {
    if (column.type !== 'number' && column.type !== 'percent' && column.type !== 'currency') return '';
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return '';
    if (num > 0) return 'mt__cell--positive';
    if (num < 0) return 'mt__cell--negative';
    return '';
  }

  private renderSparkline(values: number[]): unknown {
    if (!values || values.length < 2) return html``;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 80;
    const height = 24;
    const padding = 2;

    const points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const lastVal = values[values.length - 1];
    const firstVal = values[0];
    const isPositive = lastVal >= firstVal;
    const colorClass = isPositive ? 'mt__sparkline--positive' : 'mt__sparkline--negative';

    return html/*html*/`
      <svg class="mt__sparkline ${colorClass}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  private renderSortIcon(columnKey: string): unknown {
    const isActive = this.sortBy === columnKey;
    const isAsc = this.sortDirection === 'asc';

    return html/*html*/`
      <span class="mt__sort-icon ${isActive ? 'mt__sort-icon--active' : ''}">
        <if ${isActive && isAsc}>
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 13l5-5 5 5H5z"/></svg>
        </if>
        <if ${isActive && !isAsc}>
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M5 7l5 5 5-5H5z"/></svg>
        </if>
        <if ${!isActive}>
          <svg viewBox="0 0 20 20" fill="currentColor" opacity="0.3"><path d="M5 7l5 5 5-5H5z"/></svg>
        </if>
      </span>
    `;
  }

  private renderCell(row: Record<string, any>, column: MetricColumn): unknown {
    const value = row[column.key];
    const isSparkline = column.sparkline && Array.isArray(value);

    if (isSparkline) {
      return html/*html*/`
        <td class="mt__cell mt__cell--sparkline">${this.renderSparkline(value)}</td>
      `;
    }

    const colorClass = this.getValueColorClass(value, column);
    const formatted = this.formatValue(value, column);
    const isNumeric = column.type === 'number' || column.type === 'percent' || column.type === 'currency';

    return html/*html*/`
      <td class="mt__cell ${colorClass} ${isNumeric ? 'mt__cell--numeric' : ''}">${formatted}</td>
    `;
  }

  @render()
  renderContent() {
    const sortedData = this.getSortedData();

    return html/*html*/`
      <div class="mt" part="base">
        <div class="mt__wrapper">
          <table class="mt__table" part="table">
            <thead>
              <tr>
                ${this.columns.map(col => html/*html*/`
                  <th class="mt__header ${col.type === 'number' || col.type === 'percent' || col.type === 'currency' ? 'mt__header--numeric' : ''} ${col.sparkline ? 'mt__header--sparkline' : ''}"
                      @click=${() => this.handleSort(col.key)}
                      role="columnheader"
                      aria-sort="${this.sortBy === col.key ? (this.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}">
                    <span class="mt__header-content">
                      ${col.label}
                      ${this.renderSortIcon(col.key)}
                    </span>
                  </th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${sortedData.map((row, i) => html/*html*/`
                <tr class="mt__row"
                    part="row"
                    tabindex="0"
                    @click=${() => this.handleRowClick(row, i)}
                    @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleRowClick(row, i); } }}>
                  ${this.columns.map(col => this.renderCell(row, col))}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
