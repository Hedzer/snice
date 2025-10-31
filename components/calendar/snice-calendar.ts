import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import type { SniceCalendarElement, CalendarView, CalendarEvent } from './snice-calendar.types';
import cssContent from './snice-calendar.css?inline';

@element('snice-calendar')
export class SniceCalendar extends HTMLElement implements SniceCalendarElement {
  @property({ type: Date })
  value: Date | string = new Date();

  @property({ attribute: 'view' })
  view: CalendarView = 'month';

  @property({ type: Array })
  events: CalendarEvent[] = [];

  @property({ type: Date, attribute: 'min-date' })
  minDate: Date | string = '';

  @property({ type: Date, attribute: 'max-date' })
  maxDate: Date | string = '';

  @property({ type: Array, attribute: 'disabled-dates' })
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

  @dispatch('@snice/calendar-change', { bubbles: true, composed: true })
  private dispatchChange() {
    return { value: this.value, calendar: this };
  }

  @dispatch('@snice/calendar-event-click', { bubbles: true, composed: true })
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

    // Create header
    this.header = document.createElement('div');
    this.header.className = 'calendar__header';

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

    // Add weekday headers
    const weekdays = this.getWeekdays();
    weekdays.forEach(day => {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar__weekday';
      weekdayEl.textContent = day;
      this.grid.appendChild(weekdayEl);
    });

    // Create 42 day cells
    for (let i = 0; i < 42; i++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar__day';

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

    days.forEach((date, i) => {
      const cell = this.dayCells[i];
      if (!cell) return;

      const isOtherMonth = date.getMonth() !== currentMonth;
      const isToday = this.highlightToday && this.isToday(date);
      const isSelected = this.isSelected(date);
      const isDisabled = this.isDisabled(date);
      const dayEvents = this.getEventsForDate(date);

      // Update classes
      cell.className = 'calendar__day';
      if (isOtherMonth) cell.classList.add('calendar__day--other-month');
      if (isToday) cell.classList.add('calendar__day--today');
      if (isSelected) cell.classList.add('calendar__day--selected');
      if (isDisabled) cell.classList.add('calendar__day--disabled');

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
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-calendar': SniceCalendar;
  }
}
