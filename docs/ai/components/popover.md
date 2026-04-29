# snice-popover

Click-triggered, interactive panel anchored to a trigger element.

Distinct from `<snice-tooltip>` (hover-only, non-interactive text/HTML) and from `<snice-menu>` (popover specialised for menu items + keyboard nav). Use `<snice-popover>` for arbitrary interactive content (filter forms, sort builders, color pickers, etc.).

## Properties

```ts
open: boolean = false;
placement: 'top'|'top-start'|'top-end'|'bottom'|'bottom-start'|'bottom-end'|'left'|'left-start'|'left-end'|'right'|'right-start'|'right-end' = 'bottom-end';
distance: number = 6;                        // px gap from trigger
noOutsideDismiss: boolean = false;           // attr: no-outside-dismiss
noEscapeDismiss: boolean = false;            // attr: no-escape-dismiss
```

## Methods

- `show()` → Open the panel
- `hide()` → Close the panel
- `toggle()` → Toggle open/closed

## Events

- `popover-open` → `{ popover }`
- `popover-close` → `{ popover }`

## Slots

- `trigger` - The element that toggles the panel (required)
- `(default)` - Panel content

## CSS Custom Properties

- `--snice-popover-bg` - Panel background
- `--snice-popover-text` - Panel text color
- `--snice-popover-border` - Panel border color
- `--snice-popover-shadow` - Panel shadow
- `--snice-popover-radius` - Panel corner radius
- `--snice-popover-padding` - Panel inner padding
- `--snice-popover-min-width` - Panel min width (default 12rem)
- `--snice-popover-max-width` - Panel max width (default 28rem)

## CSS Parts

- `trigger` - Trigger wrapper
- `panel` - Floating panel
- `content` - Inner content wrapper

## Basic Usage

```ts
import 'snice/components/popover/snice-popover';
```

```html
<snice-popover placement="bottom-start" distance="8">
  <snice-button slot="trigger">Open</snice-button>
  <div>
    <h4>Panel content</h4>
    <snice-input placeholder="Anything"></snice-input>
  </div>
</snice-popover>
```

## Examples

### Programmatic open

```ts
const pop = document.querySelector('snice-popover');
pop.show();
pop.addEventListener('popover-close', () => console.log('closed'));
```

### No-dismiss (require explicit close)

```html
<snice-popover no-outside-dismiss no-escape-dismiss>
  <button slot="trigger">Open</button>
  <div>...</div>
</snice-popover>
```

## Accessibility

- Trigger is `role="button"` with `aria-haspopup="dialog"` and reflective `aria-expanded`.
- Panel is `role="dialog"`, opens via the platform `popover="manual"` API.
- Outside-click and Escape close by default; opt out with `no-outside-dismiss` / `no-escape-dismiss`.
- Focus is restored to the trigger when the panel closes via Escape.
