# snice-qr-reader

QR code scanner using device camera and ZXing WASM decoder.

## API

### Properties
- `auto-start: boolean = false` - Auto-start scanning on mount
- `camera: 'front'|'back' = 'back'` - Camera selection
- `pick-first: boolean = false` - Scan at max speed until first hit, then stop and shutdown
- `manual-snap: boolean = false` - Photo mode: open camera, manually trigger snapshots
- `scan-speed: number = 3` - Scan speed 1-10 (higher = faster, more CPU). Ignored when pick-first=true
- `tap-start: boolean = false` - Enable tap/click on viewport to start/stop scanning

### Methods
- `start()` - Start camera/scanning
- `stop()` - Stop camera/scanning
- `snap()` - Take snapshot (manual-snap mode)

### Events
- `qr-scan` - detail: `{data: string, timestamp: number, reader: SniceQRReader}`
- `qr-error` - detail: `{error: any, reader: SniceQRReader}`
- `camera-ready` - detail: `{reader: SniceQRReader}`
- `camera-error` - detail: `{error: any, reader: SniceQRReader}`

## Usage

```html
<snice-qr-reader auto-start></snice-qr-reader>
<script>
  reader.addEventListener('qr-scan', e => console.log(e.detail.data));
</script>
```

## Implementation

### File Structure
- `snice-qr-reader.ts` - Main component (camera, scanning loop)
- `qr-worker.ts` - Web Worker for QR detection
- `qr-decoder.ts` - ZXing WASM wrapper (legacy)
- `zxing-reader.mjs` - ZXing ES module
- `zxing_reader.wasm` - WASM binary
- `ZXING-LICENSE` - Apache 2.0 + MIT

### QR Detection
Uses ZXing WASM decoder exclusively for universal browser support.

### Camera Loop
```ts
private scanFrame() {
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  worker.postMessage({ type: 'decode', imageData });
  // Worker responds with result in background thread
  requestAnimationFrame(() => this.scanFrame());
}
```

### Lifecycle
- `@ready` - Init worker, auto-start if enabled
- `@dispose` - Stop scan, release camera, terminate worker
- Scan loop uses requestAnimationFrame
- QR detection runs in Web Worker (non-blocking)
- Only emits event if QR data changed

### CSS Tokens
```css
--qr-reader-border: var(--snice-color-border, #e5e7eb)
--qr-reader-bg: var(--snice-color-bg, #fff)
--qr-reader-text: var(--snice-color-text, #1f2937)
```

## License
- ZXing-C++: Apache 2.0
- zxing-wasm: MIT
- See ZXING-LICENSE file

## Browser Requirements
- getUserMedia API
- WebAssembly support
- HTTPS for mobile
