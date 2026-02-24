import { page } from '../router';
import { render, styles, html, css, property, ready, on } from 'snice';
import type { Placard } from 'snice';
import type { ReportRow } from '../types/app';
import { generateReportData } from '../services/mock-data';

const placard: Placard = {
  name: 'reports',
  title: 'Reports',
  icon: '\u{1f4c4}',
  show: true,
  order: 2,
};

@page({ tag: 'reports-page', routes: ['/reports'], placard })
export class ReportsPage extends HTMLElement {
  @property({ type: Array }) rows: ReportRow[] = [];
  @property() status: 'loading' | 'error' | 'ready' = 'loading';
  @property() searchQuery = '';

  @ready()
  load() {
    this.loadData();
  }

  private loadData(search?: string) {
    this.status = 'loading';
    try {
      this.rows = generateReportData(search);
      this.status = 'ready';
    } catch {
      this.status = 'error';
    }
  }

  @on('search-changed', 'data-table')
  handleSearchChanged(e: CustomEvent) {
    const query = e.detail.query;
    this.searchQuery = query;
    this.loadData(query);
  }

  @render()
  renderContent() {
    const totalRevenue = this.rows.reduce((s, r) => s + r.revenue, 0);
    const totalOrders = this.rows.reduce((s, r) => s + r.orders, 0);
    const avgConversion = this.rows.length > 0
      ? this.rows.reduce((s, r) => s + r.conversion, 0) / this.rows.length
      : 0;

    return html`
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Reports</h1>
            <p class="page-subtitle">Product performance and analytics</p>
          </div>
        </div>

        <case ${this.status}>
          <when value="loading">
            <div class="loading">
              <div class="spinner"></div>
              <span>Loading report data...</span>
            </div>
          </when>
          <when value="error">
            <div class="error">
              <p>Failed to load report data.</p>
              <button class="btn" @click=${() => this.loadData()}>Retry</button>
            </div>
          </when>
          <default>
            <div class="summary-row">
              <div class="summary-item">
                <span class="summary-label">Total Revenue</span>
                <span class="summary-value">$${totalRevenue.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Orders</span>
                <span class="summary-value">${totalOrders.toLocaleString()}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Avg. Conversion</span>
                <span class="summary-value">${avgConversion.toFixed(1)}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Products</span>
                <span class="summary-value">${this.rows.length}</span>
              </div>
            </div>

            <data-table
              .rows=${this.rows}
              searchQuery="${this.searchQuery}"
            ></data-table>
          </default>
        </case>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 1.5rem;
      }

      .page-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--dash-text, #f1f5f9);
        margin: 0 0 0.25rem 0;
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--dash-text-secondary, #94a3b8);
        margin: 0;
      }

      .summary-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .summary-item {
        background: var(--dash-surface, #1e293b);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius-lg, 12px);
        padding: 1rem 1.25rem;
      }

      .summary-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--dash-text-secondary, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        margin-bottom: 0.375rem;
      }

      .summary-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--dash-text, #f1f5f9);
        font-variant-numeric: tabular-nums;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 4rem 2rem;
        color: var(--dash-text-secondary, #94a3b8);
        font-size: 0.875rem;
      }

      .spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid var(--dash-border, #334155);
        border-top-color: var(--dash-primary, #6366f1);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error {
        text-align: center;
        padding: 3rem 2rem;
        color: var(--dash-text-secondary, #94a3b8);
      }

      .error p { margin: 0 0 1rem 0; }

      .btn {
        background: var(--dash-primary, #6366f1);
        color: white;
        border: none;
        padding: 0.5rem 1.25rem;
        border-radius: var(--dash-radius, 8px);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
      }

      .btn:hover { opacity: 0.9; }
    `;
  }
}
