<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/camera-annotate.md -->

# Camera Annotate Component

Combines camera capture with freehand drawing and labeled annotations. Provides a workflow for taking pictures, drawing shapes on them, and adding descriptive labels to each annotation.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'camera' \| 'annotate'` | `'camera'` | Current mode of the component |
| `autoRotateColors` (attr: `auto-rotate-colors`) | `boolean` | `true` | Automatically cycle through preset colors for each new annotation |
| `showLabelsPanel` (attr: `show-labels-panel`) | `boolean` | `true` | Show the sidebar panel with annotation labels |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `capture()` | -- | `Promise<void>` | Capture current camera frame and switch to annotate mode |
| `exportImage()` | `options?: { includeLabels?: boolean }` | `string` | Export annotated image as data URL |
| `exportAnnotations()` | -- | `AnnotationData` | Export all annotation data as a serializable object |
| `importAnnotations()` | `data: AnnotationData` | `void` | Load annotation data from a previously exported object |
| `clearAnnotations()` | -- | `void` | Remove all annotations and strokes |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `capture` | `{ dataURL: string, width: number, height: number }` | Fired when an image is captured from the camera |
| `annotate` | `{ annotation: Annotation }` | Fired when a new annotation (shape) is drawn |
| `annotation-change` | `{ annotations: Annotation[] }` | Fired when annotations are modified (add, remove, visibility, label) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer layout container |
| `canvas` | Canvas area containing the video feed and drawing surface |
| `toolbar` | Toolbar with capture/retake, undo, clear, and export buttons |
| `sidebar` | Sidebar panel with color palette and annotation labels |

```css
snice-camera-annotate::part(base) {
  border-radius: 12px;
  overflow: hidden;
}

snice-camera-annotate::part(sidebar) {
  background: #1e293b;
  color: white;
}
```

## Basic Usage

```html
<snice-camera-annotate></snice-camera-annotate>
```

```typescript
import 'snice/components/camera-annotate/snice-camera-annotate';
```

## Examples

### Without Labels Panel

Hide the sidebar by setting `show-labels-panel` to false.

```html
<snice-camera-annotate show-labels-panel="false"></snice-camera-annotate>
```

### Manual Color Selection

Disable auto-rotation to choose colors manually from the palette.

```html
<snice-camera-annotate auto-rotate-colors="false"></snice-camera-annotate>
```

### Listening to Events

Use events to track capture and annotation changes.

```html
<snice-camera-annotate id="annotator"></snice-camera-annotate>

<script type="module">
  const annotator = document.getElementById('annotator');

  annotator.addEventListener('capture', (e) => {
    console.log('Captured:', e.detail.width, 'x', e.detail.height);
  });

  annotator.addEventListener('annotate', (e) => {
    console.log('New annotation:', e.detail.annotation.id);
  });

  annotator.addEventListener('annotation-change', (e) => {
    console.log('Total annotations:', e.detail.annotations.length);
  });
</script>
```

### Save and Load Annotations

Use `exportAnnotations()` and `importAnnotations()` to persist annotation data.

```javascript
// Save
const data = annotator.exportAnnotations();
localStorage.setItem('annotations', JSON.stringify(data));

// Load
const json = localStorage.getItem('annotations');
if (json) {
  annotator.importAnnotations(JSON.parse(json));
}
```

### Export Image

Use `exportImage()` to download the annotated image with or without labels.

```javascript
const imageOnly = annotator.exportImage();
const withLabels = annotator.exportImage({ includeLabels: true });

const a = document.createElement('a');
a.href = withLabels;
a.download = 'annotated.png';
a.click();
```

## Accessibility

- Color swatches have title attributes showing the hex value
- Annotation visibility toggles have descriptive title text
- Delete buttons have clear title labels
- The sidebar scrolls independently when annotations exceed available space
