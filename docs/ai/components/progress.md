# snice-progress

Progress indicator with linear or circular display, indeterminate mode, striped/animated styles, and labels.

## Properties

```typescript
value: number = 0;
max: number = 100;
variant: 'linear'|'circular' = 'linear';
size: 'small'|'medium'|'large'|'xl'|'xxl'|'xxxl' = 'medium';
color: 'primary'|'success'|'warning'|'error'|'info'|string = 'primary';
indeterminate: boolean = false;
showLabel: boolean = false;                          // attr: show-label
label: string = '';                                  // Custom label text
striped: boolean = false;
animated: boolean = false;
thickness: number = 4;                               // Circular stroke width
```

## Methods

- `setProgress(value: number, max?: number)` - Set progress value
- `getPercentage()` - Get calculated percentage (0-100)

## Events

- `progress-change` → `{ value, max, percentage, indeterminate }` - Value changed

## CSS Parts

Linear: `base`, `bar`, `label`
Circular: `base`, `circle`, `circle-bg`, `circle-bar`, `label`

## CSS Custom Properties

```css
--progress-height: 0.5rem;
--progress-radius: 4px;
--progress-bg: var(--snice-color-border, rgb(226 226 226));
--progress-color: var(--snice-color-primary, rgb(37 99 235));
--progress-animation-duration: 1.5s;
```

## Basic Usage

```html
<snice-progress value="50"></snice-progress>
<snice-progress variant="circular" value="75" size="xl"></snice-progress>
<snice-progress indeterminate></snice-progress>
<snice-progress value="60" show-label></snice-progress>
<snice-progress value="70" striped animated></snice-progress>
<snice-progress value="80" color="success"></snice-progress>
```

```typescript
import 'snice/components/progress/snice-progress';
progress.setProgress(75);
console.log(progress.getPercentage());
```

## Accessibility

- Uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Label text used as `aria-label`
