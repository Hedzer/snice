# snice-slider

Range slider for numeric value selection.

## Properties

```typescript
value: number = 0;
min: number = 0;
max: number = 100;
step: number = 1;
variant: 'default'|'primary'|'success'|'warning'|'danger' = 'default';
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
readonly: boolean = false;
label: string = '';
helperText: string = '';
errorText: string = '';
name: string = '';
showValue: boolean = false;
showTicks: boolean = false;
vertical: boolean = false;
loading: boolean = false;
```

## Methods

- `focus()` - Focus slider thumb
- `blur()` - Blur slider thumb

## Events

- `slider-input` - {value, slider} - During drag
- `slider-change` - {value, slider} - After drag complete

## Usage

```html
<!-- Basic -->
<snice-slider label="Volume" min="0" max="100"></snice-slider>

<!-- With value display -->
<snice-slider show-value value="50"></snice-slider>

<!-- With ticks -->
<snice-slider show-ticks min="0" max="10" step="1"></snice-slider>

<!-- Variants -->
<snice-slider variant="primary"></snice-slider>
<snice-slider variant="success"></snice-slider>
<snice-slider variant="warning"></snice-slider>
<snice-slider variant="danger"></snice-slider>

<!-- Sizes -->
<snice-slider size="small"></snice-slider>
<snice-slider size="medium"></snice-slider>
<snice-slider size="large"></snice-slider>

<!-- Vertical -->
<snice-slider vertical></snice-slider>

<!-- Step increments -->
<snice-slider min="0" max="100" step="5" value="50"></snice-slider>

<!-- Events -->
<snice-slider id="slider"></snice-slider>
<script>
const slider = document.querySelector('#slider');
slider.addEventListener('slider-change', (e) => {
  console.log('Value:', e.detail.value);
});
</script>
```

## Features

- Form-associated custom element
- Mouse and touch support
- Keyboard navigation (arrows, home/end, page up/down)
- 5 color variants
- 3 sizes
- Vertical orientation
- Optional value display
- Optional tick marks
- Step increments
- Accessible
