export type SpotlightPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface SpotlightStep {
  target: string;
  title: string;
  description: string;
  position?: SpotlightPosition;
}

export interface SniceSpotlightElement extends HTMLElement {
  steps: SpotlightStep[];
  start(): void;
  next(): void;
  prev(): void;
  goToStep(index: number): void;
  end(): void;
}

export interface SniceSpotlightEventMap {
  'spotlight-start': CustomEvent<void>;
  'spotlight-step': CustomEvent<{ index: number; step: SpotlightStep }>;
  'spotlight-end': CustomEvent<void>;
  'spotlight-skip': CustomEvent<{ index: number }>;
}
