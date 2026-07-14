export type TimeRangeGranularity = 5 | 15 | 30 | 60;
export type TimeFormat = '12h' | '24h';

export interface TimeRange {
  start: string;
  end: string;
}

export interface SniceTimeRangePickerElement extends HTMLElement {
  granularity: TimeRangeGranularity;
  startTime: string;
  endTime: string;
  value: string;
  disabledRanges: string;
  format: TimeFormat;
  multiple: boolean;
  readonly: boolean;
  disabled: boolean;

  // Methods
  getSelectedRanges(): TimeRange[];
  setSelectedRanges(ranges: TimeRange[]): void;
  clearSelection(): void;
  isSlotDisabled(time: string): boolean;
}

export interface TimeRangeChangeDetail {
  ranges: TimeRange[];
  component: SniceTimeRangePickerElement;
}

export interface TimeRangeSelectDetail {
  start: string;
  component: SniceTimeRangePickerElement;
}

export interface TimeRangeCompleteDetail {
  range: TimeRange;
  ranges: TimeRange[];
  component: SniceTimeRangePickerElement;
}

export interface SniceTimeRangePickerEventMap {
  'time-range-change': CustomEvent<TimeRangeChangeDetail>;
  'time-range-select': CustomEvent<TimeRangeSelectDetail>;
  'time-range-complete': CustomEvent<TimeRangeCompleteDetail>;
}
