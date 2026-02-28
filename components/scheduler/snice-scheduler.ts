import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import type { SniceSchedulerElement, SchedulerView, SchedulerResource, SchedulerEvent } from './snice-scheduler.types';
import cssContent from './snice-scheduler.css?inline';

const HOUR_MS = 3600000;
const MIN_MS = 60000;

@element('snice-scheduler')
export class SniceScheduler extends HTMLElement implements SniceSchedulerElement {
  @property({ type: Array })
  resources: SchedulerResource[] = [];

  @property({ type: Array })
  events: SchedulerEvent[] = [];

  @property()
  view: SchedulerView = 'week';

  @property({ type: Date })
  date: Date | string = new Date();

  @property({ type: Number })
  granularity: number = 60;

  @property({ type: Number, attribute: 'start-hour' })
  startHour: number = 0;

  @property({ type: Number, attribute: 'end-hour' })
  endHour: number = 24;

  private container!: HTMLElement;
  private gridWrapper!: HTMLElement;
  private dragState: {
    type: 'create' | 'move' | 'resize';
    eventId?: string | number;
    resourceId: string | number;
    startX: number;
    startY: number;
    origStart?: Date;
    origEnd?: Date;
    origResourceId?: string | number;
    previewEl?: HTMLElement;
  } | null = null;

  @dispatch('event-create', { bubbles: true, composed: true })
  private emitEventCreate(event: SchedulerEvent) {
    return { event };
  }

  @dispatch('event-move', { bubbles: true, composed: true })
  private emitEventMove(event: SchedulerEvent, oldResourceId: string | number, oldStart: Date | string, oldEnd: Date | string) {
    return { event, oldResourceId, oldStart, oldEnd };
  }

  @dispatch('event-resize', { bubbles: true, composed: true })
  private emitEventResize(event: SchedulerEvent, oldStart: Date | string, oldEnd: Date | string) {
    return { event, oldStart, oldEnd };
  }

  @dispatch('event-click', { bubbles: true, composed: true })
  private emitEventClick(event: SchedulerEvent) {
    return { event };
  }

  @dispatch('slot-click', { bubbles: true, composed: true })
  private emitSlotClick(resourceId: string | number, start: Date, end: Date) {
    return { resourceId, start, end };
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.buildDOM();
    this.renderGrid();
  }

  private get currentDate(): Date {
    return typeof this.date === 'string' ? new Date(this.date) : this.date;
  }

  private buildDOM(): void {
    const shadow = this.shadowRoot!;
    this.container = document.createElement('div');
    this.container.className = 'scheduler';
    this.container.setAttribute('part', 'base');
    shadow.appendChild(this.container);
  }

  private renderGrid(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'scheduler__header';
    header.setAttribute('part', 'header');

    const nav = document.createElement('div');
    nav.className = 'scheduler__nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'scheduler__nav-btn';
    prevBtn.textContent = '\u2039';
    prevBtn.onclick = () => this.navigatePrev();

    const todayBtn = document.createElement('button');
    todayBtn.className = 'scheduler__nav-btn';
    todayBtn.textContent = 'Today';
    todayBtn.onclick = () => this.navigateToday();

    const nextBtn = document.createElement('button');
    nextBtn.className = 'scheduler__nav-btn';
    nextBtn.textContent = '\u203A';
    nextBtn.onclick = () => this.navigateNext();

    const title = document.createElement('span');
    title.className = 'scheduler__title';
    title.textContent = this.getHeaderTitle();

    nav.appendChild(prevBtn);
    nav.appendChild(todayBtn);
    nav.appendChild(nextBtn);
    nav.appendChild(title);

    const viewToggle = document.createElement('div');
    viewToggle.className = 'scheduler__view-toggle';

    const views: SchedulerView[] = ['day', 'week', 'month'];
    views.forEach(v => {
      const btn = document.createElement('button');
      btn.className = `scheduler__view-btn ${v === this.view ? 'active' : ''}`;
      btn.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      btn.onclick = () => { this.view = v; };
      viewToggle.appendChild(btn);
    });

    header.appendChild(nav);
    header.appendChild(viewToggle);
    this.container.appendChild(header);

    if (this.view === 'month') {
      this.renderMonthView();
    } else {
      this.renderDayWeekView();
    }
  }

  private renderDayWeekView(): void {
    const body = document.createElement('div');
    body.className = 'scheduler__body';

    // Resource sidebar
    const resourcePanel = document.createElement('div');
    resourcePanel.className = 'scheduler__resources';
    resourcePanel.setAttribute('part', 'resources');

    const resourceHeader = document.createElement('div');
    resourceHeader.className = 'scheduler__resource-header';
    resourceHeader.textContent = 'Resources';
    resourcePanel.appendChild(resourceHeader);

    this.resources.forEach(res => {
      const resEl = document.createElement('div');
      resEl.className = 'scheduler__resource';

      const avatar = document.createElement('div');
      avatar.className = 'scheduler__resource-avatar';
      if (res.color) avatar.style.background = res.color;
      if (res.avatar) {
        const img = document.createElement('img');
        img.src = res.avatar;
        img.alt = res.name;
        avatar.appendChild(img);
      } else {
        avatar.textContent = res.name.charAt(0).toUpperCase();
      }

      const name = document.createElement('div');
      name.className = 'scheduler__resource-name';
      name.textContent = res.name;

      resEl.appendChild(avatar);
      resEl.appendChild(name);
      resourcePanel.appendChild(resEl);
    });

    body.appendChild(resourcePanel);

    // Grid area
    this.gridWrapper = document.createElement('div');
    this.gridWrapper.className = 'scheduler__grid-wrapper';
    this.gridWrapper.setAttribute('part', 'grid');

    const days = this.getViewDays();
    const slotsPerHour = 60 / this.granularity;
    const totalSlots = (this.endHour - this.startHour) * slotsPerHour;
    const cellWidth = this.view === 'day' ? 3.75 : 2.5; // rem
    const totalWidth = days.length * totalSlots * cellWidth;

    // Time header
    const timeHeader = document.createElement('div');
    timeHeader.className = 'scheduler__time-header';
    timeHeader.style.width = `${totalWidth}rem`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    days.forEach(day => {
      for (let h = this.startHour; h < this.endHour; h++) {
        for (let s = 0; s < slotsPerHour; s++) {
          const cell = document.createElement('div');
          cell.className = 'scheduler__time-cell';
          cell.style.width = `${cellWidth}rem`;

          const isToday = day.getTime() === today.getTime();
          if (isToday) cell.classList.add('scheduler__time-cell--today');

          if (s === 0) {
            const dayLabel = this.view === 'day' ? '' : `${day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} `;
            cell.textContent = `${dayLabel}${this.formatHour(h)}`;
          }

          timeHeader.appendChild(cell);
        }
      }
    });

    this.gridWrapper.appendChild(timeHeader);

    // Grid rows
    const grid = document.createElement('div');
    grid.className = 'scheduler__grid';
    grid.style.width = `${totalWidth}rem`;

    this.resources.forEach(res => {
      const row = document.createElement('div');
      row.className = 'scheduler__row';
      row.dataset.resourceId = String(res.id);

      days.forEach(day => {
        for (let h = this.startHour; h < this.endHour; h++) {
          for (let s = 0; s < slotsPerHour; s++) {
            const cell = document.createElement('div');
            cell.className = 'scheduler__cell';
            cell.style.width = `${cellWidth}rem`;

            if (s === 0) {
              cell.classList.add('scheduler__cell--hour-start');
            } else {
              cell.classList.add('scheduler__cell--sub-hour');
            }

            const slotStart = new Date(day);
            slotStart.setHours(h, s * this.granularity, 0, 0);

            const slotEnd = new Date(slotStart.getTime() + this.granularity * MIN_MS);

            cell.onclick = () => this.emitSlotClick(res.id, slotStart, slotEnd);

            cell.onmousedown = (e) => this.handleCellMouseDown(e, res.id, slotStart);

            row.appendChild(cell);
          }
        }
      });

      // Render events for this resource
      const resourceEvents = this.events.filter(ev => ev.resourceId === res.id);
      resourceEvents.forEach(ev => {
        const evEl = this.createEventElement(ev, days, totalSlots, cellWidth);
        if (evEl) row.appendChild(evEl);
      });

      grid.appendChild(row);
    });

    this.gridWrapper.appendChild(grid);

    // Current time indicator
    const now = new Date();
    const nowDay = new Date(now);
    nowDay.setHours(0, 0, 0, 0);

    const matchingDay = days.find(d => d.getTime() === nowDay.getTime());
    if (matchingDay) {
      const dayIndex = days.indexOf(matchingDay);
      const minutesSinceStart = (now.getHours() - this.startHour) * 60 + now.getMinutes();
      if (minutesSinceStart >= 0 && minutesSinceStart < (this.endHour - this.startHour) * 60) {
        const slotOffset = minutesSinceStart / this.granularity;
        const xPos = (dayIndex * totalSlots + slotOffset) * cellWidth;

        const nowLine = document.createElement('div');
        nowLine.className = 'scheduler__now-line';
        nowLine.style.left = `${xPos}rem`;
        grid.appendChild(nowLine);
      }
    }

    body.appendChild(this.gridWrapper);
    this.container.appendChild(body);
  }

  private renderMonthView(): void {
    const monthGrid = document.createElement('div');
    monthGrid.className = 'scheduler__month-grid';
    monthGrid.setAttribute('part', 'grid');

    // Day headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      const header = document.createElement('div');
      header.className = 'scheduler__month-header';
      header.textContent = day;
      monthGrid.appendChild(header);
    });

    // Month days
    const current = this.currentDate;
    const year = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);

      const dayEl = document.createElement('div');
      dayEl.className = 'scheduler__month-day';

      if (cellDate.getMonth() !== month) {
        dayEl.classList.add('scheduler__month-day--other');
      }

      if (cellDate.getTime() === today.getTime()) {
        dayEl.classList.add('scheduler__month-day--today');
      }

      const dayNumber = document.createElement('div');
      dayNumber.className = 'scheduler__month-day-number';
      dayNumber.textContent = String(cellDate.getDate());
      dayEl.appendChild(dayNumber);

      // Events for this day
      const dayStart = new Date(cellDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvents = this.events.filter(ev => {
        const evStart = typeof ev.start === 'string' ? new Date(ev.start) : ev.start;
        const evEnd = typeof ev.end === 'string' ? new Date(ev.end) : ev.end;
        return evStart < dayEnd && evEnd > dayStart;
      });

      dayEvents.slice(0, 3).forEach(ev => {
        const evEl = document.createElement('div');
        evEl.className = 'scheduler__month-event';
        if (ev.color) evEl.style.background = ev.color;
        evEl.textContent = ev.title;
        evEl.onclick = (e) => { e.stopPropagation(); this.emitEventClick(ev); };
        dayEl.appendChild(evEl);
      });

      if (dayEvents.length > 3) {
        const moreEl = document.createElement('div');
        moreEl.className = 'scheduler__month-event';
        moreEl.style.background = 'var(--snice-color-text-tertiary, rgb(115 115 115))';
        moreEl.textContent = `+${dayEvents.length - 3} more`;
        dayEl.appendChild(moreEl);
      }

      dayEl.onclick = () => {
        this.date = cellDate;
        this.view = 'day';
      };

      monthGrid.appendChild(dayEl);
    }

    this.container.appendChild(monthGrid);
  }

  private createEventElement(ev: SchedulerEvent, days: Date[], totalSlots: number, cellWidth: number): HTMLElement | null {
    const evStart = typeof ev.start === 'string' ? new Date(ev.start) : ev.start;
    const evEnd = typeof ev.end === 'string' ? new Date(ev.end) : ev.end;
    const slotsPerHour = 60 / this.granularity;

    const evStartDay = new Date(evStart);
    evStartDay.setHours(0, 0, 0, 0);

    const dayIndex = days.findIndex(d => d.getTime() === evStartDay.getTime());
    if (dayIndex === -1) return null;

    const minutesSinceStart = (evStart.getHours() - this.startHour) * 60 + evStart.getMinutes();
    const durationMinutes = (evEnd.getTime() - evStart.getTime()) / MIN_MS;

    if (minutesSinceStart < 0) return null;

    const startSlot = dayIndex * totalSlots + minutesSinceStart / this.granularity;
    const widthSlots = durationMinutes / this.granularity;

    const evEl = document.createElement('div');
    evEl.className = 'scheduler__event';
    if (ev.color) evEl.style.background = ev.color;
    evEl.style.left = `${startSlot * cellWidth}rem`;
    evEl.style.width = `${Math.max(widthSlots * cellWidth, cellWidth)}rem`;

    const titleEl = document.createElement('span');
    titleEl.className = 'scheduler__event-title';
    titleEl.textContent = ev.title;
    evEl.appendChild(titleEl);

    const timeEl = document.createElement('span');
    timeEl.className = 'scheduler__event-time';
    timeEl.textContent = `${this.formatTime(evStart)} - ${this.formatTime(evEnd)}`;
    evEl.appendChild(timeEl);

    // Resize handles
    const leftHandle = document.createElement('div');
    leftHandle.className = 'scheduler__event-handle scheduler__event-handle--left';
    leftHandle.onmousedown = (e) => { e.stopPropagation(); this.handleEventResizeStart(e, ev, 'left'); };
    evEl.appendChild(leftHandle);

    const rightHandle = document.createElement('div');
    rightHandle.className = 'scheduler__event-handle scheduler__event-handle--right';
    rightHandle.onmousedown = (e) => { e.stopPropagation(); this.handleEventResizeStart(e, ev, 'right'); };
    evEl.appendChild(rightHandle);

    evEl.onclick = (e) => { e.stopPropagation(); this.emitEventClick(ev); };
    evEl.onmousedown = (e) => { if (e.target === evEl || e.target === titleEl || e.target === timeEl) this.handleEventMoveStart(e, ev); };

    return evEl;
  }

  private handleCellMouseDown(e: MouseEvent, resourceId: string | number, slotStart: Date): void {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;

    this.dragState = {
      type: 'create',
      resourceId,
      startX,
      startY,
      origStart: slotStart,
      origEnd: new Date(slotStart.getTime() + this.granularity * MIN_MS),
    };

    const onMouseMove = (ev: MouseEvent) => {
      if (!this.dragState || this.dragState.type !== 'create') return;
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx < 5 && dy < 5) return; // Dead zone
    };

    const onMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (!this.dragState || this.dragState.type !== 'create') return;

      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);

      // If small movement, treat as slot click (handled via onclick)
      if (dx < 5 && dy < 5) {
        this.dragState = null;
        return;
      }

      // Create event from drag
      const newEvent: SchedulerEvent = {
        id: `new-${Date.now()}`,
        resourceId,
        start: this.dragState.origStart!,
        end: this.dragState.origEnd!,
        title: 'New Event',
      };

      this.emitEventCreate(newEvent);
      this.dragState = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private handleEventMoveStart(e: MouseEvent, ev: SchedulerEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const evStart = typeof ev.start === 'string' ? new Date(ev.start) : new Date(ev.start.getTime());
    const evEnd = typeof ev.end === 'string' ? new Date(ev.end) : new Date(ev.end.getTime());

    this.dragState = {
      type: 'move',
      eventId: ev.id,
      resourceId: ev.resourceId,
      startX: e.clientX,
      startY: e.clientY,
      origStart: evStart,
      origEnd: evEnd,
      origResourceId: ev.resourceId,
    };

    const cellWidthPx = this.getCellWidthPx();
    const rowHeight = this.getRowHeight();

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!this.dragState || this.dragState.type !== 'move') return;

      const dx = moveEv.clientX - this.dragState.startX;
      const dy = moveEv.clientY - this.dragState.startY;

      const slotDelta = Math.round(dx / cellWidthPx);
      const rowDelta = Math.round(dy / rowHeight);

      const minutesDelta = slotDelta * this.granularity;
      const newStart = new Date(this.dragState.origStart!.getTime() + minutesDelta * MIN_MS);
      const newEnd = new Date(this.dragState.origEnd!.getTime() + minutesDelta * MIN_MS);

      // Update resource
      let newResourceIndex = this.resources.findIndex(r => r.id === this.dragState!.origResourceId) + rowDelta;
      newResourceIndex = Math.max(0, Math.min(newResourceIndex, this.resources.length - 1));
      const newResourceId = this.resources[newResourceIndex].id;

      const event = this.events.find(e => e.id === ev.id);
      if (event) {
        event.start = newStart;
        event.end = newEnd;
        event.resourceId = newResourceId;
        this.events = [...this.events];
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (!this.dragState || this.dragState.type !== 'move') return;

      const event = this.events.find(e => e.id === ev.id);
      if (event) {
        this.emitEventMove(event, this.dragState.origResourceId!, this.dragState.origStart!, this.dragState.origEnd!);
      }

      this.dragState = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private handleEventResizeStart(e: MouseEvent, ev: SchedulerEvent, side: 'left' | 'right'): void {
    e.preventDefault();
    e.stopPropagation();

    const evStart = typeof ev.start === 'string' ? new Date(ev.start) : new Date(ev.start.getTime());
    const evEnd = typeof ev.end === 'string' ? new Date(ev.end) : new Date(ev.end.getTime());

    this.dragState = {
      type: 'resize',
      eventId: ev.id,
      resourceId: ev.resourceId,
      startX: e.clientX,
      startY: e.clientY,
      origStart: evStart,
      origEnd: evEnd,
    };

    const cellWidthPx = this.getCellWidthPx();

    const onMouseMove = (moveEv: MouseEvent) => {
      if (!this.dragState || this.dragState.type !== 'resize') return;

      const dx = moveEv.clientX - this.dragState.startX;
      const slotDelta = Math.round(dx / cellWidthPx);
      const minutesDelta = slotDelta * this.granularity;

      const event = this.events.find(e => e.id === ev.id);
      if (!event) return;

      if (side === 'left') {
        const newStart = new Date(this.dragState.origStart!.getTime() + minutesDelta * MIN_MS);
        if (newStart < this.dragState.origEnd!) {
          event.start = newStart;
        }
      } else {
        const newEnd = new Date(this.dragState.origEnd!.getTime() + minutesDelta * MIN_MS);
        if (newEnd > this.dragState.origStart!) {
          event.end = newEnd;
        }
      }

      this.events = [...this.events];
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (!this.dragState || this.dragState.type !== 'resize') return;

      const event = this.events.find(e => e.id === ev.id);
      if (event) {
        this.emitEventResize(event, this.dragState.origStart!, this.dragState.origEnd!);
      }

      this.dragState = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private getCellWidthPx(): number {
    const cell = this.gridWrapper?.querySelector('.scheduler__cell') as HTMLElement;
    return cell ? cell.offsetWidth : 40;
  }

  private getRowHeight(): number {
    const row = this.gridWrapper?.querySelector('.scheduler__row') as HTMLElement;
    return row ? row.offsetHeight : 60;
  }

  private getViewDays(): Date[] {
    const current = this.currentDate;
    const days: Date[] = [];

    if (this.view === 'day') {
      const d = new Date(current);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    } else {
      // week: get Mon-Sun
      const d = new Date(current);
      const dayOfWeek = d.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday start
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const weekDay = new Date(d);
        weekDay.setDate(d.getDate() + i);
        days.push(weekDay);
      }
    }

    return days;
  }

  private getHeaderTitle(): string {
    const d = this.currentDate;
    if (this.view === 'day') {
      return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (this.view === 'week') {
      const days = this.getViewDays();
      const first = days[0];
      const last = days[days.length - 1];
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} (${first.getDate()} - ${last.getDate()})`;
      }
      return `${first.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${last.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  private formatHour(h: number): string {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  private navigatePrev(): void {
    const d = this.currentDate;
    if (this.view === 'day') {
      this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    } else if (this.view === 'week') {
      this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
    } else {
      this.date = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    }
  }

  private navigateNext(): void {
    const d = this.currentDate;
    if (this.view === 'day') {
      this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    } else if (this.view === 'week') {
      this.date = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    } else {
      this.date = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }

  private navigateToday(): void {
    this.date = new Date();
  }

  // Public methods

  addEvent(event: SchedulerEvent): void {
    this.events = [...this.events, event];
  }

  removeEvent(id: string | number): void {
    this.events = this.events.filter(ev => ev.id !== id);
  }

  scrollToDate(date: Date | string): void {
    if (!this.gridWrapper) return;
    const d = typeof date === 'string' ? new Date(date) : date;
    this.date = d;
  }

  scrollToResource(id: string | number): void {
    const resourcePanel = this.container?.querySelector('.scheduler__resources');
    if (!resourcePanel) return;

    const index = this.resources.findIndex(r => r.id === id);
    if (index >= 0) {
      const resourceEls = resourcePanel.querySelectorAll('.scheduler__resource');
      const targetEl = resourceEls[index] as HTMLElement;
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  @watch('resources')
  @watch('events')
  @watch('view')
  @watch('date')
  @watch('granularity')
  @watch('startHour')
  @watch('endHour')
  handlePropertyChange() {
    if (this.container) {
      this.renderGrid();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-scheduler': SniceScheduler;
  }
}
