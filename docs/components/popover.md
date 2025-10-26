# Popover Component

Display floating content positioned relative to a target element.

## Basic Usage

```html
<button id="my-button">Click me</button>
<snice-popover target-selector="#my-button">
  Popover content goes here
</snice-popover>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Popover visibility |
| `placement` | `PopoverPlacement` | `'top'` | Popover position |
| `trigger` | `'click' \| 'hover' \| 'focus' \| 'manual'` | `'click'` | Open trigger |
| `distance` | `number` | `8` | Distance from target (px) |
| `showArrow` | `boolean` | `true` | Show arrow indicator |
| `closeOnClickOutside` | `boolean` | `true` | Close on outside click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `hoverDelay` | `number` | `200` | Hover delay (ms) |
| `targetSelector` | `string` | `''` | Target element selector |

## Placement Options

`'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'`

## Methods

### `show(): void`
Show the popover.

```javascript
popover.show();
```

### `hide(): void`
Hide the popover.

```javascript
popover.hide();
```

### `toggle(): void`
Toggle popover visibility.

```javascript
popover.toggle();
```

### `updatePosition(): void`
Recalculate and update popover position.

```javascript
popover.updatePosition();
```

## Events

### `@snice/popover-show`
Dispatched when popover is shown.

```javascript
popover.addEventListener('@snice/popover-show', (e) => {
  console.log('Popover shown');
});
```

### `@snice/popover-hide`
Dispatched when popover is hidden.

```javascript
popover.addEventListener('@snice/popover-hide', (e) => {
  console.log('Popover hidden');
});
```

## Examples

### Click Trigger (Default)

```html
<button id="click-btn">Click me</button>
<snice-popover target-selector="#click-btn">
  Popover content
</snice-popover>
```

### Hover Trigger

```html
<button id="hover-btn">Hover me</button>
<snice-popover target-selector="#hover-btn" trigger="hover">
  Appears on hover
</snice-popover>
```

### Focus Trigger

```html
<input id="input" type="text" placeholder="Focus me">
<snice-popover target-selector="#input" trigger="focus">
  Help text appears on focus
</snice-popover>
```

### Manual Control

```html
<button id="open-btn">Open</button>
<button id="close-btn">Close</button>
<snice-popover id="manual-popover" trigger="manual">
  Manually controlled
</snice-popover>

<script>
  const popover = document.getElementById('manual-popover');
  document.getElementById('open-btn').addEventListener('click', () => {
    popover.show();
  });
  document.getElementById('close-btn').addEventListener('click', () => {
    popover.hide();
  });
</script>
```

### Different Placements

```html
<!-- Top -->
<button id="top-btn">Top</button>
<snice-popover target-selector="#top-btn" placement="top">Top</snice-popover>

<!-- Bottom -->
<button id="bottom-btn">Bottom</button>
<snice-popover target-selector="#bottom-btn" placement="bottom">Bottom</snice-popover>

<!-- Left -->
<button id="left-btn">Left</button>
<snice-popover target-selector="#left-btn" placement="left">Left</snice-popover>

<!-- Right -->
<button id="right-btn">Right</button>
<snice-popover target-selector="#right-btn" placement="right">Right</snice-popover>
```

### Start/End Alignment

```html
<!-- Top Start -->
<button id="ts-btn">Top Start</button>
<snice-popover target-selector="#ts-btn" placement="top-start">
  Aligned to start
</snice-popover>

<!-- Top End -->
<button id="te-btn">Top End</button>
<snice-popover target-selector="#te-btn" placement="top-end">
  Aligned to end
</snice-popover>
```

### No Arrow

```html
<button id="no-arrow-btn">No Arrow</button>
<snice-popover target-selector="#no-arrow-btn" show-arrow="false">
  No arrow indicator
</snice-popover>
```

### Custom Distance

```html
<button id="distance-btn">Far away</button>
<snice-popover target-selector="#distance-btn" distance="20">
  20px from target
</snice-popover>
```

### Rich Content

```html
<button id="rich-btn">User Info</button>
<snice-popover target-selector="#rich-btn" placement="bottom">
  <div style="max-width: 250px;">
    <h3 style="margin: 0 0 8px;">John Doe</h3>
    <p style="margin: 0 0 8px; color: #666;">
      Senior Developer at Example Corp
    </p>
    <button>View Profile</button>
  </div>
</snice-popover>
```

### Custom Hover Delay

```html
<button id="delay-btn">Hover (500ms delay)</button>
<snice-popover
  target-selector="#delay-btn"
  trigger="hover"
  hover-delay="500">
  Delayed appearance
</snice-popover>
```

### Disable Click Outside Close

```html
<button id="no-close-btn">Click me</button>
<snice-popover
  target-selector="#no-close-btn"
  close-on-click-outside="false">
  Must click button again to close
</snice-popover>
```

### Disable Escape Key Close

```html
<button id="no-escape-btn">Click me</button>
<snice-popover
  target-selector="#no-escape-btn"
  close-on-escape="false">
  Escape key won't close this
</snice-popover>
```

### With Form

```html
<button id="form-btn">Edit</button>
<snice-popover target-selector="#form-btn" placement="bottom-start">
  <form style="padding: 8px; min-width: 200px;">
    <label>Name:</label>
    <input type="text" style="width: 100%; padding: 4px; margin-top: 4px;">
    <button type="submit" style="margin-top: 8px;">Save</button>
  </form>
</snice-popover>
```

### With List

```html
<button id="menu-btn">Options</button>
<snice-popover target-selector="#menu-btn" placement="bottom-start">
  <div style="min-width: 150px;">
    <div style="padding: 8px; cursor: pointer;">Edit</div>
    <div style="padding: 8px; cursor: pointer;">Duplicate</div>
    <div style="padding: 8px; cursor: pointer; color: red;">Delete</div>
  </div>
</snice-popover>
```

### Tooltip Style

```html
<span id="tooltip-target">Hover for info</span>
<snice-popover
  target-selector="#tooltip-target"
  trigger="hover"
  hover-delay="0"
  placement="top">
  This is tooltip-like popover
</snice-popover>
```

### Help Text

```html
<label>
  Password
  <span id="help-icon" style="cursor: help;">ⓘ</span>
</label>
<input type="password">
<snice-popover
  target-selector="#help-icon"
  trigger="hover"
  placement="right">
  Password must be at least 8 characters with uppercase, lowercase, and numbers.
</snice-popover>
```

### Confirmation Dialog

```html
<button id="delete-btn">Delete</button>
<snice-popover id="confirm-popover" trigger="manual" placement="top">
  <div style="padding: 8px;">
    <p style="margin: 0 0 8px;">Are you sure?</p>
    <button id="confirm-yes" style="background: #f44336;">Yes</button>
    <button id="confirm-no" style="background: #9e9e9e; margin-left: 8px;">No</button>
  </div>
</snice-popover>

<script>
  const deleteBtn = document.getElementById('delete-btn');
  const confirmPopover = document.getElementById('confirm-popover');

  deleteBtn.addEventListener('click', () => {
    confirmPopover.show();
  });

  document.getElementById('confirm-yes').addEventListener('click', () => {
    console.log('Deleted!');
    confirmPopover.hide();
  });

  document.getElementById('confirm-no').addEventListener('click', () => {
    confirmPopover.hide();
  });
</script>
```

## Accessibility

- Popovers automatically update position on scroll/resize
- Close on Escape key (configurable)
- Focus management for keyboard navigation
- Hover trigger includes delay to prevent accidental triggers
- Click outside to close (configurable)

## Browser Support

- Modern browsers with Custom Elements v1 support
- Uses fixed positioning for overlay
- Automatic position updates on scroll/resize
- Arrow indicators use CSS borders
