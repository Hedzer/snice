<!-- AI: For a low-token version of this doc, use docs/ai/components/range-slider.md instead -->

# Range Slider
`<snice-range-slider>`

A two-handle slider for selecting a numeric range, with a highlighted track between the two thumbs.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/range-slider/snice-range-slider';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-range-slider.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `valueLow` (attr: `value-low`) | `number` | `0` | Low handle position |
| `valueHigh` (attr: `value-high`) | `number` | `100` | High handle position |
| `disabled` | `boolean` | `false` | Disables the slider |
| `showTooltip` (attr: `show-tooltip`) | `boolean` | `false` | Show value tooltip on hover/drag |
| `showLabels` (attr: `show-labels`) | `boolean` | `false` | Show min/max labels |
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

Use the `min`, `max`, and `step` attributes to define the slider range.

```html
<snice-range-slider min="0" max="1000" step="50" value-low="200" value-high="800"></snice-range-slider>
```

### Tooltips

Set the `show-tooltip` attribute to display the current value on hover and drag.

```html
<snice-range-slider show-tooltip value-low="25" value-high="75"></snice-range-slider>
```

### Min/Max Labels

Set the `show-labels` attribute to display the range boundaries below the track.

```html
<snice-range-slider show-labels min="0" max="500" value-low="100" value-high="400"></snice-range-slider>
```

### Vertical Orientation

Set the `orientation` attribute to `"vertical"` for a vertical slider.

```html
<snice-range-slider orientation="vertical" value-low="30" value-high="70"></snice-range-slider>
```

### Disabled

Set the `disabled` attribute to prevent user interaction.

```html
<snice-range-slider disabled value-low="20" value-high="60"></snice-range-slider>
```

### Event Handling

Listen to the `range-change` event to react to value changes.

```html
<snice-range-slider id="price-range" min="0" max="500" value-low="50" value-high="300"></snice-range-slider>

<script>
  document.getElementById('price-range').addEventListener('range-change', (e) => {
    console.log(`Price range: $${e.detail.valueLow} - $${e.detail.valueHigh}`);
  });
</script>
```
