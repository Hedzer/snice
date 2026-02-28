import { element, property, render, styles, dispatch, watch, query, html, css } from 'snice';
import type { GanttZoom, GanttTask, SniceGanttElement } from './snice-gantt.types';
import ganttStyles from './snice-gantt.css?inline';

const DAY_MS = 86400000;

@element('snice-gantt')
export class SniceGantt extends HTMLElement implements SniceGanttElement {
  @property({ type: Array })
  tasks: GanttTask[] = [];

  @property() zoom: GanttZoom = 'week';

  @property({ type: Boolean, attribute: 'show-dependencies' })
  showDependencies: boolean = true;

  private timelineStart: Date = new Date();
  private timelineEnd: Date = new Date();
  private cellWidth: number = 40;
  private dragState: { taskId: string; type: 'move' | 'resize-left' | 'resize-right'; startX: number; origStart: string; origEnd: string } | null = null;

  @query('.gantt-timeline')
  private timelineElement?: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${ganttStyles}`;
  }

  @watch('tasks')
  handleTasksChange() {
    this.computeTimeline();
  }

  @watch('zoom')
  handleZoomChange() {
    this.computeTimeline();
  }

  private computeTimeline(): void {
    if (this.tasks.length === 0) {
      this.timelineStart = new Date();
      this.timelineEnd = new Date();
      return;
    }

    let minDate = Infinity;
    let maxDate = -Infinity;

    for (const task of this.tasks) {
      const start = new Date(task.start).getTime();
      const end = new Date(task.end).getTime();
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    const padding = this.zoom === 'day' ? DAY_MS * 2 : this.zoom === 'week' ? DAY_MS * 7 : DAY_MS * 14;
    this.timelineStart = new Date(minDate - padding);
    this.timelineEnd = new Date(maxDate + padding);

    this.cellWidth = this.zoom === 'day' ? 40 : this.zoom === 'week' ? 28 : 12;
  }

  private getTimelineDays(): Date[] {
    const days: Date[] = [];
    const current = new Date(this.timelineStart);
    current.setHours(0, 0, 0, 0);

    while (current <= this.timelineEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  private getHeaderCells(): { label: string; span: number; isToday: boolean }[] {
    const days = this.getTimelineDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.zoom === 'day') {
      return days.map(d => ({
        label: String(d.getDate()),
        span: 1,
        isToday: d.getTime() === today.getTime(),
      }));
    }

    if (this.zoom === 'week') {
      return days.map(d => ({
        label: d.getDay() === 1 ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : String(d.getDate()),
        span: 1,
        isToday: d.getTime() === today.getTime(),
      }));
    }

    const cells: { label: string; span: number; isToday: boolean }[] = [];
    let currentMonth = -1;
    for (const d of days) {
      if (d.getMonth() !== currentMonth) {
        currentMonth = d.getMonth();
        cells.push({
          label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
          span: 1,
          isToday: false,
        });
      } else {
        cells[cells.length - 1].span++;
      }
    }
    return cells;
  }

  private dateToX(date: string | Date): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = d.getTime() - this.timelineStart.getTime();
    const totalDays = diff / DAY_MS;
    return totalDays * this.cellWidth;
  }

  private getOrderedTasks(): (GanttTask | { __group: string })[] {
    const groups = new Map<string, GanttTask[]>();
    const ungrouped: GanttTask[] = [];

    for (const task of this.tasks) {
      if (task.group) {
        if (!groups.has(task.group)) groups.set(task.group, []);
        groups.get(task.group)!.push(task);
      } else {
        ungrouped.push(task);
      }
    }

    const result: (GanttTask | { __group: string })[] = [];
    for (const [group, tasks] of groups) {
      result.push({ __group: group });
      result.push(...tasks);
    }
    result.push(...ungrouped);
    return result;
  }

  @render()
  renderGantt() {
    this.computeTimeline();
    const headerCells = this.getHeaderCells();
    const orderedItems = this.getOrderedTasks();
    const days = this.getTimelineDays();
    const totalWidth = days.length * this.cellWidth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayX = this.dateToX(today);
    const todayVisible = todayX >= 0 && todayX <= totalWidth;
    const isDay = this.zoom === 'day';
    const isWeek = this.zoom === 'week';
    const isMonth = this.zoom === 'month';

    const taskItems = this.tasks;
    let taskRowIndex = 0;
    const taskRowMap = new Map<string, number>();

    for (const item of orderedItems) {
      if ('__group' in item) {
        taskRowIndex++;
      } else {
        taskRowMap.set(item.id, taskRowIndex);
        taskRowIndex++;
      }
    }

    return html`
      <div class="gantt-container" part="base">
        <div class="gantt-header" part="header">
          <div class="gantt-zoom-toggle" part="controls">
            <button class="gantt-zoom-btn ${isDay ? 'active' : ''}" @click=${() => { this.zoom = 'day'; }}>Day</button>
            <button class="gantt-zoom-btn ${isWeek ? 'active' : ''}" @click=${() => { this.zoom = 'week'; }}>Week</button>
            <button class="gantt-zoom-btn ${isMonth ? 'active' : ''}" @click=${() => { this.zoom = 'month'; }}>Month</button>
          </div>
        </div>

        <div class="gantt-body" part="body">
          <div class="gantt-task-list" part="task-list">
            <div class="gantt-task-list-header">Task</div>
            ${orderedItems.map(item => {
              if ('__group' in item) {
                return html`<div class="gantt-group-header">${item.__group}</div>`;
              }
              return html`
                <div class="gantt-task-name" @click=${() => this.emitTaskClick(item)}>${item.name}</div>
              `;
            })}
          </div>

          <div class="gantt-timeline" part="timeline">
            <div class="gantt-timeline-header" style="width: ${totalWidth}px">
              ${headerCells.map(cell => html`
                <div
                  class="gantt-timeline-cell ${cell.isToday ? 'gantt-timeline-cell--today' : ''}"
                  style="width: ${cell.span * this.cellWidth}px"
                >${cell.label}</div>
              `)}
            </div>

            <div class="gantt-timeline-rows" style="width: ${totalWidth}px; height: ${taskRowIndex * 2.25}rem">
              ${taskItems.map(task => {
                const left = this.dateToX(task.start);
                const right = this.dateToX(task.end);
                const width = Math.max(right - left, this.cellWidth / 2);
                const rowIdx = taskRowMap.get(task.id) || 0;
                const top = rowIdx * 2.25;
                const bgColor = task.color || 'var(--snice-color-primary, rgb(37 99 235))';
                const progress = task.progress || 0;
                const hasProgress = progress > 0;

                return html`
                  <div
                    class="gantt-bar"
                    style="left: ${left}px; width: ${width}px; top: calc(${top}rem + 0.375rem); background: ${bgColor}"
                    @click=${() => this.emitTaskClick(task)}
                    @mousedown=${(e: MouseEvent) => this.handleBarMouseDown(e, task, 'move')}
                  >
                    <if ${hasProgress}>
                      <div class="gantt-bar-progress" style="width: ${progress}%"></div>
                    </if>
                    <span class="gantt-bar-label">${task.name}</span>
                    <div class="gantt-bar-handle gantt-bar-handle--left" @mousedown=${(e: MouseEvent) => { e.stopPropagation(); this.handleBarMouseDown(e, task, 'resize-left'); }}></div>
                    <div class="gantt-bar-handle gantt-bar-handle--right" @mousedown=${(e: MouseEvent) => { e.stopPropagation(); this.handleBarMouseDown(e, task, 'resize-right'); }}></div>
                  </div>
                `;
              })}

              <if ${todayVisible}>
                <div class="gantt-today-line" style="left: ${todayX}px"></div>
              </if>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Public Methods ---

  scrollToDate(date: string): void {
    if (!this.timelineElement) return;
    const x = this.dateToX(date);
    this.timelineElement.scrollLeft = Math.max(0, x - this.timelineElement.clientWidth / 2);
  }

  scrollToTask(id: string): void {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      this.scrollToDate(task.start);
    }
  }

  // --- Drag handlers ---

  private handleBarMouseDown(e: MouseEvent, task: GanttTask, type: 'move' | 'resize-left' | 'resize-right'): void {
    e.preventDefault();
    this.dragState = {
      taskId: task.id,
      type,
      startX: e.clientX,
      origStart: task.start,
      origEnd: task.end,
    };

    const onMouseMove = (ev: MouseEvent) => this.handleDragMove(ev);
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.handleDragEnd();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private handleDragMove(e: MouseEvent): void {
    if (!this.dragState) return;

    const dx = e.clientX - this.dragState.startX;
    const daysDelta = Math.round(dx / this.cellWidth);
    if (daysDelta === 0) return;

    const task = this.tasks.find(t => t.id === this.dragState!.taskId);
    if (!task) return;

    const origStart = new Date(this.dragState.origStart);
    const origEnd = new Date(this.dragState.origEnd);

    if (this.dragState.type === 'move') {
      task.start = new Date(origStart.getTime() + daysDelta * DAY_MS).toISOString().split('T')[0];
      task.end = new Date(origEnd.getTime() + daysDelta * DAY_MS).toISOString().split('T')[0];
    } else if (this.dragState.type === 'resize-left') {
      const newStart = new Date(origStart.getTime() + daysDelta * DAY_MS);
      if (newStart < origEnd) {
        task.start = newStart.toISOString().split('T')[0];
      }
    } else if (this.dragState.type === 'resize-right') {
      const newEnd = new Date(origEnd.getTime() + daysDelta * DAY_MS);
      if (newEnd > origStart) {
        task.end = newEnd.toISOString().split('T')[0];
      }
    }

    this.tasks = [...this.tasks];
  }

  private handleDragEnd(): void {
    if (!this.dragState) return;

    const task = this.tasks.find(t => t.id === this.dragState!.taskId);
    if (task) {
      if (this.dragState.type === 'move') {
        this.emitTaskMove(task);
      } else {
        this.emitTaskResize(task);
      }
    }

    this.dragState = null;
  }

  // --- Events ---

  @dispatch('task-click', { bubbles: true, composed: true })
  private emitTaskClick(task: GanttTask) {
    return { task };
  }

  @dispatch('task-resize', { bubbles: true, composed: true })
  private emitTaskResize(task: GanttTask) {
    return { task, start: task.start, end: task.end };
  }

  @dispatch('task-move', { bubbles: true, composed: true })
  private emitTaskMove(task: GanttTask) {
    return { task, start: task.start, end: task.end };
  }

  @dispatch('task-link', { bubbles: true, composed: true })
  private emitTaskLink(source: string, target: string) {
    return { source, target };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-gantt': SniceGantt;
  }
}
