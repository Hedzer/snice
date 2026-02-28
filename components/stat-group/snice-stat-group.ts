import { element, property, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-stat-group.css?inline';
import type { SniceStatGroupElement, StatGroupVariant, StatItem, StatClickDetail } from './snice-stat-group.types';

@element('snice-stat-group')
export class SniceStatGroup extends HTMLElement implements SniceStatGroupElement {
  @property({ type: Array })
  stats: StatItem[] = [];

  @property({ type: Number })
  columns = 0;

  @property()
  variant: StatGroupVariant = 'card';

  @watch('stats')
  handleStatsChange() {
    // Re-render on stats change
  }

  @watch('columns')
  handleColumnsChange() {
    if (this.columns > 0) {
      this.style.setProperty('--sg-columns', String(this.columns));
    } else {
      this.style.removeProperty('--sg-columns');
    }
  }

  @ready()
  init() {
    this.handleColumnsChange();
  }

  private handleStatClick(stat: StatItem, index: number) {
    this.emitStatClick({ stat, index });
  }

  @dispatch('stat-click', { bubbles: true, composed: true })
  private emitStatClick(detail?: StatClickDetail): StatClickDetail {
    return detail!;
  }

  private renderTrendIcon(trend: string): unknown {
    if (trend === 'up') {
      return html/*html*/`
        <svg class="stat__trend-icon stat__trend-icon--up" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
      `;
    }
    if (trend === 'down') {
      return html/*html*/`
        <svg class="stat__trend-icon stat__trend-icon--down" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      `;
    }
    return html/*html*/`
      <svg class="stat__trend-icon stat__trend-icon--neutral" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  private renderStat(stat: StatItem, index: number): unknown {
    const hasColor = stat.color;

    return html/*html*/`
      <div class="stat"
           part="stat"
           tabindex="0"
           role="button"
           @click=${() => this.handleStatClick(stat, index)}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleStatClick(stat, index); } }}>
        <if ${stat.icon}>
          <div class="stat__icon" style="${hasColor ? `color: ${stat.color}` : ''}">
            ${stat.icon}
          </div>
        </if>
        <div class="stat__content">
          <span class="stat__label">${stat.label}</span>
          <span class="stat__value" style="${hasColor ? `color: ${stat.color}` : ''}">${stat.value}</span>
          <if ${stat.trend || stat.trendValue}>
            <div class="stat__trend stat__trend--${stat.trend || 'neutral'}">
              <if ${stat.trend}>
                ${this.renderTrendIcon(stat.trend!)}
              </if>
              <if ${stat.trendValue}>
                <span class="stat__trend-value">${stat.trendValue}</span>
              </if>
            </div>
          </if>
        </div>
      </div>
    `;
  }

  @render()
  renderContent() {
    return html/*html*/`
      <div class="stat-group" part="base">
        ${this.stats.map((stat, i) => this.renderStat(stat, i))}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
