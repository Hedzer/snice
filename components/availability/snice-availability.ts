import { element, property, styles, dispatch, ready, watch, css } from 'snice';
import type { SniceAvailabilityElement, AvailabilityFormat, AvailabilityRange } from './snice-availability.types';
import cssContent from './snice-availability.css?inline';

@element('snice-availability')
export class SniceAvailability extends HTMLElement implements SniceAvailabilityElement {
  @property({ type: Array })
  value: AvailabilityRange[] = [];

  @property({ type: Number })
  granularity: number = 60;

  @property({ type: Number, attribute: 'start-hour' })
  startHour: number = 0;

  @property({ type: Number, attribute: 'end-hour' })
  endHour: number = 24;

  @property()
  format: AvailabilityFormat = '12h';

  @property({ type: Boolean })
  readonly: boolean = false;

  private container!: HTMLElement;
  private activeCells: Set<string> = new Set(); // "day-slotIndex"
  private isDragging = false;
  private dragMode: 'add' | 'remove' = 'add';
  private dragStartCell: string | null = null;

  @dispatch('availability-change', { bubbles: true, composed: true })
  private emitChange() {
    return { value: this.getAvailability() };
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.container = document.createElement('div');
    this.container.className = 'availability';
    this.container.setAttribute('part', 'base');
    this.shadowRoot!.appendChild(this.container);
    this.syncFromValue();
    this.renderGrid();
  }

  private get slotsPerHour(): number {
    return 60 / this.granularity;
  }

  private get totalSlots(): number {
    return (this.endHour - this.startHour) * this.slotsPerHour;
  }

  private syncFromValue(): void {
    this.activeCells.clear();

    this.value.forEach(range => {
      const [startH, startM] = range.start.split(':').map(Number);
      const [endH, endM] = range.end.split(':').map(Number);

      const startMinute = startH * 60 + startM;
      const endMinute = endH * 60 + endM;

      for (let m = startMinute; m < endMinute; m += this.granularity) {
        const slotIndex = (m - this.startHour * 60) / this.granularity;
        if (slotIndex >= 0 && slotIndex < this.totalSlots) {
          this.activeCells.add(`${range.day}-${slotIndex}`);
        }
      }
    });
  }

  private syncToValue(): void {
    const ranges: AvailabilityRange[] = [];

    for (let day = 0; day < 7; day++) {
      let rangeStart: number | null = null;

      for (let slot = 0; slot <= this.totalSlots; slot++) {
        const key = `${day}-${slot}`;
        const isActive = this.activeCells.has(key);

        if (isActive && rangeStart === null) {
          rangeStart = slot;
        } else if (!isActive && rangeStart !== null) {
          const startMinute = this.startHour * 60 + rangeStart * this.granularity;
          const endMinute = this.startHour * 60 + slot * this.granularity;
          ranges.push({
            day,
            start: this.minutesToTimeStr(startMinute),
            end: this.minutesToTimeStr(endMinute),
          });
          rangeStart = null;
        }
      }
    }

    this.value = ranges;
  }

  private minutesToTimeStr(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private renderGrid(): void {
    this.container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'availability__header';
    header.setAttribute('part', 'header');

    const title = document.createElement('div');
    title.className = 'availability__title';
    title.textContent = 'Weekly Availability';
    header.appendChild(title);

    if (!this.readonly) {
      const presets = document.createElement('div');
      presets.className = 'availability__presets';

      const businessBtn = document.createElement('button');
      businessBtn.className = 'availability__preset';
      businessBtn.textContent = 'Business Hours';
      businessBtn.onclick = () => this.applyBusinessHours();

      const weekdaysBtn = document.createElement('button');
      weekdaysBtn.className = 'availability__preset';
      weekdaysBtn.textContent = 'Weekdays Only';
      weekdaysBtn.onclick = () => this.applyWeekdays();

      const clearBtn = document.createElement('button');
      clearBtn.className = 'availability__preset';
      clearBtn.textContent = 'Clear All';
      clearBtn.onclick = () => this.clear();

      presets.appendChild(businessBtn);
      presets.appendChild(weekdaysBtn);
      presets.appendChild(clearBtn);
      header.appendChild(presets);
    }

    this.container.appendChild(header);

    // Grid
    const gridWrapper = document.createElement('div');
    gridWrapper.className = 'availability__grid-wrapper';

    const grid = document.createElement('div');
    grid.className = 'availability__grid';
    grid.setAttribute('part', 'grid');

    // Corner cell
    const corner = document.createElement('div');
    corner.className = 'availability__corner';
    grid.appendChild(corner);

    // Day headers
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(name => {
      const headerEl = document.createElement('div');
      headerEl.className = 'availability__day-header';
      headerEl.textContent = name;
      grid.appendChild(headerEl);
    });

    // Time rows
    for (let slot = 0; slot < this.totalSlots; slot++) {
      const minutes = this.startHour * 60 + slot * this.granularity;
      const isHourStart = minutes % 60 === 0;

      // Time label
      const timeLabel = document.createElement('div');
      timeLabel.className = 'availability__time-label';
      if (isHourStart) {
        timeLabel.classList.add('availability__time-label--hour');
        timeLabel.textContent = this.formatTimeLabel(minutes);
      } else {
        timeLabel.classList.add('availability__time-label--sub-hour');
      }
      grid.appendChild(timeLabel);

      // Day cells
      for (let day = 0; day < 7; day++) {
        const cell = document.createElement('div');
        const key = `${day}-${slot}`;
        cell.className = 'availability__cell';
        cell.dataset.key = key;

        if (isHourStart) {
          cell.classList.add('availability__cell--hour-start');
        } else {
          cell.classList.add('availability__cell--sub-hour');
        }

        if (this.activeCells.has(key)) {
          cell.classList.add('availability__cell--active');
        }

        if (!this.readonly) {
          cell.onmousedown = (e) => this.handleCellMouseDown(e, key, cell);
          cell.onmouseenter = (e) => this.handleCellMouseEnter(e, key, cell);
        }

        grid.appendChild(cell);
      }
    }

    gridWrapper.appendChild(grid);
    this.container.appendChild(gridWrapper);

    // Mouse up listener
    if (!this.readonly) {
      const onMouseUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          this.dragStartCell = null;
          this.syncToValue();
          this.emitChange();
        }
      };

      // Remove previous listener if exists
      document.removeEventListener('mouseup', onMouseUp);
      document.addEventListener('mouseup', onMouseUp);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'availability__footer';

    const legend = document.createElement('div');
    legend.className = 'availability__legend';

    const availItem = document.createElement('span');
    availItem.className = 'availability__legend-item';
    const availSwatch = document.createElement('span');
    availSwatch.className = 'availability__legend-swatch availability__legend-swatch--available';
    availItem.appendChild(availSwatch);
    availItem.appendChild(document.createTextNode(' Available'));
    legend.appendChild(availItem);

    const unavailItem = document.createElement('span');
    unavailItem.className = 'availability__legend-item';
    const unavailSwatch = document.createElement('span');
    unavailSwatch.className = 'availability__legend-swatch availability__legend-swatch--unavailable';
    unavailItem.appendChild(unavailSwatch);
    unavailItem.appendChild(document.createTextNode(' Unavailable'));
    legend.appendChild(unavailItem);

    footer.appendChild(legend);

    const count = document.createElement('div');
    count.className = 'availability__count';
    const totalHours = this.activeCells.size * this.granularity / 60;
    count.textContent = `${totalHours}h selected`;
    footer.appendChild(count);

    this.container.appendChild(footer);
  }

  private handleCellMouseDown(e: MouseEvent, key: string, cell: HTMLElement): void {
    e.preventDefault();
    this.isDragging = true;
    this.dragStartCell = key;

    // Toggle: if active, go to remove mode; otherwise add mode
    if (this.activeCells.has(key)) {
      this.dragMode = 'remove';
      this.activeCells.delete(key);
      cell.classList.remove('availability__cell--active');
    } else {
      this.dragMode = 'add';
      this.activeCells.add(key);
      cell.classList.add('availability__cell--active');
    }
  }

  private handleCellMouseEnter(e: MouseEvent, key: string, cell: HTMLElement): void {
    if (!this.isDragging) return;

    if (this.dragMode === 'add') {
      this.activeCells.add(key);
      cell.classList.add('availability__cell--active');
    } else {
      this.activeCells.delete(key);
      cell.classList.remove('availability__cell--active');
    }
  }

  private formatTimeLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (this.format === '24h') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  private applyBusinessHours(): void {
    this.activeCells.clear();

    // Mon-Fri (0-4), 9 AM - 5 PM
    for (let day = 0; day < 5; day++) {
      for (let slot = 0; slot < this.totalSlots; slot++) {
        const minutes = this.startHour * 60 + slot * this.granularity;
        if (minutes >= 540 && minutes < 1020) { // 9:00 - 17:00
          this.activeCells.add(`${day}-${slot}`);
        }
      }
    }

    this.syncToValue();
    this.emitChange();
    this.renderGrid();
  }

  private applyWeekdays(): void {
    this.activeCells.clear();

    // Mon-Fri (0-4), all hours
    for (let day = 0; day < 5; day++) {
      for (let slot = 0; slot < this.totalSlots; slot++) {
        this.activeCells.add(`${day}-${slot}`);
      }
    }

    this.syncToValue();
    this.emitChange();
    this.renderGrid();
  }

  // Public methods

  getAvailability(): AvailabilityRange[] {
    return [...this.value];
  }

  setAvailability(ranges: AvailabilityRange[]): void {
    this.value = ranges;
    this.syncFromValue();
    this.renderGrid();
  }

  clear(): void {
    this.activeCells.clear();
    this.syncToValue();
    this.emitChange();
    this.renderGrid();
  }

  @watch('value')
  handleValueChange() {
    if (this.container) {
      this.syncFromValue();
      this.renderGrid();
    }
  }

  @watch('granularity')
  @watch('startHour')
  @watch('endHour')
  @watch('format')
  @watch('readonly')
  handlePropertyChange() {
    if (this.container) {
      this.syncFromValue();
      this.renderGrid();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-availability': SniceAvailability;
  }
}
