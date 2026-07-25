import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import type { SniceCalendarElement, CalendarView, CalendarEvent } from './snice-calendar.types';
import cssContent from './snice-calendar.css?inline';

@element('snice-calendar')
export class SniceCalendar extends HTMLElement implements SniceCalendarElement {
  @property({ type: Date })
  value: Date | string = new Date();

  @property({ attribute: 'view' })
  view: CalendarView = 'month';

  @property({ type: Array, attribute: false })
  events: CalendarEvent[] = [];

  @property({ type: Date, attribute: 'min-date' })
  minDate: Date | string = '';

  @property({ type: Date, attribute: 'max-date' })
  maxDate: Date | string = '';

  @property({ type: Array, attribute: false })
  disabledDates: (Date | string)[] = [];

  @property({ type: Boolean, attribute: 'highlight-today' })
  highlightToday = true;

  @property({ type: Boolean, attribute: 'show-week-numbers' })
  showWeekNumbers = false;

  @property({ type: Number, attribute: 'first-day-of-week' })
  firstDayOfWeek = 0; // 0 = Sunday, 1 = Monday

  @property({ attribute: 'locale' })
  locale = 'en-US';

  private displayDate = new Date();
  private container!: HTMLElement;
  private header!: HTMLElement;
  private grid!: HTMLElement;
  private dayCells: HTMLElement[] = [];
  private focusedDate: Date | null = null;

  private computeRovingIndex(days: Date[]): number {
    // Prefer: focused → selected → today → first in-month day
    const same = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (this.focusedDate) {
      const idx = days.findIndex(d => same(d, this.focusedDate!));
      if (idx >= 0) return idx;
    }
    if (this.value) {
      const s = this.value instanceof Date ? this.value : new Date(this.value);
      if (!isNaN(s.getTime())) {
        const idx = days.findIndex(d => same(d, s));
        if (idx >= 0) return idx;
      }
    }
    const today = new Date();
    const tIdx = days.findIndex(d => same(d, today));
    if (tIdx >= 0) return tIdx;
    return days.findIndex(d => d.getMonth() === this.displayDate.getMonth());
  }

  private handleGridKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const currentDate = (target as any).__date as Date | undefined;
    if (!currentDate) return;

    let delta: number | null = null;
    let monthStep: 1 | -1 | null = null;
    switch (e.key) {
      case 'ArrowLeft':  delta = -1; break;
      case 'ArrowRight': delta = 1; break;
      case 'ArrowUp':    delta = -7; break;
      case 'ArrowDown':  delta = 7; break;
      case 'Home':       delta = -currentDate.getDay(); break;
      case 'End':        delta = 6 - currentDate.getDay(); break;
      case 'PageUp':     monthStep = -1; break;
      case 'PageDown':   monthStep = 1; break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.handleDayClick(currentDate);
        return;
      default: return;
    }
    e.preventDefault();
    const next = new Date(currentDate);
    if (delta !== null) next.setDate(currentDate.getDate() + delta);
    if (monthStep !== null) next.setMonth(currentDate.getMonth() + monthStep);

    // If moved outside the displayed month, navigate.
    if (next.getMonth() !== this.displayDate.getMonth() ||
        next.getFullYear() !== this.displayDate.getFullYear()) {
      this.displayDate = new Date(next.getFullYear(), next.getMonth(), 1);
    }
    this.focusedDate = next;
    this.updateView();
    // Move focus to the newly-selected cell after DOM update.
    const sameAs = (d: Date, e2: Date) =>
      d.getFullYear() === e2.getFullYear() &&
      d.getMonth() === e2.getMonth() &&
      d.getDate() === e2.getDate();
    requestAnimationFrame(() => {
      const cell = this.dayCells.find(c => sameAs((c as any).__date, next));
      cell?.focus();
    });
  };

  @dispatch('calendar-change', { bubbles: true, composed: true })
  private dispatchChange() {
    return { value: this.value, calendar: this };
  }

  @dispatch('calendar-event-click', { bubbles: true, composed: true })
  private dispatchEventClick(event: CalendarEvent) {
    return { event, calendar: this };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.createDOM();
    this.updateView();
  }

  private createDOM() {
    const shadow = this.shadowRoot!;

    // Create container
    this.container = document.createElement('div');
    this.container.className = `calendar calendar--${this.view}`;
    this.container.setAttribute('part', 'base');

    // Create header
    this.header = document.createElement('div');
    this.header.className = 'calendar__header';
    this.header.setAttribute('part', 'header');

    const title = document.createElement('div');
    title.className = 'calendar__title';

    const nav = document.createElement('div');
    nav.className = 'calendar__nav';

    const todayBtn = document.createElement('button');
    todayBtn.className = 'calendar__nav-button';
    todayBtn.textContent = 'Today';
    todayBtn.onclick = () => this.goToToday();

    const prevBtn = document.createElement('button');
    prevBtn.className = 'calendar__nav-button';
    prevBtn.textContent = '‹';
    prevBtn.onclick = () => this.previousMonth();

    const nextBtn = document.createElement('button');
    nextBtn.className = 'calendar__nav-button';
    nextBtn.textContent = '›';
    nextBtn.onclick = () => this.nextMonth();

    nav.appendChild(todayBtn);
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);

    this.header.appendChild(title);
    this.header.appendChild(nav);

    // Create grid
    this.grid = document.createElement('div');
    this.grid.className = 'calendar__grid';
    this.grid.setAttribute('part', 'grid');

    // Add weekday headers
    const weekdays = this.getWeekdays();
    weekdays.forEach(day => {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar__weekday';
      weekdayEl.textContent = day;
      this.grid.appendChild(weekdayEl);
    });

    // Mark grid for a11y
    this.grid.setAttribute('role', 'grid');
    this.grid.setAttribute('aria-label', 'Calendar');
    this.grid.addEventListener('keydown', this.handleGridKeydown);

    // Create 42 day cells
    for (let i = 0; i < 42; i++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar__day';
      dayCell.setAttribute('role', 'gridcell');
      // Roving tabindex: only one cell is tabbable at a time. Start by
      // making the first cell tabbable; updateView re-targets the focused
      // date so today/selected gets the 0.
      dayCell.setAttribute('tabindex', i === 0 ? '0' : '-1');

      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar__day-number';
      dayCell.appendChild(dayNumber);

      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'calendar__events';
      eventsContainer.style.display = 'none';
      dayCell.appendChild(eventsContainer);

      this.grid.appendChild(dayCell);
      this.dayCells.push(dayCell);
    }

    this.container.appendChild(this.header);
    this.container.appendChild(this.grid);
    shadow.appendChild(this.container);
  }

  private updateView() {
    // Update header title
    const monthName = this.displayDate.toLocaleDateString(this.locale, { month: 'long', year: 'numeric' });
    const titleEl = this.header.querySelector('.calendar__title') as HTMLElement;
    if (titleEl) titleEl.textContent = monthName;

    // Update day cells
    const days = this.getMonthDays();
    const currentMonth = this.displayDate.getMonth();

    // Resolve which cell should be tab-stoppable (roving tabindex).
    const rovingIndex = this.computeRovingIndex(days);

    days.forEach((date, i) => {
      const cell = this.dayCells[i];
      if (!cell) return;

      const isOtherMonth = date.getMonth() !== currentMonth;
      const isToday = this.highlightToday && this.isToday(date);
      const isSelected = this.isSelected(date);
      const isDisabled = this.isDisabled(date);
      const dayEvents = this.getEventsForDate(date);

      // Update classes (preserving role)
      cell.className = 'calendar__day';
      if (isOtherMonth) cell.classList.add('calendar__day--other-month');
      if (isToday) cell.classList.add('calendar__day--today');
      if (isSelected) cell.classList.add('calendar__day--selected');
      if (isDisabled) cell.classList.add('calendar__day--disabled');

      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      cell.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      cell.setAttribute('aria-current', isToday && !isOtherMonth ? 'date' : 'false');
      cell.setAttribute('tabindex', i === rovingIndex ? '0' : '-1');
      cell.setAttribute('aria-label', date.toLocaleDateString(this.locale, { dateStyle: 'full' }));
      (cell as any).__date = date;

      // Update day number
      const dayNumber = cell.querySelector('.calendar__day-number') as HTMLElement;
      if (dayNumber) dayNumber.textContent = String(date.getDate());

      // Update click handler
      cell.onclick = () => this.handleDayClick(date);

      // Update events
      const eventsContainer = cell.querySelector('.calendar__events') as HTMLElement;
      if (eventsContainer) {
        if (dayEvents.length > 0) {
          eventsContainer.style.display = '';
          eventsContainer.innerHTML = '';

          dayEvents.slice(0, 3).forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'calendar__event';
            if (event.color) eventEl.style.background = event.color;
            eventEl.textContent = event.title;
            eventEl.onclick = (e) => this.handleEventClick(event, e);
            eventsContainer.appendChild(eventEl);
          });

          if (dayEvents.length > 3) {
            const moreEl = document.createElement('div');
            moreEl.className = 'calendar__event';
            moreEl.style.background = '#999';
            moreEl.textContent = `+${dayEvents.length - 3} more`;
            eventsContainer.appendChild(moreEl);
          }
        } else {
          eventsContainer.style.display = 'none';
        }
      }
    });
  }

  goToToday(): void {
    this.displayDate = new Date();
    this.value = new Date();
    this.updateView();
    this.dispatchChange();
  }

  goToDate(date: Date | string): void {
    this.displayDate = typeof date === 'string' ? new Date(date) : date;
    this.value = this.displayDate;
    this.updateView();
    this.dispatchChange();
  }

  previousMonth(): void {
    this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() - 1);
    this.updateView();
  }

  nextMonth(): void {
    this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() + 1);
    this.updateView();
  }

  previousWeek(): void {
    this.displayDate = new Date(this.displayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.updateView();
  }

  nextWeek(): void {
    this.displayDate = new Date(this.displayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.updateView();
  }

  previousDay(): void {
    this.displayDate = new Date(this.displayDate.getTime() - 24 * 60 * 60 * 1000);
    this.updateView();
  }

  nextDay(): void {
    this.displayDate = new Date(this.displayDate.getTime() + 24 * 60 * 60 * 1000);
    this.updateView();
  }

  getDisplayedMonth(): { month: number; year: number } {
    return {
      month: this.displayDate.getMonth(),
      year: this.displayDate.getFullYear()
    };
  }

  getEventsForDate(date: Date | string): CalendarEvent[] {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const targetTime = targetDate.getTime();

    return this.events.filter(event => {
      if (!event.start) return false;

      const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start;
      const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();

      // If no end date, event is single day
      if (!event.end) {
        return this.isSameDay(targetDate, startDate);
      }

      // Multi-day event: check if target date falls between start and end
      const endDate = typeof event.end === 'string' ? new Date(event.end) : event.end;
      const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

      return targetTime >= startTime && targetTime <= endTime;
    });
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return this.formatDate(date1) === this.formatDate(date2);
  }

  private isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  private isSelected(date: Date): boolean {
    const valueDate = typeof this.value === 'string' ? new Date(this.value) : this.value;
    return this.isSameDay(date, valueDate);
  }

  private isDisabled(date: Date): boolean {
    if (this.minDate) {
      const min = typeof this.minDate === 'string' ? new Date(this.minDate) : this.minDate;
      if (date < min) return true;
    }

    if (this.maxDate) {
      const max = typeof this.maxDate === 'string' ? new Date(this.maxDate) : this.maxDate;
      if (date > max) return true;
    }

    return this.disabledDates.some(d => {
      const disabledDate = typeof d === 'string' ? new Date(d) : d;
      return this.isSameDay(date, disabledDate);
    });
  }

  private handleDayClick(date: Date) {
    if (this.isDisabled(date)) return;

    this.value = date;
    this.updateView();
    this.dispatchChange();
  }

  private handleEventClick(event: CalendarEvent, e: Event) {
    e.stopPropagation();
    this.dispatchEventClick(event);
  }

  private getMonthDays(): Date[] {
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Adjust for first day of week setting
    const daysToSubtract = (firstDayOfWeek - this.firstDayOfWeek + 7) % 7;
    const startDate = new Date(year, month, 1 - daysToSubtract);

    // Generate 42 days (6 weeks)
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
    }

    return days;
  }

  private getWeekdays(): string[] {
    const weekdays = [];
    const baseDate = new Date(2024, 0, this.firstDayOfWeek); // Start from a Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      weekdays.push(date.toLocaleDateString(this.locale, { weekday: 'short' }));
    }

    return weekdays;
  }

  @watch('value')
  @watch('events')
  handlePropertyChange() {
    if (this.grid) {
      this.updateView();
    }
  }

  @watch('locale')
  @watch('firstDayOfWeek')
  handleWeekdayInputsChange() {
    if (!this.grid) return;
    // Rebuild the weekday header row so the new locale / start-of-week is reflected.
    const existing = this.grid.querySelectorAll('.calendar__weekday');
    existing.forEach(el => el.remove());
    const weekdays = this.getWeekdays();
    weekdays.forEach((day, i) => {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar__weekday';
      weekdayEl.textContent = day;
      // Insert before the first day cell so header row stays at the top
      this.grid.insertBefore(weekdayEl, this.grid.children[i] || null);
    });
    this.updateView();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-calendar': SniceCalendar;
  }
}
