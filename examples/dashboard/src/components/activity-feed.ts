import { element, property, render, styles, html, css } from 'snice';
import type { ActivityItem } from '../types/app';
import { timeAgo, formatCurrency } from '../services/mock-data';

@element('activity-feed')
export class ActivityFeed extends HTMLElement {
  @property({ type: Array }) items: ActivityItem[] = [];

  @render()
  renderContent() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Recent Activity</h3>
        </div>
        <div class="feed">
          <case ${this.items.length > 0 ? 'data' : 'empty'}>
            <when value="data">
              ${this.items.map(
                (item) => html`
                  <div class="feed-item" key=${item.id}>
                    <div class="feed-dot" data-type="${item.type}"></div>
                    <div class="feed-content">
                      <div class="feed-message">${item.message}</div>
                      <div class="feed-meta">
                        <span class="feed-time">${timeAgo(item.timestamp)}</span>
                        <if ${item.amount !== undefined}>
                          <span class="feed-amount" ?data-negative=${(item.amount ?? 0) < 0}>
                            ${formatCurrency(Math.abs(item.amount!))}
                          </span>
                        </if>
                      </div>
                    </div>
                  </div>
                `
              )}
            </when>
            <default>
              <div class="empty">No recent activity</div>
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
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--dash-border, #334155);
      }

      .panel-title {
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--dash-text, #f1f5f9);
        margin: 0;
      }

      .feed {
        max-height: 400px;
        overflow-y: auto;
      }

      .feed-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid var(--dash-border, #334155);
        transition: background 0.15s ease;
      }

      .feed-item:last-child {
        border-bottom: none;
      }

      .feed-item:hover {
        background: var(--dash-surface-hover, #334155);
      }

      .feed-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 0.4rem;
        flex-shrink: 0;
      }

      .feed-dot[data-type="sale"] { background: var(--dash-success, #10b981); }
      .feed-dot[data-type="signup"] { background: var(--dash-primary, #6366f1); }
      .feed-dot[data-type="refund"] { background: var(--dash-warning, #f59e0b); }
      .feed-dot[data-type="alert"] { background: var(--dash-danger, #ef4444); }

      .feed-content {
        flex: 1;
        min-width: 0;
      }

      .feed-message {
        font-size: 0.8125rem;
        color: var(--dash-text, #f1f5f9);
        margin-bottom: 0.25rem;
      }

      .feed-meta {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 0.75rem;
      }

      .feed-time {
        color: var(--dash-text-muted, #64748b);
      }

      .feed-amount {
        color: var(--dash-success, #10b981);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      .feed-amount[data-negative] {
        color: var(--dash-danger, #ef4444);
      }

      .empty {
        padding: 2rem;
        text-align: center;
        color: var(--dash-text-muted, #64748b);
        font-size: 0.875rem;
      }
    `;
  }
}
