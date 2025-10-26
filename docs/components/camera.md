# Camera Component

Live camera feed access with capture functionality and device management.

## Basic Usage

```html
<snice-camera id="camera"></snice-camera>

<script>
  const camera = document.getElementById('camera');

  // Start camera
  await camera.start();

  // Capture photo
  const image = await camera.capture();
  console.log(image.dataURL);
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` | `boolean` | `false` | Auto-start on load |
| `facingMode` | `'user' \| 'environment'` | `'user'` | Camera facing mode |
| `resolution` | `CameraResolution` | `'hd'` | Video resolution |
| `mirror` | `boolean` | `true` | Mirror video (for selfies) |
| `showControls` | `boolean` | `true` | Show control buttons |
| `captureFormat` | `'image/png' \| 'image/jpeg' \| 'image/webp'` | `'image/jpeg'` | Capture image format |
| `captureQuality` | `number` | `0.92` | Capture quality (0-1) |

## Resolution Options

- `'qvga'` - 320x240
- `'vga'` - 640x480
- `'hd'` - 1280x720
- `'full-hd'` - 1920x1080
- `'4k'` - 3840x2160

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
Capture current frame.

```javascript
const image = await camera.capture();
// { dataURL, blob, width, height, timestamp }
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

### `getDevices(): Promise<MediaDeviceInfo[]>`
List available cameras.

```javascript
const devices = await camera.getDevices();
devices.forEach(device => {
  console.log(device.label, device.deviceId);
});
```

### `selectDevice(deviceId): Promise<void>`
Select specific camera.

```javascript
await camera.selectDevice('device-id-here');
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

### `@snice/camera-switch`
Camera switched.

```javascript
camera.addEventListener('@snice/camera-switch', (e) => {
  console.log('Switched to', e.detail.facingMode);
});
```

### `@snice/camera-error`
Camera error occurred.

```javascript
camera.addEventListener('@snice/camera-error', (e) => {
  console.error(e.detail.error);
});
```

## Examples

### Auto-start Camera

```html
<snice-camera auto-start></snice-camera>
```

### Back Camera

```html
<snice-camera facing-mode="environment"></snice-camera>
```

### High Resolution

```html
<snice-camera resolution="full-hd"></snice-camera>
```

### No Mirror

```html
<snice-camera mirror="false"></snice-camera>
```

### Custom Capture Format

```html
<snice-camera
  capture-format="image/png"
  capture-quality="1.0">
</snice-camera>
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

### Device Selector

```javascript
const devices = await camera.getDevices();
const select = document.createElement('select');

devices.forEach(device => {
  const option = document.createElement('option');
  option.value = device.deviceId;
  option.textContent = device.label;
  select.appendChild(option);
});

select.addEventListener('change', async (e) => {
  await camera.selectDevice(e.target.value);
});
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

### Permissions Check

```javascript
async function checkPermissions() {
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    console.log('Camera permission:', result.state);

    result.addEventListener('change', () => {
      console.log('Permission changed:', result.state);
    });
  } catch (error) {
    console.log('Permissions API not supported');
  }
}
```

## Security

- Requires HTTPS (or localhost for development)
- Requires user permission
- Permission prompts are browser-controlled
- Stream automatically stops on page unload

## Accessibility

- Keyboard navigation for controls
- ARIA labels for buttons
- Visual feedback for capture
- Error messaging

## Browser Support

- Modern browsers with getUserMedia API
- Requires camera hardware
- May not work on some mobile browsers
- Fallback messaging for unsupported browsers
