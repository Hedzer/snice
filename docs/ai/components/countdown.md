# snice-countdown

Countdown timer to a target date with multiple visual variants and display formats.

## Properties

```typescript
target: string = '';                                  // ISO date string
format: 'dhms'|'hms'|'ms' = 'dhms';                 // Display segments
variant: 'simple'|'flip'|'circular' = 'simple';     // Visual style
```

## Events

- `countdown-complete` -> `void` - Countdown reached zero
- `countdown-tick` -> `{ days, hours, minutes, seconds, total }` - Fires every second

## CSS Custom Properties

```css
--snice-font-family
--snice-font-size-2xl           /* Digit size */
--snice-font-size-xs            /* Label size */
--snice-color-text              /* Digit color */
--snice-color-text-secondary    /* Label color */
--snice-color-text-tertiary     /* Separator color */
--snice-color-background-element /* Flip variant card bg */
--snice-color-border            /* Flip variant border */
--snice-color-primary           /* Circular variant ring color */
--snice-color-success           /* Complete state color */
```

## CSS Parts

- `base` - Outer countdown container
- `segment` - Individual time segment (days, hours, etc.)
- `value` - Digit value within a segment
- `label` - Text label within a segment (e.g. "Days")
- `separator` - Colon separator between segments

## Basic Usage

```html
<snice-countdown target="2026-12-31T00:00:00Z" variant="flip" format="dhms"></snice-countdown>
```

```typescript
import 'snice/components/countdown/snice-countdown';

cd.addEventListener('countdown-complete', () => alert('Done!'));
cd.addEventListener('countdown-tick', (e) => console.log(e.detail.total));
```

## Accessibility

- Live updates every second
- `.complete` class added to host on finish
- Descriptive labels on each segment
