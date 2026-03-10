# snice-camera-annotate

Camera capture + freehand drawing + labeled annotations.

## Properties

```typescript
mode: 'camera' | 'annotate' = 'camera';
autoRotateColors: boolean = true;     // attribute: auto-rotate-colors
showLabelsPanel: boolean = true;      // attribute: show-labels-panel
```

## Methods

- `capture(): Promise<void>` - Capture frame, switch to annotate mode
- `exportImage(options?: { includeLabels?: boolean }): string` - Export as data URL
- `exportAnnotations(): AnnotationData` - Export annotation data (JSON-serializable)
- `importAnnotations(data: AnnotationData): void` - Load annotation data
- `clearAnnotations(): void` - Remove all annotations

## Events

- `capture` -> `{ dataURL: string, width: number, height: number }`
- `annotate` -> `{ annotation: Annotation }`
- `annotation-change` -> `{ annotations: Annotation[] }`

## CSS Parts

- `base` - Outer layout container
- `canvas` - Canvas area (video + drawing surface)
- `toolbar` - Toolbar (capture/retake, undo, clear, export)
- `sidebar` - Sidebar (color palette + annotation labels)

## Basic Usage

```html
<snice-camera-annotate></snice-camera-annotate>
```

```typescript
import 'snice/components/camera-annotate/snice-camera-annotate';

// Save/load annotations
const data = annotator.exportAnnotations();
annotator.importAnnotations(data);

// Export image
const url = annotator.exportImage({ includeLabels: true });
```

## Accessibility

- Color swatches have title attributes
- Annotation toggles have descriptive titles
- Sidebar scrolls independently
