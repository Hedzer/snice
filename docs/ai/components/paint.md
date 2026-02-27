# snice-paint

Self-contained drawing canvas with built-in toolbar.

## Properties

```typescript
colors: string[] = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#e2e8f0','#1e293b'];
color: string = '#3b82f6';
strokeWidth: number = 3;
minStrokeWidth: number = 1;
maxStrokeWidth: number = 20;
controls: string = 'colors,size,eraser,undo,redo,clear';
backgroundColor: string = '#ffffff';
colorSelects: number = 0; // extra color-picker dots in palette
disabled: boolean = false;
```

## Controls

Comma-separated in `controls` attribute:
- `colors` — color swatch grid
- `size` — brush size slider
- `eraser` — eraser toggle
- `undo` — undo button
- `redo` — redo button
- `clear` — clear button

## Methods

```typescript
undo(): void
redo(): void
clear(): void
toDataURL(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): string
toBlob(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): Promise<Blob>
download(filename?: string): void
getStrokes(): PaintStroke[]
setStrokes(strokes: PaintStroke[]): void
```

## PaintStroke

```typescript
interface PaintStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}
```

## Events

- `paint-start` — Drawing started (detail: { point })
- `paint-end` — Stroke completed (detail: { stroke })
- `paint-clear` — Canvas cleared
- `paint-undo` — Undo performed
- `paint-redo` — Redo performed
- `color-select` — Custom color picked (detail: { color, index })

## Slots

| Slot | Behavior | Description |
|------|----------|-------------|
| `toolbar-start` | Additive | Content prepended above default controls |
| `colors` | Replaces default | Replaces built-in color swatches |
| `size` | Replaces default | Replaces built-in size slider |
| `tools` | Additive | Custom tool buttons (between eraser and undo/redo) |
| `toolbar-end` | Additive | Content appended below default controls |

Toolbar auto-shows when any slot has content, even if `controls=""`.

**CSS Parts:**
- `base` - The outer paint container
- `toolbar` - The toolbar with controls
- `canvas-wrap` - The canvas wrapper element
- `canvas` - The drawing canvas element

## Usage

```html
<snice-paint></snice-paint>

<!-- Custom colors -->
<snice-paint colors='["#ff0000","#00ff00","#0000ff"]'></snice-paint>

<!-- Minimal controls -->
<snice-paint controls="colors,undo"></snice-paint>

<!-- Custom size range -->
<snice-paint min-stroke-width="2" max-stroke-width="50"></snice-paint>
```

```javascript
const paint = document.querySelector('snice-paint');

// Export
paint.download('artwork.png');
const url = paint.toDataURL();

// Save/load
const strokes = paint.getStrokes();
paint.setStrokes(strokes);
```

```html
<!-- Custom color pickers in palette -->
<snice-paint color-selects="2"></snice-paint>

<!-- Custom tools -->
<snice-paint>
  <button slot="tools" onclick="...">Rectangle</button>
  <button slot="tools" onclick="...">Circle</button>
</snice-paint>

<!-- Replace color picker -->
<snice-paint>
  <input slot="colors" type="color" onchange="this.closest('snice-paint').color = this.value">
</snice-paint>

<!-- Add save button -->
<snice-paint>
  <button slot="toolbar-end" onclick="this.closest('snice-paint').download()">Save</button>
</snice-paint>
```
