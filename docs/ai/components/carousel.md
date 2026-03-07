# snice-carousel

Image/content carousel with autoplay, loop, navigation.

## Properties

```typescript
activeIndex: number = 0;
autoplay: boolean = false;
autoplayInterval: number = 3000;
autoplayDirection: 'forward'|'backward' = 'forward';
loop: boolean = true;
showControls: boolean = true;
showIndicators: boolean = true;
slidesPerView: number = 1;
spaceBetween: number = 0;
```

## Methods

- `next()`, `prev()`, `goToSlide(index)`
- `play()`, `pause()`

## Slots

- `(default)` - Slide content (each direct child = one slide)

## Events

- `carousel-slide-change` → `{ activeIndex, previousIndex, carousel }`

## CSS Parts

- `container` - Outermost carousel wrapper
- `viewport` - Visible slide area
- `slides-container` - Flex container holding all slides
- `controls` - Prev/next button container
- `button-prev` - Previous slide button
- `button-next` - Next slide button
- `indicators` - Slide indicator dot container
- `indicator` - Individual indicator dot

## Usage

```html
<!-- Basic -->
<snice-carousel>
  <div>Slide 1</div>
  <div>Slide 2</div>
</snice-carousel>

<!-- Autoplay -->
<snice-carousel autoplay autoplay-interval="2000">
  <div>Auto 1</div>
  <div>Auto 2</div>
</snice-carousel>

<!-- Multiple slides -->
<snice-carousel slides-per-view="3" space-between="20">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</snice-carousel>
```
