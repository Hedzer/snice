import { element, property, render, styles, html, css } from 'snice';
import cssContent from './snice-stat.css?inline';
import type { StatTrend, StatSize, SniceStatElement } from './snice-stat.types';

@element('snice-stat')
export class SniceStat extends HTMLElement implements SniceStatElement {
  @property({  })
  label = '';

  @property({  })
  value: string | number = '';

  @property({  })
  change: string | number = '';

  @property({  })
  trend: StatTrend = 'neutral';

  @property({  })
  size: StatSize = 'medium';

  @property({  })
  icon = '';

  @property({ attribute: 'icon-image' })
  iconImage = '';

  @property({ type: Boolean, attribute: 'color-value' })
  colorValue = false;

  private getTrendIcon(): string {
    switch (this.trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'neutral': return '→';
      default: return '';
    }
  }

  @render()
  render() {
    const statClasses = [
      'stat',
      `stat--${this.size}`
    ].filter(Boolean).join(' ');

    const valueClasses = [
      'stat__value',
      this.colorValue && this.trend ? `stat__value--${this.trend}` : ''
    ].filter(Boolean).join(' ');

    const changeClasses = [
      'stat__change',
      this.trend ? `stat__change--${this.trend}` : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${statClasses}" part="container">
        <if ${this.icon || this.iconImage}>
          <div class="stat__header" part="header">
            <div class="stat__icon" part="icon">
              <if ${this.iconImage}>
                <img class="stat__icon-image" src="${this.iconImage}" alt="" />
              </if>
              <if ${!this.iconImage && this.icon}>
                ${this.icon}
              </if>
            </div>
            <div class="stat__label" part="label">${this.label}</div>
          </div>
        </if>

        <if ${!this.icon && !this.iconImage && this.label}>
          <div class="stat__label" part="label">${this.label}</div>
        </if>

        <div class="${valueClasses}" part="value">${this.value}</div>

        <if ${this.change}>
          <div class="${changeClasses}" part="change">
            <span class="stat__change-icon">${this.getTrendIcon()}</span>
            ${this.change}
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }
}
