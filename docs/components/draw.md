<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/draw.md -->

# Draw Component
`<snice-draw>`

Canvas drawing with smooth lazy-brush technology, auto-polygon, and auto-circle detection.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `width` | `width` | `number` | `800` | Canvas width |
| `height` | `height` | `number` | `600` | Canvas height |
| `tool` | `tool` | `DrawTool` | `'pen'` | Drawing tool (`'pen'` \| `'eraser'` \| `'line'` \| `'rectangle'` \| `'circle'` \| `'text'`) |
| `color` | `color` | `string` | `'#000000'` | Brush color |
| `strokeWidth` | `stroke-width` | `number` | `2` | Brush width |
| `backgroundColor` | `background-color` | `string` | `'#ffffff'` | Canvas background |
| `lazy` | `lazy` | `boolean` | `false` | Enable lazy brush |
| `lazyRadius` | `lazy-radius` | `number` | `60` | Lazy brush radius |
| `friction` | `friction` | `number` | `0.1` | Lazy brush friction |
| `smoothing` | `smoothing` | `number` | `0.5` | Line smoothing (0-1) |
| `autoPolygon` | `auto-polygon` | `boolean` | `false` | Enable auto-polygon shape completion |
| `polygonCurvePoints` | `polygon-curve-points` | `number` | `10` | Polygon curve smoothness (2-30) |
| `autoCircle` | `auto-circle` | `boolean` | `false` | Enable auto-circle detection |
| `circlePoints` | `circle-points` | `number` | `50` | Circle closing curve smoothness |
| `disabled` | `disabled` | `boolean` | `false` | Disable drawing |

### Types

```typescript
type DrawTool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text';

interface DrawStroke {
  id: string;          // Unique identifier
  tool: DrawTool;      // Tool used
  color: string;       // Hex color
  width: number;       // Stroke width
  points: Point[];     // Array of {x, y, pressure?}
  timestamp: number;   // Creation time (ms)
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `clear()` | -- | Clear the entire canvas |
| `undo()` | -- | Undo last stroke |
| `redo()` | -- | Redo previously undone stroke |
| `toDataURL()` | `type?: string, quality?: number` | Export as data URL |
| `toBlob()` | `type?: string, quality?: number` | Export as Blob |
| `download()` | `filename?: string` | Download drawing |
| `loadImage()` | `url: string` | Load image onto canvas |
| `getStrokes()` | -- | Get all strokes |
| `setStrokes()` | `strokes: DrawStroke[]` | Set strokes (for loading saved drawings) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `draw-start` | -- | Drawing started |
| `draw-end` | `{ stroke }` | Drawing ended (stroke complete) |
| `draw-clear` | -- | Canvas cleared |
| `draw-undo` | -- | Undo performed |
| `draw-redo` | -- | Redo performed |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer draw container |
| `canvas` | Drawing canvas element |

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

```typescript
import 'snice/components/draw/snice-draw';
```

```html
<snice-draw id="draw" width="800" height="600"></snice-draw>
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-draw.min.js"></script>
```

## Examples

### Custom Colors and Stroke Width

Use the `color` and `stroke-width` properties to customize the brush.

```typescript
draw.color = '#ff0000';
draw.strokeWidth = 5;
```

### Toolbar Integration

Build a custom toolbar with tool and color controls.

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

### Lazy Brush

Enable lazy brush for smooth, organic lines by making the brush lag behind the cursor.

```html
<snice-draw lazy lazy-radius="60" friction="0.1" smoothing="0.5"></snice-draw>
```

- Larger radius = smoother, slower response
- Smaller radius = more control, less smoothing
- Disable for pixel-perfect control

### Auto-Polygon

Enable auto-polygon to automatically close drawn shapes.

```html
<snice-draw auto-polygon polygon-curve-points="15"></snice-draw>
```

When you finish drawing, it detects self-intersections and trims at the first crossing point. If start and end points are far apart (>20px), it connects them with a smooth curve. The `polygon-curve-points` value (2-30) controls curve smoothness.

### Auto-Circle

Enable auto-circle to detect and smooth circular strokes.

```html
<snice-draw auto-circle circle-points="50"></snice-draw>
```

When enabled, strokes are analyzed and converted into smooth circles. The `circle-points` value controls the smoothness of the closing curve.

### Export Drawing

Use `toDataURL()`, `toBlob()`, or `download()` to export the canvas.

```javascript
const dataURL = draw.toDataURL('image/png');
const blob = await draw.toBlob('image/png', 0.9);
draw.download('my-artwork.png');
```

### Save and Load

Use `getStrokes()` and `setStrokes()` to persist drawings.

```javascript
// Save
const strokes = draw.getStrokes();
localStorage.setItem('drawing', JSON.stringify(strokes));

// Load
const saved = JSON.parse(localStorage.getItem('drawing'));
draw.setStrokes(saved);
```

### Load Background Image

Use `loadImage()` to load a background image onto the canvas.

```javascript
await draw.loadImage('background.jpg');
```

### Event Handling

Listen for drawing events to build auto-save or analytics.

```javascript
draw.addEventListener('draw-end', (e) => {
  const stroke = e.detail.stroke;
  console.log(`Drew ${stroke.points.length} points`);
});
```

## Accessibility

- Pointer Events API for touch and stylus support
- Works on desktop and mobile
- Pressure-sensitive stylus support
- `disabled` property prevents all drawing interaction
