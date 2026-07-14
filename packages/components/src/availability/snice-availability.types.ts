export type AvailabilityFormat = '12h' | '24h';

export interface AvailabilityRange {
  day: number; // 0=Mon, 1=Tue, ..., 6=Sun
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

export interface SniceAvailabilityElement extends HTMLElement {
  value: AvailabilityRange[];
  granularity: number;
  startHour: number;
  endHour: number;
  format: AvailabilityFormat;
  readonly: boolean;

  getAvailability(): AvailabilityRange[];
  setAvailability(ranges: AvailabilityRange[]): void;
  clear(): void;
}

export interface SniceAvailabilityEventMap {
  'availability-change': CustomEvent<{ value: AvailabilityRange[] }>;
}
