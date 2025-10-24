# snice-progress

Progress indicator with linear or circular display.

## Properties

```typescript
value: number = 0;
max: number = 100;
variant: 'linear'|'circular' = 'linear';
indeterminate: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
color: string = '';
showLabel: boolean = false;
label: string = '';
striped: boolean = false;
animated: boolean = false;
```

## Usage

```html
<!-- Basic linear -->
<snice-progress value="50"></snice-progress>

<!-- Circular -->
<snice-progress variant="circular" value="75"></snice-progress>

<!-- Indeterminate (loading) -->
<snice-progress indeterminate></snice-progress>
<snice-progress variant="circular" indeterminate></snice-progress>

<!-- With label -->
<snice-progress value="60" show-label></snice-progress>
<snice-progress value="60" label="Uploading..."></snice-progress>

<!-- Custom max -->
<snice-progress value="3" max="10"></snice-progress>

<!-- Striped and animated -->
<snice-progress value="70" striped></snice-progress>
<snice-progress value="70" striped animated></snice-progress>

<!-- Custom color -->
<snice-progress value="80" color="#3b82f6"></snice-progress>

<!-- Sizes -->
<snice-progress value="50" size="small"></snice-progress>
<snice-progress value="50" size="medium"></snice-progress>
<snice-progress value="50" size="large"></snice-progress>

<!-- Dynamic updates -->
<snice-progress id="prog" value="0"></snice-progress>
<script>
const prog = document.querySelector('#prog');
let val = 0;
setInterval(() => {
  val = (val + 10) % 100;
  prog.value = val;
}, 500);
</script>
```

## Features

- Linear or circular variant
- Indeterminate mode for unknown progress
- Optional percentage label or custom text
- Striped and animated styles
- Custom color
- 3 sizes
- Reactive value updates
