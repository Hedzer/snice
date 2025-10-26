# Camera Component

Live camera feed with built-in mobile-style controls and flexible positioning.

## Basic Usage

```html
<snice-camera id="camera"></snice-camera>

<script>
  const camera = document.getElementById('camera');

  // Auto-starts by default, but you can manually start
  await camera.start();

  // Capture photo
  const image = await camera.capture();
  console.log(image.dataURL);
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` | `boolean` | `true` | Auto-start camera on load |
| `facingMode` | `'user' \| 'environment'` | `'user'` | Front or back camera |
| `mirror` | `boolean` | `true` | Mirror video for front camera |
| `controlsPosition` | `ControlsPosition` | `'auto'` | Control button positioning |
| `showControls` | `boolean` | `true` | Show built-in controls |
| `width` | `number` | `1280` | Video width (resolution) |
| `height` | `number` | `720` | Video height (resolution) |
| `aspectRatio` | `string` | `''` | Aspect ratio: `'16:9'`, `'4:3'`, `'1:1'`, `'21:9'` |

## Control Positions

| Position | Description |
|----------|-------------|
| `'auto'` | Auto-detect: `bottom-right` (portrait), `right` (landscape) |
| **Corners** | |
| `'bottom-left'` | Bottom-left corner |
| `'bottom-right'` | Bottom-right corner |
| `'top-left'` | Top-left corner |
| `'top-right'` | Top-right corner |
| **Edges** | |
| `'bottom'` | Bottom edge (centered) |
| `'right'` | Right edge (centered) |
| `'left'` | Left edge (centered) |
| `'top'` | Top edge (centered) |

## Methods

### `start(): Promise<void>`
Start camera feed.

```javascript
await camera.start();
```

### `stop(): void`
Stop camera and release resources.

```javascript
camera.stop();
```

### `capture(): Promise<CapturedImage>`
Capture current frame as image.

```javascript
const image = await camera.capture();
// Returns: { dataURL, blob, width, height, timestamp }
```

### `switchCamera(): Promise<void>`
Toggle between front/back camera.

```javascript
await camera.switchCamera();
```

### `isActive(): boolean`
Check if camera is running.

```javascript
if (camera.isActive()) {
  // Camera is on
}
```

### `getStream(): MediaStream | null`
Get current media stream.

```javascript
const stream = camera.getStream();
```

### `enterFullscreen(): void`
Enter fullscreen mode.

```javascript
camera.enterFullscreen();
```

### `exitFullscreen(): void`
Exit fullscreen mode.

```javascript
camera.exitFullscreen();
```

### `toggleFullscreen(): void`
Toggle fullscreen mode.

```javascript
camera.toggleFullscreen();
```

## Events

### `@snice/camera-start`
Camera started successfully.

```javascript
camera.addEventListener('@snice/camera-start', (e) => {
  console.log('Camera on', e.detail.stream);
});
```

### `@snice/camera-stop`
Camera stopped.

```javascript
camera.addEventListener('@snice/camera-stop', () => {
  console.log('Camera off');
});
```

### `@snice/camera-capture`
Photo captured.

```javascript
camera.addEventListener('@snice/camera-capture', (e) => {
  const image = e.detail.image;
  console.log(image.dataURL);
});
```

### `@snice/camera-error`
Camera error occurred.

```javascript
camera.addEventListener('@snice/camera-error', (e) => {
  console.error(e.detail.error);
});
```

## Slots

### `controls`
Custom controls overlay area. Full viewport, positioned absolutely.

```html
<snice-camera>
  <div slot="controls" style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 8px 12px; border-radius: 4px;">
    LIVE
  </div>
</snice-camera>
```

## Examples

### Zero Config (Recommended)

```html
<snice-camera></snice-camera>
```

Auto-starts camera with controls at bottom-right (portrait) or right (landscape).

### Back Camera

```html
<snice-camera facing-mode="environment"></snice-camera>
```

### Control Positioning

```html
<!-- Bottom-left corner -->
<snice-camera controls-position="bottom-left"></snice-camera>

<!-- Right edge (centered) -->
<snice-camera controls-position="right"></snice-camera>

<!-- Top-right corner -->
<snice-camera controls-position="top-right"></snice-camera>
```

### No Mirror

```html
<snice-camera mirror="false"></snice-camera>
```

### Custom Resolution

```html
<!-- 4K -->
<snice-camera width="3840" height="2160"></snice-camera>

<!-- Full HD -->
<snice-camera width="1920" height="1080"></snice-camera>

<!-- VGA -->
<snice-camera width="640" height="480"></snice-camera>
```

### Aspect Ratios

```html
<!-- 16:9 widescreen -->
<snice-camera aspect-ratio="16:9"></snice-camera>

<!-- 4:3 classic -->
<snice-camera aspect-ratio="4:3"></snice-camera>

<!-- 1:1 square -->
<snice-camera aspect-ratio="1:1" width="1080" height="1080"></snice-camera>

<!-- 21:9 ultra-wide -->
<snice-camera aspect-ratio="21:9"></snice-camera>
```

### Fullscreen

```html
<snice-camera id="cam"></snice-camera>
<button onclick="document.getElementById('cam').toggleFullscreen()">
  Fullscreen
</button>
```

### Save Captured Image

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

### Photo Gallery

```javascript
const gallery = [];

camera.addEventListener('@snice/camera-capture', (e) => {
  gallery.push(e.detail.image);
  displayGallery();
});

function displayGallery() {
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  gallery.forEach(image => {
    const img = document.createElement('img');
    img.src = image.dataURL;
    img.width = 200;
    container.appendChild(img);
  });
}
```

### Custom Overlay Controls (With Built-in Controls)

```html
<snice-camera>
  <div slot="controls" class="my-controls">
    <div class="recording-indicator">● REC</div>
    <div class="timer">00:00</div>
  </div>
</snice-camera>

<style>
  .my-controls {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    color: white;
    font-size: 14px;
  }

  .recording-indicator {
    color: red;
    animation: blink 1s infinite;
  }
</style>
```

### Fully Custom Controls (No Built-in Controls)

```html
<snice-camera id="camera" show-controls="false">
  <div slot="controls" class="custom-controls">
    <button class="custom-capture" onclick="document.getElementById('camera').capture()">
      📷 Take Photo
    </button>
    <button class="custom-switch" onclick="document.getElementById('camera').switchCamera()">
      🔄 Flip
    </button>
  </div>
</snice-camera>

<style>
  .custom-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
  }

  .custom-capture, .custom-switch {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
  }
</style>
```

## Built-in Controls

The camera includes built-in mobile-style controls:

- **Capture button** (56px) - White circle with camera icon, positioned for thumb access
- **Switch camera button** (40px) - Auto-hides if only one camera available

Controls use Material Design-style icons and are positioned based on `controlsPosition`.

## Technical Details

- **Resolution**: Default 720p HD (1280x720) - configurable via `width`/`height`
- **Format**: JPEG at 0.92 quality
- **Mirror**: Automatically mirrors front camera video (can be disabled)
- **Orientation**: Auto-detects portrait/landscape for control positioning
- **Aspect Ratios**: Supports 16:9, 4:3, 1:1, 21:9 presets
- **Fullscreen**: Native browser fullscreen API support

## Security

- Requires HTTPS (or localhost for development)
- Requires user permission
- Permission prompts are browser-controlled
- Stream automatically stops on page unload

## Accessibility

- Keyboard navigation for controls
- Visual feedback for capture
- Error messaging

## Browser Support

- Modern browsers with getUserMedia API
- Requires camera hardware
- May not work on some mobile browsers
