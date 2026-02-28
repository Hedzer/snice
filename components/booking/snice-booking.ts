import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import type { SniceBookingElement, BookingVariant, BookingSlot, BookingField, BookingData } from './snice-booking.types';
import cssContent from './snice-booking.css?inline';

@element('snice-booking')
export class SniceBooking extends HTMLElement implements SniceBookingElement {
  @property({ type: Array, attribute: 'available-dates' })
  availableDates: (Date | string)[] = [];

  @property({ type: Array, attribute: 'available-slots' })
  availableSlots: BookingSlot[] = [];

  @property({ type: Number })
  duration: number = 30;

  @property({ type: Date, attribute: 'min-date' })
  minDate: Date | string = '';

  @property({ type: Date, attribute: 'max-date' })
  maxDate: Date | string = '';

  @property({ type: Array })
  fields: BookingField[] = [];

  @property()
  variant: BookingVariant = 'stepper';

  private currentStep = 1;
  private selectedDate: string = '';
  private selectedSlot: BookingSlot | null = null;
  private formValues: Record<string, string> = {};
  private displayMonth: Date = new Date();
  private confirmed = false;
  private container!: HTMLElement;

  @dispatch('date-select', { bubbles: true, composed: true })
  private emitDateSelect(date: string) {
    return { date };
  }

  @dispatch('slot-select', { bubbles: true, composed: true })
  private emitSlotSelect(slot: BookingSlot) {
    return { slot };
  }

  @dispatch('booking-confirm', { bubbles: true, composed: true })
  private emitBookingConfirm(booking: BookingData) {
    return { booking };
  }

  @dispatch('booking-cancel', { bubbles: true, composed: true })
  private emitBookingCancel() {
    return undefined;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.container = document.createElement('div');
    this.container.className = 'booking';
    this.container.setAttribute('part', 'base');
    this.shadowRoot!.appendChild(this.container);
    this.renderContent();
  }

  private renderContent(): void {
    this.container.innerHTML = '';

    if (this.confirmed) {
      this.renderConfirmation();
      return;
    }

    // Stepper header
    if (this.variant === 'stepper') {
      this.renderStepper();
    }

    const content = document.createElement('div');
    content.className = 'booking__content';

    if (this.variant === 'stepper') {
      if (this.currentStep === 1) {
        this.renderCalendar(content);
      } else if (this.currentStep === 2) {
        this.renderSlots(content);
      } else {
        this.renderForm(content);
      }
    } else {
      // Inline: show all
      this.renderCalendar(content);
      this.renderSlots(content);
      if (this.selectedSlot) {
        this.renderForm(content);
      }
    }

    this.container.appendChild(content);

    // Actions
    if (this.variant === 'stepper') {
      this.renderActions();
    }
  }

  private renderStepper(): void {
    const stepper = document.createElement('div');
    stepper.className = 'booking__stepper';
    stepper.setAttribute('part', 'stepper');

    const steps = [
      { num: 1, label: 'Date' },
      { num: 2, label: 'Time' },
      { num: 3, label: 'Confirm' },
    ];

    steps.forEach(step => {
      const stepEl = document.createElement('div');
      stepEl.className = 'booking__step';
      if (step.num === this.currentStep) stepEl.classList.add('booking__step--active');
      if (step.num < this.currentStep) stepEl.classList.add('booking__step--completed');

      const numEl = document.createElement('span');
      numEl.className = 'booking__step-number';
      numEl.textContent = step.num < this.currentStep ? '\u2713' : String(step.num);

      stepEl.appendChild(numEl);
      stepEl.appendChild(document.createTextNode(step.label));
      stepper.appendChild(stepEl);
    });

    this.container.appendChild(stepper);
  }

  private renderCalendar(parent: HTMLElement): void {
    const cal = document.createElement('div');
    cal.className = 'booking__calendar';
    cal.setAttribute('part', 'calendar');

    // Month header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'booking__month-header';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'booking__month-nav';
    prevBtn.textContent = '\u2039';
    prevBtn.onclick = () => this.prevMonth();

    const monthTitle = document.createElement('span');
    monthTitle.className = 'booking__month-title';
    monthTitle.textContent = this.displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'booking__month-nav';
    nextBtn.textContent = '\u203A';
    nextBtn.onclick = () => this.nextMonth();

    monthHeader.appendChild(prevBtn);
    monthHeader.appendChild(monthTitle);
    monthHeader.appendChild(nextBtn);
    cal.appendChild(monthHeader);

    // Weekday headers
    const weekdays = document.createElement('div');
    weekdays.className = 'booking__weekdays';
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
      const wdEl = document.createElement('div');
      wdEl.className = 'booking__weekday';
      wdEl.textContent = d;
      weekdays.appendChild(wdEl);
    });
    cal.appendChild(weekdays);

    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'booking__days';

    const year = this.displayMonth.getFullYear();
    const month = this.displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      cellDate.setHours(0, 0, 0, 0);

      const btn = document.createElement('button');
      btn.className = 'booking__day';
      btn.textContent = String(cellDate.getDate());

      const dateStr = this.formatDate(cellDate);
      const isOtherMonth = cellDate.getMonth() !== month;
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected = dateStr === this.selectedDate;
      const isAvailable = this.isDateAvailable(cellDate);
      const isDisabled = this.isDateDisabled(cellDate);

      if (isOtherMonth) btn.classList.add('booking__day--other');
      if (isToday) btn.classList.add('booking__day--today');
      if (isSelected) btn.classList.add('booking__day--selected');
      if (isAvailable && !isOtherMonth && !isDisabled) btn.classList.add('booking__day--available');
      if (isDisabled || isOtherMonth) btn.classList.add('booking__day--disabled');

      if (!isOtherMonth && !isDisabled) {
        btn.onclick = () => this.selectDate(dateStr);
      }

      daysGrid.appendChild(btn);
    }

    cal.appendChild(daysGrid);
    parent.appendChild(cal);
  }

  private renderSlots(parent: HTMLElement): void {
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'booking__slots';
    slotsContainer.setAttribute('part', 'slots');

    const title = document.createElement('div');
    title.className = 'booking__slots-title';
    title.textContent = this.selectedDate
      ? `Available times for ${new Date(this.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`
      : 'Select a date first';
    slotsContainer.appendChild(title);

    const filteredSlots = this.getFilteredSlots();

    if (filteredSlots.length === 0) {
      const noSlots = document.createElement('div');
      noSlots.className = 'booking__no-slots';
      noSlots.textContent = this.selectedDate ? 'No available time slots' : 'Please select a date to see available times';
      slotsContainer.appendChild(noSlots);
    } else {
      const grid = document.createElement('div');
      grid.className = 'booking__slots-grid';

      filteredSlots.forEach(slot => {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'booking__slot';
        if (this.selectedSlot && this.selectedSlot.time === slot.time && this.selectedSlot.date === slot.date) {
          slotBtn.classList.add('booking__slot--selected');
        }

        const timeEl = document.createElement('div');
        timeEl.className = 'booking__slot-time';
        timeEl.textContent = this.formatSlotTime(slot.time);

        const durationEl = document.createElement('div');
        durationEl.className = 'booking__slot-duration';
        durationEl.textContent = `${slot.duration} min`;

        slotBtn.appendChild(timeEl);
        slotBtn.appendChild(durationEl);

        slotBtn.onclick = () => this.selectSlot(slot);
        grid.appendChild(slotBtn);
      });

      slotsContainer.appendChild(grid);
    }

    parent.appendChild(slotsContainer);
  }

  private renderForm(parent: HTMLElement): void {
    const form = document.createElement('div');
    form.className = 'booking__form';
    form.setAttribute('part', 'form');

    // Summary
    if (this.selectedDate && this.selectedSlot) {
      const summary = document.createElement('div');
      summary.className = 'booking__summary';

      const dateRow = document.createElement('div');
      dateRow.className = 'booking__summary-row';
      const dateLabel = document.createElement('div');
      dateLabel.className = 'booking__summary-label';
      dateLabel.textContent = 'Date';
      const dateValue = document.createElement('div');
      dateValue.className = 'booking__summary-value';
      dateValue.textContent = new Date(this.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      dateRow.appendChild(dateLabel);
      dateRow.appendChild(dateValue);
      summary.appendChild(dateRow);

      const timeRow = document.createElement('div');
      timeRow.className = 'booking__summary-row';
      const timeLabel = document.createElement('div');
      timeLabel.className = 'booking__summary-label';
      timeLabel.textContent = 'Time';
      const timeValue = document.createElement('div');
      timeValue.className = 'booking__summary-value';
      timeValue.textContent = `${this.formatSlotTime(this.selectedSlot.time)} (${this.selectedSlot.duration} min)`;
      timeRow.appendChild(timeLabel);
      timeRow.appendChild(timeValue);
      summary.appendChild(timeRow);

      form.appendChild(summary);
    }

    // Custom fields
    this.fields.forEach(field => {
      const fieldEl = document.createElement('div');
      fieldEl.className = 'booking__field';

      const label = document.createElement('label');
      label.className = 'booking__label';
      label.textContent = field.label + (field.required ? ' *' : '');
      fieldEl.appendChild(label);

      if (field.type === 'textarea') {
        const textarea = document.createElement('textarea');
        textarea.className = 'booking__input booking__textarea';
        if (field.placeholder) textarea.placeholder = field.placeholder;
        if (field.required) textarea.required = true;
        textarea.value = this.formValues[field.name] || '';
        textarea.oninput = () => { this.formValues[field.name] = textarea.value; };
        fieldEl.appendChild(textarea);
      } else {
        const input = document.createElement('input');
        input.className = 'booking__input';
        input.type = field.type;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        input.value = this.formValues[field.name] || '';
        input.oninput = () => { this.formValues[field.name] = input.value; };
        fieldEl.appendChild(input);
      }

      form.appendChild(fieldEl);
    });

    parent.appendChild(form);
  }

  private renderActions(): void {
    const actions = document.createElement('div');
    actions.className = 'booking__actions';

    const backBtn = document.createElement('button');
    backBtn.className = 'booking__btn';
    backBtn.textContent = this.currentStep === 1 ? 'Cancel' : 'Back';
    backBtn.onclick = () => {
      if (this.currentStep === 1) {
        this.emitBookingCancel();
      } else {
        this.currentStep--;
        this.renderContent();
      }
    };

    const nextBtn = document.createElement('button');
    nextBtn.className = 'booking__btn booking__btn--primary';

    if (this.currentStep === 3) {
      nextBtn.textContent = 'Confirm Booking';
      nextBtn.disabled = !this.isFormValid();
      nextBtn.onclick = () => this.confirmBooking();
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.disabled = (this.currentStep === 1 && !this.selectedDate) ||
                          (this.currentStep === 2 && !this.selectedSlot);
      nextBtn.onclick = () => {
        this.currentStep++;
        this.renderContent();
      };
    }

    actions.appendChild(backBtn);
    actions.appendChild(nextBtn);
    this.container.appendChild(actions);
  }

  private renderConfirmation(): void {
    const confirmation = document.createElement('div');
    confirmation.className = 'booking__confirmation';
    confirmation.setAttribute('part', 'confirmation');

    const icon = document.createElement('div');
    icon.className = 'booking__confirmation-icon';
    icon.textContent = '\u2713';

    const titleEl = document.createElement('div');
    titleEl.className = 'booking__confirmation-title';
    titleEl.textContent = 'Booking Confirmed';

    const textEl = document.createElement('div');
    textEl.className = 'booking__confirmation-text';
    if (this.selectedDate && this.selectedSlot) {
      textEl.textContent = `${new Date(this.selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at ${this.formatSlotTime(this.selectedSlot.time)}`;
    }

    const resetBtn = document.createElement('button');
    resetBtn.className = 'booking__btn';
    resetBtn.textContent = 'Book Another';
    resetBtn.style.marginTop = '1rem';
    resetBtn.onclick = () => this.reset();

    confirmation.appendChild(icon);
    confirmation.appendChild(titleEl);
    confirmation.appendChild(textEl);
    confirmation.appendChild(resetBtn);
    this.container.appendChild(confirmation);
  }

  // Helpers

  private selectDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.selectedSlot = null;
    this.emitDateSelect(dateStr);
    this.renderContent();
  }

  private selectSlot(slot: BookingSlot): void {
    this.selectedSlot = slot;
    this.emitSlotSelect(slot);
    this.renderContent();
  }

  private confirmBooking(): void {
    if (!this.selectedDate || !this.selectedSlot) return;

    const booking: BookingData = {
      date: this.selectedDate,
      slot: this.selectedSlot,
      fields: { ...this.formValues },
    };

    this.confirmed = true;
    this.emitBookingConfirm(booking);
    this.renderContent();
  }

  private prevMonth(): void {
    this.displayMonth = new Date(this.displayMonth.getFullYear(), this.displayMonth.getMonth() - 1, 1);
    this.renderContent();
  }

  private nextMonth(): void {
    this.displayMonth = new Date(this.displayMonth.getFullYear(), this.displayMonth.getMonth() + 1, 1);
    this.renderContent();
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isDateAvailable(date: Date): boolean {
    if (this.availableDates.length === 0) return true;

    const dateStr = this.formatDate(date);
    return this.availableDates.some(d => {
      const availStr = typeof d === 'string' ? d : this.formatDate(d instanceof Date ? d : new Date(d));
      return availStr === dateStr;
    });
  }

  private isDateDisabled(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    if (this.minDate) {
      const min = typeof this.minDate === 'string' ? new Date(this.minDate) : this.minDate;
      if (date < min) return true;
    }

    if (this.maxDate) {
      const max = typeof this.maxDate === 'string' ? new Date(this.maxDate) : this.maxDate;
      if (date > max) return true;
    }

    if (this.availableDates.length > 0 && !this.isDateAvailable(date)) return true;

    return false;
  }

  private getFilteredSlots(): BookingSlot[] {
    if (!this.selectedDate) return [];
    return this.availableSlots.filter(slot => slot.date === this.selectedDate);
  }

  private formatSlotTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private isFormValid(): boolean {
    return this.fields
      .filter(f => f.required)
      .every(f => this.formValues[f.name]?.trim());
  }

  // Public methods

  reset(): void {
    this.currentStep = 1;
    this.selectedDate = '';
    this.selectedSlot = null;
    this.formValues = {};
    this.confirmed = false;
    this.displayMonth = new Date();
    this.renderContent();
  }

  getBooking(): BookingData | null {
    if (!this.selectedDate || !this.selectedSlot) return null;
    return {
      date: this.selectedDate,
      slot: this.selectedSlot,
      fields: { ...this.formValues },
    };
  }

  @watch('availableDates')
  @watch('availableSlots')
  @watch('fields')
  @watch('variant')
  handlePropertyChange() {
    if (this.container) {
      this.renderContent();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-booking': SniceBooking;
  }
}
