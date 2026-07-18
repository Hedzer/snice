# snice-range-slider

Two-handle slider for selecting a numeric range (min/max pair).

## Properties

```typescript
min: number = 0;
max: number = 100;
step: number = 1;
valueLow: number = 0;              // live property only
valueHigh: number = 100;           // live property only
defaultValueLow: number = 0;       // attr: value-low
defaultValueHigh: number = 100;    // attr: value-high
disabled: boolean = false;
showTooltip: boolean = false;      // attr: show-tooltip
showLabels: boolean = false;       // attr: show-labels
orientation: 'horizontal'|'vertical' = 'horizontal';
name: string = '';
readonly type: 'range';
readonly form: HTMLFormElement | null;
readonly validity: ValidityState;
readonly validationMessage: string;
readonly willValidate: boolean;
readonly labels: NodeList | null;
```

## Value and form lifecycle

- Live endpoints are independent from authored `value-low`/`value-high` defaults. They are ordered, clamped, and snapped to a `min`-based step lattice; invalid steps fall back to `1`.
- Each pristine endpoint follows its default; interaction, restore, or assignment dirties it.
- Form/restoration state is `"low,high"`; reset silently restores both latest defaults as one clamped ordered range.
- Repeated reset, reconnect, form moves, and disabled fieldsets preserve authored state.
- A named range contributes one `"low,high"` string to `FormData` and is listed in `form.elements`; explicit `form="id"`, labels, reset, restore, and fieldsets are supported.
- Normalization leaves no residual min/max/step error. `setCustomValidity(message)` establishes `customError`, styles/names both thumbs as invalid, and blocks validated submission; pass `''` to clear it.
- Disabled ranges are omitted and barred. Custom errors survive the temporary barred state and reappear when re-enabled.

## Methods

- `focus()` / `blur()` - Focus the low thumb / blur both thumbs
- `checkValidity()` / `reportValidity()` - Check/report current validity
- `setCustomValidity(message)` - Set or clear `customError`

## Events

- `range-change` → `{ valueLow: number, valueHigh: number, component: SniceRangeSliderElement }`

## CSS Parts

- `track` - The slider track
- `range` - Highlighted range between thumbs
- `thumb-low` - Low value thumb
- `thumb-high` - High value thumb
- `label-min` - Min label text
- `label-max` - Max label text

## Basic Usage

```html
<snice-range-slider value-low="20" value-high="80"></snice-range-slider>

<!-- With tooltips and labels -->
<snice-range-slider show-tooltip show-labels min="0" max="1000" value-low="200" value-high="800"></snice-range-slider>

<!-- Custom step -->
<snice-range-slider min="0" max="100" step="5"></snice-range-slider>

<!-- Vertical -->
<snice-range-slider orientation="vertical" value-low="30" value-high="70"></snice-range-slider>
```

```typescript
slider.addEventListener('range-change', (e) => {
  console.log(e.detail.valueLow, e.detail.valueHigh);
});
```

## Keyboard Navigation

- Arrow keys adjust focused thumb by step
- Home/End move to min/max bounds
- Each thumb independently focusable

## Accessibility

- `role="slider"` on each thumb with aria-valuenow/min/max
- Focus ring on keyboard navigation
- Track click moves nearest thumb
- Associated labels name the thumbs as `<label> minimum` and `<label> maximum`
