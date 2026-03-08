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
    slideCount?: any;
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
export declare const Carousel: import("react").ForwardRefExoticComponent<Omit<CarouselProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=carousel.d.ts.map