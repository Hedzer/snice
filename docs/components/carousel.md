<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/carousel.md -->

# Carousel Component

Content carousel with autoplay, looping, navigation controls, slide indicators, and multi-slide views.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activeIndex` (attr: `active-index`) | `number` | `0` | Current slide index |
| `autoplay` | `boolean` | `false` | Enable automatic slide advancement |
| `autoplayInterval` (attr: `autoplay-interval`) | `number` | `3000` | Autoplay interval in milliseconds |
| `autoplayDirection` (attr: `autoplay-direction`) | `'forward' \| 'backward'` | `'forward'` | Autoplay direction |
| `loop` | `boolean` | `true` | Enable infinite looping |
| `showControls` (attr: `show-controls`) | `boolean` | `true` | Show previous/next arrow buttons |
| `showIndicators` (attr: `show-indicators`) | `boolean` | `true` | Show slide indicator dots |
| `slidesPerView` (attr: `slides-per-view`) | `number` | `1` | Number of slides visible at once |
| `spaceBetween` (attr: `space-between`) | `number` | `0` | Space between slides in pixels |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `next()` | -- | Advance to the next slide |
| `prev()` | -- | Go to the previous slide |
| `goToSlide()` | `index: number` | Navigate to a specific slide by index |
| `play()` | -- | Start autoplay |
| `pause()` | -- | Pause autoplay |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `carousel-slide-change` | `{ activeIndex: number, previousIndex: number, carousel: SniceCarouselElement }` | Fired when the active slide changes |

## Slots

| Name | Description |
|------|-------------|
| (default) | Slide content. Each direct child element becomes one slide. |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | The outermost carousel wrapper |
| `viewport` | The visible slide area |
| `slides-container` | The flex container holding all slides |
| `controls` | The prev/next button container |
| `button-prev` | The previous slide button |
| `button-next` | The next slide button |
| `indicators` | The slide indicator dot container |
| `indicator` | Individual slide indicator dot |

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
```

## Examples

### Autoplay

Set the `autoplay` attribute to automatically advance slides.

```html
<snice-carousel autoplay autoplay-interval="2000">
  <img src="/photos/hero-1.jpg" alt="Product showcase">
  <img src="/photos/hero-2.jpg" alt="Feature highlight">
  <img src="/photos/hero-3.jpg" alt="Customer testimonial">
</snice-carousel>
```

### Multiple Slides Per View

Use `slides-per-view` to show multiple slides at once, and `space-between` for spacing.

```html
<snice-carousel slides-per-view="3" space-between="20">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
  <div>Card 4</div>
  <div>Card 5</div>
</snice-carousel>
```

### Without Loop

Set `loop` to `false` to disable infinite scrolling.

```html
<snice-carousel loop="false">
  <div>Step 1: Introduction</div>
  <div>Step 2: Configuration</div>
  <div>Step 3: Deployment</div>
</snice-carousel>
```

### Hide Controls

Use `show-controls` and `show-indicators` to toggle navigation elements.

```html
<snice-carousel show-controls="false">
  <div>Slide 1</div>
  <div>Slide 2</div>
</snice-carousel>
```

### Programmatic Control

Use methods to control the carousel from JavaScript.

```html
<snice-carousel id="myCarousel">
  <img src="/photos/1.jpg" alt="Photo 1">
  <img src="/photos/2.jpg" alt="Photo 2">
  <img src="/photos/3.jpg" alt="Photo 3">
</snice-carousel>

<button onclick="myCarousel.prev()">Previous</button>
<button onclick="myCarousel.next()">Next</button>
<button onclick="myCarousel.goToSlide(0)">First</button>
```

### Event Handling

Listen for slide changes to synchronize other UI elements.

```typescript
carousel.addEventListener('carousel-slide-change', (e) => {
  console.log('Active slide:', e.detail.activeIndex);
  console.log('Previous slide:', e.detail.previousIndex);
});
```

### Image Gallery

Use the carousel for an image gallery with styled slides.

```html
<snice-carousel loop>
  <img src="/gallery/sunset.jpg" alt="Sunset over mountains">
  <img src="/gallery/ocean.jpg" alt="Ocean waves">
  <img src="/gallery/forest.jpg" alt="Forest trail">
</snice-carousel>

<style>
  snice-carousel img {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 8px;
  }
</style>
```

## Accessibility

- Keyboard navigation with arrow keys
- ARIA roles and labels for controls and indicators
- Focus management between slides
