# snice-draw

Canvas drawing with lazy-brush smoothing, auto-polygon, and auto-circle.

## Properties

```typescript
width: number = 800;
height: number = 600;
tool: 'pen'|'eraser'|'line'|'rectangle'|'circle'|'text' = 'pen';
color: string = '#000000';
strokeWidth: number = 2;            // attribute: stroke-width
backgroundColor: string = '#ffffff'; // attribute: background-color
lazy: boolean = false;
lazyRadius: number = 60;            // attribute: lazy-radius
friction: number = 0.1;
smoothing: number = 0.5;
autoPolygon: boolean = false;       // attribute: auto-polygon
polygonCurvePoints: number = 10;    // attribute: polygon-curve-points (2-30)
autoCircle: boolean = false;        // attribute: auto-circle
circlePoints: number = 50;          // attribute: circle-points
disabled: boolean = false;
```

## Methods

- `clear()` - Clear canvas
- `undo()` / `redo()` - Undo/redo strokes
- `toDataURL(type?, quality?)` → `string` - Export as data URL
- `toBlob(type?, quality?)` → `Promise<Blob>` - Export as Blob
- `download(filename?)` - Download drawing
- `loadImage(url)` → `Promise<void>` - Load background image
- `getStrokes()` → `DrawStroke[]` - Get all strokes
- `setStrokes(strokes)` - Set strokes (load saved drawings)

## DrawStroke

```typescript
interface DrawStroke {
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  points: Point[];      // {x, y, pressure?}
  timestamp: number;
}
```

## Events

- `draw-start` - Drawing started
- `draw-end` → `{ stroke }` - Stroke completed
- `draw-clear` - Canvas cleared
- `draw-undo` - Undo performed
- `draw-redo` - Redo performed

## CSS Parts

- `base` - Outer draw container
- `canvas` - Drawing canvas element

## Basic Usage

```html
<snice-draw width="800" height="600" tool="pen" color="#000000" stroke-width="2"></snice-draw>
<snice-draw lazy lazy-radius="60" auto-polygon polygon-curve-points="15"></snice-draw>
<snice-draw auto-circle circle-points="50"></snice-draw>
```

```typescript
draw.tool = 'pen';
draw.color = '#ff0000';
draw.clear();
draw.undo();
draw.download('drawing.png');

const strokes = draw.getStrokes();
draw.setStrokes(strokes);
await draw.loadImage('bg.jpg');
```

## Lazy Brush

Brush follows cursor within radius for smooth lines. Larger radius = smoother. Reduces jitter/tremor.

## Auto-Polygon

Processes completed strokes into closed shapes. Detects self-intersections and trims. Auto-closes open shapes with smooth curves. `polygonCurvePoints` 2-30 controls curve smoothness.

## Auto-Circle

Detects circular strokes and smooths them. `circlePoints` controls closing curve smoothness.
