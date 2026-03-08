# snice-qr-reader

QR code scanner using device camera and ZXing WASM decoder.

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

- `start()` - Start camera and scanning
- `stop()` - Stop scanning and release camera
- `snap()` - Take snapshot (manual-snap mode), returns QR data or null
- `scanImage(file: File)` - Scan QR code from image file
- `switchCamera()` - Toggle front/back camera

## Events

- `qr-scan` → `{ data: string, timestamp: number, reader }`
- `qr-error` → `{ error: any, reader }`
- `camera-ready` → `{ reader }`
- `camera-error` → `{ error: any, reader }`

## Usage

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
reader.start();

// Manual snap
const result = await reader.snap();
```

## CSS Custom Properties

- `--qr-reader-bg` - Container background (default: `rgb(0 0 0)`)
- `--qr-reader-overlay` - Overlay/gradient color (default: `rgb(0 0 0 / 0.7)`)
- `--qr-reader-controls-color` - Button icon/text color (default: `rgb(255 255 255)`)
- `--qr-reader-btn-bg` - Button background (default: `rgb(0 0 0 / 0.4)`)
- `--qr-reader-btn-hover-bg` - Button hover background (default: `rgb(0 0 0 / 0.6)`)

## Features

- ZXing WASM decoder (Apache 2.0 + MIT)
- Web Worker for non-blocking detection
- Front/back camera switching
- Configurable scan speed (1-10)
- Pick-first mode (max speed, auto-stop)
- Manual snapshot mode
- Tap-to-start interaction
- Camera released on stop/dispose
- HTTPS required for mobile
