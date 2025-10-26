# Split Pane Component

Resizable split pane layout with horizontal or vertical orientation.

## Basic Usage

```html
<snice-split-pane style="height: 400px;">
  <div slot="primary">Left pane content</div>
  <div slot="secondary">Right pane content</div>
</snice-split-pane>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Split direction |
| `primarySize` | `number` | `50` | Primary pane size (%) |
| `minPrimarySize` | `number` | `10` | Min primary size (%) |
| `minSecondarySize` | `number` | `10` | Min secondary size (%) |
| `snapSize` | `number` | `0` | Snap interval (%, 0 = none) |
| `disabled` | `boolean` | `false` | Disable resizing |

## Methods

### `getPrimarySize(): number`
Get current primary pane size percentage.

```javascript
const size = splitPane.getPrimarySize(); // 50
```

### `getSecondarySize(): number`
Get current secondary pane size percentage.

```javascript
const size = splitPane.getSecondarySize(); // 50
```

### `setPrimarySize(size: number): void`
Set primary pane size (respects min sizes).

```javascript
splitPane.setPrimarySize(30); // Set to 30%
```

### `reset(): void`
Reset to 50/50 split.

```javascript
splitPane.reset();
```

## Events

### `@snice/resize`
Dispatched when pane is resized.

```javascript
splitPane.addEventListener('@snice/resize', (e) => {
  console.log('Primary:', e.detail.primarySize);
  console.log('Secondary:', e.detail.secondarySize);
});
```

**Detail:** `{ primarySize: number, secondarySize: number, splitPane: SniceResizeElement }`

## Examples

### Horizontal Split

```html
<snice-split-pane style="height: 400px;">
  <div slot="primary">Left pane</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>
```

### Vertical Split

```html
<snice-split-pane direction="vertical" style="height: 400px;">
  <div slot="primary">Top pane</div>
  <div slot="secondary">Bottom pane</div>
</snice-split-pane>
```

### Custom Initial Size

```html
<snice-split-pane primary-size="30" style="height: 400px;">
  <div slot="primary">30% width</div>
  <div slot="secondary">70% width</div>
</snice-split-pane>
```

### With Minimum Sizes

```html
<snice-split-pane
  min-primary-size="20"
  min-secondary-size="30"
  style="height: 400px;">
  <div slot="primary">Min 20%</div>
  <div slot="secondary">Min 30%</div>
</snice-split-pane>
```

### With Snap

```html
<!-- Snaps to 10% increments -->
<snice-split-pane snap-size="10" style="height: 400px;">
  <div slot="primary">Snaps to 10, 20, 30...</div>
  <div slot="secondary">Right pane</div>
</snice-split-pane>
```

### Disabled

```html
<snice-split-pane disabled primary-size="40" style="height: 400px;">
  <div slot="primary">Fixed 40%</div>
  <div slot="secondary">Fixed 60%</div>
</snice-split-pane>
```

### Programmatic Control

```html
<button id="set-30">30%</button>
<button id="set-70">70%</button>
<button id="reset">Reset</button>

<snice-split-pane id="my-split" style="height: 400px;">
  <div slot="primary">Primary</div>
  <div slot="secondary">Secondary</div>
</snice-split-pane>

<script>
  const split = document.getElementById('my-split');

  document.getElementById('set-30').addEventListener('click', () => {
    split.setPrimarySize(30);
  });

  document.getElementById('set-70').addEventListener('click', () => {
    split.setPrimarySize(70);
  });

  document.getElementById('reset').addEventListener('click', () => {
    split.reset();
  });
</script>
```

### Nested Split Panes

```html
<snice-split-pane style="height: 500px;">
  <div slot="primary">
    <snice-split-pane direction="vertical" style="height: 100%;">
      <div slot="primary">Top Left</div>
      <div slot="secondary">Bottom Left</div>
    </snice-split-pane>
  </div>
  <div slot="secondary">Right Pane</div>
</snice-split-pane>
```

### File Explorer Layout

```html
<snice-split-pane primary-size="25" style="height: 600px;">
  <!-- Sidebar -->
  <div slot="primary" style="padding: 10px; background: #f5f5f5;">
    <h3>Files</h3>
    <ul>
      <li>index.html</li>
      <li>styles.css</li>
      <li>script.js</li>
    </ul>
  </div>

  <!-- Main content -->
  <div slot="secondary" style="padding: 20px;">
    <h2>Content Area</h2>
    <p>Main content goes here...</p>
  </div>
</snice-split-pane>
```

### Code Editor Layout

```html
<snice-split-pane primary-size="20" style="height: 600px;">
  <!-- File tree -->
  <div slot="primary" style="background: #1e1e1e; color: #d4d4d4; padding: 10px;">
    <div>📁 src</div>
    <div style="margin-left: 15px;">📄 main.ts</div>
  </div>

  <!-- Editor + Console -->
  <div slot="secondary" style="height: 100%;">
    <snice-split-pane direction="vertical" primary-size="70">
      <!-- Editor -->
      <div slot="primary" style="background: #1e1e1e; color: #d4d4d4; padding: 10px; font-family: monospace;">
        <code>console.log('Hello');</code>
      </div>

      <!-- Console -->
      <div slot="secondary" style="background: #252526; color: #d4d4d4; padding: 10px; font-family: monospace;">
        $ npm start
      </div>
    </snice-split-pane>
  </div>
</snice-split-pane>
```

### Dashboard Layout

```html
<snice-split-pane direction="vertical" primary-size="60" style="height: 600px;">
  <!-- Charts -->
  <div slot="primary">
    <snice-split-pane>
      <div slot="primary">Chart 1</div>
      <div slot="secondary">Chart 2</div>
    </snice-split-pane>
  </div>

  <!-- Table -->
  <div slot="secondary" style="padding: 20px;">
    <table style="width: 100%;">
      <tr><th>Name</th><th>Value</th></tr>
      <tr><td>Item 1</td><td>100</td></tr>
    </table>
  </div>
</snice-split-pane>
```

### Email Client Layout

```html
<snice-split-pane primary-size="30" style="height: 600px;">
  <!-- Email list -->
  <div slot="primary" style="background: #f5f5f5; padding: 10px; overflow: auto;">
    <div style="padding: 10px; background: white; margin-bottom: 5px; border-radius: 4px;">
      <strong>Meeting Today</strong>
      <div style="font-size: 12px; color: #666;">John Doe</div>
    </div>
    <div style="padding: 10px; background: white; margin-bottom: 5px; border-radius: 4px;">
      <strong>Project Update</strong>
      <div style="font-size: 12px; color: #666;">Jane Smith</div>
    </div>
  </div>

  <!-- Email content -->
  <div slot="secondary" style="padding: 20px; overflow: auto;">
    <h2>Meeting Today</h2>
    <div style="color: #666; margin-bottom: 10px;">From: John Doe</div>
    <p>Let's meet at 2pm to discuss the project...</p>
  </div>
</snice-split-pane>
```

### Responsive Sizes

```html
<snice-split-pane id="responsive-split" style="height: 400px;">
  <div slot="primary">Primary</div>
  <div slot="secondary">Secondary</div>
</snice-split-pane>

<script>
  const split = document.getElementById('responsive-split');

  function updateSize() {
    if (window.innerWidth < 768) {
      split.setPrimarySize(100); // Stack on mobile
    } else {
      split.setPrimarySize(50); // Side by side on desktop
    }
  }

  window.addEventListener('resize', updateSize);
  updateSize();
</script>
```

## Styling

The component exposes CSS custom properties for theming:

```css
snice-split-pane {
  --snice-border-color: #e0e0e0;
  --snice-color-primary: #2196f3;
  --snice-bg-secondary: #f5f5f5;
}
```

## Accessibility

- Drag handle is keyboard accessible
- Mouse and touch support for resizing
- Respects minimum sizes for usability
- Visual feedback on hover and drag

## Browser Support

- Modern browsers with Custom Elements v1 support
- Mouse event handling for drag
- Percentage-based sizing for responsiveness
