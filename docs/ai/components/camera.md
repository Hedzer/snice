# snice-camera

Live camera feed with built-in mobile-style controls.

## Properties

```typescript
autoStart: boolean = true;
facingMode: 'user'|'environment' = 'user';
mirror: boolean = true;
controlsPosition: ControlsPosition = 'auto';
showControls: boolean = true;
width: number = 1280;
height: number = 720;
aspectRatio: string = '';  // '16:9', '4:3', '1:1', '21:9'
```

## ControlsPosition

```typescript
type ControlsPosition =
  | 'auto'                    // Auto-detect (bottom-right portrait, right landscape)
  | 'bottom' | 'right' | 'left' | 'top'     // Edge positions
  | 'bottom-left' | 'bottom-right'          // Corner positions
  | 'top-left' | 'top-right';
```

## Methods

```typescript
start(): Promise<void>
stop(): void
capture(): Promise<CapturedImage>
switchCamera(): Promise<void>
isActive(): boolean
getStream(): MediaStream | null
enterFullscreen(): void
exitFullscreen(): void
toggleFullscreen(): void
```

## CapturedImage

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

- `@snice/camera-start` - Camera started (detail: { stream })
- `@snice/camera-stop` - Camera stopped
- `@snice/camera-capture` - Photo captured (detail: { image })
- `@snice/camera-error` - Error occurred (detail: { error })

## Slots

- `controls` - Custom controls overlay (full viewport, positioned absolutely)

## Usage

```html
<!-- Zero config -->
<snice-camera></snice-camera>

<!-- Custom position -->
<snice-camera controls-position="bottom-left"></snice-camera>

<!-- Back camera -->
<snice-camera facing-mode="environment"></snice-camera>

<!-- Custom controls overlay -->
<snice-camera>
  <div slot="controls" style="position: absolute; top: 10px; left: 10px;">
    LIVE
  </div>
</snice-camera>

<!-- Hide built-in controls, use only custom -->
<snice-camera show-controls="false">
  <div slot="controls" style="position: absolute; bottom: 20px; right: 20px;">
    <button onclick="this.closest('snice-camera').capture()">📷</button>
  </div>
</snice-camera>

<!-- 4K resolution -->
<snice-camera width="3840" height="2160"></snice-camera>

<!-- 16:9 aspect ratio -->
<snice-camera aspect-ratio="16:9"></snice-camera>

<!-- Square -->
<snice-camera aspect-ratio="1:1" width="1080" height="1080"></snice-camera>
```

```javascript
// Capture photo
const image = await camera.capture();
// { dataURL, blob, width, height, timestamp }

// Switch camera
await camera.switchCamera();

// Events
camera.addEventListener('@snice/camera-capture', (e) => {
  const img = e.detail.image;
  console.log(img.dataURL);
});

// Fullscreen
camera.toggleFullscreen();
```

## Features

- Auto-starts on load (default)
- Built-in mobile-style controls (Material Design icons)
- 720p HD quality (1280x720 hardcoded)
- Switch camera button (auto-hides if only one camera)
- Capture button with camera icon
- Auto-detect orientation for control positioning
- Corner and edge control positioning
- Mirror mode for front camera
- Slotted custom controls overlay
- Requires HTTPS
