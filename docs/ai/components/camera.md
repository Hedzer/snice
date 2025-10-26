# snice-camera

Live camera feed with capture functionality.

## Properties

```typescript
autoStart: boolean = false;
facingMode: 'user'|'environment' = 'user';
resolution: 'qvga'|'vga'|'hd'|'full-hd'|'4k' = 'hd';
mirror: boolean = true;
showControls: boolean = true;
captureFormat: 'image/png'|'image/jpeg'|'image/webp' = 'image/jpeg';
captureQuality: number = 0.92;
```

## Methods

```typescript
start(): Promise<void>
stop(): void
capture(): Promise<CapturedImage>
switchCamera(): Promise<void>
isActive(): boolean
getStream(): MediaStream | null
getDevices(): Promise<MediaDeviceInfo[]>
selectDevice(deviceId: string): Promise<void>
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

- `@snice/camera-start` - Camera started (detail: { camera, stream })
- `@snice/camera-stop` - Camera stopped
- `@snice/camera-capture` - Photo captured (detail: { camera, image })
- `@snice/camera-switch` - Camera switched (detail: { camera, facingMode })
- `@snice/camera-error` - Error occurred (detail: { camera, error })

## Usage

```javascript
// Start camera
await camera.start();

// Capture photo
const image = await camera.capture();
// { dataURL, blob, width, height, timestamp }

// Switch camera
await camera.switchCamera();

// Stop
camera.stop();

// Select device
const devices = await camera.getDevices();
await camera.selectDevice(devices[0].deviceId);

// Events
camera.addEventListener('@snice/camera-capture', (e) => {
  const img = e.detail.image;
  console.log(img.dataURL);
});
```

```html
<snice-camera
  auto-start
  facing-mode="user"
  resolution="hd"
  mirror
  capture-format="image/jpeg"
  capture-quality="0.92">
</snice-camera>
```

## Resolutions

- qvga: 320x240
- vga: 640x480
- hd: 1280x720
- full-hd: 1920x1080
- 4k: 3840x2160

## Features

- Live camera feed
- Photo capture
- Front/back camera
- Multiple resolutions
- Device selection
- Mirror mode
- Built-in controls
- Error handling
- Requires HTTPS
