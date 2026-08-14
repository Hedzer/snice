export type CalendarView = 'month' | 'week' | 'day';

/** Avatar shown at the start of an event's bars, rendered with <snice-avatar>. */
export interface CalendarEventAvatar {
  /** Image URL. */
  src?: string;
  /** Person's name — used for the initials fallback when there is no image. */
  name?: string;
  alt?: string;
}

/**
 * Lazy tooltip content for an event bar. Called when the pointer enters a
 * bar; may return plain text, a DOM node for rich content, or a promise of
 * either (resolved results are discarded if the pointer has already left).
 */
export type CalendarEventTooltip =
  (event: CalendarEvent) => string | Node | Promise<string | Node>;

export interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date | string;
  end?: Date | string;
  color?: string;
  /**
   * Extra class name(s) for this event's stripe bars. Also appended to the
   * bars' `part` attribute, so specific events are styleable from outside:
   * `snice-calendar::part(urgent) { ... }`.
   */
  className?: string;
  /** Avatar on each bar; a plain string is shorthand for `{ src }`. */
  avatar?: string | CalendarEventAvatar;
  /** Static tooltip text for this event's bars. */
  tooltip?: string;
  data?: any;
}

export interface SniceCalendarElement extends HTMLElement {
  value: Date | string;
  view: CalendarView;
  events: CalendarEvent[];
  /** Lazy/rich tooltip provider for event bars; wins over `event.tooltip`. */
  eventTooltip: CalendarEventTooltip | null;
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
