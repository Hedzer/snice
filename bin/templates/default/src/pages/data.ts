import { page } from '../router';
import { render, styles, context, observe, property, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import { isAuthenticated } from '../guards/auth';

interface DataItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'archived';
  createdAt: string;
}

const placard: Placard = {
  name: 'data',
  title: 'Data',
  icon: '\ud83d\udcca',
  show: true,
  order: 5
};

// Mock data
const MOCK_ITEMS: DataItem[] = [
  { id: '1', title: 'API Integration', description: 'Connect external payment gateway', status: 'active', createdAt: '2025-01-15' },
  { id: '2', title: 'User Analytics', description: 'Implement tracking dashboard', status: 'pending', createdAt: '2025-01-20' },
  { id: '3', title: 'Email Templates', description: 'Design transactional email set', status: 'active', createdAt: '2025-02-01' },
  { id: '4', title: 'Legacy Migration', description: 'Migrate v1 database schema', status: 'archived', createdAt: '2024-12-10' },
  { id: '5', title: 'Mobile App', description: 'React Native companion app', status: 'pending', createdAt: '2025-02-15' },
  { id: '6', title: 'CI/CD Pipeline', description: 'GitHub Actions deployment workflow', status: 'active', createdAt: '2025-01-05' },
  { id: '7', title: 'Documentation', description: 'API reference and developer guides', status: 'active', createdAt: '2025-02-10' },
  { id: '8', title: 'Performance Audit', description: 'Lighthouse and Core Web Vitals', status: 'archived', createdAt: '2024-11-20' },
];

@page({ tag: 'data-page', routes: ['/data'], guards: [isAuthenticated], placard })
export class DataPage extends HTMLElement {
  private ctx?: Context;
  allItems: DataItem[] = [];
  filteredItems: DataItem[] = [];
  searchQuery = '';
  statusFilter: 'all' | 'active' | 'pending' | 'archived' = 'all';
  @property({ type: Boolean }) loading = true;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @observe('resize')
  handleResize(entries: ResizeObserverEntry[]) {
    const width = entries[0].contentRect.width;
    const table = this.shadowRoot?.querySelector('.data-table');
    if (table) {
      table.classList.toggle('compact', width < 600);
    }
  }

  connectedCallback() {
    // Simulate loading data
    setTimeout(() => {
      this.allItems = [...MOCK_ITEMS];
      this.filteredItems = this.allItems;
      this.loading = false;
    }, 500);
  }

  handleSearch(e: CustomEvent) {
    this.searchQuery = e.detail.query || '';
    this.applyFilters();
  }

  setStatusFilter(status: 'all' | 'active' | 'pending' | 'archived') {
    this.statusFilter = status;
    this.applyFilters();
  }

  private applyFilters() {
    let items = this.allItems;

    if (this.statusFilter !== 'all') {
      items = items.filter(i => i.status === this.statusFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    this.filteredItems = items;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'var(--success-color)',
      pending: 'var(--warning-color)',
      archived: 'var(--text-light)'
    };
    return colors[status] || 'var(--text-light)';
  }

  @render()
  renderContent() {
    return html`
      <div class="container">
        <div class="header">
          <h1>Data</h1>
          <span class="count">${this.filteredItems.length} items</span>
        </div>

        <div class="toolbar">
          <search-bar
            placeholder="Search items..."
            @search=${this.handleSearch}
          ></search-bar>

          <div class="filters">
            <button
              class="filter-btn ${this.statusFilter === 'all' ? 'active' : ''}"
              @click=${() => this.setStatusFilter('all')}
            >All</button>
            <button
              class="filter-btn ${this.statusFilter === 'active' ? 'active' : ''}"
              @click=${() => this.setStatusFilter('active')}
            >Active</button>
            <button
              class="filter-btn ${this.statusFilter === 'pending' ? 'active' : ''}"
              @click=${() => this.setStatusFilter('pending')}
            >Pending</button>
            <button
              class="filter-btn ${this.statusFilter === 'archived' ? 'active' : ''}"
              @click=${() => this.setStatusFilter('archived')}
            >Archived</button>
          </div>
        </div>

        <case ${this.loading ? 'loading' : this.filteredItems.length === 0 ? 'empty' : 'data'}>
          <when value="loading">
            <div class="center">
              <snice-spinner></snice-spinner>
            </div>
          </when>
          <when value="empty">
            <snice-empty-state
              icon="\ud83d\udd0d"
              title="No results"
              description="Try adjusting your search or filters"
            ></snice-empty-state>
          </when>
          <default>
            <div class="data-table">
              <div class="table-header">
                <span class="col-title">Title</span>
                <span class="col-status">Status</span>
                <span class="col-date">Created</span>
              </div>
              ${this.filteredItems.map(item => html`
                <div class="table-row" key=${item.id}>
                  <div class="col-title">
                    <strong>${item.title}</strong>
                    <span class="description">${item.description}</span>
                  </div>
                  <div class="col-status">
                    <span class="status-dot" style="background: ${this.getStatusColor(item.status)}"></span>
                    ${item.status}
                  </div>
                  <div class="col-date">${item.createdAt}</div>
                </div>
              `)}
            </div>
          </default>
        </case>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .container {
        padding: 2rem;
        max-width: 1000px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1.5rem;
      }

      h1 {
        margin: 0;
        color: var(--primary-color);
      }

      .count {
        font-size: 0.875rem;
        color: var(--text-light);
      }

      .toolbar {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      search-bar {
        width: 100%;
      }

      .filters {
        display: flex;
        gap: 0.5rem;
      }

      .filter-btn {
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        color: var(--text-light);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.15s;
      }

      .filter-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      .filter-btn.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .center {
        display: flex;
        justify-content: center;
        padding: 3rem;
      }

      .data-table {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
      }

      .table-header {
        display: grid;
        grid-template-columns: 1fr 120px 100px;
        padding: 0.75rem 1rem;
        background: var(--bg-secondary);
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-light);
      }

      .table-row {
        display: grid;
        grid-template-columns: 1fr 120px 100px;
        padding: 1rem;
        border-top: 1px solid var(--border-color);
        align-items: center;
        transition: background 0.15s;
      }

      .table-row:hover {
        background: var(--bg-secondary);
      }

      .col-title strong {
        display: block;
        color: var(--text-color);
        font-size: 0.9375rem;
      }

      .description {
        display: block;
        font-size: 0.8125rem;
        color: var(--text-light);
        margin-top: 0.125rem;
      }

      .col-status {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--text-color);
        text-transform: capitalize;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .col-date {
        font-size: 0.8125rem;
        color: var(--text-light);
      }

      .data-table.compact .table-header {
        display: none;
      }

      .data-table.compact .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }

      @media (max-width: 640px) {
        .filters {
          flex-wrap: wrap;
        }
      }
    `;
  }
}
