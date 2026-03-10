<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/qr-reader.md -->

# QR Reader

A QR code scanner using device cameras with real-time detection.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` (attr: `auto-start`) | `boolean` | `false` | Auto-start scanning on mount |
| `camera` | `'front' \| 'back'` | `'back'` | Which camera to use |
| `pickFirst` (attr: `pick-first`) | `boolean` | `false` | Scan at max speed until first hit, then auto-stop |
| `manualSnap` (attr: `manual-snap`) | `boolean` | `false` | Photo snapshot mode instead of continuous scanning |
| `scanSpeed` (attr: `scan-speed`) | `number` | `3` | Scan speed 1-10 (higher = more CPU, ignored with `pick-first`) |
| `tapStart` (attr: `tap-start`) | `boolean` | `false` | Tap viewport to toggle scanning on/off |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `start()` | — | Start camera and begin scanning (async) |
| `stop()` | — | Stop scanning and release camera |
| `snap()` | — | Take snapshot and scan for QR code (async, returns data string or `null`) |
| `scanImage()` | `file: File` | Scan a QR code from an image file (async, returns data string) |
| `switchCamera()` | — | Toggle between front and back camera |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `qr-scan` | `{ data: string, timestamp: number, reader }` | QR code successfully detected |
| `qr-error` | `{ error: any, reader }` | Scan error occurred |
| `camera-ready` | `{ reader }` | Camera initialized and ready |
| `camera-error` | `{ error: any, reader }` | Camera initialization failed |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--qr-reader-bg` | Container and viewport background | `rgb(0 0 0)` |
| `--qr-reader-overlay` | Overlay and gradient color | `rgb(0 0 0 / 0.7)` |
| `--qr-reader-controls-color` | Button icon and text color | `rgb(255 255 255)` |
| `--qr-reader-btn-bg` | Button background | `rgb(0 0 0 / 0.4)` |
| `--qr-reader-btn-hover-bg` | Button hover background | `rgb(0 0 0 / 0.6)` |

## Basic Usage

```typescript
import 'snice/components/qr-reader/snice-qr-reader';
```

```html
<snice-qr-reader auto-start></snice-qr-reader>
```

```typescript
reader.addEventListener('qr-scan', (e) => {
  console.log('QR Code:', e.detail.data);
});
```

## Examples

### Auto-Start

Set `auto-start` to begin scanning when the component mounts.

```html
<snice-qr-reader auto-start></snice-qr-reader>
```

### Manual Control

Start and stop scanning programmatically.

```html
<snice-qr-reader></snice-qr-reader>
```

```typescript
await reader.start();
reader.stop();
```

### Pick-First (One-Shot)

Set `pick-first` to scan at maximum speed until the first QR code is found, then auto-stop.

```html
<snice-qr-reader pick-first></snice-qr-reader>
```

```typescript
reader.addEventListener('qr-scan', (e) => {
  console.log('Found:', e.detail.data);
  // Scanner stops and releases camera automatically
});
await reader.start();
```

### Manual Snapshot

Set `manual-snap` for a photo-based scanning mode with a manual trigger button.

```html
<snice-qr-reader manual-snap></snice-qr-reader>
```

```typescript
await reader.start(); // Opens camera viewfinder
const result = await reader.snap();
console.log(result ? `Found: ${result}` : 'No QR code found');
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

Set `tap-start` to let users tap the viewport to toggle scanning.

```html
<snice-qr-reader tap-start></snice-qr-reader>
```

### Scan from Image File

Use `scanImage()` to detect a QR code from an uploaded image.

```typescript
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const result = await reader.scanImage(e.target.files[0]);
  console.log('Found:', result);
});
```

### Error Handling

Listen for error events to handle camera and scan failures.

```typescript
reader.addEventListener('camera-error', (e) => {
  console.error('Camera error:', e.detail.error);
});

reader.addEventListener('qr-error', (e) => {
  console.error('Scan error:', e.detail.error);
});
```

## Accessibility

- Requires HTTPS for camera access on mobile devices
- Built-in start/stop/snap buttons with icon labels
- Camera is released when the component is disconnected or scanning is stopped
- Visual feedback shown for scan results and errors
