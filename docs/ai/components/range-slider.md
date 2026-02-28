# snice-range-slider

Two-handle slider for selecting a numeric range (min/max pair).

## Properties

```typescript
min: number = 0;
max: number = 100;
step: number = 1;
valueLow: number = 0;              // attr: value-low
valueHigh: number = 100;           // attr: value-high
disabled: boolean = false;
showTooltip: boolean = false;      // attr: show-tooltip
showLabels: boolean = false;       // attr: show-labels
orientation: 'horizontal'|'vertical' = 'horizontal';
```

## Events

- `range-change` -> `{ valueLow: number, valueHigh: number, component: SniceRangeSliderElement }`

## CSS Parts

- `track` - The slider track
- `range` - The highlighted range between thumbs
- `thumb-low` - Low value thumb
- `thumb-high` - High value thumb
- `label-min` - Min label text
- `label-max` - Max label text

## Usage

```html
<!-- Basic -->
<snice-range-slider value-low="20" value-high="80"></snice-range-slider>

<!-- With tooltips -->
<snice-range-slider show-tooltip value-low="25" value-high="75"></snice-range-slider>

<!-- With labels -->
<snice-range-slider show-labels min="0" max="1000"></snice-range-slider>

<!-- Custom step -->
<snice-range-slider min="0" max="100" step="5"></snice-range-slider>

<!-- Vertical -->
<snice-range-slider orientation="vertical" value-low="30" value-high="70"></snice-range-slider>

<!-- Disabled -->
<snice-range-slider disabled value-low="20" value-high="60"></snice-range-slider>
```
