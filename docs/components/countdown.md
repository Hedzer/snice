<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/countdown.md -->

# Countdown Component

A countdown timer to a target date with live-updating segments for days, hours, minutes, and seconds. Supports three visual variants (simple, flip, circular) and configurable display formats.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `target` | `string` | `''` | ISO date string for the target date/time to count down to |
| `format` | `'dhms' \| 'hms' \| 'ms'` | `'dhms'` | Display format: days+hours+minutes+seconds, hours+minutes+seconds, or minutes+seconds |
| `variant` | `'simple' \| 'flip' \| 'circular'` | `'simple'` | Visual style of the countdown display |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `countdown-complete` | `void` | Fired when the countdown reaches zero |
| `countdown-tick` | `{ days: number, hours: number, minutes: number, seconds: number, total: number }` | Fired every second with the current remaining time values |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-font-family` | Font family |
| `--snice-font-size-2xl` | Digit size |
| `--snice-font-size-xs` | Label size |
| `--snice-color-text` | Digit color |
| `--snice-color-text-secondary` | Label color |
| `--snice-color-text-tertiary` | Separator color |
| `--snice-color-background-element` | Flip variant card background |
| `--snice-color-border` | Flip variant border |
| `--snice-color-primary` | Circular variant ring color |
| `--snice-color-success` | Completed state color |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer countdown container |
| `segment` | Individual time segment (days, hours, etc.) |
| `value` | Digit value within a segment |
| `label` | Text label within a segment (e.g. "Days") |
| `separator` | Colon separator between segments |

```css
snice-countdown::part(value) {
  font-size: 3rem;
  font-weight: 800;
}

snice-countdown::part(label) {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

snice-countdown::part(separator) {
  color: #9ca3af;
}
```

## Basic Usage

```html
<snice-countdown target="2026-12-31T00:00:00Z"></snice-countdown>
```

```typescript
import 'snice/components/countdown/snice-countdown';
```

## Examples

### Simple Countdown

The default variant displays digits with labels underneath.

```html
<snice-countdown target="2026-12-31T00:00:00Z" format="dhms" variant="simple"></snice-countdown>
```

### Flip Variant

Use `variant="flip"` for a card-flip animation style inspired by airport departure boards.

```html
<snice-countdown target="2027-01-01T00:00:00Z" variant="flip" format="dhms"></snice-countdown>
```

### Circular Variant

Use `variant="circular"` to display each segment inside a circular progress ring.

```html
<snice-countdown target="2026-06-15T18:00:00Z" variant="circular" format="hms"></snice-countdown>
```

### Short Format

Use `format="ms"` for a countdown that only shows minutes and seconds.

```html
<snice-countdown target="2026-02-22T12:30:00Z" format="ms" variant="simple"></snice-countdown>
```

### Event Handling

Listen for completion and tick events to trigger actions.

```html
<snice-countdown id="sale-timer" target="2026-03-01T00:00:00Z" variant="flip"></snice-countdown>

<script type="module">
  import 'snice/components/countdown/snice-countdown';

  const countdown = document.getElementById('sale-timer');

  countdown.addEventListener('countdown-complete', () => {
    alert('The sale has ended!');
  });

  countdown.addEventListener('countdown-tick', (e) => {
    if (e.detail.total <= 60) {
      countdown.style.color = 'red';
    }
  });
</script>
```

## Accessibility

- Live updates every second with current values
- A `.complete` CSS class is added to the host element when the countdown finishes
- Each time segment has a descriptive label below the digits
- Segment labels provide context for screen readers
