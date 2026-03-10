# snice-paint

Self-contained drawing canvas with built-in toolbar for colors, brush size, eraser, undo/redo, and clear.

## Properties

```typescript
color: string = '#3b82f6';
strokeWidth: number = 3;                              // attr: stroke-width
minStrokeWidth: number = 1;                           // attr: min-stroke-width
maxStrokeWidth: number = 20;                          // attr: max-stroke-width
controls: string = 'colors,size,eraser,undo,redo,clear';
backgroundColor: string = '#ffffff';                  // attr: background-color
colorSelects: number = 0;                             // attr: color-selects, extra color picker dots
disabled: boolean = false;
colors: string[];  // getter/setter, default: ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#e2e8f0','#1e293b']
```

## Methods

- `undo()` - Undo last stroke
- `redo()` - Redo last undone stroke
- `clear()` - Clear canvas
- `toDataURL(type?, quality?)` - Export as data URL
- `toBlob(type?, quality?)` - Export as Blob (async)
- `download(filename?)` - Download as image file
- `getStrokes()` - Get copy of all strokes
- `setStrokes(strokes)` - Replace all strokes

## Events

- `paint-start` → `{ point: Point }` - Drawing started
- `paint-end` → `{ stroke: PaintStroke }` - Stroke completed
- `paint-clear` → `{}` - Canvas cleared
- `paint-undo` → `{}` - Undo performed
- `paint-redo` → `{}` - Redo performed
- `color-select` → `{ color: string, index: number }` - Custom color picked

## Slots

- `toolbar-start` - Content prepended before default controls
- `colors` - Replaces built-in color swatches
- `size` - Replaces built-in size slider
- `tools` - Custom tool buttons (between eraser and undo/redo)
- `toolbar-end` - Content appended after default controls

## CSS Parts

- `base` - Outer paint container
- `toolbar` - Toolbar with controls
- `canvas-wrap` - Canvas wrapper element
- `canvas` - Drawing canvas element

## Basic Usage

```html
<snice-paint></snice-paint>
```

```typescript
import 'snice/components/paint/snice-paint';

// Export
paint.download('artwork.png');
const strokes = paint.getStrokes();
paint.setStrokes(strokes);
```

## Accessibility

- Canvas supports pointer events for drawing
- Toolbar buttons have title attributes for tooltips
- Disabled state prevents all drawing interaction

## Types

```typescript
interface Point { x: number; y: number; }
interface PaintStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}
type PaintControl = 'colors' | 'size' | 'eraser' | 'undo' | 'redo' | 'clear';
```
