import { element, property, dispatch, watch, render, styles, html, css } from 'snice';
import cssContent from './snice-heatmap.css?inline';
import type { HeatmapColorScheme, HeatmapDataPoint, SniceHeatmapElement } from './snice-heatmap.types';

interface CellData {
  date: string;
  value: number;
  level: number;
  day: number;
  week: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@element('snice-heatmap')
export class SniceHeatmap extends HTMLElement implements SniceHeatmapElement {
  @property({ type: Array, attribute: false })
  data: HeatmapDataPoint[] = [];

  @property({ attribute: 'color-scheme' })
  colorScheme: HeatmapColorScheme = 'green';

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Number, attribute: 'cell-size' })
  cellSize = 12;

  @property({ type: Number, attribute: 'cell-gap' })
  cellGap = 3;

  @property({ type: Boolean, attribute: 'show-tooltip' })
  showTooltip = true;

  @property({ type: Number })
  weeks = 52;

  @property() private tooltipText = '';
  @property({ type: Number }) private tooltipX = 0;
  @property({ type: Number }) private tooltipY = 0;
  @property({ type: Boolean }) private tooltipVisible = false;

  @dispatch('cell-click', { bubbles: true, composed: true })
  private dispatchCellClick(date: string, value: number) {
    return { date, value };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @watch('cellSize')
  @watch('cellGap')
  private updateCssVars() {
    this.style.setProperty('--cell-size', `${this.cellSize}px`);
    this.style.setProperty('--cell-gap', `${this.cellGap}px`);
  }

  private buildGrid(): CellData[] {
    const cells: CellData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const totalDays = this.weeks * 7 + dayOfWeek + 1;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    const dataMap = new Map<string, number>();
    for (const point of this.data) {
      dataMap.set(point.date, point.value);
    }

    const maxValue = this.data.length > 0
      ? Math.max(...this.data.map(d => d.value))
      : 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = this.formatDate(d);
      const value = dataMap.get(dateStr) ?? 0;
      const level = this.getLevel(value, maxValue);
      const day = d.getDay();
      const week = Math.floor(i / 7);

      cells.push({ date: dateStr, value, level, day, week });
    }

    return cells;
  }

  private getLevel(value: number, max: number): number {
    if (value === 0 || max === 0) return 0;
    const ratio = value / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getMonthLabels(cells: CellData[]): { label: string; column: number }[] {
    const labels: { label: string; column: number }[] = [];
    let lastMonth = -1;

    for (const cell of cells) {
      if (cell.day !== 0) continue;
      const month = new Date(cell.date + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        labels.push({ label: MONTH_NAMES[month], column: cell.week + 1 });
        lastMonth = month;
      }
    }

    return labels;
  }

  private handleCellClick(cell: CellData) {
    this.dispatchCellClick(cell.date, cell.value);
  }

  private handleCellMouseEnter(e: MouseEvent, cell: CellData) {
    if (!this.showTooltip) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    this.tooltipText = `${cell.value} contribution${cell.value !== 1 ? 's' : ''} on ${cell.date}`;
    this.tooltipX = rect.left + rect.width / 2;
    this.tooltipY = rect.top - 8;
    this.tooltipVisible = true;
  }

  private handleCellMouseLeave() {
    if (!this.showTooltip) return;
    this.tooltipVisible = false;
  }

  @render()
  renderContent() {
    const cells = this.buildGrid();
    const totalWeeks = cells.length > 0 ? cells[cells.length - 1].week + 1 : 0;
    const monthLabels = this.getMonthLabels(cells);

    const gridStyle = `grid-template-columns: repeat(${totalWeeks}, var(--cell-size))`;

    return html/*html*/`
      <div class="heatmap" part="base">
        <div class="heatmap__grid-area" part="grid-area">
          <if ${this.showLabels}>
            <div class="heatmap__day-labels">
              ${DAY_LABELS.map((label, i) =>
                html`<span class="heatmap__day-label">${i % 2 === 1 ? label : ''}</span>`
              )}
            </div>
          </if>
          <div class="heatmap__grid-wrapper">
            <if ${this.showLabels}>
              <div class="heatmap__month-labels" style="${gridStyle}">
                ${this.renderMonthLabels(monthLabels, totalWeeks)}
              </div>
            </if>
            <div class="heatmap__grid" part="grid">
              ${cells.map(cell =>
                html`<button
                  class="heatmap__cell heatmap__cell--level-${cell.level}"
                  aria-label="${cell.value} contribution${cell.value !== 1 ? 's' : ''} on ${cell.date}"
                  @click=${() => this.handleCellClick(cell)}
                  @mouseenter=${(e: MouseEvent) => this.handleCellMouseEnter(e, cell)}
                  @mouseleave=${() => this.handleCellMouseLeave()}
                ></button>`
              )}
            </div>
          </div>
        </div>
        <if ${this.tooltipVisible && this.showTooltip}>
          <div class="heatmap__tooltip" part="tooltip" style="left:${this.tooltipX}px;top:${this.tooltipY}px;transform:translate(-50%,-100%)">
            ${this.tooltipText}
          </div>
        </if>
      </div>
    `;
  }

  private renderMonthLabels(labels: { label: string; column: number }[], totalWeeks: number) {
    const spans: ReturnType<typeof html>[] = [];
    let currentCol = 1;

    for (const { label, column } of labels) {
      if (column > currentCol) {
        spans.push(html`<span class="heatmap__month-label" style="grid-column: ${currentCol} / ${column}"></span>`);
      }
      const nextLabel = labels.find(l => l.column > column);
      const endCol = nextLabel ? nextLabel.column : totalWeeks + 1;
      spans.push(html`<span class="heatmap__month-label" style="grid-column: ${column} / ${endCol}">${label}</span>`);
      currentCol = endCol;
    }

    if (currentCol <= totalWeeks) {
      spans.push(html`<span class="heatmap__month-label" style="grid-column: ${currentCol} / ${totalWeeks + 1}"></span>`);
    }

    return spans;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-heatmap': SniceHeatmap;
  }
}
