# QR Reader Component

`<snice-qr-reader>` provides QR code scanning functionality using device cameras with WebAssembly-based QR detection.

## Features

- **Camera Access**: Use front or back camera for QR code scanning
- **Real-time Detection**: Continuous scanning with ZXing WASM decoder
- **Auto-start**: Optional automatic camera activation on mount
- **Event-based**: Emits events for successful scans, errors, and camera status
- **Responsive**: Adapts to container size with proper aspect ratio
- **Configurable Speed**: Adjust scan speed for performance vs detection speed trade-off

## Basic Usage

```html
<snice-qr-reader auto-start></snice-qr-reader>

<script>
  const reader = document.querySelector('snice-qr-reader');

  reader.addEventListener('@snice/qr-scan', (event) => {
    console.log('QR Code:', event.detail.data);
  });
</script>
```

## Properties

### `auto-start`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically start scanning when component is mounted

```html
<snice-qr-reader auto-start></snice-qr-reader>
```

### `camera`
- **Type**: `'front' | 'back'`
- **Default**: `'back'`
- **Description**: Which camera to use for scanning

```html
<snice-qr-reader camera="front"></snice-qr-reader>
```

### `pick-first`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Scan continuously at maximum speed until first successful QR code detection, then stop and shut down camera. Ignores `scan-speed` setting.

```html
<!-- Scan at max speed until first QR hit, then stop -->
<snice-qr-reader pick-first></snice-qr-reader>
```

### `manual-snap`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Photo snapshot mode. Opens camera as a live viewfinder, and you manually trigger snapshot attempts by clicking the snap button.

```html
<!-- Manual photo snapshot mode -->
<snice-qr-reader manual-snap></snice-qr-reader>
```

### `scan-speed`
- **Type**: `number`
- **Default**: `3`
- **Description**: Scan speed from 1-10. Higher values = faster QR detection but more CPU usage. Lower values = slower detection but better performance. **Note**: Ignored when `pick-first` is enabled (always scans at max speed).

```html
<!-- Slow scan (better performance) -->
<snice-qr-reader scan-speed="1"></snice-qr-reader>

<!-- Medium scan (balanced, default) -->
<snice-qr-reader scan-speed="3"></snice-qr-reader>

<!-- Fast scan (faster detection) -->
<snice-qr-reader scan-speed="10"></snice-qr-reader>
```

### `tap-start`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable tap/click interaction on the camera viewport to start/stop scanning. When enabled, clicking or tapping anywhere on the video preview will toggle scanning on/off.

```html
<!-- Enable tap to start/stop -->
<snice-qr-reader tap-start></snice-qr-reader>
```

## Methods

### `start()`
Start the camera and begin scanning for QR codes (or open camera for manual-snap mode).

```javascript
const reader = document.querySelector('snice-qr-reader');
reader.start();
```

### `stop()`
Stop scanning and release the camera.

```javascript
reader.stop();
```

### `snap()`
Take a snapshot and check for QR codes (manual-snap mode only).

```javascript
const result = await reader.snap(); // Returns QR data or null
```

## Events

### `@snice/qr-scan`
Fired when a QR code is successfully detected.

**Detail Properties:**
- `data` (string): The decoded QR code content
- `timestamp` (number): Unix timestamp of the scan
- `reader` (SniceQRReader): Reference to the component

```javascript
reader.addEventListener('@snice/qr-scan', (event) => {
  console.log('Data:', event.detail.data);
  console.log('Time:', new Date(event.detail.timestamp));
});
```

### `@snice/qr-error`
Fired when an error occurs during scanning.

**Detail Properties:**
- `error` (any): Error object or message
- `reader` (SniceQRReader): Reference to the component

```javascript
reader.addEventListener('@snice/qr-error', (event) => {
  console.error('Error:', event.detail.error);
});
```

### `@snice/camera-ready`
Fired when the camera has been successfully initialized and is ready to scan.

**Detail Properties:**
- `reader` (SniceQRReader): Reference to the component

```javascript
reader.addEventListener('@snice/camera-ready', (event) => {
  console.log('Camera is ready');
});
```

### `@snice/camera-error`
Fired when camera initialization fails.

**Detail Properties:**
- `error` (any): Error object or message
- `reader` (SniceQRReader): Reference to the component

```javascript
reader.addEventListener('@snice/camera-error', (event) => {
  console.error('Camera error:', event.detail.error);
});
```

## Examples

### Manual Control

```html
<snice-qr-reader id="reader"></snice-qr-reader>
<button onclick="startReading()">Start</button>
<button onclick="stopReading()">Stop</button>
<div id="result"></div>

<script>
  const reader = document.getElementById('reader');
  const result = document.getElementById('result');

  function startReading() {
    reader.start();
  }

  function stopReading() {
    reader.stop();
  }

  reader.addEventListener('@snice/qr-scan', (e) => {
    result.textContent = `Scanned: ${e.detail.data}`;
  });
</script>
```

### Pick-First (One-Shot)

```html
<snice-qr-reader id="scanner" pick-first></snice-qr-reader>

<script>
  const scanner = document.getElementById('scanner');

  scanner.addEventListener('@snice/qr-scan', (e) => {
    // Process the scan
    processQRCode(e.detail.data);

    // Scanner automatically stops and shuts down camera
  });

  // Start scanning at max speed
  scanner.start();
</script>
```

### Manual Snapshot

```html
<snice-qr-reader id="snapReader" manual-snap></snice-qr-reader>
<button id="snapBtn">Take Photo</button>

<script>
  const reader = document.getElementById('snapReader');
  const btn = document.getElementById('snapBtn');

  // Open camera
  reader.start();

  // Manually trigger snapshot
  btn.addEventListener('click', async () => {
    const result = await reader.snap();
    if (result) {
      console.log('QR Code:', result);
    } else {
      console.log('No QR code found');
    }
  });
</script>
```

### Front Camera

```html
<snice-qr-reader camera="front" auto-start></snice-qr-reader>

<script>
  // Useful for self-scanning scenarios
  document.querySelector('snice-qr-reader')
    .addEventListener('@snice/qr-scan', (e) => {
      validateTicket(e.detail.data);
    });
</script>
```

### Error Handling

```html
<snice-qr-reader id="reader" auto-start></snice-qr-reader>
<div id="status"></div>

<script>
  const reader = document.getElementById('reader');
  const status = document.getElementById('status');

  reader.addEventListener('@snice/qr-scan', (e) => {
    status.textContent = `✓ Scanned: ${e.detail.data}`;
    status.style.color = 'green';
  });

  reader.addEventListener('@snice/qr-error', (e) => {
    status.textContent = `✗ Error: ${e.detail.error}`;
    status.style.color = 'red';

    // Retry after error
    setTimeout(() => reader.start(), 2000);
  });
</script>
```

## Styling

The component uses CSS custom properties for theming:

```css
snice-qr-reader {
  --qr-reader-border: var(--snice-color-border, #e5e7eb);
  --qr-reader-bg: var(--snice-color-bg, #ffffff);
  --qr-reader-text: var(--snice-color-text, #1f2937);

  /* Size */
  width: 100%;
  max-width: 600px;
}
```

## Browser Support

- Requires `getUserMedia` API support
- Uses WebAssembly for QR detection (ZXing)
- Works on modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browser camera access requires HTTPS

## Implementation Details

### QR Detection
Uses ZXing-C++ WebAssembly build for fast, accurate QR code detection:
- **License**: Apache 2.0 (ZXing-C++) + MIT (zxing-wasm)
- **Format Support**: QR Code, Micro QR Code
- **Performance**: ~60fps scanning on modern devices

### Camera Management
- Requests user permission for camera access
- Automatically releases camera when component is destroyed
- Handles camera errors gracefully with fallback messages

### Privacy
- Camera feed stays in the browser (no uploads)
- QR data is only emitted via events
- Camera is released when scanning stops

## Related Components

- `<snice-qr-code>` - Generate QR codes
- `<snice-camera>` - General camera capture component

## License

QR detection powered by:
- **ZXing-C++**: Apache License 2.0
- **zxing-wasm**: MIT License

See `components/qr-reader/ZXING-LICENSE` for full license text.
