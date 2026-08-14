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

/** Inline popover content for an event: text, a node, or a node factory. */
export type CalendarEventPopoverContent = string | Node | (() => Node);

/**
 * Lazy popover content provider, called when a bar with `popover` enabled is
 * clicked. May return text, a DOM node, or a promise of either; results that
 * resolve after the popover closed are discarded. When no provider is set,
 * the calendar issues a `@request('calendar/event-popover')` with
 * `{ event }` instead, so any `@respond('calendar/event-popover')` controller
 * can supply the content.
 */
export type CalendarEventPopoverProvider =
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
  /**
   * Click-to-open popover for this event's bars. Absent/false: clicking only
   * dispatches `calendar-event-click`. `true`: content resolves dynamically
   * (element `eventPopover` provider, else the `calendar/event-popover`
   * request channel). String/Node/factory: inline content.
   */
  popover?: boolean | CalendarEventPopoverContent;
  data?: any;
}

export interface SniceCalendarElement extends HTMLElement {
  value: Date | string;
  view: CalendarView;
  events: CalendarEvent[];
  /** Lazy/rich tooltip provider for event bars; wins over `event.tooltip`. */
  eventTooltip: CalendarEventTooltip | null;
  /**
   * Lazy/rich popover provider for bars whose event has `popover` enabled.
   * Wins over the `calendar/event-popover` request channel.
   */
  eventPopover: CalendarEventPopoverProvider | null;
  /** Close any open event popover. */
  closeEventPopover(): void;
  minDate: Date | string;
  maxDate: Date | string;
  disabledDates: (Date | string)[];
  highlightToday: boolean;
  showWeekNumbers: boolean;
  firstDayOfWeek: number;
  locale: string;
  /**
   * Display-only mode: clicking a day neither selects/highlights it nor
   * fires `calendar-change`. Event bars stay interactive.
   * Attribute: `no-day-select`.
   */
  noDaySelect: boolean;

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
