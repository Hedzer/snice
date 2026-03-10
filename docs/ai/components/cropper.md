# snice-cropper

Image cropping with draggable/resizable crop area, rotation, zoom, aspect ratio lock, and rule-of-thirds grid.

## Properties

```typescript
src: string = '';                                    // Image URL
aspectRatio: number = 0;                             // attribute: aspect-ratio (0 = free, 1 = square, 1.777 = 16:9)
minWidth: number = 20;                               // attribute: min-width
minHeight: number = 20;                              // attribute: min-height
outputType: 'png'|'jpeg'|'webp' = 'png';           // attribute: output-type
```

## Methods

- `crop(): Promise<Blob | null>` - Produce cropped image blob
- `rotate(degrees: number)` - Rotate image (cumulative)
- `zoom(level: number)` - Set zoom level (0.1 to 10)
- `reset()` - Reset rotation, zoom, and crop area

## Events

- `crop-change` -> `{ rect: { x, y, width, height } }` - Crop area moved/resized
- `crop-complete` -> `{ blob: Blob | null }` - After crop() produces output

## CSS Custom Properties

```css
--snice-color-background-element  /* Container background */
--snice-color-border              /* Container border */
--snice-border-radius-lg          /* Container radius */
--cropper-overlay                 /* Overlay mask color (default: rgb(0 0 0 / 0.5)) */
--cropper-border-color            /* Crop area border (default: rgb(255 255 255)) */
--cropper-guide-color             /* Guide lines (default: rgb(255 255 255 / 0.4)) */
--cropper-handle-color            /* Handle fill (default: rgb(255 255 255)) */
--cropper-handle-border           /* Handle border (default: rgb(0 0 0 / 0.3)) */
```

## CSS Parts

- `base` - Outer cropper container
- `image-container` - Image display area
- `crop-area` - Draggable/resizable crop region

## Basic Usage

```html
<snice-cropper src="/photo.jpg" aspect-ratio="1" output-type="jpeg"></snice-cropper>
```

```typescript
import 'snice/components/cropper/snice-cropper';

const blob = await cropper.crop();
cropper.rotate(90);
cropper.zoom(1.5);
cropper.reset();
```

## Accessibility

- Drag to reposition, 8 handles to resize
- Rule-of-thirds grid overlay
- Dark mask indicates crop region
- Aspect ratio enforced on resize when set
