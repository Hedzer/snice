# snice-signature

Canvas-based signature pad with smooth bezier curves, touch support, and export to PNG/Blob.

## Properties

```ts
strokeColor: string                      // Pen color (default: 'rgb(23 23 23)', attr: stroke-color)
strokeWidth: number                      // Pen width in px (default: 2, attr: stroke-width)
backgroundColor: string                  // Pad background color (attr: background-color)
readonly: boolean                        // Disable drawing (default: false)
```

## Methods

- `clear()` -- Erase all strokes
- `toDataURL(type?: string)` -- Export as data URL (default: 'image/png')
- `toBlob()` -- Export as Blob (async, returns `Promise<Blob | null>`)
- `isEmpty()` -- Returns `true` if no strokes drawn

## Events

- `signature-change` -> `{ empty: boolean }` -- Stroke drawn (empty state changed)
- `signature-clear` -> `void` -- Pad cleared

## CSS Custom Properties

```css
--snice-font-family
--snice-color-border               /* Pad border */
--snice-color-background           /* Default pad background */
--snice-border-radius-lg           /* Pad corner radius */
--snice-focus-ring-width
--snice-focus-ring-color
--snice-focus-ring-offset
--signature-bg                     /* Internal: set via backgroundColor property */
```

## Usage

```html
<snice-signature
  stroke-color="rgb(0 0 128)"
  stroke-width="3"
  background-color="rgb(255 255 240)"
></snice-signature>
```

```js
const sig = document.querySelector('snice-signature');

// Save signature
document.getElementById('save').addEventListener('click', async () => {
  if (sig.isEmpty()) return alert('Please sign first');
  const dataUrl = sig.toDataURL();
  // or
  const blob = await sig.toBlob();
});

// Clear
document.getElementById('clear').addEventListener('click', () => {
  sig.clear();
});

sig.addEventListener('signature-change', (e) => {
  console.log('Has signature:', !e.detail.empty);
});
```
