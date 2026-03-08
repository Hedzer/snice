import { createReactAdapter } from './wrapper';
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
export const Carousel = createReactAdapter({
    tagName: 'snice-carousel',
    properties: ["activeIndex", "autoplay", "autoplayInterval", "autoplayDirection", "loop", "showControls", "showIndicators", "slidesPerView", "spaceBetween", "slideCount"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=carousel.js.map