# snice-camera

Live camera feed with built-in mobile-style controls.

## Properties

```typescript
autoStart: boolean = true;                    // attribute: auto-start
facingMode: 'user'|'environment' = 'user';    // attribute: facing-mode
mirror: boolean = true;
controlsPosition: ControlsPosition = 'auto';  // attribute: controls-position
showControls: boolean = true;                  // attribute: show-controls
width: number = 1280;
height: number = 720;
aspectRatio: string = 'auto';                  // attribute: aspect-ratio — 'auto','16:9','9:16','4:3','1:1','21:9'
objectFit: 'contain'|'cover' = 'cover';        // attribute: object-fit
```

## Methods

- `start(): Promise<void>` - Start camera feed
- `stop(): void` - Stop camera
- `capture(): Promise<CapturedImage>` - Capture frame (`{ dataURL, blob, width, height, timestamp }`)
- `switchCamera(): Promise<void>` - Toggle front/back
- `isActive(): boolean` - Check if running
- `getStream(): MediaStream | null` - Get stream
- `enterFullscreen()` / `exitFullscreen()` / `toggleFullscreen()` - Fullscreen control

## Events

- `camera-start` -> `{ stream: MediaStream }`
- `camera-stop` -> (no detail)
- `camera-capture` -> `{ image: CapturedImage }`
- `camera-error` -> `{ error: Error }`

## Slots

- `controls` - Custom controls overlay (full viewport, positioned absolutely)

## CSS Custom Properties

- `--snice-camera-bg` - Background (default: `rgb(0 0 0)`)
- `--snice-camera-overlay` - Controls gradient overlay
- `--snice-camera-controls-color` - Controls icon/text color
- `--snice-camera-btn-bg` / `--snice-camera-btn-hover-bg` - Button backgrounds
- `--snice-camera-capture-bg` / `--snice-camera-capture-color` / `--snice-camera-capture-hover-bg` - Capture button
- `--snice-camera-flash-color` - Flash overlay
- `--snice-camera-status-bg` - Status badge

## CSS Parts

- `base` - Outer camera container
- `controls` - Built-in control buttons area

## Basic Usage

```html
<snice-camera></snice-camera>
```

```typescript
import 'snice/components/camera/snice-camera';

const image = await camera.capture();
// { dataURL, blob, width, height, timestamp }
```

## Accessibility

- Keyboard navigation for controls
- Visual feedback for capture
- Error messaging
