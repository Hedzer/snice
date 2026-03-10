<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/camera.md -->

# Camera Component

Live camera feed with built-in mobile-style controls, flexible positioning, aspect ratio presets, and fullscreen support.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` (attr: `auto-start`) | `boolean` | `true` | Auto-start camera on load |
| `facingMode` (attr: `facing-mode`) | `'user' \| 'environment'` | `'user'` | Front or back camera |
| `mirror` | `boolean` | `true` | Mirror video for front camera |
| `controlsPosition` (attr: `controls-position`) | `ControlsPosition` | `'auto'` | Control button positioning |
| `showControls` (attr: `show-controls`) | `boolean` | `true` | Show built-in controls |
| `width` | `number` | `1280` | Video width (resolution) |
| `height` | `number` | `720` | Video height (resolution) |
| `aspectRatio` (attr: `aspect-ratio`) | `string` | `'auto'` | Aspect ratio: `'auto'`, `'16:9'`, `'9:16'`, `'4:3'`, `'1:1'`, `'21:9'` |
| `objectFit` (attr: `object-fit`) | `'contain' \| 'cover'` | `'cover'` | How video fits container |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `start()` | -- | `Promise<void>` | Start camera feed |
| `stop()` | -- | `void` | Stop camera and release resources |
| `capture()` | -- | `Promise<CapturedImage>` | Capture current frame as image |
| `switchCamera()` | -- | `Promise<void>` | Toggle between front/back camera |
| `isActive()` | -- | `boolean` | Check if camera is running |
| `getStream()` | -- | `MediaStream \| null` | Get current media stream |
| `enterFullscreen()` | -- | `void` | Enter fullscreen mode |
| `exitFullscreen()` | -- | `void` | Exit fullscreen mode |
| `toggleFullscreen()` | -- | `void` | Toggle fullscreen mode |

### CapturedImage

```typescript
interface CapturedImage {
  dataURL: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `camera-start` | `{ stream: MediaStream }` | Camera started successfully |
| `camera-stop` | -- | Camera stopped |
| `camera-capture` | `{ image: CapturedImage }` | Photo captured |
| `camera-error` | `{ error: Error }` | Camera error occurred |

## Slots

| Name | Description |
|------|-------------|
| `controls` | Custom controls overlay area. Full viewport, positioned absolutely. |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-camera-bg` | Camera background color | `rgb(0 0 0)` |
| `--snice-camera-overlay` | Controls gradient overlay color | `rgb(0 0 0 / 0.5)` |
| `--snice-camera-controls-color` | Controls icon and text color | `rgb(255 255 255)` |
| `--snice-camera-btn-bg` | Button background | `rgb(0 0 0 / 0.4)` |
| `--snice-camera-btn-hover-bg` | Button hover background | `rgb(0 0 0 / 0.6)` |
| `--snice-camera-capture-bg` | Capture button background | `rgb(255 255 255 / 0.95)` |
| `--snice-camera-capture-color` | Capture button icon color | `rgb(51 51 51)` |
| `--snice-camera-capture-hover-bg` | Capture button hover background | `rgb(255 255 255)` |
| `--snice-camera-flash-color` | Flash overlay color | `rgb(255 255 255)` |
| `--snice-camera-status-bg` | Status badge background | `rgb(0 0 0 / 0.7)` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer camera container holding the video feed |
| `controls` | Built-in control buttons area (capture and switch camera) |

## Basic Usage

```html
<snice-camera></snice-camera>
```

```typescript
import 'snice/components/camera/snice-camera';

const image = await camera.capture();
console.log(image.dataURL);
```

## Examples

### Back Camera

Use `facing-mode="environment"` to activate the rear camera on mobile devices.

```html
<snice-camera facing-mode="environment"></snice-camera>
```

### Control Positioning

Use `controls-position` to place the built-in controls at different locations.

```html
<snice-camera controls-position="bottom-left"></snice-camera>
<snice-camera controls-position="right"></snice-camera>
<snice-camera controls-position="top-right"></snice-camera>
```

### Aspect Ratios

Use `aspect-ratio` to constrain the camera display shape.

```html
<snice-camera aspect-ratio="16:9"></snice-camera>
<snice-camera aspect-ratio="1:1" width="1080" height="1080"></snice-camera>
<snice-camera aspect-ratio="9:16" object-fit="cover" width="720" height="1280"></snice-camera>
```

### Custom Resolution

Use `width` and `height` to request a specific camera resolution.

```html
<snice-camera width="3840" height="2160"></snice-camera>
<snice-camera width="1920" height="1080"></snice-camera>
```

### Fullscreen

Use the fullscreen methods for immersive camera views.

```html
<snice-camera id="cam"></snice-camera>
<button onclick="document.getElementById('cam').toggleFullscreen()">Fullscreen</button>
```

### Custom Overlay Controls

Use the `controls` slot to add custom overlays alongside or instead of the built-in controls.

```html
<snice-camera>
  <div slot="controls" style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 8px 12px; border-radius: 4px;">
    LIVE
  </div>
</snice-camera>
```

### Fully Custom Controls

Set `show-controls="false"` and use the `controls` slot for complete control customization.

```html
<snice-camera id="camera" show-controls="false">
  <div slot="controls" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px;">
    <button onclick="document.getElementById('camera').capture()">Take Photo</button>
    <button onclick="document.getElementById('camera').switchCamera()">Flip</button>
  </div>
</snice-camera>
```

### Save Captured Image

Use the `capture()` method to get images for download or upload.

```javascript
const image = await camera.capture();

// Download
const a = document.createElement('a');
a.href = image.dataURL;
a.download = `photo-${image.timestamp}.jpg`;
a.click();

// Upload to server
const formData = new FormData();
formData.append('photo', image.blob, 'photo.jpg');
await fetch('/upload', { method: 'POST', body: formData });
```

## Accessibility

- Keyboard navigation for controls
- Visual feedback for capture
- Error messaging
