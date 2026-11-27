# snice-camera-annotate

Camera capture + freehand drawing + labeled annotations.

## Properties

```typescript
mode: 'camera' | 'annotate' = 'camera';
autoStart: boolean = false;           // attribute: auto-start
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
- `main` - Main column holding the canvas area and toolbar
- `video` - The live `<video>` preview
- `draw-canvas` - The `<canvas>` drawing surface
- `control-group` - A grouped run of toolbar controls
- `separator` - Vertical separator between toolbar groups
- `button` - Any labelled toolbar button
- `primary-button` - Added to `button` on the capture/retake button
- `undo-button` - Added to `button` on the undo button
- `clear-button` - Added to `button` on the clear-all button
- `export-button` - Added to `button` on the export button
- `icon-button` - Any icon-only button
- `toggle-all-button` - Added to `icon-button` on the toggle-all-annotations button
- `visibility-button` - Added to `icon-button` on an annotation visibility toggle
- `visibility-button-off` - Added to `visibility-button` while its annotation is hidden
- `delete-button` - Added to `icon-button` on an annotation delete button
- `icon` - The `<svg>` glyph inside a button
- `primary-icon` - Added to `icon` in the capture/retake button
- `undo-icon` - Added to `icon` in the undo button
- `clear-icon` - Added to `icon` in the clear-all button
- `export-icon` - Added to `icon` in the export button
- `toggle-all-icon` - Added to `icon` in the toggle-all button
- `visibility-icon` - Added to `icon` in a visibility toggle
- `delete-icon` - Added to `icon` in a delete button
- `input` - Any `<input>` control
- `stroke-width-label` - Stroke-width label wrapper in the toolbar
- `stroke-width-input` - Added to `input` on the stroke-width field
- `sidebar-hidden` - Added to `sidebar` while the labels panel is hidden
- `sidebar-header` - Sidebar header row
- `sidebar-title` - Sidebar title text
- `color-section` - Color palette section
- `color-palette` - Swatch grid
- `color-swatch` - One color swatch
- `color-swatch-active` - Added to `color-swatch` for the active color
- `auto-rotate` - Auto-rotate-colors label wrapper
- `auto-rotate-input` - Added to `input` on the auto-rotate checkbox
- `annotation-list` - Annotation list container
- `empty` - Empty-state message in the annotation list
- `annotation-item` - One annotation row
- `annotation-item-highlighted` - Added to `annotation-item` while highlighted
- `annotation-color` - Color chip on an annotation row
- `annotation-label` - Label field wrapper on an annotation row
- `annotation-label-input` - Added to `input` on the annotation label field
- `annotation-actions` - Action buttons on an annotation row

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
