# snice-cropper

Image cropping component with draggable/resizable crop area, rotation, zoom, aspect ratio lock, and rule-of-thirds grid.

## Properties

```ts
src: string = ''                              // attr: src — Image URL to crop
aspectRatio: number = 0                       // attr: aspect-ratio — Lock ratio (0 = free, e.g. 1.777 for 16:9)
minWidth: number = 20                         // attr: min-width — Min crop width in px
minHeight: number = 20                        // attr: min-height — Min crop height in px
outputType: CropperOutputType = 'png'         // attr: output-type — 'png' | 'jpeg' | 'webp'
```

## Events

- `crop-change` -> `{ rect: { x: number, y: number, width: number, height: number } }` — Fires on crop area move/resize
- `crop-complete` -> `{ blob: Blob | null }` — Fires after `crop()` produces output

## Methods

- `crop(): Promise<Blob | null>` — Produce cropped image blob
- `rotate(degrees: number): void` — Rotate image by degrees (cumulative)
- `zoom(level: number): void` — Set zoom level (0.1 to 10)
- `reset(): void` — Reset rotation, zoom, and crop area to defaults

## CSS Custom Properties

```css
--snice-color-background-element  /* Container background */
--snice-color-border              /* Container border */
--snice-border-radius-lg          /* Container radius */
```

**CSS Parts:**
- `base` - Outer cropper container div
- `image-container` - Image display area
- `crop-area` - Draggable/resizable crop region

## Behavior

- Crop area is draggable (move) and resizable via 8 corner/edge handles
- Rule-of-thirds grid overlay on crop area
- Dark mask outside crop area
- Aspect ratio enforced on resize when `aspectRatio > 0`

## Usage

```html
<snice-cropper src="/photo.jpg" aspect-ratio="1" output-type="jpeg"></snice-cropper>
```

```js
const cropper = document.querySelector('snice-cropper');
const blob = await cropper.crop();

// Rotate 90 degrees clockwise
cropper.rotate(90);

// Zoom in
cropper.zoom(1.5);
```
