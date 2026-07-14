export type CountdownFormat = 'dhms' | 'hms' | 'ms';
export type CountdownVariant = 'flip' | 'simple' | 'circular';

export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export interface SniceCountdownElement extends HTMLElement {
  target: string;
  format: CountdownFormat;
  variant: CountdownVariant;
}

export interface SniceCountdownEventMap {
  'countdown-complete': CustomEvent<void>;
  'countdown-tick': CustomEvent<CountdownValues>;
}
