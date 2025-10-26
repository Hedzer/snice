# Draw Component

Canvas drawing with smooth lazy-brush technology.

## Basic Usage

```html
<snice-draw id="draw" width="800" height="600"></snice-draw>

<script>
  const draw = document.getElementById('draw');

  // Clear canvas
  draw.clear();

  // Undo/redo
  draw.undo();
  draw.redo();

  // Download
  draw.download('my-drawing.png');
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `tool` | `DrawTool` | `'pen'` | Drawing tool |
| `color` | `string` | `'#000000'` | Brush color |
| `strokeWidth` | `number` | `2` | Brush width |
| `backgroundColor` | `string` | `'#ffffff'` | Canvas background |
| `lazy` | `boolean` | `true` | Enable lazy brush |
| `lazyRadius` | `number` | `30` | Lazy brush radius |
| `smoothing` | `number` | `0.5` | Line smoothing (0-1) |
| `disabled` | `boolean` | `false` | Disable drawing |

## Tools

- `'pen'` - Draw with brush
- `'eraser'` - Erase strokes
- `'line'` - Draw straight lines
- `'rectangle'` - Draw rectangles
- `'circle'` - Draw circles
- `'text'` - Add text

## Methods

### `clear(): void`
Clear the entire canvas.

### `undo(): void`
Undo last stroke.

### `redo(): void`
Redo previously undone stroke.

### `toDataURL(type?, quality?): string`
Export as data URL.

### `toBlob(type?, quality?): Promise<Blob>`
Export as Blob.

### `download(filename?): void`
Download drawing.

### `loadImage(url): Promise<void>`
Load image onto canvas.

### `getStrokes(): DrawStroke[]`
Get all strokes.

### `setStrokes(strokes): void`
Set strokes (for loading saved drawings).

## Events

- `@snice/draw-start` - Drawing started
- `@snice/draw-end` - Drawing ended (stroke complete)
- `@snice/draw-clear` - Canvas cleared
- `@snice/draw-undo` - Undo performed
- `@snice/draw-redo` - Redo performed

## Examples

### Basic Drawing

```html
<snice-draw width="800" height="600"></snice-draw>
```

### Custom Colors

```javascript
const draw = document.querySelector('snice-draw');
draw.color = '#ff0000';
draw.strokeWidth = 5;
```

### Toolbar Integration

```html
<div>
  <button onclick="draw.tool = 'pen'">Pen</button>
  <button onclick="draw.tool = 'eraser'">Eraser</button>
  <input type="color" oninput="draw.color = this.value">
  <button onclick="draw.clear()">Clear</button>
  <button onclick="draw.undo()">Undo</button>
  <button onclick="draw.redo()">Redo</button>
</div>

<snice-draw id="draw"></snice-draw>
```

### Lazy Brush Settings

```javascript
// More responsive (smaller radius)
draw.lazyRadius = 10;

// Very smooth (larger radius)
draw.lazyRadius = 60;

// Disable lazy brush
draw.lazy = false;
```

### Export Drawing

```javascript
// As data URL
const dataURL = draw.toDataURL('image/png');

// As blob
const blob = await draw.toBlob('image/png', 0.9);

// Download
draw.download('my-artwork.png');
```

### Save and Load

```javascript
// Save drawing
const strokes = draw.getStrokes();
localStorage.setItem('drawing', JSON.stringify(strokes));

// Load drawing
const saved = JSON.parse(localStorage.getItem('drawing'));
draw.setStrokes(saved);
```

### Load Background Image

```javascript
await draw.loadImage('background.jpg');
```

### Event Handling

```javascript
draw.addEventListener('@snice/draw-end', (e) => {
  const stroke = e.detail.stroke;
  console.log(`Drew ${stroke.points.length} points`);

  // Auto-save
  saveDrawing();
});
```

### Keyboard Shortcuts

```javascript
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        draw.redo();
      } else {
        draw.undo();
      }
    }
  }
});
```

## Lazy Brush

The lazy brush creates smooth, organic lines by making the brush lag behind your cursor within a configurable radius. This eliminates jitter and produces professional-looking strokes.

**How it works:**
1. Cursor moves freely
2. Brush follows within `lazyRadius`
3. Creates smooth curves
4. Reduces hand tremor effects

**Tips:**
- Larger radius = smoother, slower response
- Smaller radius = more control, less smoothing
- Disable for pixel-perfect control

## Browser Support

- Modern browsers with Canvas API
- Pointer Events API for touch support
- Works on desktop and mobile

## Performance

- Optimized canvas rendering
- Efficient stroke storage
- Smooth 60fps drawing
- Touch and stylus pressure support
