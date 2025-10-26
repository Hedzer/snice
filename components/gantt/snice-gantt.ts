import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { SniceGanttElement, GanttTask, GanttViewMode } from './snice-gantt.types';
import cssContent from './snice-gantt.css?inline';

@element('snice-gantt')
export class SniceGantt extends HTMLElement implements SniceGanttElement {
  @property({ type: Array })
  tasks: GanttTask[] = [];

  @property({ attribute: 'view-mode' })
  viewMode: GanttViewMode = 'day';

  @property({ type: Boolean, attribute: 'show-today' })
  showToday = true;

  @property({ type: Boolean, attribute: 'show-progress' })
  showProgress = true;

  @property({ type: Boolean, attribute: 'show-dependencies' })
  showDependencies = false;

  @property({ type: Date, attribute: 'min-date' })
  minDate: Date | string = '';

  @property({ type: Date, attribute: 'max-date' })
  maxDate: Date | string = '';

  @dispatch('@snice/gantt-task-click', { bubbles: true, composed: true })
  private dispatchTaskClick(task: GanttTask) {
    return { task, gantt: this };
  }

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  getTask(id: string | number): GanttTask | undefined {
    return this.tasks.find(t => t.id === id);
  }

  scrollToToday(): void {
    // Implementation would scroll viewport to today's date
  }

  scrollToTask(id: string | number): void {
    // Implementation would scroll to specific task
  }

  private getDateRange(): { start: Date; end: Date } {
    if (this.tasks.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
      };
    }

    let minDate = this.minDate ?
      (typeof this.minDate === 'string' ? new Date(this.minDate) : this.minDate) :
      null;

    let maxDate = this.maxDate ?
      (typeof this.maxDate === 'string' ? new Date(this.maxDate) : this.maxDate) :
      null;

    this.tasks.forEach(task => {
      const start = typeof task.start === 'string' ? new Date(task.start) : task.start;
      const end = typeof task.end === 'string' ? new Date(task.end) : task.end;

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    });

    return { start: minDate!, end: maxDate! };
  }

  private getColumnWidth(): number {
    switch (this.viewMode) {
      case 'day': return 60;
      case 'week': return 100;
      case 'month': return 120;
      case 'year': return 150;
      default: return 60;
    }
  }

  private getColumns(): Date[] {
    const { start, end } = this.getDateRange();
    const columns: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      columns.push(new Date(current));

      switch (this.viewMode) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return columns;
  }

  private formatColumnHeader(date: Date): string {
    switch (this.viewMode) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week ${this.getWeekNumber(date)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return '';
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getTaskBarPosition(task: GanttTask): { left: number; width: number } {
    const { start: rangeStart } = this.getDateRange();
    const taskStart = typeof task.start === 'string' ? new Date(task.start) : task.start;
    const taskEnd = typeof task.end === 'string' ? new Date(task.end) : task.end;

    const columnWidth = this.getColumnWidth();
    const dayInMs = 24 * 60 * 60 * 1000;

    const startOffset = (taskStart.getTime() - rangeStart.getTime()) / dayInMs;
    const duration = (taskEnd.getTime() - taskStart.getTime()) / dayInMs;

    let daysPerColumn = 1;
    switch (this.viewMode) {
      case 'week': daysPerColumn = 7; break;
      case 'month': daysPerColumn = 30; break;
      case 'year': daysPerColumn = 365; break;
    }

    return {
      left: (startOffset / daysPerColumn) * columnWidth,
      width: Math.max((duration / daysPerColumn) * columnWidth, 20)
    };
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private handleTaskClick(task: GanttTask) {
    this.dispatchTaskClick(task);
  }

  @render()
  template() {
    const columns = this.getColumns();
    const columnWidth = this.getColumnWidth();

    return html`
      <div class="gantt">
        <div class="gantt__sidebar">
          <div class="gantt__header">
            <div class="gantt__header-cell" style="width: 200px;">Task</div>
          </div>
          <div class="gantt__rows">
            ${this.tasks.map(task => html`
              <div class="gantt__row">
                <div class="gantt__row-label">${task.name}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="gantt__timeline">
          <div class="gantt__header">
            ${columns.map(date => html`
              <div class="gantt__header-cell" style="width: ${columnWidth}px;">
                ${this.formatColumnHeader(date)}
              </div>
            `)}
          </div>

          <div class="gantt__rows" style="position: relative;">
            <!-- Grid lines -->
            <div class="gantt__grid">
              ${columns.map(date => html`
                <div
                  class="gantt__grid-column ${this.showToday && this.isToday(date) ? 'gantt__grid-column--today' : ''}"
                  style="width: ${columnWidth}px;">
                </div>
              `)}
            </div>

            <!-- Task bars -->
            ${this.tasks.map(task => {
              const { left, width } = this.getTaskBarPosition(task);

              return html`
                <div class="gantt__row">
                  <div class="gantt__bars">
                    <div
                      class="gantt__bar"
                      style="${task.color ? `background: ${task.color};` : ''} left: ${left}px; width: ${width}px;"
                      @click=${() => this.handleTaskClick(task)}>
                      <div class="gantt__bar-label">${task.name}</div>
                      <if ${this.showProgress && task.progress !== undefined}>
                        <div class="gantt__bar-progress" style="width: ${task.progress}%;"></div>
                      </if>
                    </div>
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-gantt': SniceGantt;
  }
}
