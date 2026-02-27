# snice-camera-annotate

Image annotation component combining camera capture + freehand drawing + labeled annotations.

## Properties

```typescript
mode: 'camera' | 'annotate' = 'camera';
autoRotateColors: boolean = true;    // attribute: auto-rotate-colors
showLabelsPanel: boolean = true;     // attribute: show-labels-panel
```

## Methods

```typescript
capture(): Promise<void>;
exportImage(options?: { includeLabels?: boolean }): string;
exportAnnotations(): AnnotationData;
importAnnotations(data: AnnotationData): void;
clearAnnotations(): void;
```

## Events

```typescript
'capture'           → { dataURL: string; width: number; height: number }
'annotate'          → { annotation: Annotation }
'annotation-change' → { annotations: Annotation[] }
```

## Types

```typescript
interface Annotation {
  id: string;
  strokeId: string;
  label: string;
  color: string;
  visible: boolean;
  timestamp: number;
}

interface AnnotationData {
  annotations: Annotation[];
  strokes: AnnotationStroke[];
  imageWidth: number;
  imageHeight: number;
}

interface AnnotationStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
}
```

## Usage

```html
<!-- Default -->
<snice-camera-annotate></snice-camera-annotate>

<!-- No sidebar -->
<snice-camera-annotate show-labels-panel="false"></snice-camera-annotate>

<!-- Manual color selection -->
<snice-camera-annotate auto-rotate-colors="false"></snice-camera-annotate>
```

**CSS Parts:**
- `base` - Outer layout container div
- `canvas` - Canvas area containing video and drawing surface
- `toolbar` - Toolbar with capture/retake, undo, clear, export buttons
- `sidebar` - Sidebar panel with color palette and annotation labels

## Features

- Camera capture → freehand draw → label workflow
- 12-color preset palette with auto-rotation
- Sidebar labels linked to drawn shapes
- Hover label highlights shape, dims others (opacity 0.2 + grayscale)
- Show/hide individual and bulk annotations
- Export image with/without rendered labels
- Save/load annotation data (JSON)
- Undo last stroke
- Adjustable stroke width
