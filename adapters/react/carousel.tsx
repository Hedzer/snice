// GENERATED FILE — DO NOT EDIT.
// Source: components/carousel/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Carousel component
 */
export interface CarouselProps extends SniceBaseProps {
  activeIndex?: any;
  autoplay?: any;
  autoplayInterval?: any;
  autoplayDirection?: any;
  loop?: any;
  showControls?: any;
  showIndicators?: any;
  slidesPerView?: any;
  spaceBetween?: any;
  onCarouselSlideChange?: (event: any) => void;
}

/**
 * Carousel - React adapter for snice-carousel
 *
 * This is an auto-generated React wrapper for the Snice carousel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/carousel';
 * import { Carousel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Carousel />;
 * }
 * ```
 */
export const Carousel = createReactAdapter<CarouselProps>({
  tagName: 'snice-carousel',
  properties: ["activeIndex","autoplay","autoplayInterval","autoplayDirection","loop","showControls","showIndicators","slidesPerView","spaceBetween"],
  events: {"carousel-slide-change":"onCarouselSlideChange"},
  formAssociated: false
});
