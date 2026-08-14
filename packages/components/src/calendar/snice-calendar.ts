import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import '../avatar/snice-avatar';
import type { SniceCalendarElement, CalendarView, CalendarEvent, CalendarEventTooltip } from './snice-calendar.types';
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

  @property({ attribute: false })
  eventTooltip: CalendarEventTooltip | null = null;

  private displayDate = new Date();
  private tooltipEl!: HTMLElement;
  private tooltipToken = 0;
  private tooltipBar: HTMLElement | null = null;
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

    // Add weekday headers. Every grid child gets an explicit position —
    // event stripe bars are placed explicitly, and mixing explicit items
    // with auto-flow would push auto-placed cells out of their slots.
    const weekdays = this.getWeekdays();
    weekdays.forEach((day, i) => {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar__weekday';
      weekdayEl.textContent = day;
      weekdayEl.style.gridRow = '1';
      weekdayEl.style.gridColumn = String(i + 1);
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

      dayCell.style.gridRow = String(Math.floor(i / 7) + 2);
      dayCell.style.gridColumn = String((i % 7) + 1);

      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar__day-number';
      dayCell.appendChild(dayNumber);

      this.grid.appendChild(dayCell);
      this.dayCells.push(dayCell);
    }

    // Shared tooltip overlay for event bars — one element, repositioned per
    // bar, so rich content can load lazily without a tooltip instance per bar.
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'calendar__tooltip';
    this.tooltipEl.setAttribute('part', 'event-tooltip');
    this.tooltipEl.setAttribute('role', 'tooltip');
    this.tooltipEl.id = 'calendar-event-tooltip';
    this.tooltipEl.hidden = true;

    this.container.appendChild(this.header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.tooltipEl);
    shadow.appendChild(this.container);
  }

  private async showEventTooltip(bar: HTMLElement, event: CalendarEvent) {
    const token = ++this.tooltipToken;
    const provider = this.eventTooltip;

    let content: string | Node | undefined;
    if (provider) {
      try {
        content = await provider(event);
      } catch {
        content = event.tooltip;
      }
    } else {
      content = event.tooltip;
    }

    // Pointer already left (or moved to another bar) while loading.
    if (token !== this.tooltipToken || content == null) return;

    if (typeof content === 'string') this.tooltipEl.textContent = content;
    else this.tooltipEl.replaceChildren(content);

    this.tooltipEl.hidden = false;
    this.tooltipBar = bar;
    bar.setAttribute('aria-describedby', this.tooltipEl.id);

    // Fixed positioning above the bar, clamped to the viewport.
    const rect = bar.getBoundingClientRect();
    this.tooltipEl.style.left = `${Math.max(4, rect.left)}px`;
    this.tooltipEl.style.top = `${Math.max(4, rect.top - this.tooltipEl.offsetHeight - 6)}px`;
  }

  private hideEventTooltip() {
    this.tooltipToken++;
    this.tooltipEl.hidden = true;
    this.tooltipBar?.removeAttribute('aria-describedby');
    this.tooltipBar = null;
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
    });

    this.renderEventStripes(days);
  }

  /** Visible stacking depth for event stripes; deeper lanes collapse into a
   *  per-day "+N more" chip. */
  private static readonly MAX_EVENT_LANES = 3;

  /**
   * Render events as continuous stripes: one bar per (event × week row),
   * spanning the event's days in that week and chopped at week boundaries
   * with continues-left/right styling. Overlapping events stack into lanes
   * per week — earlier start first, longer event first on ties — like
   * professional calendars.
   */
  private renderEventStripes(days: Date[]) {
    this.grid.querySelectorAll('.calendar__event-bar').forEach(el => el.remove());
    this.dayCells.forEach(cell => {
      cell.querySelector('.calendar__more')?.remove();
      cell.style.removeProperty('--calendar-week-lanes');
      cell.style.removeProperty('--calendar-week-more');
      cell.classList.remove('calendar__day--stacked');
    });

    if (!this.events || this.events.length === 0) return;

    // Local-midnight timestamps for the visible grid; events normalize to the
    // same construction so lookups are exact (and DST-safe).
    const dayTimes = days.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    const dayIndex = new Map<number, number>(dayTimes.map((t, i) => [t, i]));
    const gridStart = dayTimes[0];
    const gridEnd = dayTimes[dayTimes.length - 1];

    const normalize = (d: Date | string): number => {
      const date = typeof d === 'string' ? new Date(d) : d;
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    };

    type Segmentable = {
      event: CalendarEvent;
      startIdx: number;
      endIdx: number;
      startsBeforeGrid: boolean;
      endsAfterGrid: boolean;
      startTime: number;
      duration: number;
      order: number;
    };

    const resolved: Segmentable[] = [];
    this.events.forEach((event, order) => {
      if (!event.start) return;
      const startTime = normalize(event.start);
      if (isNaN(startTime)) return;
      const endTime = event.end ? Math.max(normalize(event.end), startTime) : startTime;
      if (isNaN(endTime) || endTime < gridStart || startTime > gridEnd) return;

      const startsBeforeGrid = startTime < gridStart;
      const endsAfterGrid = endTime > gridEnd;
      const startIdx = startsBeforeGrid ? 0 : dayIndex.get(startTime)!;
      const endIdx = endsAfterGrid ? dayTimes.length - 1 : dayIndex.get(endTime)!;
      resolved.push({
        event, startIdx, endIdx, startsBeforeGrid, endsAfterGrid,
        startTime, duration: endTime - startTime, order,
      });
    });

    resolved.sort((a, b) =>
      a.startTime - b.startTime || b.duration - a.duration || a.order - b.order);

    const hiddenPerDay = new Array(dayTimes.length).fill(0);
    const weekCount = Math.floor(dayTimes.length / 7);
    const weekLaneCounts = new Array(weekCount).fill(0);

    for (let week = 0; week < weekCount; week++) {
      const weekStart = week * 7;
      const weekEnd = weekStart + 6;
      // lanes[lane] holds the occupied [startCol, endCol] ranges in this week.
      const lanes: Array<Array<[number, number]>> = [];

      for (const item of resolved) {
        if (item.endIdx < weekStart || item.startIdx > weekEnd) continue;

        const segStart = Math.max(item.startIdx, weekStart);
        const segEnd = Math.min(item.endIdx, weekEnd);
        const startCol = segStart - weekStart;
        const endCol = segEnd - weekStart;

        let lane = 0;
        while (lanes[lane]?.some(([s, e]) => startCol <= e && endCol >= s)) lane++;
        (lanes[lane] ??= []).push([startCol, endCol]);
        weekLaneCounts[week] = Math.min(
          Math.max(weekLaneCounts[week], lane + 1), SniceCalendar.MAX_EVENT_LANES);

        if (lane >= SniceCalendar.MAX_EVENT_LANES) {
          for (let i = segStart; i <= segEnd; i++) hiddenPerDay[i]++;
          continue;
        }

        const continuesLeft = segStart > item.startIdx
          || (segStart === item.startIdx && item.startsBeforeGrid);
        const continuesRight = segEnd < item.endIdx
          || (segEnd === item.endIdx && item.endsAfterGrid);

        const bar = document.createElement('div');
        bar.className = 'calendar__event-bar';
        if (continuesLeft) bar.classList.add('calendar__event-bar--continues-left');
        if (continuesRight) bar.classList.add('calendar__event-bar--continues-right');

        // A custom className rides along on both the class list and the part
        // attribute, so events are styleable from outside via
        // ::part(<className>).
        const customClasses = item.event.className
          ? item.event.className.split(/\s+/).filter(Boolean)
          : [];
        bar.classList.add(...customClasses);
        bar.setAttribute('part', ['event-bar', ...customClasses].join(' '));

        bar.setAttribute('data-event-id', String(item.event.id));
        bar.setAttribute('data-lane', String(lane));
        bar.style.gridRow = String(week + 2); // row 1 is the weekday header
        bar.style.gridColumn = `${startCol + 1} / ${endCol + 2}`;
        bar.style.setProperty('--calendar-event-lane', String(lane));
        if (item.event.color) bar.style.background = item.event.color;

        if (item.event.avatar) {
          const spec = typeof item.event.avatar === 'string'
            ? { src: item.event.avatar }
            : item.event.avatar;
          const avatar = document.createElement('snice-avatar') as any;
          avatar.className = 'calendar__event-avatar';
          avatar.setAttribute('part', 'event-avatar');
          // Attributes, not property assignments: the avatar's shape/size CSS
          // matches on :host([shape])/:host([size]) attribute selectors.
          avatar.setAttribute('size', 'xs');
          avatar.setAttribute('shape', 'circle');
          // Tiny thumbnail — eager: lazy-load buys nothing at this size and
          // stalls on very tall pages.
          avatar.setAttribute('loading', 'eager');
          if (spec.src) avatar.src = spec.src;
          if (spec.name) avatar.name = spec.name;
          if (spec.alt) avatar.alt = spec.alt;
          bar.appendChild(avatar);
        }
        const titleEl = document.createElement('span');
        titleEl.className = 'calendar__event-title';
        titleEl.textContent = item.event.title;
        bar.appendChild(titleEl);

        // Tooltip: static string, or lazy/rich content from eventTooltip.
        // The native title attribute stays only when no tooltip is configured.
        if (item.event.tooltip || this.eventTooltip) {
          bar.onmouseenter = () => this.showEventTooltip(bar, item.event);
          bar.onmouseleave = () => this.hideEventTooltip();
        } else {
          bar.title = item.event.title;
        }
        bar.onclick = (e) => this.handleEventClick(item.event, e);
        this.grid.appendChild(bar);
      }
    }

    hiddenPerDay.forEach((count, i) => {
      if (count === 0) return;
      const cell = this.dayCells[i];
      if (!cell) return;
      const more = document.createElement('div');
      more.className = 'calendar__more';
      more.textContent = `+${count} more`;
      cell.appendChild(more);
    });

    // Reserve row height for the lane stack (and the "+N more" chip) so
    // stripes never spill past their week row — every cell in a week shares
    // the reservation, since the grid row is as tall as its tallest cell.
    for (let week = 0; week < weekCount; week++) {
      if (weekLaneCounts[week] === 0) continue;
      const weekHasMore = hiddenPerDay
        .slice(week * 7, week * 7 + 7).some(count => count > 0);
      for (let i = week * 7; i < week * 7 + 7; i++) {
        const cell = this.dayCells[i];
        if (!cell) continue;
        cell.style.setProperty('--calendar-week-lanes', String(weekLaneCounts[week]));
        if (weekHasMore) cell.style.setProperty('--calendar-week-more', '1rem');
        // Stacked rows size by their reservation; aspect-ratio would
        // transfer the height into a min-width and overflow the column.
        cell.classList.add('calendar__day--stacked');
      }
    }
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
  @watch('eventTooltip')
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
      weekdayEl.style.gridRow = '1';
      weekdayEl.style.gridColumn = String(i + 1);
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
