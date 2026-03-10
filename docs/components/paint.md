<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/paint.md -->

# Paint
`<snice-paint>`

A self-contained drawing canvas with a built-in toolbar for colors, brush size, eraser, undo/redo, and clear.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string` | `'#3b82f6'` | Current brush color |
| `strokeWidth` (attr: `stroke-width`) | `number` | `3` | Current brush stroke width |
| `minStrokeWidth` (attr: `min-stroke-width`) | `number` | `1` | Minimum brush size |
| `maxStrokeWidth` (attr: `max-stroke-width`) | `number` | `20` | Maximum brush size |
| `controls` | `string` | `'colors,size,eraser,undo,redo,clear'` | Comma-separated list of toolbar controls |
| `backgroundColor` (attr: `background-color`) | `string` | `'#ffffff'` | Canvas background color |
| `colorSelects` (attr: `color-selects`) | `number` | `0` | Number of extra color picker dots in palette |
| `disabled` | `boolean` | `false` | Disable drawing interaction |
| `colors` | `string[]` | `['#3b82f6',...]` | Color palette (getter/setter, set via JS or JSON attribute) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `undo()` | -- | Undo the last stroke |
| `redo()` | -- | Redo the last undone stroke |
| `clear()` | -- | Clear the canvas |
| `toDataURL()` | `type?: string, quality?: number` | Export canvas as a data URL |
| `toBlob()` | `type?: string, quality?: number` | Export canvas as a Blob (async) |
| `download()` | `filename?: string` | Download canvas as an image file |
| `getStrokes()` | -- | Get a copy of all strokes |
| `setStrokes()` | `strokes: PaintStroke[]` | Replace all strokes and redraw |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `paint-start` | `{ point: Point }` | Fired when drawing starts |
| `paint-end` | `{ stroke: PaintStroke }` | Fired when a stroke is completed |
| `paint-clear` | `{}` | Fired when the canvas is cleared |
| `paint-undo` | `{}` | Fired when an undo is performed |
| `paint-redo` | `{}` | Fired when a redo is performed |
| `color-select` | `{ color: string, index: number }` | Fired when a custom color picker is used |

## Slots

| Name | Behavior | Description |
|------|----------|-------------|
| `toolbar-start` | Additive | Content prepended before default controls |
| `colors` | Replaces default | Replaces the built-in color swatches |
| `size` | Replaces default | Replaces the built-in size slider |
| `tools` | Additive | Custom tool buttons (between eraser and undo/redo) |
| `toolbar-end` | Additive | Content appended after default controls |

The toolbar auto-shows when any slot has content, even if `controls=""`.

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer paint container |
| `toolbar` | `<div>` | The toolbar with controls |
| `canvas-wrap` | `<div>` | The canvas wrapper element |
| `canvas` | `<canvas>` | The drawing canvas element |

## Basic Usage

```typescript
import 'snice/components/paint/snice-paint';
```

```html
<snice-paint></snice-paint>
```

## Examples

### Custom Colors

Set the color palette via a JSON attribute or JavaScript.

```html
<snice-paint colors='["#ff0000","#00ff00","#0000ff"]'></snice-paint>
```

### Minimal Controls

Show only specific toolbar controls.

```html
<snice-paint controls="colors,undo"></snice-paint>
```

### Custom Size Range

Adjust the minimum and maximum brush sizes.

```html
<snice-paint min-stroke-width="2" max-stroke-width="50"></snice-paint>
```

### Color Pickers

Add extra color picker inputs to the palette.

```html
<snice-paint color-selects="2"></snice-paint>
```

### Custom Toolbar Content

Use slots to extend the toolbar with custom controls.

```html
<snice-paint>
  <button slot="tools" onclick="...">Rectangle</button>
  <button slot="toolbar-end" onclick="this.closest('snice-paint').download()">Save</button>
</snice-paint>
```

### Replace Color Picker

Swap the default swatches for a native color input.

```html
<snice-paint>
  <input slot="colors" type="color" onchange="this.closest('snice-paint').color = this.value">
</snice-paint>
```

### Export and Save/Load

```typescript
// Export as image
paint.download('artwork.png');
const dataUrl = paint.toDataURL();
const blob = await paint.toBlob();

// Save and restore strokes
const strokes = paint.getStrokes();
localStorage.setItem('drawing', JSON.stringify(strokes));
paint.setStrokes(JSON.parse(localStorage.getItem('drawing')));
```

## Accessibility

- Canvas supports pointer events for drawing on touch and mouse devices
- All toolbar buttons have `title` attributes for tooltips
- The `disabled` property prevents all drawing interaction

## Data Types

```typescript
interface Point {
  x: number;
  y: number;
}

interface PaintStroke {
  id: string;                      // Unique stroke identifier
  tool: 'pen' | 'eraser';         // Drawing tool used
  color: string;                   // Stroke color
  width: number;                   // Stroke width
  points: Point[];                 // Array of points in the stroke
  timestamp: number;               // When the stroke was created
}

type PaintControl = 'colors' | 'size' | 'eraser' | 'undo' | 'redo' | 'clear';
```
