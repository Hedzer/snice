import { element, property, render, styles, html, css, on, dispatch } from 'snice';
import type { ReportRow } from '../types/app';
import { formatCurrency } from '../services/mock-data';

@element('data-table')
export class DataTable extends HTMLElement {
  @property({ type: Array }) rows: ReportRow[] = [];
  @property() searchQuery = '';

  @on('input', 'input', { debounce: 300 })
  handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.emitSearch();
  }

  @dispatch('search-changed')
  emitSearch() {
    return { query: this.searchQuery };
  }

  @render()
  renderContent() {
    const trendIcon = (trend: string) => {
      if (trend === 'up') return html`<span class="trend trend-up">&#9650;</span>`;
      if (trend === 'down') return html`<span class="trend trend-down">&#9660;</span>`;
      return html`<span class="trend trend-flat">&#9644;</span>`;
    };

    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Product Performance</h3>
          <div class="search-box">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <input type="text" placeholder="Search products..." .value=${this.searchQuery} />
          </div>
        </div>
        <div class="table-wrap">
          <case ${this.rows.length > 0 ? 'data' : 'empty'}>
            <when value="data">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th class="align-right">Revenue</th>
                    <th class="align-right">Orders</th>
                    <th class="align-right">Conv. %</th>
                    <th class="align-center">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.rows.map(
                    (row) => html`
                      <tr key=${row.id}>
                        <td class="cell-name">${row.name}</td>
                        <td>
                          <span class="badge">${row.category}</span>
                        </td>
                        <td class="align-right mono">${formatCurrency(row.revenue)}</td>
                        <td class="align-right mono">${row.orders.toLocaleString()}</td>
                        <td class="align-right mono">${row.conversion.toFixed(1)}%</td>
                        <td class="align-center">${trendIcon(row.trend)}</td>
                      </tr>
                    `
                  )}
                </tbody>
              </table>
            </when>
            <default>
              <div class="empty">
                <if ${this.searchQuery.length > 0}>
                  <span>No results for "${this.searchQuery}"</span>
                </if>
                <if ${this.searchQuery.length === 0}>
                  <span>No data available</span>
                </if>
              </div>
            </default>
          </case>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .panel {
        background: var(--dash-surface, #1e293b);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius-lg, 12px);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--dash-border, #334155);
        gap: 1rem;
        flex-wrap: wrap;
      }

      .panel-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--dash-text, #f1f5f9);
        margin: 0;
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--dash-bg, #0f172a);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius, 8px);
        padding: 0.375rem 0.75rem;
      }

      .search-icon {
        color: var(--dash-text-muted, #64748b);
        flex-shrink: 0;
      }

      .search-box input {
        background: none;
        border: none;
        outline: none;
        color: var(--dash-text, #f1f5f9);
        font-size: 0.8125rem;
        width: 160px;
      }

      .search-box input::placeholder {
        color: var(--dash-text-muted, #64748b);
      }

      .table-wrap {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
      }

      thead {
        background: rgba(15, 23, 42, 0.5);
      }

      th {
        padding: 0.625rem 1rem;
        text-align: left;
        font-weight: 600;
        color: var(--dash-text-secondary, #94a3b8);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }

      td {
        padding: 0.75rem 1rem;
        color: var(--dash-text, #f1f5f9);
        border-bottom: 1px solid var(--dash-border, #334155);
        white-space: nowrap;
      }

      tr:last-child td {
        border-bottom: none;
      }

      tr:hover td {
        background: var(--dash-surface-hover, #334155);
      }

      .align-right { text-align: right; }
      .align-center { text-align: center; }

      .mono {
        font-variant-numeric: tabular-nums;
      }

      .cell-name {
        font-weight: 500;
      }

      .badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        background: rgba(99, 102, 241, 0.15);
        color: var(--dash-primary-light, #818cf8);
        font-size: 0.6875rem;
        font-weight: 500;
      }

      .trend {
        font-size: 0.75rem;
      }
      .trend-up { color: var(--dash-success, #10b981); }
      .trend-down { color: var(--dash-danger, #ef4444); }
      .trend-flat { color: var(--dash-text-muted, #64748b); }

      .empty {
        padding: 2.5rem;
        text-align: center;
        color: var(--dash-text-muted, #64748b);
        font-size: 0.875rem;
      }
    `;
  }
}
