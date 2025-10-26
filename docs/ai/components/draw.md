# snice-draw

Canvas drawing with lazy-brush smoothing.

## Properties

```typescript
width: number = 800;
height: number = 600;
tool: 'pen'|'eraser'|'line'|'rectangle'|'circle'|'text' = 'pen';
color: string = '#000000';
strokeWidth: number = 2;
backgroundColor: string = '#ffffff';
lazy: boolean = true;
lazyRadius: number = 30;
smoothing: number = 0.5;
disabled: boolean = false;
```

## Methods

```typescript
clear(): void
undo(): void
redo(): void
toDataURL(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): string
toBlob(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): Promise<Blob>
download(filename?: string): void
loadImage(url: string): Promise<void>
getStrokes(): DrawStroke[]
setStrokes(strokes: DrawStroke[]): void
```

## DrawStroke

```typescript
interface DrawStroke {
  tool: DrawTool;
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}
```

## Events

- `@snice/draw-start` - Drawing started
- `@snice/draw-end` - Stroke completed (detail: { stroke })
- `@snice/draw-clear` - Canvas cleared
- `@snice/draw-undo` - Undo performed
- `@snice/draw-redo` - Redo performed

## Usage

```javascript
// Change tool
draw.tool = 'pen';
draw.color = '#ff0000';
draw.strokeWidth = 5;

// Lazy brush
draw.lazy = true;
draw.lazyRadius = 30;
draw.smoothing = 0.5;

// Actions
draw.clear();
draw.undo();
draw.redo();

// Export
const dataURL = draw.toDataURL('image/png');
const blob = await draw.toBlob('image/png');
draw.download('drawing.png');

// Save/load
const strokes = draw.getStrokes();
draw.setStrokes(strokes);

// Load image
await draw.loadImage('bg.jpg');
```

```html
<snice-draw
  width="800"
  height="600"
  tool="pen"
  color="#000000"
  stroke-width="2"
  lazy
  lazy-radius="30">
</snice-draw>
```

## Lazy Brush

Smooth drawing with cursor lag-following:
- Brush follows cursor within radius
- Creates organic, smooth lines
- Reduces jitter and tremor
- Configurable radius and smoothing

## Features

- Canvas drawing
- Lazy brush smoothing
- Pen/eraser tools
- Undo/redo
- Export (PNG/JPEG/WebP)
- Save/load strokes
- Touch/stylus support
- Keyboard shortcuts
