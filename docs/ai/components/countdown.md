# snice-countdown

Countdown timer to a target date with multiple display formats and visual variants.

## Properties

```ts
target: string = ''                           // attr: target — ISO date string to count down to
format: CountdownFormat = 'dhms'              // attr: format — 'dhms' | 'hms' | 'ms'
variant: CountdownVariant = 'simple'          // attr: variant — 'simple' | 'flip' | 'circular'
```

## Events

- `countdown-complete` → `void` - Fires when countdown reaches zero
- `countdown-tick` → `{ days, hours, minutes, seconds, total }` - Fires every second

## CSS Custom Properties

Uses standard snice design tokens:

```css
--snice-font-family
--snice-font-size-2xl      /* Digit size */
--snice-font-size-xs       /* Label size */
--snice-color-text         /* Digit color */
--snice-color-text-secondary /* Label color */
--snice-color-text-tertiary  /* Separator color */
--snice-color-background-element /* Flip variant card bg */
--snice-color-border       /* Flip variant border */
--snice-color-primary      /* Circular variant ring color */
--snice-color-success      /* Complete state color */
```

**CSS Parts:**
- `base` - Outer countdown container
- `segment` - Individual time segment (days, hours, etc.)
- `value` - Digit value within a segment
- `label` - Text label within a segment (e.g. "Days")
- `separator` - Colon separator between segments

## Behavior

- Ticks every second, auto-stops on completion
- Adds `.complete` class to host when finished
- `format` controls which segments display:
  - `dhms`: Days, Hours, Min, Sec
  - `hms`: Hours, Min, Sec
  - `ms`: Min, Sec

## Usage

```html
<snice-countdown target="2026-12-31T00:00:00Z" format="dhms" variant="flip"></snice-countdown>
```

```typescript
cd.addEventListener('countdown-complete', () => alert('Done!'));
cd.addEventListener('countdown-tick', e => console.log(e.detail.total));
```
