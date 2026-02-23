# snice-progress

Progress indicator with linear or circular display.

## Properties

```typescript
value: number = 0;
max: number = 100;
variant: 'linear'|'circular' = 'linear';
indeterminate: boolean = false;
size: 'small'|'medium'|'large'|'xl'|'xxl'|'xxxl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info'|string = 'primary';
showLabel: boolean = false;       // attr: show-label
label: string = '';
striped: boolean = false;
animated: boolean = false;
thickness: number = 4;            // Stroke width for circular variant
```

## Methods

- `setProgress(value, max?)` - Set progress value
- `getPercentage()` - Get calculated percentage (0-100)

## Events

- `progress-change` → `{ value, max, percentage, indeterminate }`

## Usage

```html
<!-- Linear -->
<snice-progress value="50"></snice-progress>

<!-- Circular -->
<snice-progress variant="circular" value="75" size="xl"></snice-progress>

<!-- Indeterminate -->
<snice-progress indeterminate></snice-progress>

<!-- With label -->
<snice-progress value="60" show-label></snice-progress>
<snice-progress value="60" label="Uploading..."></snice-progress>

<!-- Striped and animated -->
<snice-progress value="70" striped animated></snice-progress>

<!-- Colors -->
<snice-progress value="80" color="success"></snice-progress>
<snice-progress value="80" color="#3b82f6"></snice-progress>

<!-- Custom max -->
<snice-progress value="3" max="10"></snice-progress>
```

```typescript
const prog = document.querySelector('snice-progress');
prog.setProgress(75);
prog.setProgress(3, 10);
console.log(prog.getPercentage());
```

## Features

- Linear and circular variants
- Indeterminate mode for unknown progress
- Optional percentage or custom label
- Striped and animated styles
- 5 semantic + custom CSS colors
- 6 sizes (small through xxxl)
