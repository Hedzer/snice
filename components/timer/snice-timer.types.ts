export type TimerMode = 'stopwatch' | 'timer';

export interface SniceTimerElement extends HTMLElement {
  mode: TimerMode;
  initialTime: number;
  running: boolean;

  start(): void;
  stop(): void;
  reset(): void;
  getTime(): number;
}
