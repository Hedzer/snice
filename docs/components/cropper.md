<!-- AI: For a low-token version of this doc, use docs/ai/components/cropper.md instead -->

# Cropper Component

The cropper component provides an image cropping tool with a draggable and resizable crop area, rotation, zoom controls, optional aspect ratio locking, and a rule-of-thirds grid overlay. It outputs cropped images as Blob objects in PNG, JPEG, or WebP format.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-cropper src="/photo.jpg"></snice-cropper>
```

```typescript
import 'snice/components/cropper/snice-cropper';
```

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
| `reset()` | -- | `void` | Reset rotation, zoom, and crop area to their defaults |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `crop-change` | `{ rect: { x: number, y: number, width: number, height: number } }` | Fired when the crop area is moved or resized |
| `crop-complete` | `{ blob: Blob \| null }` | Fired after `crop()` produces the output blob |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--snice-color-background-element` | Container background color |
| `--snice-color-border` | Container border color |
| `--snice-border-radius-lg` | Container border radius |

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
      window.open(url); // Preview the cropped image
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
<snice-cropper id="editor" src="/photos/vacation.jpg" aspect-ratio="0"></snice-cropper>

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

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer cropper container |
| `image-container` | `<div>` | Image display area |
| `crop-area` | `<div>` | Draggable/resizable crop region with handles |

```css
snice-cropper::part(base) {
  border: 2px solid #ccc;
  border-radius: 12px;
}

snice-cropper::part(crop-area) {
  border-color: #3b82f6;
}
```

## Accessibility

- **Drag interaction**: The crop area can be repositioned by dragging, and resized via 8 corner and edge handles
- **Rule-of-thirds grid**: An overlay grid helps with composition alignment
- **Visual feedback**: A dark mask outside the crop area clearly indicates the cropped region
- **Aspect ratio enforcement**: When `aspectRatio` is set, resize handles maintain the locked ratio automatically
