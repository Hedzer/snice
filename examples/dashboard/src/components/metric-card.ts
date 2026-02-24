import { element, property, render, styles, html, css } from 'snice';
import { formatMetricValue, calculateChange } from '../services/mock-data';

@element('metric-card')
export class MetricCard extends HTMLElement {
  @property() label = '';
  @property({ type: Number }) value = 0;
  @property({ type: Number }) previousValue = 0;
  @property() format: 'number' | 'currency' | 'percent' = 'number';
  @property() icon = '';

  @render()
  renderContent() {
    const change = calculateChange(this.value, this.previousValue);
    const isPositive = change >= 0;
    const formattedValue = formatMetricValue(this.value, this.format);
    const changeText = (isPositive ? '+' : '') + change.toFixed(1) + '%';

    return html`
      <div class="card">
        <div class="card-header">
          <span class="card-label">${this.label}</span>
          <span class="card-icon">${this.icon}</span>
        </div>
        <div class="card-value">${formattedValue}</div>
        <div class="card-change" ?data-positive=${isPositive} ?data-negative=${!isPositive}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <if ${isPositive}>
              <path d="M6 2L10 7H2L6 2Z"/>
            </if>
            <if ${!isPositive}>
              <path d="M6 10L2 5H10L6 10Z"/>
            </if>
          </svg>
          <span>${changeText} vs last period</span>
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

      .card {
        background: var(--dash-surface, #1e293b);
        border: 1px solid var(--dash-border, #334155);
        border-radius: var(--dash-radius-lg, 12px);
        padding: 1.25rem;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .card-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--dash-text-secondary, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .card-icon {
        width: 2rem;
        height: 2rem;
        border-radius: var(--dash-radius, 8px);
        background: rgba(99, 102, 241, 0.15);
        color: var(--dash-primary-light, #818cf8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
      }

      .card-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--dash-text, #f1f5f9);
        margin-bottom: 0.5rem;
        line-height: 1.2;
      }

      .card-change {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .card-change[data-positive] {
        color: var(--dash-success, #10b981);
      }

      .card-change[data-negative] {
        color: var(--dash-danger, #ef4444);
      }
    `;
  }
}
