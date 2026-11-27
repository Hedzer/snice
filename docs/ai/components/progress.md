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

Linear variant:

- `base` - Outer progress container with `role="progressbar"`
- `base-with-label` - Added to `base` when `show-label` is set
- `base-indeterminate` - Added to `base` while indeterminate
- `base-empty` - Added to `base` when determinate progress is `0%`
- `base-complete` - Added to `base` when determinate progress reaches `100%`
- `bar` - The progress bar fill
- `bar-indeterminate` - Added to `bar` while indeterminate
- `bar-empty` - Added to `bar` when determinate progress is `0%`
- `bar-complete` - Added to `bar` when determinate progress reaches `100%`
- `wave` - Material 3 Expressive bounded wavy linear progress indicator helper (`<svg>`)
- `label` - Percentage or custom label text

Circular variant:

- `base` - Outer progress container with `role="progressbar"`
- `base-indeterminate` - Added to `base` while indeterminate
- `circle` - The SVG element
- `circle-bg` - Background circle stroke
- `circle-bar` - Foreground progress arc
- `circle-bar-indeterminate` - Added to `circle-bar` while indeterminate
- `label` - Percentage or custom label text

## CSS Custom Properties

```css
--progress-height: 0.5rem;
--progress-radius: 4px;
--progress-bg: color-mix(in srgb, var(--snice-color-border, rgb(226 226 226)) 90%, white); /* track; lightened past the border token so the default fill/track pair clears WCAG 1.4.11's 3:1 */
--progress-color: var(--snice-color-primary, rgb(37 99 235));
--progress-track-opacity: 0.2;  /* circular track ring; raise to 1 on dark surfaces — 0.2 of any color vanishes on near-black */
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
