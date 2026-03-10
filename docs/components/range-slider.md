<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/range-slider.md -->

# Range Slider

A two-handle slider for selecting a numeric range, with a highlighted track between the two thumbs.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `valueLow` (attr: `value-low`) | `number` | `0` | Low handle value |
| `valueHigh` (attr: `value-high`) | `number` | `100` | High handle value |
| `disabled` | `boolean` | `false` | Disables the slider |
| `showTooltip` (attr: `show-tooltip`) | `boolean` | `false` | Show value tooltip on hover/drag |
| `showLabels` (attr: `show-labels`) | `boolean` | `false` | Show min/max labels below the track |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Slider orientation |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `range-change` | `{ valueLow: number, valueHigh: number, component: SniceRangeSliderElement }` | Fired when either handle value changes |

## CSS Parts

| Part | Description |
|------|-------------|
| `track` | The slider track |
| `range` | The highlighted area between the two thumbs |
| `thumb-low` | The low-value thumb |
| `thumb-high` | The high-value thumb |
| `label-min` | The minimum label text |
| `label-max` | The maximum label text |

## Basic Usage

```typescript
import 'snice/components/range-slider/snice-range-slider';
```

```html
<snice-range-slider value-low="20" value-high="80"></snice-range-slider>
```

## Examples

### Custom Range and Step

Use `min`, `max`, and `step` to define the slider range and increment.

```html
<snice-range-slider min="0" max="1000" step="50" value-low="200" value-high="800"></snice-range-slider>
```

### Tooltips

Set `show-tooltip` to display the current value on hover and drag.

```html
<snice-range-slider show-tooltip value-low="25" value-high="75"></snice-range-slider>
```

### Min/Max Labels

Set `show-labels` to display the range boundaries below the track.

```html
<snice-range-slider show-labels min="0" max="500" value-low="100" value-high="400"></snice-range-slider>
```

### Vertical Orientation

Set `orientation="vertical"` for a vertical slider.

```html
<snice-range-slider orientation="vertical" value-low="30" value-high="70"></snice-range-slider>
```

### Disabled

Set `disabled` to prevent user interaction.

```html
<snice-range-slider disabled value-low="20" value-high="60"></snice-range-slider>
```

### Event Handling

Listen to `range-change` to react to value changes.

```typescript
slider.addEventListener('range-change', (e) => {
  console.log(`Range: ${e.detail.valueLow} - ${e.detail.valueHigh}`);
});
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowLeft` / `ArrowDown` | Decrease focused thumb by one step |
| `ArrowRight` / `ArrowUp` | Increase focused thumb by one step |
| `Home` | Move focused thumb to minimum (low thumb) or to low value (high thumb) |
| `End` | Move focused thumb to high value (low thumb) or to maximum (high thumb) |

Each thumb is independently focusable and constrained so low cannot exceed high.

## Accessibility

- Each thumb has `role="slider"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`
- Low thumb labeled "Range minimum", high thumb labeled "Range maximum"
- Focus ring shown on keyboard navigation
- Supports both mouse and touch interaction
- Track click moves the nearest thumb
