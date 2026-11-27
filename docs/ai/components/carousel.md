# snice-carousel

Content carousel with autoplay, loop, navigation controls, and multi-slide views.

## Properties

```typescript
activeIndex: number = 0;                                   // attribute: active-index
autoplay: boolean = false;
autoplayInterval: number = 3000;                           // attribute: autoplay-interval
autoplayDirection: 'forward'|'backward' = 'forward';       // attribute: autoplay-direction
loop: boolean = true;
showControls: boolean = true;                              // attribute: show-controls
showIndicators: boolean = true;                            // attribute: show-indicators
slidesPerView: number = 1;                                 // attribute: slides-per-view
spaceBetween: number = 0;                                  // attribute: space-between
```

## Methods

- `next()` / `prev()` - Navigate slides
- `goToSlide(index: number)` - Go to specific slide
- `play()` / `pause()` - Control autoplay

## Events

- `carousel-slide-change` -> `{ activeIndex, previousIndex, carousel }`

## Slots

- `(default)` - Slide content (each direct child = one slide)

## CSS Parts

- `base` - Outermost wrapper (same element as `container`)
- `container` - Outermost wrapper
- `viewport` - Visible slide area
- `slides-container` - Flex container holding slides
- `controls` - Prev/next button container
- `button-prev` / `button-next` - Navigation buttons
- `indicators` - Indicator dot container
- `indicator` - Individual indicator dot
- `button-icon` - Chevron glyph inside a navigation button
- `button-icon-prev` - Added to `button-icon` in the previous button
- `button-icon-next` - Added to `button-icon` in the next button
- `button-prev-disabled` - Added to `button-prev` when there is no previous slide
- `button-next-disabled` - Added to `button-next` when there is no next slide
- `indicator-active` - Added to `indicator` for the active slide

## Basic Usage

```html
<snice-carousel>
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</snice-carousel>
```

```typescript
import 'snice/components/carousel/snice-carousel';

carousel.addEventListener('carousel-slide-change', (e) => {
  console.log('Active:', e.detail.activeIndex);
});
```

## Accessibility

- Keyboard navigation with arrow keys
- ARIA roles and labels for controls
