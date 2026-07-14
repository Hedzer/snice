import { element, property, query, watch, dispatch, ready, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-time-range-picker.css?inline';
import type { TimeRangeGranularity, TimeFormat, TimeRange, SniceTimeRangePickerElement } from './snice-time-range-picker.types';

@element('snice-time-range-picker')
export class SniceTimeRangePicker extends HTMLElement implements SniceTimeRangePickerElement {
  @property({ type: Number })
  granularity: TimeRangeGranularity = 15;

  @property({ attribute: 'start-time' })
  startTime = '00:00';

  @property({ attribute: 'end-time' })
  endTime = '23:59';

  @property()
  value = '';

  @property({ attribute: 'disabled-ranges' })
  disabledRanges = '';

  @property()
  format: TimeFormat = '24h';

  @property({ type: Boolean })
  multiple = false;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Boolean })
  disabled = false;

  @query('.slots-container')
  slotsContainer?: HTMLElement;

  private slots: string[] = [];
  private selectedIndices: Set<number> = new Set();
  private disabledIndices: Set<number> = new Set();
  private isDragging = false;
  private dragStartIndex = -1;
  private dragEndIndex = -1;
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;
  private boundHandleTouchMove: (e: TouchEvent) => void;
  private boundHandleTouchEnd: (e: TouchEvent) => void;

  constructor() {
    super();
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  renderContent() {
    this.buildSlots();
    this.parseDisabledRanges();
    this.parseValue();

    const displayValue = this.getDisplayValue();

    return html`
      <div part="base" class="wrapper">
        <div part="header" class="header">
          <span class="header-label">Time</span>
          <span class="${displayValue ? 'header-value' : 'header-value header-value--empty'}">
            ${displayValue || 'No selection'}
          </span>
        </div>
        <div part="slots" class="slots-container"
          @mousedown=${(e: MouseEvent) => this.handleMouseDown(e)}
          @touchstart=${(e: TouchEvent) => this.handleTouchStart(e)}>
          ${this.slots.map((time, index) => {
            const isSelected = this.selectedIndices.has(index);
            const isDisabled = this.disabledIndices.has(index);
            const isDragging = this.isDragging && this.isInDragRange(index) && !isDisabled;
            const isHourStart = this.isHourBoundary(time);
            const ranges = this.getSelectedRanges();
            const isRangeStart = this.isRangeStart(index, ranges);
            const isRangeEnd = this.isRangeEnd(index, ranges);

            const classes = [
              'slot',
              isSelected ? 'slot--selected' : '',
              isDisabled ? 'slot--disabled' : '',
              isDragging ? 'slot--dragging' : '',
              isHourStart ? 'slot--hour-start' : '',
              isRangeStart ? 'slot--range-start' : '',
              isRangeEnd ? 'slot--range-end' : '',
            ].filter(Boolean).join(' ');

            return html`
              <div class="${classes}"
                data-index="${index}"
                data-time="${time}"
                tabindex="${isDisabled ? '-1' : '0'}"
                role="option"
                aria-selected="${isSelected || isDragging ? 'true' : 'false'}"
                aria-disabled="${isDisabled ? 'true' : 'false'}"
                @keydown=${(e: KeyboardEvent) => this.handleSlotKeydown(e, index)}>
                <span class="slot-time">${this.formatTime(time)}</span>
                <span class="slot-separator"></span>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  @ready()
  init() {
    this.buildSlots();
    this.parseDisabledRanges();
    this.parseValue();
  }

  @dispose()
  cleanup() {
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    document.removeEventListener('touchmove', this.boundHandleTouchMove);
    document.removeEventListener('touchend', this.boundHandleTouchEnd);
  }

  // --- Slot generation ---

  private buildSlots() {
    const slots: string[] = [];
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);
    const gran = this.granularity;

    for (let m = startMinutes; m <= endMinutes; m += gran) {
      slots.push(this.minutesToTime(m));
    }

    this.slots = slots;
  }

  // --- Parsing ---

  private parseDisabledRanges() {
    this.disabledIndices.clear();
    if (!this.disabledRanges) return;

    try {
      const ranges: TimeRange[] = JSON.parse(this.disabledRanges);
      for (const range of ranges) {
        const startIdx = this.getSlotIndex(range.start);
        const endIdx = this.getSlotIndex(range.end);
        if (startIdx >= 0 && endIdx >= 0) {
          for (let i = startIdx; i <= endIdx; i++) {
            this.disabledIndices.add(i);
          }
        }
      }
    } catch {
      // Invalid JSON - ignore
    }
  }

  private parseValue() {
    this.selectedIndices.clear();
    if (!this.value) return;

    try {
      const ranges: TimeRange[] = JSON.parse(this.value);
      for (const range of ranges) {
        const startIdx = this.getSlotIndex(range.start);
        const endIdx = this.getSlotIndex(range.end);
        if (startIdx >= 0 && endIdx >= 0) {
          for (let i = startIdx; i <= endIdx; i++) {
            if (!this.disabledIndices.has(i)) {
              this.selectedIndices.add(i);
            }
          }
        }
      }
    } catch {
      // Invalid JSON - ignore
    }
  }

  // --- Time utilities ---

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private formatTime(time: string): string {
    if (this.format === '24h') return time;

    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  }

  private getSlotIndex(time: string): number {
    return this.slots.indexOf(time);
  }

  private getSlotEndTime(index: number): string {
    const startMinutes = this.timeToMinutes(this.slots[index]);
    return this.minutesToTime(startMinutes + this.granularity);
  }

  private isHourBoundary(time: string): boolean {
    return time.endsWith(':00') && time !== this.slots[0];
  }

  // --- Range helpers ---

  private isRangeStart(index: number, ranges: TimeRange[]): boolean {
    for (const range of ranges) {
      const startIdx = this.getSlotIndex(range.start);
      if (startIdx === index) return true;
    }
    return false;
  }

  private isRangeEnd(index: number, ranges: TimeRange[]): boolean {
    for (const range of ranges) {
      const endIdx = this.getSlotIndex(range.end);
      if (endIdx === index) return true;
    }
    return false;
  }

  private isInDragRange(index: number): boolean {
    if (this.dragStartIndex < 0) return false;
    const low = Math.min(this.dragStartIndex, this.dragEndIndex);
    const high = Math.max(this.dragStartIndex, this.dragEndIndex);
    return index >= low && index <= high;
  }

  // --- Mouse/touch handling ---

  private getSlotIndexFromEvent(e: MouseEvent | Touch): number {
    const target = (e.target as HTMLElement).closest('[data-index]');
    if (target) {
      return parseInt(target.getAttribute('data-index') || '-1', 10);
    }
    return -1;
  }

  private getSlotIndexFromPoint(x: number, y: number): number {
    const el = this.shadowRoot?.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return -1;
    const slot = el.closest('[data-index]');
    if (slot) {
      return parseInt(slot.getAttribute('data-index') || '-1', 10);
    }
    return -1;
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.disabled || this.readonly) return;
    const index = this.getSlotIndexFromEvent(e);
    if (index < 0 || this.disabledIndices.has(index)) return;

    e.preventDefault();
    this.startDrag(index);

    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const index = this.getSlotIndexFromPoint(e.clientX, e.clientY);
    if (index >= 0) {
      this.updateDrag(index);
    }
  }

  private handleMouseUp(_e: MouseEvent) {
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    if (this.isDragging) {
      this.endDrag();
    }
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.disabled || this.readonly) return;
    const touch = e.touches[0];
    const index = this.getSlotIndexFromEvent(touch);
    if (index < 0 || this.disabledIndices.has(index)) return;

    e.preventDefault();
    this.startDrag(index);

    document.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    document.addEventListener('touchend', this.boundHandleTouchEnd);
  }

  private handleTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const index = this.getSlotIndexFromPoint(touch.clientX, touch.clientY);
    if (index >= 0) {
      this.updateDrag(index);
    }
  }

  private handleTouchEnd(_e: TouchEvent) {
    document.removeEventListener('touchmove', this.boundHandleTouchMove);
    document.removeEventListener('touchend', this.boundHandleTouchEnd);
    if (this.isDragging) {
      this.endDrag();
    }
  }

  private startDrag(index: number) {
    this.isDragging = true;
    this.dragStartIndex = index;
    this.dragEndIndex = index;
    this.emitSelect();
    this.renderContent();
  }

  private updateDrag(index: number) {
    if (index !== this.dragEndIndex) {
      this.dragEndIndex = index;
      this.renderContent();
    }
  }

  private endDrag() {
    const low = Math.min(this.dragStartIndex, this.dragEndIndex);
    const high = Math.max(this.dragStartIndex, this.dragEndIndex);

    // Collect new indices, skipping disabled
    const newIndices: number[] = [];
    for (let i = low; i <= high; i++) {
      if (!this.disabledIndices.has(i)) {
        newIndices.push(i);
      }
    }

    if (this.multiple) {
      // Toggle: if all in range are already selected, deselect; else select
      const allSelected = newIndices.every(i => this.selectedIndices.has(i));
      if (allSelected) {
        for (const i of newIndices) {
          this.selectedIndices.delete(i);
        }
      } else {
        for (const i of newIndices) {
          this.selectedIndices.add(i);
        }
      }
    } else {
      // Single range mode: replace selection
      this.selectedIndices.clear();
      for (const i of newIndices) {
        this.selectedIndices.add(i);
      }
    }

    const completedRange: TimeRange = {
      start: this.slots[low],
      end: this.slots[high],
    };

    this.isDragging = false;
    this.dragStartIndex = -1;
    this.dragEndIndex = -1;

    this.syncValueFromSelection();
    this.emitComplete(completedRange);
    this.emitChange();
    this.renderContent();
  }

  // --- Keyboard handling ---

  private handleSlotKeydown(e: KeyboardEvent, index: number) {
    if (this.disabled || this.readonly) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (this.disabledIndices.has(index)) return;

      if (this.multiple) {
        if (this.selectedIndices.has(index)) {
          this.selectedIndices.delete(index);
        } else {
          this.selectedIndices.add(index);
        }
      } else {
        this.selectedIndices.clear();
        this.selectedIndices.add(index);
      }

      const range: TimeRange = { start: this.slots[index], end: this.slots[index] };
      this.syncValueFromSelection();
      this.emitComplete(range);
      this.emitChange();
      this.renderContent();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusSlot(index + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusSlot(index - 1);
    } else if (e.key === 'Escape') {
      this.clearSelection();
    }
  }

  private focusSlot(index: number) {
    if (index < 0 || index >= this.slots.length) return;
    const slotEl = this.shadowRoot?.querySelector(`[data-index="${index}"]`) as HTMLElement;
    slotEl?.focus();
  }

  // --- Value synchronization ---

  private syncValueFromSelection() {
    const ranges = this.getSelectedRanges();
    this.value = JSON.stringify(ranges);
  }

  private getDisplayValue(): string {
    const ranges = this.getSelectedRanges();
    if (ranges.length === 0) return '';

    return ranges.map(r => {
      const startDisplay = this.formatTime(r.start);
      const endTime = this.minutesToTime(this.timeToMinutes(r.end) + this.granularity);
      const endDisplay = this.formatTime(endTime);
      return `${startDisplay} - ${endDisplay}`;
    }).join(', ');
  }

  // --- Public API ---

  getSelectedRanges(): TimeRange[] {
    const sorted = [...this.selectedIndices].sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const ranges: TimeRange[] = [];
    let rangeStart = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== prev + 1) {
        ranges.push({
          start: this.slots[rangeStart],
          end: this.slots[prev],
        });
        rangeStart = sorted[i];
      }
      prev = sorted[i];
    }

    ranges.push({
      start: this.slots[rangeStart],
      end: this.slots[prev],
    });

    return ranges;
  }

  setSelectedRanges(ranges: TimeRange[]) {
    this.value = JSON.stringify(ranges);
    this.parseValue();
    this.emitChange();
    this.renderContent();
  }

  clearSelection() {
    this.selectedIndices.clear();
    this.value = '';
    this.emitChange();
    this.renderContent();
  }

  isSlotDisabled(time: string): boolean {
    const index = this.getSlotIndex(time);
    return index >= 0 && this.disabledIndices.has(index);
  }

  // --- Watchers ---

  @watch('value')
  handleValueChange() {
    this.parseValue();
  }

  @watch('disabled-ranges')
  handleDisabledRangesChange() {
    this.parseDisabledRanges();
  }

  @watch('granularity')
  handleGranularityChange() {
    this.buildSlots();
    this.parseDisabledRanges();
    this.parseValue();
  }

  @watch('start-time')
  handleStartTimeChange() {
    this.buildSlots();
    this.parseDisabledRanges();
    this.parseValue();
  }

  @watch('end-time')
  handleEndTimeChange() {
    this.buildSlots();
    this.parseDisabledRanges();
    this.parseValue();
  }

  // --- Event dispatchers ---

  @dispatch('time-range-change', { bubbles: true, composed: true })
  private emitChange() {
    return { ranges: this.getSelectedRanges(), component: this };
  }

  @dispatch('time-range-select', { bubbles: true, composed: true })
  private emitSelect() {
    return { start: this.slots[this.dragStartIndex], component: this };
  }

  @dispatch('time-range-complete', { bubbles: true, composed: true })
  private emitComplete(range: TimeRange) {
    return { range, ranges: this.getSelectedRanges(), component: this };
  }
}
