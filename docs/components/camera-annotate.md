[//]: # (AI: For a low-token version of this doc, use docs/ai/components/camera-annotate.md instead)

# Camera Annotate Component

The camera annotate component combines camera capture with freehand drawing and labeled annotations. It provides a workflow for taking pictures, drawing shapes on them, and adding descriptive labels to each annotation.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Examples](#examples)
- [Annotation Workflow](#annotation-workflow)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Basic Usage

```html
<snice-camera-annotate></snice-camera-annotate>
```

```typescript
import 'snice/components/camera-annotate/snice-camera-annotate';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'camera' \| 'annotate'` | `'camera'` | Current mode of the component |
| `auto-rotate-colors` | `boolean` | `true` | Automatically cycle through preset colors for each new annotation |
| `show-labels-panel` | `boolean` | `true` | Show the sidebar panel with annotation labels |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `capture()` | `Promise<void>` | Capture current camera frame and switch to annotate mode |
| `exportImage(options?)` | `string` | Export annotated image as data URL. Options: `{ includeLabels?: boolean }` |
| `exportAnnotations()` | `AnnotationData` | Export all annotation data as a serializable object |
| `importAnnotations(data)` | `void` | Load annotation data from a previously exported object |
| `clearAnnotations()` | `void` | Remove all annotations and strokes |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/capture` | `{ dataURL, width, height }` | Fired when an image is captured from the camera |
| `@snice/annotate` | `{ annotation }` | Fired when a new annotation (shape) is drawn |
| `@snice/annotation-change` | `{ annotations }` | Fired when annotations are modified (add, remove, visibility, label) |

## Examples

### Default Camera Annotator

```html
<snice-camera-annotate></snice-camera-annotate>
```

### Without Labels Panel

```html
<snice-camera-annotate show-labels-panel="false"></snice-camera-annotate>
```

### Manual Color Selection

```html
<snice-camera-annotate auto-rotate-colors="false"></snice-camera-annotate>
```

### Listening to Events

```html
<snice-camera-annotate id="annotator"></snice-camera-annotate>

<script type="module">
  const annotator = document.getElementById('annotator');

  annotator.addEventListener('@snice/capture', (e) => {
    console.log('Captured:', e.detail.width, 'x', e.detail.height);
  });

  annotator.addEventListener('@snice/annotate', (e) => {
    console.log('New annotation:', e.detail.annotation.id);
  });

  annotator.addEventListener('@snice/annotation-change', (e) => {
    console.log('Total annotations:', e.detail.annotations.length);
  });
</script>
```

### Save and Load Annotations

```html
<snice-camera-annotate id="annotator"></snice-camera-annotate>

<script type="module">
  const annotator = document.getElementById('annotator');

  // Save
  function saveAnnotations() {
    const data = annotator.exportAnnotations();
    localStorage.setItem('annotations', JSON.stringify(data));
  }

  // Load
  function loadAnnotations() {
    const json = localStorage.getItem('annotations');
    if (json) {
      annotator.importAnnotations(JSON.parse(json));
    }
  }
</script>
```

### Export Image

```html
<snice-camera-annotate id="annotator"></snice-camera-annotate>
<button onclick="downloadImage()">Download</button>

<script type="module">
  function downloadImage() {
    const annotator = document.getElementById('annotator');

    // Without labels on the image
    const imageOnly = annotator.exportImage();

    // With labels rendered on the image
    const withLabels = annotator.exportImage({ includeLabels: true });

    // Download
    const a = document.createElement('a');
    a.href = withLabels;
    a.download = 'annotated.png';
    a.click();
  }
</script>
```

## Annotation Workflow

1. **Camera Mode**: The component starts showing a live camera feed
2. **Capture**: Click the "Capture" button to take a photo
3. **Annotate Mode**: Draw shapes on the captured image using freehand strokes
4. **Label**: Type labels for each annotation in the sidebar
5. **Manage**: Show/hide individual annotations, toggle all, or delete specific ones
6. **Export**: Save annotation data as JSON or export the annotated image
7. **Retake**: Click "Retake" to return to camera mode and start fresh

### Color System

- **Preset Palette**: 12 preset colors displayed as swatches in the sidebar
- **Auto Rotate**: When enabled (default), each new annotation automatically gets the next color from the palette
- **Manual Selection**: Click any color swatch to set the active drawing color

### Visual Highlighting

When you hover over an annotation label in the sidebar:
- The corresponding shape is highlighted at full opacity
- All other shapes dim to 20% opacity with a grayscale filter
- This makes it easy to identify which shape belongs to which label

## Accessibility

- Color swatches have title attributes showing the hex value
- Annotation visibility toggles have descriptive title text
- Delete buttons have clear title labels
- The sidebar scrolls independently when annotations exceed available space

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires camera access via `getUserMedia`
- Requires Custom Elements v1 and Shadow DOM support

## Best Practices

1. **Grant camera permissions**: Ensure users have allowed camera access for the capture workflow
2. **Add labels promptly**: Label annotations as you draw them for better organization
3. **Use auto-rotate colors**: Keeps annotations visually distinct without manual color selection
4. **Export regularly**: Save annotation data to prevent loss on page refresh
5. **Use the sidebar**: Hovering labels helps verify which shape corresponds to which annotation
6. **Clear before starting fresh**: Use clearAnnotations() or "Retake" to reset
7. **Export with labels**: When sharing annotated images, include labels for context
