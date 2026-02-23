import { element, property, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-weather.css?inline';
import type { WeatherData, WeatherUnit, WeatherVariant, SniceWeatherElement } from './snice-weather.types';

@element('snice-weather')
export class SniceWeather extends HTMLElement implements SniceWeatherElement {
  @property({ type: Object })
  data: WeatherData | null = null;

  @property()
  unit: WeatherUnit = 'celsius';

  @property()
  variant: WeatherVariant = 'full';

  private formatTemp(temp: number): string {
    const symbol = this.unit === 'celsius' ? '\u00B0C' : '\u00B0F';
    return `${Math.round(temp)}${symbol}`;
  }

  private getDefaultIcon(condition: string): string {
    const lower = condition.toLowerCase();
    if (lower.includes('sun') || lower.includes('clear')) return '\u2600\uFE0F';
    if (lower.includes('cloud') && lower.includes('part')) return '\u26C5';
    if (lower.includes('cloud')) return '\u2601\uFE0F';
    if (lower.includes('rain')) return '\uD83C\uDF27\uFE0F';
    if (lower.includes('snow')) return '\uD83C\uDF28\uFE0F';
    if (lower.includes('thunder') || lower.includes('storm')) return '\u26C8\uFE0F';
    if (lower.includes('fog') || lower.includes('mist')) return '\uD83C\uDF2B\uFE0F';
    if (lower.includes('wind')) return '\uD83C\uDF2C\uFE0F';
    return '\uD83C\uDF24\uFE0F';
  }

  @render()
  template() {
    if (!this.data) {
      return html`<div class="weather"><span>No weather data</span></div>`;
    }

    const icon = this.data.icon || this.getDefaultIcon(this.data.condition);

    const details = html`
      <div class="details">
        ${this.data.humidity != null ? html`
          <span class="detail-item">\uD83D\uDCA7 ${this.data.humidity}%</span>
        ` : html``}
        ${this.data.wind != null ? html`
          <span class="detail-item">\uD83C\uDF2C\uFE0F ${this.data.wind} km/h</span>
        ` : html``}
      </div>
    `;

    const forecast = this.data.forecast && this.data.forecast.length > 0
      ? html`
        <div class="forecast">
          ${this.data.forecast.map(day => html`
            <div class="forecast-day">
              <span class="forecast-day-name">${day.day}</span>
              <span class="forecast-icon">${day.icon || this.getDefaultIcon(day.condition)}</span>
              <div class="forecast-temps">
                <span class="forecast-high">${this.formatTemp(day.high)}</span>
                <span class="forecast-low">${this.formatTemp(day.low)}</span>
              </div>
            </div>
          `)}
        </div>
      `
      : html``;

    return html`
      <div class="weather">
        <div class="current">
          <span class="icon">${icon}</span>
          <div>
            <div class="temp">${this.formatTemp(this.data.temp)}</div>
            <div class="condition">${this.data.condition}</div>
          </div>
        </div>
        ${details}
        ${forecast}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
