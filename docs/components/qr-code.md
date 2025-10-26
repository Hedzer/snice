# QR Code Component

Generate QR codes from text, URLs, and other data with customizable styling.

## Basic Usage

```javascript
const qr = document.querySelector('snice-qr-code');
qr.value = 'https://example.com';
qr.size = 200;
```

```html
<snice-qr-code value="https://example.com" size="200"></snice-qr-code>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Data to encode |
| `size` | `number` | `200` | QR code size in pixels |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'` | Error correction level |
| `renderMode` | `'canvas' \| 'svg'` | `'svg'` | Rendering mode |
| `margin` | `number` | `4` | Quiet zone size |
| `fgColor` | `string` | `'#000000'` | Foreground color |
| `bgColor` | `string` | `'#ffffff'` | Background color |
| `includeImage` | `boolean` | `false` | Include center image |
| `imageUrl` | `string` | `''` | Center image URL |
| `imageSize` | `number` | `40` | Center image size |

## Error Correction Levels

- `'L'` - Low (7% recovery)
- `'M'` - Medium (15% recovery) - Default
- `'Q'` - Quartile (25% recovery)
- `'H'` - High (30% recovery)

## Methods

### `toDataURL(type?, quality?): Promise<string>`
Export QR code as data URL.

```javascript
const dataURL = await qr.toDataURL('image/png', 0.92);
console.log(dataURL);
```

**Parameters:**
- `type` - Image type: `'image/png'`, `'image/jpeg'`, `'image/webp'` (default: `'image/png'`)
- `quality` - Image quality 0-1 (default: `0.92`)

### `toBlob(type?, quality?): Promise<Blob>`
Export QR code as Blob.

```javascript
const blob = await qr.toBlob('image/png');
```

### `download(filename?): void`
Download QR code as image.

```javascript
qr.download('my-qr-code.png');
```

## Examples

### Simple URL

```html
<snice-qr-code value="https://example.com"></snice-qr-code>
```

### Custom Size

```html
<snice-qr-code
  value="https://example.com"
  size="300">
</snice-qr-code>
```

### Custom Colors

```html
<snice-qr-code
  value="https://example.com"
  fg-color="#2196f3"
  bg-color="#e3f2fd">
</snice-qr-code>
```

### High Error Correction

```html
<snice-qr-code
  value="Important Data"
  error-correction-level="H">
</snice-qr-code>
```

### Canvas Mode

```html
<snice-qr-code
  value="https://example.com"
  render-mode="canvas">
</snice-qr-code>
```

### With Center Image

```html
<snice-qr-code
  value="https://example.com"
  include-image
  image-url="logo.png"
  image-size="50">
</snice-qr-code>
```

### Larger Margin

```html
<snice-qr-code
  value="https://example.com"
  margin="8">
</snice-qr-code>
```

### Email Link

```html
<snice-qr-code value="mailto:contact@example.com"></snice-qr-code>
```

### Phone Number

```html
<snice-qr-code value="tel:+1234567890"></snice-qr-code>
```

### SMS Message

```html
<snice-qr-code value="sms:+1234567890?body=Hello"></snice-qr-code>
```

### WiFi Credentials

```html
<snice-qr-code
  value="WIFI:T:WPA;S:MyNetwork;P:password123;;">
</snice-qr-code>
```

**WiFi Format:**
```
WIFI:T:[WPA|WEP|nopass];S:[network SSID];P:[password];;
```

### vCard Contact

```html
<snice-qr-code
  value="BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
END:VCARD">
</snice-qr-code>
```

### Geographic Location

```html
<snice-qr-code value="geo:37.7749,-122.4194"></snice-qr-code>
```

### Calendar Event

```html
<snice-qr-code
  value="BEGIN:VEVENT
SUMMARY:Meeting
DTSTART:20240101T100000Z
DTEND:20240101T110000Z
END:VEVENT">
</snice-qr-code>
```

### Dynamic QR Code

```javascript
const qr = document.querySelector('snice-qr-code');

// Update value
function updateQRCode(newValue) {
  qr.value = newValue;
}

// Change colors
function setColors(fg, bg) {
  qr.fgColor = fg;
  qr.bgColor = bg;
}

// Change size
function setSize(size) {
  qr.size = size;
}
```

### Export Examples

```javascript
const qr = document.querySelector('snice-qr-code');

// Export as PNG data URL
const pngURL = await qr.toDataURL('image/png');
console.log(pngURL);

// Export as JPEG
const jpegURL = await qr.toDataURL('image/jpeg', 0.9);

// Export as WebP
const webpURL = await qr.toDataURL('image/webp');

// Get Blob
const blob = await qr.toBlob('image/png');

// Upload to server
const formData = new FormData();
formData.append('qr-code', blob, 'qr.png');
await fetch('/upload', { method: 'POST', body: formData });

// Download
qr.download('my-qr-code.png');
```

### Interactive Generator

```html
<input type="text" id="input" placeholder="Enter text">
<snice-qr-code id="qr"></snice-qr-code>

<script>
  const input = document.getElementById('input');
  const qr = document.getElementById('qr');

  input.addEventListener('input', (e) => {
    qr.value = e.target.value;
  });
</script>
```

### Styled QR Codes

```html
<!-- Blue theme -->
<snice-qr-code
  value="https://example.com"
  fg-color="#1976d2"
  bg-color="#e3f2fd"
  size="250">
</snice-qr-code>

<!-- Green theme -->
<snice-qr-code
  value="https://example.com"
  fg-color="#388e3c"
  bg-color="#e8f5e9"
  size="250">
</snice-qr-code>

<!-- Dark theme -->
<snice-qr-code
  value="https://example.com"
  fg-color="#ffffff"
  bg-color="#212121"
  size="250">
</snice-qr-code>
```

### Product QR Code

```javascript
const product = {
  id: '12345',
  name: 'Widget Pro',
  price: 29.99,
  url: 'https://example.com/products/12345'
};

const qr = document.querySelector('snice-qr-code');
qr.value = product.url;
qr.size = 200;
```

### Share QR Code

```javascript
async function shareQRCode() {
  const qr = document.querySelector('snice-qr-code');
  const blob = await qr.toBlob('image/png');

  if (navigator.share) {
    await navigator.share({
      title: 'My QR Code',
      files: [new File([blob], 'qr-code.png', { type: 'image/png' })]
    });
  }
}
```

### Print QR Code

```javascript
async function printQRCode() {
  const qr = document.querySelector('snice-qr-code');
  const dataURL = await qr.toDataURL('image/png');

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <body>
        <img src="${dataURL}" />
        <script>window.print();<\/script>
      </body>
    </html>
  `);
}
```

### Copy to Clipboard

```javascript
async function copyQRCode() {
  const qr = document.querySelector('snice-qr-code');
  const blob = await qr.toBlob('image/png');

  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);

  alert('QR code copied to clipboard!');
}
```

### Batch Generation

```javascript
const items = [
  { id: 1, url: 'https://example.com/1' },
  { id: 2, url: 'https://example.com/2' },
  { id: 3, url: 'https://example.com/3' }
];

items.forEach(item => {
  const qr = document.createElement('snice-qr-code');
  qr.value = item.url;
  qr.size = 150;
  document.body.appendChild(qr);
});
```

### Business Card

```javascript
const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
ORG:Acme Inc
TITLE:CEO
TEL:+1234567890
EMAIL:john@acme.com
URL:https://acme.com
ADR:;;123 Main St;Springfield;IL;62701;USA
END:VCARD`;

const qr = document.querySelector('snice-qr-code');
qr.value = vcard;
qr.size = 250;
qr.errorCorrectionLevel = 'H';
```

## Common Data Formats

### URL
```
https://example.com
```

### Email
```
mailto:name@example.com
mailto:name@example.com?subject=Hello&body=Message
```

### Phone
```
tel:+1234567890
```

### SMS
```
sms:+1234567890
sms:+1234567890?body=Message
```

### WiFi
```
WIFI:T:WPA;S:NetworkName;P:password;;
WIFI:T:WEP;S:NetworkName;P:password;;
WIFI:T:nopass;S:NetworkName;;
```

### Location
```
geo:37.7749,-122.4194
geo:37.7749,-122.4194?q=San Francisco
```

### vCard
```
BEGIN:VCARD
VERSION:3.0
FN:Full Name
N:Last;First;Middle
ORG:Company
TITLE:Job Title
TEL;TYPE=WORK:+1234567890
TEL;TYPE=CELL:+0987654321
EMAIL:email@example.com
URL:https://example.com
ADR;TYPE=WORK:;;Address Line;City;State;ZIP;Country
NOTE:Additional notes
END:VCARD
```

## Accessibility

- Provide alternative text describing QR code purpose
- Include human-readable URL near QR code
- Ensure sufficient size for scanning
- Use high contrast colors
- Consider error correction for damaged codes

## Browser Support

- Modern browsers with Custom Elements v1
- SVG or Canvas support
- Blob API for export
- File download API

## Performance Tips

- Use SVG mode for smaller file size
- Use Canvas mode for pixel-perfect rendering
- Cache generated QR codes when possible
- Limit size to what's needed for scanning
- Use appropriate error correction level
