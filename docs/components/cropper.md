<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/cropper.md -->

# Cropper Component

An image cropping tool with a draggable and resizable crop area, rotation, zoom controls, optional aspect ratio locking, and a rule-of-thirds grid overlay. Outputs cropped images as Blob objects in PNG, JPEG, or WebP format.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | URL of the image to crop |
| `aspectRatio` (attr: `aspect-ratio`) | `number` | `0` | Lock the crop area to a specific aspect ratio. `0` means free-form. Use `1` for square, `1.777` for 16:9, etc. |
| `minWidth` (attr: `min-width`) | `number` | `20` | Minimum crop area width in pixels |
| `minHeight` (attr: `min-height`) | `number` | `20` | Minimum crop area height in pixels |
| `outputType` (attr: `output-type`) | `'png' \| 'jpeg' \| 'webp'` | `'png'` | Output image format |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `crop()` | -- | `Promise<Blob \| null>` | Produce a cropped image Blob from the current crop area |
| `rotate()` | `degrees: number` | `void` | Rotate the image by the given degrees (cumulative) |
| `zoom()` | `level: number` | `void` | Set the zoom level (range: 0.1 to 10) |
| `reset()` | -- | `void` | Reset rotation, zoom, and crop area to defaults |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `crop-change` | `{ rect: { x: number, y: number, width: number, height: number } }` | Fired when the crop area is moved or resized |
| `crop-complete` | `{ blob: Blob \| null }` | Fired after `crop()` produces the output blob |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-background-element` | Container background color | `rgb(252 251 249)` |
| `--snice-color-border` | Container border color | `rgb(226 226 226)` |
| `--snice-border-radius-lg` | Container border radius | `0.5rem` |
| `--cropper-overlay` | Overlay mask color outside crop area | `rgb(0 0 0 / 0.5)` |
| `--cropper-border-color` | Crop area border color | `rgb(255 255 255)` |
| `--cropper-guide-color` | Rule-of-thirds guide line color | `rgb(255 255 255 / 0.4)` |
| `--cropper-handle-color` | Resize handle fill color | `rgb(255 255 255)` |
| `--cropper-handle-border` | Resize handle border color | `rgb(0 0 0 / 0.3)` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer cropper container |
| `image-container` | Image display area |
| `crop-area` | Draggable/resizable crop region with handles |

```css
snice-cropper::part(base) {
  border: 2px solid #ccc;
  border-radius: 12px;
}

snice-cropper::part(crop-area) {
  border-color: #3b82f6;
}
```

## Basic Usage

```html
<snice-cropper src="/photo.jpg"></snice-cropper>
```

```typescript
import 'snice/components/cropper/snice-cropper';
```

## Examples

### Basic Image Cropping

Load an image and let the user crop it freely.

```html
<snice-cropper id="my-cropper" src="/photos/landscape.jpg"></snice-cropper>

<button onclick="handleCrop()">Crop Image</button>

<script type="module">
  import 'snice/components/cropper/snice-cropper';

  async function handleCrop() {
    const cropper = document.getElementById('my-cropper');
    const blob = await cropper.crop();
    if (blob) {
      const url = URL.createObjectURL(blob);
      window.open(url);
    }
  }
  window.handleCrop = handleCrop;
</script>
```

### Square Crop with Aspect Ratio Lock

Use `aspect-ratio="1"` to enforce a square crop area, useful for profile photos.

```html
<snice-cropper
  src="/photos/portrait.jpg"
  aspect-ratio="1"
  output-type="jpeg">
</snice-cropper>
```

### 16:9 Crop for Video Thumbnails

Lock to a widescreen aspect ratio for video thumbnails or banner images.

```html
<snice-cropper
  src="/photos/wide-shot.jpg"
  aspect-ratio="1.777"
  output-type="webp"
  min-width="160"
  min-height="90">
</snice-cropper>
```

### Rotation and Zoom Controls

Use the `rotate()` and `zoom()` methods for image adjustment.

```html
<snice-cropper id="editor" src="/photos/vacation.jpg"></snice-cropper>

<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
  <button onclick="document.getElementById('editor').rotate(-90)">Rotate Left</button>
  <button onclick="document.getElementById('editor').rotate(90)">Rotate Right</button>
  <button onclick="document.getElementById('editor').zoom(1.5)">Zoom In</button>
  <button onclick="document.getElementById('editor').zoom(0.8)">Zoom Out</button>
  <button onclick="document.getElementById('editor').reset()">Reset</button>
</div>
```

### Listening to Crop Changes

Track the crop area position and dimensions in real time.

```html
<snice-cropper id="tracked-cropper" src="/photos/product.jpg"></snice-cropper>
<p id="crop-info">Move the crop area...</p>

<script type="module">
  const cropper = document.getElementById('tracked-cropper');
  const info = document.getElementById('crop-info');

  cropper.addEventListener('crop-change', (e) => {
    const { x, y, width, height } = e.detail.rect;
    info.textContent = `Position: (${x}, ${y}) Size: ${width} x ${height}`;
  });
</script>
```

## Accessibility

- Drag interaction: The crop area can be repositioned by dragging, and resized via 8 corner and edge handles
- Rule-of-thirds grid overlay helps with composition alignment
- Dark mask outside the crop area clearly indicates the cropped region
- When `aspectRatio` is set, resize handles maintain the locked ratio automatically
