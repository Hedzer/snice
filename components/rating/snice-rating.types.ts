export type RatingPrecision = 'full' | 'half';
export type RatingSize = 'small' | 'medium' | 'large';

export interface SniceRatingElement extends HTMLElement {
  value: number;
  max: number;
  icon: string;
  size: RatingSize;
  readonly: boolean;
  precision: RatingPrecision;
}

export interface SniceRatingEventMap {
  'rating-change': CustomEvent<{ value: number }>;
}
