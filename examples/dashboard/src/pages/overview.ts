import { page } from '../router';
import { render, styles, html, css, property, context, ready, dispose, observe } from 'snice';
import type { Placard, Context } from 'snice';
import type { DashboardAppContext, MetricCard, TimeSeriesPoint, ChartDataPoint, ActivityItem } from '../types/app';
import { generateMetrics, generateTimeSeries, generateCategoryData, generateActivity } from '../services/mock-data';

const placard: Placard = {
  name: 'overview',
  title: 'Overview',
  icon: '\u{1f4ca}',
  show: true,
  order: 1,
};

@page({ tag: 'overview-page', routes: ['/', '/overview'], placard })
export class OverviewPage extends HTMLElement {
  @property({ type: Array }) metrics: MetricCard[] = [];
  @property({ type: Array }) timeSeries: TimeSeriesPoint[] = [];
  @property({ type: Array }) categories: ChartDataPoint[] = [];
  @property({ type: Array }) activity: ActivityItem[] = [];
  @property() status: 'loading' | 'error' | 'ready' = 'loading';
  @property({ type: Boolean }) isWide = true;

  private ctx?: Context;
  private refreshTimer?: ReturnType<typeof setInterval>;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @observe('media:(min-width: 1024px)')
  handleMediaChange(matches: boolean) {
    this.isWide = matches;
  }

  @ready()
  async load() {
    await this.loadData();
    const app = this.ctx?.application as DashboardAppContext | undefined;
    const interval = app?.refreshInterval || 30000;
    this.refreshTimer = setInterval(() => this.refreshMetrics(), interval);
  }

  @dispose()
  cleanup() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private async loadData() {
    this.status = 'loading';
    try {
      this.metrics = generateMetrics();
      this.timeSeries = generateTimeSeries(30);
      this.categories = generateCategoryData();
      this.activity = generateActivity();
      this.status = 'ready';
    } catch {
      this.status = 'error';
    }
  }

  private refreshMetrics() {
    try {
      this.metrics = generateMetrics();
    } catch {
      // Silent refresh failure
    }
  }

  @render()
  renderContent() {
    return html`
      <div class="page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard Overview</h1>
            <p class="page-subtitle">Key metrics and recent activity</p>
          </div>
        </div>

        <case ${this.status}>
          <when value="loading">
            <div class="loading">
              <div class="spinner"></div>
              <span>Loading dashboard data...</span>
            </div>
          </when>
          <when value="error">
            <div class="error">
              <p>Failed to load data.</p>
              <button class="btn" @click=${() => this.loadData()}>Retry</button>
            </div>
          </when>
          <default>
            <div class="metrics-grid">
              ${this.metrics.map(
                (m) => html`
                  <metric-card
                    key=${m.id}
                    label="${m.label}"
                    .value=${m.value}
                    .previousValue=${m.previousValue}
                    format="${m.format}"
                    icon="${m.icon}"
                  ></metric-card>
                `
              )}
            </div>

            <div class="charts-row" ?data-stacked=${!this.isWide}>
              <div class="chart-main">
                <bar-chart title="Revenue Over Time" .data=${this.timeSeries}></bar-chart>
              </div>
              <div class="chart-side">
                <donut-chart title="Sales by Category" .data=${this.categories}></donut-chart>
              </div>
            </div>

            <activity-feed .items=${this.activity}></activity-feed>
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

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .charts-row {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .charts-row[data-stacked] {
        grid-template-columns: 1fr;
      }

      .chart-main, .chart-side {
        min-width: 0;
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

      .error p {
        margin: 0 0 1rem 0;
      }

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

      .btn:hover {
        opacity: 0.9;
      }
    `;
  }
}
