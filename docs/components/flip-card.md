<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/flip-card.md -->

# Flip Card

The flip card component creates a two-sided card with a CSS 3D flip animation. Content is placed in front and back slots, and the card can be flipped by clicking, keyboard interaction, or programmatically.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `flipped` | `boolean` | `false` | Whether the back face is currently showing |
| `clickToFlip` (attr: `click-to-flip`) | `boolean` | `true` | Enable click and keyboard interaction to toggle the card |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Flip axis direction |
| `duration` | `number` | `600` | Flip animation duration in milliseconds |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `flip()` | -- | Toggle between front and back faces |
| `flipTo(side)` | `side: 'front' \| 'back'` | Flip to a specific side |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `flip-change` | `{ flipped: boolean, side: 'front' \| 'back' }` | Fired when the card flips to a different side |

## Slots

| Name | Description |
|------|-------------|
| `front` | Content displayed on the front face of the card |
| `back` | Content displayed on the back face of the card |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer flip card container |
| `front` | The front face container |
| `back` | The back face container |

```css
snice-flip-card::part(base) {
  border-radius: 1rem;
}

snice-flip-card::part(front) {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

snice-flip-card::part(back) {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
```

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--flip-duration` | Animation duration (automatically set from the `duration` property) |

## Basic Usage

```typescript
import 'snice/components/flip-card/snice-flip-card';
```

```html
<snice-flip-card style="width: 300px; height: 200px;">
  <div slot="front">Front side</div>
  <div slot="back">Back side</div>
</snice-flip-card>
```

## Examples

### Horizontal Flip (Default)

Click the card to flip it horizontally around the Y axis.

```html
<snice-flip-card style="width: 300px; height: 200px;">
  <div slot="front" style="display: flex; align-items: center; justify-content: center; background: #3b82f6; color: white; height: 100%; border-radius: 8px;">
    Click to flip
  </div>
  <div slot="back" style="display: flex; align-items: center; justify-content: center; background: #10b981; color: white; height: 100%; border-radius: 8px;">
    Back side!
  </div>
</snice-flip-card>
```

### Vertical Flip

Use `direction="vertical"` to flip the card around the X axis.

```html
<snice-flip-card direction="vertical" style="width: 300px; height: 200px;">
  <div slot="front" style="padding: 2rem; background: #f3f4f6; height: 100%; box-sizing: border-box;">
    <h3>Question</h3>
    <p>What is the capital of France?</p>
  </div>
  <div slot="back" style="padding: 2rem; background: #dbeafe; height: 100%; box-sizing: border-box;">
    <h3>Answer</h3>
    <p>Paris</p>
  </div>
</snice-flip-card>
```

### Custom Duration

Set `duration` to control the speed of the flip animation.

```html
<snice-flip-card duration="1200" style="width: 250px; height: 180px;">
  <div slot="front">Slow flip (1.2s)</div>
  <div slot="back">Back side</div>
</snice-flip-card>

<snice-flip-card duration="200" style="width: 250px; height: 180px;">
  <div slot="front">Fast flip (0.2s)</div>
  <div slot="back">Back side</div>
</snice-flip-card>
```

### Programmatic Control

Disable click-to-flip and control the card from JavaScript.

```html
<snice-flip-card id="controlled-card" click-to-flip="false" style="width: 300px; height: 200px;">
  <div slot="front" style="padding: 1.5rem;">
    <h3>Product Details</h3>
    <p>Wireless Headphones - $79.99</p>
  </div>
  <div slot="back" style="padding: 1.5rem;">
    <h3>Specifications</h3>
    <p>Battery: 30 hours, Bluetooth 5.0, Weight: 250g</p>
  </div>
</snice-flip-card>

<button onclick="document.getElementById('controlled-card').flipTo('front')">Show Front</button>
<button onclick="document.getElementById('controlled-card').flipTo('back')">Show Back</button>
<button onclick="document.getElementById('controlled-card').flip()">Toggle</button>
```

### Flashcard Study Deck

```html
<snice-flip-card id="flashcard" direction="vertical" style="width: 350px; height: 250px;">
  <div slot="front" style="display: flex; align-items: center; justify-content: center; font-size: 1.25rem; padding: 2rem; text-align: center;">
    <strong>What does HTML stand for?</strong>
  </div>
  <div slot="back" style="display: flex; align-items: center; justify-content: center; font-size: 1.25rem; padding: 2rem; text-align: center;">
    HyperText Markup Language
  </div>
</snice-flip-card>

<script type="module">
  const card = document.getElementById('flashcard');
  card.addEventListener('flip-change', (e) => {
    console.log(`Now showing: ${e.detail.side}`);
  });
</script>
```

## Keyboard Navigation

When `click-to-flip` is enabled:
- **Enter** / **Space** -- Toggle the card flip

## Accessibility

- **Keyboard support**: When `click-to-flip` is enabled, pressing Enter or Space toggles the card
- **Focus management**: The card is focusable with `tabindex="0"` when click-to-flip is enabled
- **ARIA attributes**: The component uses `role="button"` and `aria-label` to convey state for assistive technologies
- **Visible content**: Both sides of the card accept arbitrary slotted content, allowing for accessible markup on each face
