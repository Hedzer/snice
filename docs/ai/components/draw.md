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
lazy: boolean = false;
lazyRadius: number = 60;
friction: number = 0.1;
smoothing: number = 0.5;
autoPolygon: boolean = false;
polygonCurvePoints: number = 10;
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
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}
```

## Events

- `draw-start` - Drawing started
- `draw-end` - Stroke completed (detail: { stroke })
- `draw-clear` - Canvas cleared
- `draw-undo` - Undo performed
- `draw-redo` - Redo performed

## Usage

```javascript
// Change tool
draw.tool = 'pen';
draw.color = '#ff0000';
draw.strokeWidth = 5;

// Lazy brush
draw.lazy = true;
draw.lazyRadius = 60;
draw.friction = 0.1;
draw.smoothing = 0.5;

// Auto-polygon
draw.autoPolygon = true;
draw.polygonCurvePoints = 15; // Smoother curves

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
  lazy-radius="60"
  friction="0.1"
  auto-polygon
  polygon-curve-points="10">
</snice-draw>
```

## Lazy Brush

Smooth drawing with cursor lag-following:
- Brush follows cursor within radius
- Creates organic, smooth lines
- Reduces jitter and tremor
- Configurable radius and smoothing

## Auto-Polygon

Automatically processes completed strokes into closed shapes:
- Detects self-intersections and trims excess
- Auto-closes open shapes with smooth curves
- `autoPolygon: boolean` - Enable feature (default: false)
- `polygonCurvePoints: number` - Curve smoothness 2-30 (default: 10)

Processing happens on stroke completion (pointerup):
1. If stroke crosses itself, trim at first intersection
2. If start/end points >20px apart, connect with quadratic curve
3. Higher curve points = smoother closing arc

## Features

- Canvas drawing
- Lazy brush smoothing
- Auto-polygon processing
- Pen/eraser tools
- Undo/redo
- Export (PNG/JPEG/WebP)
- Save/load strokes
- Touch/stylus support
- Keyboard shortcuts
