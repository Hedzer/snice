<!-- AI: For a low-token version of this doc, use docs/ai/components/qr-reader.md instead -->

# QR Reader
`<snice-qr-reader>`

A QR code scanner using device cameras with WebAssembly-based detection.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/qr-reader/snice-qr-reader';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-qr-reader.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` (attr: `auto-start`) | `boolean` | `false` | Auto-start scanning on mount |
| `camera` | `'front' \| 'back'` | `'back'` | Which camera to use |
| `pickFirst` (attr: `pick-first`) | `boolean` | `false` | Scan until first hit, then stop |
| `manualSnap` (attr: `manual-snap`) | `boolean` | `false` | Photo snapshot mode |
| `scanSpeed` (attr: `scan-speed`) | `number` | `3` | Scan speed 1-10 (ignored with pick-first) |
| `tapStart` (attr: `tap-start`) | `boolean` | `false` | Tap viewport to toggle scanning |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `start()` | -- | Start camera and scanning |
| `stop()` | -- | Stop scanning and release camera |
| `snap()` | -- | Take snapshot (manual-snap mode), returns data or null |
| `scanImage()` | `file: File` | Scan QR code from an image file |
| `switchCamera()` | -- | Toggle between front and back camera |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `qr-scan` | `{ data: string, timestamp: number, reader }` | QR code detected |
| `qr-error` | `{ error: any, reader }` | Scan error occurred |
| `camera-ready` | `{ reader }` | Camera initialized |
| `camera-error` | `{ error: any, reader }` | Camera initialization failed |

## Basic Usage

```typescript
import 'snice/components/qr-reader/snice-qr-reader';
```

```html
<snice-qr-reader auto-start></snice-qr-reader>

<script type="module">
  document.querySelector('snice-qr-reader').addEventListener('qr-scan', (e) => {
    console.log('QR Code:', e.detail.data);
  });
</script>
```

## Examples

### Auto-Start

Set `auto-start` to begin scanning when the component mounts.

```html
<snice-qr-reader auto-start></snice-qr-reader>
```

### Manual Control

```html
<snice-qr-reader id="reader"></snice-qr-reader>
<button onclick="document.getElementById('reader').start()">Start</button>
<button onclick="document.getElementById('reader').stop()">Stop</button>
```

### Pick-First (One-Shot)

Set `pick-first` to scan at maximum speed until the first QR code is found, then auto-stop.

```html
<snice-qr-reader id="scanner" pick-first></snice-qr-reader>

<script type="module">
  const scanner = document.getElementById('scanner');
  scanner.addEventListener('qr-scan', (e) => {
    console.log('Found:', e.detail.data);
    // Scanner stops and releases camera automatically
  });
  scanner.start();
</script>
```

### Manual Snapshot

Set `manual-snap` for a photo-based scanning mode with manual trigger.

```html
<snice-qr-reader id="snapReader" manual-snap></snice-qr-reader>
<button id="snapBtn">Take Photo</button>

<script type="module">
  const reader = document.getElementById('snapReader');
  reader.start(); // Opens camera viewfinder

  document.getElementById('snapBtn').addEventListener('click', async () => {
    const result = await reader.snap();
    console.log(result ? `Found: ${result}` : 'No QR code found');
  });
</script>
```

### Front Camera

Use `camera="front"` for self-scanning scenarios.

```html
<snice-qr-reader camera="front" auto-start></snice-qr-reader>
```

### Scan Speed

Use `scan-speed` (1-10) to balance detection speed vs CPU usage.

```html
<snice-qr-reader scan-speed="1" auto-start></snice-qr-reader>
<snice-qr-reader scan-speed="10" auto-start></snice-qr-reader>
```

### Tap to Start

Set `tap-start` to let users click the viewport to toggle scanning.

```html
<snice-qr-reader tap-start></snice-qr-reader>
```

### Error Handling

```typescript
const reader = document.querySelector('snice-qr-reader');

reader.addEventListener('qr-error', (e) => {
  console.error('Scan error:', e.detail.error);
});

reader.addEventListener('camera-error', (e) => {
  console.error('Camera error:', e.detail.error);
});

reader.addEventListener('camera-ready', () => {
  console.log('Camera initialized');
});
```
