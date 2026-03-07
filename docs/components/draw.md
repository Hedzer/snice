<!-- AI: For a low-token version of this doc, use docs/ai/components/draw.md instead -->

# Draw Component

Canvas drawing with smooth lazy-brush technology.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `width` | `number` | `800` | Canvas width |
| `height` | `number` | `600` | Canvas height |
| `tool` | `DrawTool` | `'pen'` | Drawing tool |
| `color` | `string` | `'#000000'` | Brush color |
| `strokeWidth` | `number` | `2` | Brush width |
| `backgroundColor` | `string` | `'#ffffff'` | Canvas background |
| `lazy` | `boolean` | `false` | Enable lazy brush |
| `lazyRadius` | `number` | `60` | Lazy brush radius |
| `friction` | `number` | `0.1` | Lazy brush friction |
| `smoothing` | `number` | `0.5` | Line smoothing (0-1) |
| `autoPolygon` | `boolean` | `false` | Enable auto-polygon |
| `polygonCurvePoints` | `number` | `10` | Polygon curve smoothness (2-30) |
| `disabled` | `boolean` | `false` | Disable drawing |

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

- `draw-start` - Drawing started
- `draw-end` - Drawing ended (stroke complete)
- `draw-clear` - Canvas cleared
- `draw-undo` - Undo performed
- `draw-redo` - Redo performed

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer draw container |
| `canvas` | `<canvas>` | Drawing canvas element |

```css
snice-draw::part(base) {
  border: 1px solid #e2e2e2;
  border-radius: 8px;
}

snice-draw::part(canvas) {
  cursor: crosshair;
}
```

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

Each stroke has a unique ID for tracking and manipulation:

```javascript
// Save drawing
const strokes = draw.getStrokes();
localStorage.setItem('drawing', JSON.stringify(strokes));

// Load drawing
const saved = JSON.parse(localStorage.getItem('drawing'));
draw.setStrokes(saved);

// Access individual strokes by ID
const strokes = draw.getStrokes();
console.log(strokes[0].id); // e.g., "stroke-1735216842123-x7k9m2p"

// Filter strokes
const penStrokes = strokes.filter(s => s.tool === 'pen');

// Remove specific stroke
const filtered = strokes.filter(s => s.id !== 'stroke-id-to-remove');
draw.setStrokes(filtered);
```

**Stroke Structure:**

```typescript
interface DrawStroke {
  id: string;          // Unique identifier
  tool: DrawTool;      // 'pen' | 'eraser' | etc
  color: string;       // Hex color
  width: number;       // Stroke width
  points: Point[];     // Array of {x, y, pressure?}
  timestamp: number;   // Creation time (ms)
}
```

### Load Background Image

```javascript
await draw.loadImage('background.jpg');
```

### Event Handling

```javascript
draw.addEventListener('draw-end', (e) => {
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

## Tools

- `'pen'` - Draw with brush
- `'eraser'` - Erase strokes
- `'line'` - Draw straight lines
- `'rectangle'` - Draw rectangles
- `'circle'` - Draw circles
- `'text'` - Add text

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

## Auto-Polygon

Auto-polygon automatically processes completed strokes into closed shapes. When you finish drawing (release the mouse/pointer), it analyzes the stroke and applies smart shape completion.

**Features:**

1. **Self-Intersection Detection**
   - Detects when your stroke crosses itself
   - Automatically trims at the first intersection point
   - Creates a clean closed shape without excess

2. **Auto-Close Open Shapes**
   - If start and end points are far apart (>20px)
   - Connects them with a smooth quadratic curve
   - Curve adapts to the gap distance

**Properties:**

- `autoPolygon` - Enable/disable the feature (default: `false`)
- `polygonCurvePoints` - Curve smoothness, 2-30 (default: `10`)
  - Lower values (2-5): Sharp, direct connection
  - Medium values (10-15): Balanced smooth curve
  - Higher values (20-30): Very smooth, organic curve

**Example:**

```javascript
const draw = document.querySelector('snice-draw');

// Enable auto-polygon
draw.autoPolygon = true;

// Adjust curve smoothness
draw.polygonCurvePoints = 15; // Smoother curves
```

```html
<snice-draw
  auto-polygon
  polygon-curve-points="15">
</snice-draw>
```

**Use Cases:**

- Sketching closed shapes quickly
- Drawing polygons without precision
- Creating organic forms that auto-complete
- UI wireframing and mockups
- Diagram creation

**How It Works:**

The algorithm processes strokes on `pointerup`:

1. Simplify points (sample every 5th point for performance)
2. Check for self-intersections using line-line intersection
3. If intersection found: trim and close at that point
4. If no intersection and gap >20px: generate curve points
5. Use quadratic Bezier with perpendicular control point
6. Insert interpolated points for smooth rendering

## Browser Support

- Modern browsers with Canvas API
- Pointer Events API for touch support
- Works on desktop and mobile

## Performance

- Optimized canvas rendering
- Efficient stroke storage
- Smooth 60fps drawing
- Touch and stylus pressure support
