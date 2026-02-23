[//]: # (AI: For a low-token version of this doc, use docs/ai/components/paint.md instead)

# Paint
`<snice-paint>`

A self-contained drawing canvas with a built-in toolbar for color selection, brush sizing, eraser, undo/redo, and export.

## Basic Usage

```typescript
import 'snice/components/paint/snice-paint';
```

```html
<snice-paint></snice-paint>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/paint/snice-paint';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-paint.min.js"></script>
```

## Examples

### Custom Colors

Use the `colors` attribute with a JSON array to set the palette.

```html
<snice-paint colors='["#ff0000","#00ff00","#0000ff","#ffff00"]'></snice-paint>
```

### Custom Size Range

Use `min-stroke-width` and `max-stroke-width` to control the brush slider range.

```html
<snice-paint min-stroke-width="2" max-stroke-width="50" stroke-width="10"></snice-paint>
```

### Minimal Toolbar

Use the `controls` attribute with a comma-separated list to show only specific controls.

```html
<snice-paint controls="colors,undo"></snice-paint>
```

### No Toolbar

Pass an empty string to hide the toolbar entirely.

```html
<snice-paint controls=""></snice-paint>
```

### Disabled

Set the `disabled` attribute to prevent all interaction.

```html
<snice-paint disabled></snice-paint>
```

### Custom Background

Use the `background-color` attribute to change the canvas background.

```html
<snice-paint background-color="#f0f0f0"></snice-paint>
```

### Programmatic Control

```typescript
const paint = document.querySelector('snice-paint');

// Change settings
paint.color = '#ff6600';
paint.strokeWidth = 8;

// Undo / redo / clear
paint.undo();
paint.redo();
paint.clear();

// Export
paint.download('my-painting.png');
const dataURL = paint.toDataURL('image/png');
const blob = await paint.toBlob('image/jpeg', 0.9);
```

### Save and Restore Strokes

```typescript
const paint = document.querySelector('snice-paint');

// Save strokes
const strokes = paint.getStrokes();
localStorage.setItem('painting', JSON.stringify(strokes));

// Restore strokes
const saved = JSON.parse(localStorage.getItem('painting'));
paint.setStrokes(saved);
```

### Event Handling

```typescript
const paint = document.querySelector('snice-paint');

paint.addEventListener('paint-end', (e) => {
  console.log(`Stroke with ${e.detail.stroke.points.length} points`);
});

paint.addEventListener('paint-clear', () => {
  console.log('Canvas cleared');
});
```

## Stroke Structure

```typescript
interface PaintStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  points: Point[];     // Array of { x, y }
  timestamp: number;
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `colors` | `string[]` | 8 default colors | Color palette (set via JSON attribute) |
| `color` | `string` | `'#3b82f6'` | Current brush color |
| `strokeWidth` (attr: `stroke-width`) | `number` | `3` | Brush stroke width |
| `minStrokeWidth` (attr: `min-stroke-width`) | `number` | `1` | Minimum slider value |
| `maxStrokeWidth` (attr: `max-stroke-width`) | `number` | `20` | Maximum slider value |
| `controls` | `string` | `'colors,size,eraser,undo,redo,clear'` | Visible toolbar sections |
| `backgroundColor` (attr: `background-color`) | `string` | `'#ffffff'` | Canvas background color |
| `disabled` | `boolean` | `false` | Disable all interaction |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `paint-start` | `{ point: Point }` | Drawing started |
| `paint-end` | `{ stroke: PaintStroke }` | Stroke completed |
| `paint-clear` | -- | Canvas cleared |
| `paint-undo` | -- | Undo performed |
| `paint-redo` | -- | Redo performed |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `undo()` | -- | Undo the last stroke |
| `redo()` | -- | Redo the last undone stroke |
| `clear()` | -- | Clear the entire canvas |
| `toDataURL()` | `type?: string, quality?: number` | Export as data URL |
| `toBlob()` | `type?: string, quality?: number` | Export as Blob (async) |
| `download()` | `filename?: string` | Download as PNG file |
| `getStrokes()` | -- | Get all strokes for serialization |
| `setStrokes()` | `strokes: PaintStroke[]` | Restore strokes from saved data |
