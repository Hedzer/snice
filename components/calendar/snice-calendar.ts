import { element, property, render, styles, dispatch, html, css } from 'snice';
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

  goToToday(): void {
    this.displayDate = new Date();
    this.value = new Date();
    this.dispatchChange();
  }

  goToDate(date: Date | string): void {
    this.displayDate = typeof date === 'string' ? new Date(date) : date;
    this.value = this.displayDate;
    this.dispatchChange();
  }

  previousMonth(): void {
    this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() - 1);
  }

  nextMonth(): void {
    this.displayDate = new Date(this.displayDate.getFullYear(), this.displayDate.getMonth() + 1);
  }

  previousWeek(): void {
    this.displayDate = new Date(this.displayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  nextWeek(): void {
    this.displayDate = new Date(this.displayDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  previousDay(): void {
    this.displayDate = new Date(this.displayDate.getTime() - 24 * 60 * 60 * 1000);
  }

  nextDay(): void {
    this.displayDate = new Date(this.displayDate.getTime() + 24 * 60 * 60 * 1000);
  }

  getDisplayedMonth(): { month: number; year: number } {
    return {
      month: this.displayDate.getMonth(),
      year: this.displayDate.getFullYear()
    };
  }

  getEventsForDate(date: Date | string): CalendarEvent[] {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const targetDateStr = this.formatDate(targetDate);

    return this.events.filter(event => {
      const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start;
      const eventStartStr = this.formatDate(eventStart);
      return eventStartStr === targetDateStr;
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

  private renderMonthView() {
    const days = this.getMonthDays();
    const weekdays = this.getWeekdays();
    const currentMonth = this.displayDate.getMonth();

    return html`
      <div class="calendar__grid">
        ${weekdays.map(day => html`
          <div class="calendar__weekday">${day}</div>
        `)}

        ${days.map(date => {
          const isOtherMonth = date.getMonth() !== currentMonth;
          const isToday = this.highlightToday && this.isToday(date);
          const isSelected = this.isSelected(date);
          const isDisabled = this.isDisabled(date);
          const dayEvents = this.getEventsForDate(date);

          const classes = [
            'calendar__day',
            isOtherMonth && 'calendar__day--other-month',
            isToday && 'calendar__day--today',
            isSelected && 'calendar__day--selected',
            isDisabled && 'calendar__day--disabled'
          ].filter(Boolean).join(' ');

          return html`
            <div
              class="${classes}"
              @click=${() => this.handleDayClick(date)}>
              <div class="calendar__day-number">${date.getDate()}</div>
              <if ${dayEvents.length > 0}>
                <div class="calendar__events">
                  ${dayEvents.slice(0, 3).map(event => html`
                    <div
                      class="calendar__event"
                      style="${event.color ? `background: ${event.color}` : ''}"
                      @click=${(e: Event) => this.handleEventClick(event, e)}>
                      ${event.title}
                    </div>
                  `)}
                  <if ${dayEvents.length > 3}>
                    <div class="calendar__event" style="background: #999;">
                      +${dayEvents.length - 3} more
                    </div>
                  </if>
                </div>
              </if>
            </div>
          `;
        })}
      </div>
    `;
  }

  @render()
  template() {
    const monthName = this.displayDate.toLocaleDateString(this.locale, { month: 'long', year: 'numeric' });

    return html`
      <div class="calendar calendar--${this.view}">
        <div class="calendar__header">
          <div class="calendar__title">${monthName}</div>
          <div class="calendar__nav">
            <button class="calendar__nav-button" @click=${() => this.goToToday()}>
              Today
            </button>
            <button class="calendar__nav-button" @click=${() => this.previousMonth()}>
              ‹
            </button>
            <button class="calendar__nav-button" @click=${() => this.nextMonth()}>
              ›
            </button>
          </div>
        </div>

        ${this.view === 'month' ? this.renderMonthView() : html``}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-calendar': SniceCalendar;
  }
}
