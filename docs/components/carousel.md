<!-- AI: For a low-token version of this doc, use docs/ai/components/carousel.md instead -->

# Carousel
`<snice-carousel>`

Content carousel with autoplay, looping, navigation controls, and multi-slide views.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/carousel/snice-carousel';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-carousel.min.js"></script>
```

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
| `next()` | — | Advance to the next slide |
| `prev()` | — | Go to the previous slide |
| `goToSlide()` | `index: number` | Navigate to a specific slide by index |
| `play()` | — | Start autoplay |
| `pause()` | — | Pause autoplay |

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

```typescript
import 'snice/components/carousel/snice-carousel';
```

```html
<snice-carousel>
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
</snice-carousel>
```

## Examples

### Autoplay

Set the `autoplay` attribute to automatically advance slides. Use `autoplay-interval` to control the timing in milliseconds.

```html
<snice-carousel autoplay autoplay-interval="2000">
  <img src="/photos/hero-1.jpg" alt="Product showcase">
  <img src="/photos/hero-2.jpg" alt="Feature highlight">
  <img src="/photos/hero-3.jpg" alt="Customer testimonial">
</snice-carousel>
```

### Autoplay Direction

Use `autoplay-direction` to reverse the autoplay direction.

```html
<snice-carousel autoplay autoplay-direction="backward">
  <div>First</div>
  <div>Second</div>
  <div>Third</div>
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

Set `loop` to `false` to disable infinite scrolling. Navigation buttons will be disabled at the start and end.

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
<!-- No arrow buttons -->
<snice-carousel show-controls="false">
  <div>Slide 1</div>
  <div>Slide 2</div>
</snice-carousel>

<!-- No indicator dots -->
<snice-carousel show-indicators="false">
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
carousel.addEventListener('carousel-slide-change', (e: CustomEvent) => {
  console.log('Active slide:', e.detail.activeIndex);
  console.log('Previous slide:', e.detail.previousIndex);
});
```

### Image Gallery

A common pattern using the carousel for an image gallery.

```html
<snice-carousel id="gallery" loop>
  <img src="/gallery/sunset.jpg" alt="Sunset over mountains">
  <img src="/gallery/ocean.jpg" alt="Ocean waves">
  <img src="/gallery/forest.jpg" alt="Forest trail">
  <img src="/gallery/city.jpg" alt="City skyline">
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

### Product Card Carousel

Display product cards in a scrollable carousel.

```html
<snice-carousel slides-per-view="3" space-between="16" loop>
  <div class="product-card">
    <img src="/products/headphones.jpg" alt="Headphones">
    <h3>Wireless Headphones</h3>
    <p>$79.99</p>
  </div>
  <div class="product-card">
    <img src="/products/keyboard.jpg" alt="Keyboard">
    <h3>Mechanical Keyboard</h3>
    <p>$129.99</p>
  </div>
  <div class="product-card">
    <img src="/products/mouse.jpg" alt="Mouse">
    <h3>Ergonomic Mouse</h3>
    <p>$49.99</p>
  </div>
  <div class="product-card">
    <img src="/products/monitor.jpg" alt="Monitor">
    <h3>4K Monitor</h3>
    <p>$399.99</p>
  </div>
</snice-carousel>
```
