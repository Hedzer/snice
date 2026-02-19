# snice-qr-code

QR code generator with customizable styling and export.

## Properties

```typescript
value: string = '';
size: number = 200;
errorCorrectionLevel: 'L'|'M'|'Q'|'H' = 'M';
renderMode: 'canvas'|'svg' = 'canvas';
margin: number = 4;
fgColor: string = '#000000';
bgColor: string = '#ffffff';
includeImage: boolean = false;
imageUrl: string = '';
imageSize: number = 40;
dotStyle: 'square'|'rounded'|'dots' = 'square';
centerText: string = '';
centerTextSize: number = 16;
textFillColor: string = '#000000';
textOutlineColor: string = '#ffffff';
```

## Methods

```typescript
toDataURL(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): Promise<string>
toBlob(type?: 'image/png'|'image/jpeg'|'image/webp', quality?: number): Promise<Blob>
download(filename?: string): void
```

## Usage

```javascript
// Basic
qr.value = 'https://example.com';
qr.size = 200;

// Custom colors
qr.fgColor = '#2196f3';
qr.bgColor = '#e3f2fd';

// Error correction
qr.errorCorrectionLevel = 'H'; // L|M|Q|H

// Canvas mode
qr.renderMode = 'canvas';

// With image overlay
qr.includeImage = true;
qr.imageUrl = 'logo.png';
qr.imageSize = 50;

// Export
const dataURL = await qr.toDataURL('image/png', 0.92);
const blob = await qr.toBlob('image/png');
qr.download('qr-code.png');
```

```html
<snice-qr-code
  value="https://example.com"
  size="250"
  fg-color="#000000"
  bg-color="#ffffff"
  error-correction-level="M"
  render-mode="svg">
</snice-qr-code>
```

## Common Formats

```javascript
// URL
qr.value = 'https://example.com';

// Email
qr.value = 'mailto:name@example.com';

// Phone
qr.value = 'tel:+1234567890';

// SMS
qr.value = 'sms:+1234567890?body=Hello';

// WiFi
qr.value = 'WIFI:T:WPA;S:NetworkName;P:password;;';

// vCard
qr.value = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
TEL:+1234567890
EMAIL:john@example.com
END:VCARD`;

// Location
qr.value = 'geo:37.7749,-122.4194';
```

## Features

- SVG/Canvas rendering
- Custom colors
- Error correction levels
- Image overlay
- Export (PNG/JPEG/WebP)
- Download
- Adjustable margin
- Multiple data formats
