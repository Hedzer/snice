# snice-qr-reader

QR code scanner using device camera with real-time detection.

## Properties

```typescript
autoStart: boolean = false;         // attr: auto-start
camera: 'front'|'back' = 'back';
pickFirst: boolean = false;         // attr: pick-first, scan until first hit then stop
manualSnap: boolean = false;        // attr: manual-snap, photo snapshot mode
scanSpeed: number = 3;              // attr: scan-speed, 1-10 (ignored when pick-first)
tapStart: boolean = false;          // attr: tap-start, tap viewport to start/stop
```

## Methods

- `start()` - Start camera and scanning (async)
- `stop()` - Stop scanning and release camera
- `snap()` - Take snapshot, returns QR data string or null (async)
- `scanImage(file: File)` - Scan QR code from image file (async)
- `switchCamera()` - Toggle front/back camera

## Events

- `qr-scan` → `{ data: string, timestamp: number, reader }`
- `qr-error` → `{ error: any, reader }`
- `camera-ready` → `{ reader }`
- `camera-error` → `{ error: any, reader }`

## CSS Custom Properties

- `--qr-reader-bg` - Container background (`rgb(0 0 0)`)
- `--qr-reader-overlay` - Overlay/gradient color (`rgb(0 0 0 / 0.7)`)
- `--qr-reader-controls-color` - Button icon/text color (`rgb(255 255 255)`)
- `--qr-reader-btn-bg` - Button background (`rgb(0 0 0 / 0.4)`)
- `--qr-reader-btn-hover-bg` - Button hover background (`rgb(0 0 0 / 0.6)`)

## Basic Usage

```html
<!-- Auto-start continuous scanning -->
<snice-qr-reader auto-start></snice-qr-reader>

<!-- One-shot: scan until first hit -->
<snice-qr-reader pick-first></snice-qr-reader>

<!-- Manual snapshot mode -->
<snice-qr-reader manual-snap></snice-qr-reader>

<!-- Tap to start/stop -->
<snice-qr-reader tap-start></snice-qr-reader>
```

```typescript
reader.addEventListener('qr-scan', (e) => console.log(e.detail.data));
await reader.start();

// Manual snap
const result = await reader.snap();

// Scan from file
const data = await reader.scanImage(file);
```

## Accessibility

- Requires HTTPS for mobile camera access
- Built-in control buttons with icon labels
- Camera released on stop/dispose
