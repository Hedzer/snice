export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date | string;
  end?: Date | string;
  color?: string;
  data?: any;
}

export interface SniceCalendarElement extends HTMLElement {
  value: Date | string;
  view: CalendarView;
  events: CalendarEvent[];
  minDate: Date | string;
  maxDate: Date | string;
  disabledDates: (Date | string)[];
  highlightToday: boolean;
  showWeekNumbers: boolean;
  firstDayOfWeek: number;
  locale: string;

  goToToday(): void;
  goToDate(date: Date | string): void;
  previousMonth(): void;
  nextMonth(): void;
  previousWeek(): void;
  nextWeek(): void;
  previousDay(): void;
  nextDay(): void;
  getDisplayedMonth(): { month: number; year: number };
  getEventsForDate(date: Date | string): CalendarEvent[];
}
