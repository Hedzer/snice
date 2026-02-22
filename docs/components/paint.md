# Paint Component

Self-contained drawing canvas with a built-in toolbar. Includes color swatches, brush size slider, eraser toggle, undo/redo, and clear — all rendered inside the component's shadow DOM.

## Basic Usage

```html
<snice-paint></snice-paint>
```

The component renders a vertical toolbar on the left and a drawing canvas filling the remaining space.

## Properties

| Property | Type | Default | Attribute | Description |
|----------|------|---------|-----------|-------------|
| `colors` | `string[]` | 8 default colors | `colors` | Color palette (JSON array) |
| `color` | `string` | `'#3b82f6'` | `color` | Current brush color |
| `strokeWidth` | `number` | `3` | `stroke-width` | Brush width |
| `minStrokeWidth` | `number` | `1` | `min-stroke-width` | Min slider value |
| `maxStrokeWidth` | `number` | `20` | `max-stroke-width` | Max slider value |
| `controls` | `string` | `'colors,size,eraser,undo,redo,clear'` | `controls` | Visible toolbar controls |
| `backgroundColor` | `string` | `'#ffffff'` | `background-color` | Canvas background |
| `disabled` | `boolean` | `false` | `disabled` | Disable all interaction |

## Controls

The `controls` attribute accepts a comma-separated list of toolbar sections to show:

- `colors` — Color swatch grid
- `size` — Brush size slider
- `eraser` — Eraser toggle button
- `undo` — Undo button
- `redo` — Redo button
- `clear` — Clear canvas button

### Minimal Toolbar

```html
<snice-paint controls="colors,undo"></snice-paint>
```

### No Toolbar

```html
<snice-paint controls=""></snice-paint>
```

## Methods

### `undo(): void`
Undo the last stroke.

### `redo(): void`
Redo the last undone stroke.

### `clear(): void`
Clear the entire canvas.

### `toDataURL(type?, quality?): string`
Export as a data URL.

### `toBlob(type?, quality?): Promise<Blob>`
Export as a Blob.

### `download(filename?): void`
Download the painting as a PNG file.

### `getStrokes(): PaintStroke[]`
Get all strokes for serialization.

### `setStrokes(strokes): void`
Restore strokes from a previous session.

## Events

- `paint-start` — Drawing started (`detail: { point }`)
- `paint-end` — Stroke completed (`detail: { stroke }`)
- `paint-clear` — Canvas cleared
- `paint-undo` — Undo performed
- `paint-redo` — Redo performed

## Examples

### Custom Colors

```html
<snice-paint colors='["#ff0000","#00ff00","#0000ff","#ffff00"]'></snice-paint>
```

### Custom Size Range

```html
<snice-paint min-stroke-width="2" max-stroke-width="50" stroke-width="10"></snice-paint>
```

### Programmatic Control

```javascript
const paint = document.querySelector('snice-paint');

// Change color
paint.color = '#ff6600';

// Change brush size
paint.strokeWidth = 8;

// Export
paint.download('my-painting.png');
const dataURL = paint.toDataURL('image/png');
const blob = await paint.toBlob('image/jpeg', 0.9);

// Save / load
const strokes = paint.getStrokes();
localStorage.setItem('painting', JSON.stringify(strokes));

const saved = JSON.parse(localStorage.getItem('painting'));
paint.setStrokes(saved);
```

### Event Handling

```javascript
paint.addEventListener('paint-end', (e) => {
  const stroke = e.detail.stroke;
  console.log(`Stroke with ${stroke.points.length} points`);
});
```

## Stroke Structure

```typescript
interface PaintStroke {
  id: string;           // Unique identifier
  tool: 'pen' | 'eraser';
  color: string;        // Hex color
  width: number;        // Stroke width
  points: Point[];      // Array of {x, y}
  timestamp: number;    // Creation time (ms)
}
```
