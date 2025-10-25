import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-kpi.css?inline';
import type { KpiSentiment, KpiSize, SniceKpiElement } from './snice-kpi.types';
import '../sparkline/snice-sparkline';

@element('snice-kpi')
export class SniceKpi extends HTMLElement implements SniceKpiElement {
  @property({  })
  label = '';

  @property({  })
  value: string | number = '';

  @property({  })
  trendValue?: string | number;

  @property({ type: Array })
  trendData?: number[];

  @property({  })
  sentiment?: KpiSentiment;

  @property({  })
  size: KpiSize = 'medium';

  @property({ type: Boolean })
  showSparkline = true;

  @property({ type: Boolean })
  colorValue = false;

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }

  private getTrendIcon(): string {
    if (!this.sentiment) return '';

    switch (this.sentiment) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'neutral':
        return '→';
      default:
        return '';
    }
  }

  private getSparklineColor(): string {
    if (!this.sentiment) return 'primary';

    switch (this.sentiment) {
      case 'up':
        return 'success';
      case 'down':
        return 'danger';
      case 'neutral':
        return 'muted';
      default:
        return 'primary';
    }
  }

  @render()
  renderContent() {
    const kpiClasses = [
      'kpi',
      `kpi--${this.size}`
    ].filter(Boolean).join(' ');

    const valueClasses = [
      'kpi__value',
      this.colorValue && this.sentiment ? `kpi__value--${this.sentiment}` : ''
    ].filter(Boolean).join(' ');

    const hasTrend = this.trendValue !== undefined || this.sentiment !== undefined;
    const hasSparkline = this.showSparkline && this.trendData && this.trendData.length > 0;

    return html`
      <div class="${kpiClasses}" part="container">
        <div class="kpi__header" part="header">
          <div class="kpi__main" part="main">
            <div class="kpi__label" part="label">${this.label}</div>
            <div class="${valueClasses}" part="value">${this.value}</div>
          </div>

          <if ${hasTrend}>
            <div class="kpi__trend kpi__trend--${this.sentiment || 'neutral'}" part="trend">
              <if ${this.sentiment}>
                <span class="kpi__trend-icon" part="trend-icon">${this.getTrendIcon()}</span>
              </if>
              <if ${this.trendValue !== undefined}>
                <span class="kpi__trend-value" part="trend-value">${this.trendValue}</span>
              </if>
            </div>
          </if>
        </div>

        <if ${hasSparkline}>
          <div class="kpi__sparkline" part="sparkline">
            <snice-sparkline
              .data="${this.trendData}"
              color="${this.getSparklineColor()}"
              width="120"
              height="30"
              smooth>
            </snice-sparkline>
          </div>
        </if>
      </div>
    `;
  }
}
