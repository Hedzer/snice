import { element, property, styles, dispatch, ready, watch, observe, css, request, dispose } from 'snice';
import '../avatar/snice-avatar';
import type {
  SniceCalendarElement, CalendarView, CalendarEvent, CalendarEventTooltip,
  CalendarEventPopoverProvider,
} from './snice-calendar.types';
import cssContent from './snice-calendar.css?inline';

@element('snice-calendar')
export class SniceCalendar extends HTMLElement implements SniceCalendarElement {
  /**
   * The selected day, or `null` for "nothing selected yet" — the state a
   * calendar starts in. A default of today would paint the selected
   * background over today's own highlight, making `highlight-today` invisible
   * and announcing `aria-selected` for a choice the user never made.
   */
  @property({ type: Date })
  value: Date | string | null = null;

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

  @property({ type: Boolean, attribute: 'no-day-select' })
  noDaySelect = false;

  @property({ attribute: 'cell-sizing' })
  cellSizing: 'square' | 'stretch' = 'square';

  @property({ attribute: false })
  eventTooltip: CalendarEventTooltip | null = null;

  @property({ attribute: false })
  eventPopover: CalendarEventPopoverProvider | null = null;

  private displayDate = new Date();
  private tooltipEl!: HTMLElement;
  private tooltipToken = 0;
  private tooltipBar: HTMLElement | null = null;
  private popoverEl!: HTMLElement;
  private popoverToken = 0;
  private popoverBar: HTMLElement | null = null;
  private boundPopoverEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.popoverBar) this.closeEventPopover();
  };
  private boundPopoverOutside = (e: MouseEvent) => {
    if (!this.popoverBar) return;
    if (e.composedPath().includes(this.popoverEl)) return;
    this.closeEventPopover({ returnFocus: false });
  };
  private container!: HTMLElement;
  private header!: HTMLElement;
  private grid!: HTMLElement;
  private dayCells: HTMLElement[] = [];
  private weekNumberHeader!: HTMLElement;
  private weekNumberCells: HTMLElement[] = [];
  private focusedDate: Date | null = null;

  /**
   * Columns the day grid is shifted by. The week-number column occupies the
   * grid's first column, so every explicitly-placed child — weekday headers,
   * day cells, event stripes — moves one column right while it is shown.
   */
  private get columnOffset(): number {
    return this.showWeekNumbers ? 1 : 0;
  }

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

  /**
   * `calendar-more-click` carries a default action (the built-in day panel),
   * so it is cancelable and the component has to read the result of the
   * dispatch. `@dispatch` accepts `cancelable` — it is EventInit passthrough —
   * but the decorated method returns the detail, not `dispatchEvent`'s
   * boolean, so a cancelable default action cannot be observed through it.
   * Dispatched by hand for that reason, the same way `snice-link`'s `navigate`
   * and `snice-stepper`'s `step-change` are.
   *
   * @returns `false` when a listener called `preventDefault()`.
   */
  private dispatchMoreClick(date: Date, count: number): boolean {
    return this.dispatchEvent(new CustomEvent('calendar-more-click', {
      detail: { date, count, calendar: this },
      bubbles: true,
      composed: true,
      cancelable: true,
    }));
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
      weekdayEl.style.gridColumn = String(i + 1 + this.columnOffset);
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
      dayCell.style.gridColumn = String((i % 7) + 1 + this.columnOffset);

      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar__day-number';
      dayCell.appendChild(dayNumber);

      this.grid.appendChild(dayCell);
      this.dayCells.push(dayCell);
    }

    // Week-number column: a header corner cell plus one row header per week
    // row, all in the reserved first column. Built once here and attached only
    // while `show-week-numbers` is on, so a calendar without it carries no
    // extra nodes.
    this.weekNumberHeader = document.createElement('div');
    this.weekNumberHeader.className =
      'calendar__week-number calendar__week-number--header';
    this.weekNumberHeader.setAttribute('part', 'week-number-header');
    this.weekNumberHeader.setAttribute('aria-hidden', 'true');
    this.weekNumberHeader.style.gridRow = '1';
    this.weekNumberHeader.style.gridColumn = '1';

    for (let week = 0; week < 6; week++) {
      const weekCell = document.createElement('div');
      weekCell.className = 'calendar__week-number';
      weekCell.setAttribute('part', 'week-number');
      weekCell.setAttribute('role', 'rowheader');
      weekCell.style.gridRow = String(week + 2);
      weekCell.style.gridColumn = '1';
      this.weekNumberCells.push(weekCell);
    }

    // Shared tooltip overlay for event bars — one element, repositioned per
    // bar, so rich content can load lazily without a tooltip instance per bar.
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'calendar__tooltip';
    this.tooltipEl.setAttribute('part', 'event-tooltip');
    this.tooltipEl.setAttribute('role', 'tooltip');
    this.tooltipEl.id = 'calendar-event-tooltip';
    this.tooltipEl.hidden = true;

    // Interactive click-to-open popover for event details. One shared panel,
    // anchored per bar; content may load lazily (provider or the
    // calendar/event-popover request channel).
    this.popoverEl = document.createElement('div');
    this.popoverEl.className = 'calendar__popover';
    this.popoverEl.setAttribute('part', 'event-popover');
    this.popoverEl.setAttribute('role', 'dialog');
    this.popoverEl.setAttribute('aria-label', 'Event details');
    this.popoverEl.tabIndex = -1;
    this.popoverEl.hidden = true;

    this.container.appendChild(this.header);
    this.container.appendChild(this.grid);
    this.container.appendChild(this.tooltipEl);
    this.container.appendChild(this.popoverEl);
    shadow.appendChild(this.container);
  }

  /**
   * Dynamic popover channel: yields `{ event }` so any
   * `@respond('calendar/event-popover')` controller can return the content.
   */
  @request('calendar/event-popover')
  private async *requestEventPopoverContent(event: CalendarEvent): any {
    return await (yield { event });
  }

  /**
   * Opens the shared overlay, empty, anchored on `anchor`, and arms its
   * Escape / outside-press dismissal. Both panels the calendar owns — the
   * event popover and the "+N more" day list — go through here, so they share
   * one dismissal contract and one focus-return target.
   *
   * @returns the token identifying this opening; async content must check it
   *          against `popoverToken` before painting.
   */
  private beginPopover(anchor: HTMLElement, label: string): number {
    const token = ++this.popoverToken;
    this.hideEventTooltip();
    // A trigger that advertises aria-haspopup owes the reader the panel's
    // state too — and the previous anchor is stale the moment this one opens
    // (an entry in the day panel re-anchors the overlay on the same chip).
    this.setAnchorExpanded(this.popoverBar, false);
    this.setAnchorExpanded(anchor, true);
    this.popoverBar = anchor;
    this.popoverEl.setAttribute('aria-label', label);
    this.popoverEl.replaceChildren();
    this.popoverEl.hidden = false;
    this.syncOverlayLift();
    document.addEventListener('keydown', this.boundPopoverEscape, true);
    document.addEventListener('mousedown', this.boundPopoverOutside, true);
    return token;
  }

  private async openEventPopover(bar: HTMLElement, event: CalendarEvent) {
    // Anchor + loading shell first, so slow content still feels responsive.
    const token = this.beginPopover(bar, event.title || 'Event details');
    const loading = document.createElement('div');
    loading.className = 'calendar__popover-loading';
    loading.textContent = 'Loading…';
    this.popoverEl.appendChild(loading);
    this.positionPopover(bar);

    let content: string | Node | undefined;
    try {
      if (event.popover !== true && event.popover) {
        content = typeof event.popover === 'function' ? event.popover() : event.popover;
      } else if (this.eventPopover) {
        content = await this.eventPopover(event);
      } else {
        content = await this.requestEventPopoverContent(event);
      }
    } catch {
      // No responder discovered (or the provider failed) — close quietly.
      content = undefined;
    }

    if (token !== this.popoverToken) return; // closed (or replaced) meanwhile

    if (content == null) {
      console.warn(
        `[snice-calendar] event "${String(event.id)}" enables a popover but no content was provided — set eventPopover, event.popover content, or a @respond('calendar/event-popover') handler.`
      );
      this.closeEventPopover({ returnFocus: false });
      return;
    }

    if (typeof content === 'string') this.popoverEl.textContent = content;
    else this.popoverEl.replaceChildren(content);
    this.positionPopover(bar);
    this.popoverEl.focus();
  }

  /**
   * The "+N more" chip's built-in default action: the day's hidden events,
   * listed in the shared overlay.
   *
   * Wiring `calendar-more-click` is an application concern, but a chip that
   * visibly does nothing when clicked reads as broken, so the component owns a
   * sensible default. It is only a default — the event is cancelable, and
   * `preventDefault()` leaves the day to the app.
   */
  private openMorePanel(chip: HTMLElement, date: Date, hidden: CalendarEvent[]) {
    const dayLabel = date.toLocaleDateString(this.locale, { dateStyle: 'full' });
    this.beginPopover(chip,
      `${hidden.length} more event${hidden.length === 1 ? '' : 's'} on ${dayLabel}`);

    const heading = document.createElement('p');
    heading.className = 'calendar__more-date';
    heading.setAttribute('part', 'more-panel-date');
    heading.textContent = dayLabel;

    const list = document.createElement('ul');
    list.className = 'calendar__more-list';
    list.setAttribute('part', 'more-list');
    // Explicit: `list-style: none` drops the implicit list role in WebKit.
    list.setAttribute('role', 'list');

    for (const event of hidden) {
      const item = document.createElement('li');
      const entry = document.createElement('button');
      entry.type = 'button';
      entry.className = 'calendar__more-item';
      entry.setAttribute('part', 'more-item');

      const dot = document.createElement('span');
      dot.className = 'calendar__more-dot';
      dot.setAttribute('part', 'more-dot');
      dot.setAttribute('aria-hidden', 'true');
      if (event.color) dot.style.background = event.color;

      const title = document.createElement('span');
      title.className = 'calendar__more-title';
      title.textContent = event.title;

      entry.append(dot, title);
      entry.onclick = (e) => this.handleMorePanelEntry(chip, event, e);
      item.appendChild(entry);
      list.appendChild(item);
    }

    this.popoverEl.append(heading, list);
    this.positionPopover(chip);
    this.popoverEl.focus();
  }

  /**
   * A panel entry behaves like the event's own stripe: it reports the click,
   * and drills into the event's popover when it has one. Without popover
   * content there is nothing further to show, so the panel closes and hands
   * focus back to the chip.
   */
  private handleMorePanelEntry(chip: HTMLElement, event: CalendarEvent, e: Event) {
    this.handleEventClick(event, e);
    if (event.popover) this.openEventPopover(chip, event);
    else this.closeEventPopover();
  }

  /**
   * Places an overlay at a point given in viewport coordinates.
   *
   * `:host` declares `contain: layout`, which makes the host — not the
   * viewport — the containing block for its `position: fixed` descendants, so
   * viewport coordinates written straight into `left`/`top` land the overlay a
   * whole host-offset down the page. The overlays are `position: absolute`
   * inside `.calendar` instead, and the target is converted into that box
   * here, which is correct with or without the containment.
   */
  private placeOverlay(el: HTMLElement, viewportX: number, viewportY: number) {
    // The containing block is the container's PADDING box, while the rect is
    // its border box — `clientLeft`/`clientTop` are the border widths between
    // them. They are 0 by default and non-zero only when a consumer borders
    // the documented `::part(base)`, which would otherwise shift both overlays
    // off their bar by that width.
    const origin = this.container.getBoundingClientRect();
    el.style.left = `${viewportX - origin.left - this.container.clientLeft}px`;
    el.style.top = `${viewportY - origin.top - this.container.clientTop}px`;
  }

  /** Gap between a bar and its overlay, and the minimum viewport margin. */
  private static readonly OVERLAY_GAP = 6;
  private static readonly OVERLAY_EDGE = 4;

  /** Clamps an overlay's left edge into the viewport. */
  private clampOverlayX(left: number, width: number): number {
    const edge = SniceCalendar.OVERLAY_EDGE;
    const vw = window.innerWidth || 0;
    return Math.max(edge, vw > 0 ? Math.min(left, vw - width - edge) : left);
  }

  private positionPopover(bar: HTMLElement) {
    const rect = bar.getBoundingClientRect();
    const width = this.popoverEl.offsetWidth;
    const height = this.popoverEl.offsetHeight;
    const gap = SniceCalendar.OVERLAY_GAP;
    const edge = SniceCalendar.OVERLAY_EDGE;
    const vh = window.innerHeight || 0;

    let y = rect.bottom + gap;
    if (vh > 0 && y + height > vh - edge) {
      // No room under the bar — flip above it, or pin to the bottom margin
      // when the panel is taller than either side.
      const above = rect.top - gap - height;
      y = above >= edge ? above : Math.max(edge, vh - height - edge);
    }

    this.placeOverlay(this.popoverEl, this.clampOverlayX(rect.left, width), y);
  }

  closeEventPopover(options: { returnFocus?: boolean } = {}): void {
    if (!this.popoverBar) return;
    this.popoverToken++;
    const bar = this.popoverBar;
    this.setAnchorExpanded(bar, false);
    this.popoverBar = null;
    this.popoverEl.hidden = true;
    this.popoverEl.replaceChildren();
    this.syncOverlayLift();
    document.removeEventListener('keydown', this.boundPopoverEscape, true);
    document.removeEventListener('mousedown', this.boundPopoverOutside, true);
    if (options.returnFocus !== false && bar.isConnected) bar.focus();
  }

  /** Keeps a popup trigger's `aria-expanded` in step with the overlay. Guarded
   *  on `aria-haspopup` so only the anchors that actually advertise a popup —
   *  the "+N more" chip and an event bar carrying popover content — claim the
   *  state; a plain bar is not a trigger and must not report one. */
  private setAnchorExpanded(anchor: HTMLElement | null, expanded: boolean) {
    if (!anchor?.hasAttribute('aria-haspopup')) return;
    anchor.setAttribute('aria-expanded', String(expanded));
  }

  @dispose()
  cleanupPopover() {
    document.removeEventListener('keydown', this.boundPopoverEscape, true);
    document.removeEventListener('mousedown', this.boundPopoverOutside, true);
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
    this.syncOverlayLift();
    this.positionTooltip(bar);
  }

  private positionTooltip(bar: HTMLElement) {
    const rect = bar.getBoundingClientRect();
    const gap = SniceCalendar.OVERLAY_GAP;
    const edge = SniceCalendar.OVERLAY_EDGE;

    // Above the bar, or under it when the top of the viewport is in the way.
    let y = rect.top - this.tooltipEl.offsetHeight - gap;
    if (y < edge) y = rect.bottom + gap;

    this.placeOverlay(
      this.tooltipEl,
      this.clampOverlayX(rect.left, this.tooltipEl.offsetWidth),
      y,
    );
  }

  private hideEventTooltip() {
    this.tooltipToken++;
    this.tooltipEl.hidden = true;
    this.tooltipBar?.removeAttribute('aria-describedby');
    this.tooltipBar = null;
    this.syncOverlayLift();
  }

  /**
   * Marks the host while a tooltip or popover is showing. Layout containment
   * makes the host a stacking context, so an overlay can only paint above what
   * follows the calendar if the host itself is lifted — see
   * `:host([overlay-open])` in the stylesheet.
   */
  private syncOverlayLift() {
    this.toggleAttribute('overlay-open', !!this.popoverBar || !!this.tooltipBar);
  }

  private updateView() {
    // Update header title
    const monthName = this.displayDate.toLocaleDateString(this.locale, { month: 'long', year: 'numeric' });
    const titleEl = this.header.querySelector('.calendar__title') as HTMLElement;
    if (titleEl) titleEl.textContent = monthName;

    // Update day cells
    const days = this.getMonthDays();
    const currentMonth = this.displayDate.getMonth();

    // The week-number column shifts every explicitly-placed grid child, so it
    // is resolved before the cells are positioned.
    this.syncWeekNumberColumn(days);

    // Resolve which cell should be tab-stoppable (roving tabindex).
    const rovingIndex = this.computeRovingIndex(days);

    days.forEach((date, i) => {
      const cell = this.dayCells[i];
      if (!cell) return;

      const isOtherMonth = date.getMonth() !== currentMonth;
      const isToday = this.highlightToday && this.isToday(date);
      // Display-only mode never shows a selection highlight.
      const isSelected = !this.noDaySelect && this.isSelected(date);
      const isDisabled = this.isDisabled(date);

      // Update classes (preserving role)
      cell.className = 'calendar__day';
      // The week's first cell draws the grid's left edge. A class, not
      // :nth-child — the week-number column adds siblings that would shift
      // any positional selector.
      if (i % 7 === 0) cell.classList.add('calendar__day--week-start');
      if (isOtherMonth) cell.classList.add('calendar__day--other-month');
      if (isToday) cell.classList.add('calendar__day--today');
      if (isSelected) cell.classList.add('calendar__day--selected');
      if (isDisabled) cell.classList.add('calendar__day--disabled');
      if (this.noDaySelect) cell.classList.add('calendar__day--static');
      if (this.cellSizing === 'stretch') cell.classList.add('calendar__day--stretch');

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

  /**
   * Attaches or detaches the week-number column and re-places every
   * explicitly-positioned grid child for the resulting column offset.
   */
  private syncWeekNumberColumn(days: Date[]) {
    const show = this.showWeekNumbers;
    this.container.classList.toggle('calendar--week-numbers', show);

    if (show) {
      // Inserted in reading order — the corner cell ahead of the weekday
      // strip, each row header ahead of its week's day cells.
      if (!this.weekNumberHeader.isConnected) {
        this.grid.insertBefore(this.weekNumberHeader, this.grid.firstChild);
      }
      this.weekNumberCells.forEach((cell, week) => {
        if (!cell.isConnected) this.grid.insertBefore(cell, this.dayCells[week * 7]);
        const weekNumber = this.getWeekNumber(days[week * 7]);
        cell.textContent = String(weekNumber);
        cell.setAttribute('aria-label', `Week ${weekNumber}`);
      });
    } else {
      this.weekNumberHeader.remove();
      this.weekNumberCells.forEach(cell => cell.remove());
    }

    const offset = this.columnOffset;
    const weekdays = this.grid.querySelectorAll('.calendar__weekday');
    weekdays.forEach((el, i) => {
      (el as HTMLElement).style.gridColumn = String(i + 1 + offset);
    });
    this.dayCells.forEach((cell, i) => {
      cell.style.gridColumn = String((i % 7) + 1 + offset);
    });
  }

  /**
   * Number of the week that starts on `weekStart`.
   *
   * Monday-start calendars use ISO-8601 (week 1 is the week holding the year's
   * first Thursday). Every other start-of-week uses the common civil rule —
   * the week containing January 1 is week 1 — anchored on the year the week
   * ends in, so the turn-of-year week is numbered once, not twice.
   */
  private getWeekNumber(weekStart: Date): number {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const midnight = (y: number, m: number, d: number) => new Date(y, m, d).getTime();

    if (this.firstDayOfWeek === 1) {
      // The ISO week is named by its Thursday.
      const thursday = new Date(
        weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 3);
      const isoYear = thursday.getFullYear();
      // January 4 is always in ISO week 1; walk back to that week's Monday.
      const jan4 = new Date(isoYear, 0, 4);
      const week1Monday = midnight(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7));
      return 1 + Math.round((thursday.getTime() - week1Monday) / WEEK_MS);
    }

    const weekEnd = new Date(
      weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const year = weekEnd.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const week1Start = midnight(
      year, 0, 1 - ((jan1.getDay() - this.firstDayOfWeek + 7) % 7));
    return 1 + Math.round((
      midnight(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
      - week1Start) / WEEK_MS);
  }

  /** Event-lane geometry in rem — mirrors snice-calendar.css. */
  private static readonly LANE_HEIGHT_REM = 1.375;
  /** Day-number strip above the first lane (the constant in the cell's
   *  min-height reservation). */
  private static readonly LANE_STACK_TOP_REM = 2.125;
  /** Strip the "+N more" chip claims when a stack overflows. */
  private static readonly MORE_CHIP_REM = 1;
  /** Intrinsic floor of a `cell-sizing="stretch"` cell. */
  private static readonly STRETCH_FLOOR_REM = 3;
  /** Lane depth used when there is no layout to measure (headless DOM,
   *  detached, `display: none`). */
  private static readonly DEFAULT_EVENT_LANES = 3;
  /**
   * Height a single lane physically occupies, measured from the top of the
   * cell: the bar sits 1.875rem down and is 1.125rem tall.
   *
   * LANE_STACK_TOP_REM + LANE_HEIGHT_REM (3.5rem) is the *budgeted* cost of a
   * lane — it carries a bottom gap so the next lane has somewhere to go. This
   * is the smaller number the budget falls back to when the row cannot grow:
   * the point below which a drawn lane would be clipped by its own cell.
   */
  private static readonly LANE_MIN_FIT_REM = 3;
  /** Height the "+N more" chip itself occupies at the bottom of the cell. */
  private static readonly MORE_CHIP_FIT_REM = 1.125;
  /**
   * Narrowest segment, in rem, that still carries an event avatar.
   *
   * A one-day chip in a 400px month grid is ~57px wide; the avatar, its gap,
   * and the bar padding leave the title three characters ("Des…"). The title
   * is the payload and the avatar is an adornment, so — like every
   * professional calendar — a segment that cannot carry both keeps the title
   * and drops the adornment. 4.5rem is the width at which a default-size
   * title still reads next to the avatar.
   */
  private static readonly AVATAR_MIN_SEGMENT_REM = 4.5;

  /**
   * How many event lanes fit in a day cell, and how many still fit once the
   * "+N more" chip claims its strip.
   *
   * Measured from the cell's own height with every lane reservation cleared,
   * so the budget follows whatever sizes the cell — the square baseline
   * (`100cqw / 7`), a height the host imposes on the calendar, or the stretch
   * floor — and never feeds back on itself. A `cell-sizing="stretch"` cell the
   * host does not constrain has no budget at all: its row grows to fit every
   * lane, which is what "collapse to content" means.
   */
  private laneBudget(): { fit: number; withMore: number; height: number; rem: number } {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const height = this.dayCells[0]?.getBoundingClientRect().height ?? 0;
    if (!height) {
      const depth = SniceCalendar.DEFAULT_EVENT_LANES;
      return { fit: depth, withMore: depth, height: 0, rem };
    }
    if (this.cellSizing === 'stretch' && !this.rowCapped
      && height <= SniceCalendar.STRETCH_FLOOR_REM * rem + 1) {
      return { fit: Infinity, withMore: Infinity, height, rem };
    }
    const lanesIn = (reserve: number) => {
      const budgeted = Math.floor(
        (height / rem - SniceCalendar.LANE_STACK_TOP_REM - reserve)
        / SniceCalendar.LANE_HEIGHT_REM);
      if (budgeted >= 1) return budgeted;
      // Below the budgeted floor a row that can still grow always draws one
      // lane — the reservation at the end of renderEventStripes buys it the
      // height. A capped row has no such recourse, so the lane is drawn only
      // when it already fits; otherwise the day collapses entirely into its
      // chip rather than painting a stripe its cell will clip.
      if (!this.rowCapped) return 1;
      const needed = SniceCalendar.LANE_MIN_FIT_REM
        + (reserve > 0 ? SniceCalendar.MORE_CHIP_FIT_REM : 0);
      return height / rem >= needed ? 1 : 0;
    };
    return {
      fit: lanesIn(0),
      withMore: lanesIn(SniceCalendar.MORE_CHIP_REM),
      height,
      rem,
    };
  }

  /** True while `--calendar-row-cap` is holding the week rows below the size
   *  they would take of their own accord. */
  private rowCapped = false;

  /**
   * Fits the six week rows inside a host that constrains the calendar's
   * height.
   *
   * The square baseline sizes a week row from the *column width*
   * (`100cqw / 7`), which says nothing about how much height the host has
   * given the grid. A host that hands down a definite height — the components
   * page's `aspect-ratio: 1` card is the reported case — therefore gets a grid
   * whose min-content height exceeds its box: the grid overflows, and whatever
   * clips it (that card's `overflow: hidden`) takes the bottom weeks of the
   * month with it.
   *
   * The room the grid has and the room it wants are both measurable, so the
   * fix is to compare them and publish the per-row ceiling when they disagree.
   * With no constraint the container's height IS its content height, the two
   * agree, and nothing is published — square cells and the growable lane
   * reservation are untouched. Measured with the cap cleared, so it never
   * feeds back on itself.
   *
   * Month view only. The cap divides the room into WEEK_ROWS equal shares and
   * lands as a definite `grid-template-rows` track; the week and day views
   * carry their own taller `min-height` at higher specificity, so a definite
   * track there would leave every cell overflowing its own row and painting
   * over the next one. They keep the pre-cap behaviour — the var stays unset,
   * the tracks stay `auto`.
   */
  private syncRowCap() {
    this.grid.style.removeProperty('--calendar-row-cap');
    this.rowCapped = false;
    if (this.view !== 'month') return;

    // The host's own content box, not just the container's: `.calendar`'s
    // `height: 100%` resolves to auto against a host sized by `max-height`,
    // so the container reports the height it WANTED and only the host box is
    // actually clamped. Whichever is smaller is the room there really is.
    const hostStyle = getComputedStyle(this);
    const hostRoom = this.clientHeight
      - parseFloat(hostStyle.paddingTop) - parseFloat(hostStyle.paddingBottom);
    const room = Math.min(this.container.clientHeight, hostRoom)
      - this.header.getBoundingClientRect().height;
    const wanted = this.grid.getBoundingClientRect().height;
    // No layout to measure (headless, detached, display:none) — or the rows
    // already fit, which is every unconstrained calendar.
    if (!(room > 0) || !(wanted > 0) || wanted <= room + 0.5) return;

    const weekdayHeight = (this.grid.querySelector('.calendar__weekday') as
      HTMLElement | null)?.getBoundingClientRect().height ?? 0;
    // A cell cannot be shorter than its own padding and rules, so a cap below
    // that floor buys no height — it only detaches the rows from their tracks
    // and stacks each week on top of the next. Below the floor the calendar
    // has compressed as far as it physically can: it overflows a host that
    // short, the way it always did, rather than rendering weeks over weeks.
    const cell = this.dayCells[0];
    const cellStyle = cell ? getComputedStyle(cell) : null;
    const cellFloor = cellStyle
      ? parseFloat(cellStyle.paddingTop) + parseFloat(cellStyle.paddingBottom)
        + parseFloat(cellStyle.borderTopWidth)
        + parseFloat(cellStyle.borderBottomWidth)
      : 0;
    const cap = Math.max(
      (room - weekdayHeight) / SniceCalendar.WEEK_ROWS, cellFloor);
    if (!(cap > 0)) return;

    this.rowCapped = true;
    this.grid.style.setProperty('--calendar-row-cap', `${cap}px`);
  }

  /** Week rows in a month grid. */
  private static readonly WEEK_ROWS = 6;

  /**
   * Render events as continuous stripes: one bar per (event × week row),
   * spanning the event's days in that week and chopped at week boundaries
   * with continues-left/right styling. Overlapping events stack into lanes
   * per week — earlier start first, longer event first on ties — like
   * professional calendars. How many of those lanes are drawn is the week's
   * share of the day cell's height (see laneBudget); the rest collapse into
   * the day's "+N more" chip.
   */
  private renderEventStripes(days: Date[]) {
    this.closeEventPopover({ returnFocus: false }); // anchors are re-created
    this.grid.querySelectorAll('.calendar__event-bar').forEach(el => el.remove());
    this.dayCells.forEach(cell => {
      cell.querySelector('.calendar__more')?.remove();
      cell.style.removeProperty('--calendar-week-lanes');
      cell.style.removeProperty('--calendar-week-more');
    });
    // Before anything is measured and regardless of whether this month has
    // events: an empty calendar in a short host overflows too.
    this.syncRowCap();

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

    // The events each day dropped, in the order they stack — the chip reports
    // the count, and its built-in panel lists them.
    const hiddenPerDay: CalendarEvent[][] =
      Array.from({ length: dayTimes.length }, () => []);
    const weekCount = Math.floor(dayTimes.length / 7);
    const weekLaneCounts = new Array(weekCount).fill(0);
    // Measured before a single bar or reservation goes back in, so the budget
    // reflects the room the row has of its own.
    const budget = this.laneBudget();
    // Segment width comes from the same measured cell the lane budget uses, so
    // the avatar decision follows the calendar's real box and is re-taken by
    // the resize observer. No layout to measure → nothing is dropped.
    const cellWidth = this.dayCells[0]?.getBoundingClientRect().width ?? 0;
    const avatarMinWidth = SniceCalendar.AVATAR_MIN_SEGMENT_REM * budget.rem;

    for (let week = 0; week < weekCount; week++) {
      const weekStart = week * 7;
      const weekEnd = weekStart + 6;
      // lanes[lane] holds the occupied [startCol, endCol] ranges in this week.
      const lanes: Array<Array<[number, number]>> = [];
      const placed: Array<{ item: Segmentable; lane: number; segStart: number; segEnd: number }> = [];
      let stackDepth = 0;

      // Lane assignment first: how deep this week stacks decides whether the
      // "+N more" chip is needed at all, and the chip costs a strip of height.
      for (const item of resolved) {
        if (item.endIdx < weekStart || item.startIdx > weekEnd) continue;

        const segStart = Math.max(item.startIdx, weekStart);
        const segEnd = Math.min(item.endIdx, weekEnd);
        const startCol = segStart - weekStart;
        const endCol = segEnd - weekStart;

        let lane = 0;
        while (lanes[lane]?.some(([s, e]) => startCol <= e && endCol >= s)) lane++;
        (lanes[lane] ??= []).push([startCol, endCol]);
        placed.push({ item, lane, segStart, segEnd });
        stackDepth = Math.max(stackDepth, lane + 1);
      }

      const visibleLanes = stackDepth <= budget.fit ? stackDepth : budget.withMore;
      weekLaneCounts[week] = Math.min(stackDepth, visibleLanes);

      for (const { item, lane, segStart, segEnd } of placed) {
        if (lane >= visibleLanes) {
          for (let i = segStart; i <= segEnd; i++) hiddenPerDay[i].push(item.event);
          continue;
        }

        const startCol = segStart - weekStart;
        const endCol = segEnd - weekStart;

        const continuesLeft = segStart > item.startIdx
          || (segStart === item.startIdx && item.startsBeforeGrid);
        const continuesRight = segEnd < item.endIdx
          || (segEnd === item.endIdx && item.endsAfterGrid);

        // A segment too narrow for an avatar plus a legible title runs
        // compact: title only, tighter inline padding.
        const compact = cellWidth > 0
          && cellWidth * (endCol - startCol + 1) < avatarMinWidth;

        const bar = document.createElement('div');
        bar.className = 'calendar__event-bar';
        if (continuesLeft) bar.classList.add('calendar__event-bar--continues-left');
        if (continuesRight) bar.classList.add('calendar__event-bar--continues-right');
        if (compact) bar.classList.add('calendar__event-bar--compact');

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
        bar.style.gridColumn =
          `${startCol + 1 + this.columnOffset} / ${endCol + 2 + this.columnOffset}`;
        bar.style.setProperty('--calendar-event-lane', String(lane));
        if (item.event.color) bar.style.background = item.event.color;

        if (item.event.avatar && !compact) {
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

        // Popover: strictly per-event opt-in — without `popover`, a click
        // only dispatches calendar-event-click and no request is issued.
        if (item.event.popover) {
          bar.setAttribute('role', 'button');
          bar.setAttribute('tabindex', '0');
          bar.setAttribute('aria-haspopup', 'dialog');
          bar.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              this.openEventPopover(bar, item.event);
            }
          };
          bar.onclick = (e) => {
            this.handleEventClick(item.event, e);
            this.openEventPopover(bar, item.event);
          };
        } else {
          bar.onclick = (e) => this.handleEventClick(item.event, e);
        }
        this.grid.appendChild(bar);
      }
    }

    hiddenPerDay.forEach((hidden, i) => {
      const count = hidden.length;
      if (count === 0) return;
      const cell = this.dayCells[i];
      if (!cell) return;
      const date = days[i];
      const more = document.createElement('div');
      more.className = 'calendar__more';
      more.setAttribute('part', 'more-chip');
      more.textContent = `+${count} more`;
      // The chip is its own control: it reports its day and hidden count,
      // opens the day panel unless the app cancels it, and its clicks never
      // fall through to the day cell's selection handler.
      more.setAttribute('role', 'button');
      more.setAttribute('tabindex', '0');
      more.setAttribute('aria-haspopup', 'dialog');
      more.setAttribute('aria-expanded', 'false');
      more.setAttribute('aria-label',
        `${count} more event${count === 1 ? '' : 's'} on ${date.toLocaleDateString(this.locale, { dateStyle: 'full' })}`);
      more.onclick = (e) => this.handleMoreClick(date, more, hidden, e);
      more.onkeydown = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        this.handleMoreClick(date, more, hidden, e);
      };
      cell.appendChild(more);
    });

    // Reserve row height for the lane stack (and the "+N more" chip) so
    // stripes never spill past their week row — every cell in a week shares
    // the reservation, since the grid row is as tall as its tallest cell.
    // The reservation is only a floor: when the row already has the room it is
    // left off, so the busy week's row stays level with the rest. That covers
    // every cell tall enough for the stack it shows; the floor still bites
    // below 3.5rem (the one lane always drawn) or 4.5rem once the chip claims
    // its strip — square cells are that short on calendars under ~500px wide.
    for (let week = 0; week < weekCount; week++) {
      if (weekLaneCounts[week] === 0) continue;
      const weekHasMore = hiddenPerDay
        .slice(week * 7, week * 7 + 7).some(hidden => hidden.length > 0);
      const needed = (SniceCalendar.LANE_STACK_TOP_REM
        + weekLaneCounts[week] * SniceCalendar.LANE_HEIGHT_REM
        + (weekHasMore ? SniceCalendar.MORE_CHIP_REM : 0)) * budget.rem;
      if (budget.height && needed <= budget.height + 0.5) continue;
      for (let i = week * 7; i < week * 7 + 7; i++) {
        const cell = this.dayCells[i];
        if (!cell) continue;
        cell.style.setProperty('--calendar-week-lanes', String(weekLaneCounts[week]));
        if (weekHasMore) {
          cell.style.setProperty('--calendar-week-more',
            `${SniceCalendar.MORE_CHIP_REM}rem`);
        }
      }
    }

    // VISUAL-MATRIX-calendar-1: the cap at the top of this method was measured
    // against the lane-LESS grid, so a busy week's reservation could grow its
    // row past a share the cap never took from it — overflowing a tight host
    // by the few pixels Firefox's taller weekday header exposes. Re-measure
    // with the reservations in place so the cap always sees the grid it ships.
    this.syncRowCap();
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
    // No value means no selection at all — and an unparseable one selects
    // nothing rather than throwing out of the render.
    if (!this.value) return false;
    const valueDate = typeof this.value === 'string' ? new Date(this.value) : this.value;
    if (!(valueDate instanceof Date) || isNaN(valueDate.getTime())) return false;
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
    // Display-only calendars: days are not selectable at all.
    if (this.noDaySelect) return;
    if (this.isDisabled(date)) return;

    this.value = date;
    this.updateView();
    this.dispatchChange();
  }

  private handleEventClick(event: CalendarEvent, e: Event) {
    e.stopPropagation();
    this.dispatchEventClick(event);
  }

  private handleMoreClick(
    date: Date, chip: HTMLElement, hidden: CalendarEvent[], e: Event,
  ) {
    e.stopPropagation();
    // The app gets first refusal: preventDefault() means it is opening its own
    // day view and the built-in panel must stay out of the way.
    if (!this.dispatchMoreClick(date, hidden.length)) return;
    this.openMorePanel(chip, date, hidden);
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
  @watch('noDaySelect')
  @watch('cellSizing')
  @watch('showWeekNumbers')
  @watch('highlightToday')
  handlePropertyChange() {
    if (this.grid) {
      this.updateView();
    }
  }

  /** Box the stripes were last laid out against, so a resize that changes
   *  nothing (including the one the render itself causes) is a no-op. */
  private laidOutFor = '';

  /**
   * The lane budget comes from the cell's height, and that height follows the
   * calendar's own box — column width in square mode, the host's height when
   * it has one. Re-stripe when the box actually changes.
   */
  @observe('resize', { throttle: 100 })
  handleCalendarResize(entry: ResizeObserverEntry) {
    if (!this.grid) return;
    const box = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
    if (box === this.laidOutFor) return;
    this.laidOutFor = box;
    this.updateView();
  }

  @watch('locale')
  @watch('firstDayOfWeek')
  handleWeekdayInputsChange() {
    if (!this.grid) return;
    // Rebuild the weekday header row so the new locale / start-of-week is reflected.
    const existing = this.grid.querySelectorAll('.calendar__weekday');
    existing.forEach(el => el.remove());
    const weekdays = this.getWeekdays();
    // Anchor on the first day cell rather than a child index: the week-number
    // column adds siblings ahead of it, so a positional index would interleave
    // the strip with the grid's other children.
    const firstRow = this.weekNumberCells[0]?.isConnected
      ? this.weekNumberCells[0] : this.dayCells[0];
    const anchor = firstRow ?? null;
    weekdays.forEach((day, i) => {
      const weekdayEl = document.createElement('div');
      weekdayEl.className = 'calendar__weekday';
      weekdayEl.textContent = day;
      weekdayEl.style.gridRow = '1';
      weekdayEl.style.gridColumn = String(i + 1 + this.columnOffset);
      this.grid.insertBefore(weekdayEl, anchor);
    });
    this.updateView();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-calendar': SniceCalendar;
  }
}
