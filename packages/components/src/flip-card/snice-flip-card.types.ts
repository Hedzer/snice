export type FlipDirection = 'horizontal' | 'vertical';
export type FlipSide = 'front' | 'back';

export interface SniceFlipCardElement extends HTMLElement {
  flipped: boolean;
  clickToFlip: boolean;
  direction: FlipDirection;
  duration: number;
  flip(): void;
  flipTo(side: FlipSide): void;
}

export interface SniceFlipCardEventMap {
  'flip-change': CustomEvent<{ flipped: boolean; side: FlipSide }>;
}
