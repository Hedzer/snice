# Carousel Component

Image/content carousel with autoplay, loop, and navigation controls.

## Basic Usage

```html
<snice-carousel>
  <div class="slide">Slide 1</div>
  <div class="slide">Slide 2</div>
  <div class="slide">Slide 3</div>
</snice-carousel>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activeIndex` | `number` | `0` | Current slide index |
| `autoplay` | `boolean` | `false` | Enable autoplay |
| `autoplayInterval` | `number` | `3000` | Autoplay interval (ms) |
| `autoplayDirection` | `'forward' \| 'backward'` | `'forward'` | Autoplay direction |
| `loop` | `boolean` | `true` | Loop slides |
| `showControls` | `boolean` | `true` | Show prev/next buttons |
| `showIndicators` | `boolean` | `true` | Show slide indicators |
| `slidesPerView` | `number` | `1` | Number of slides visible |
| `spaceBetween` | `number` | `0` | Space between slides (px) |

## Methods

- `next()` - Go to next slide
- `prev()` - Go to previous slide
- `goToSlide(index: number)` - Go to specific slide
- `play()` - Start autoplay
- `pause()` - Pause autoplay

## Events

- `carousel-slide-change` - Slide changed (detail: { activeIndex, previousIndex, carousel })

## Examples

```html
<!-- Autoplay -->
<snice-carousel autoplay autoplay-interval="2000">
  <div>Slide 1</div>
  <div>Slide 2</div>
</snice-carousel>

<!-- Multiple slides -->
<snice-carousel slides-per-view="3" space-between="20">
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>4</div>
</snice-carousel>

<!-- No loop -->
<snice-carousel loop="false">
  <div>Slide 1</div>
  <div>Slide 2</div>
</snice-carousel>
```
