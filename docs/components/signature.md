[//]: # (AI: For a low-token version of this doc, use docs/ai/components/signature.md instead)

# Signature Component

The signature component provides a canvas-based signature pad with smooth bezier curve rendering, touch and mouse support, and export capabilities to PNG data URLs or Blobs.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```html
<snice-signature></snice-signature>
```

```typescript
import 'snice/components/signature/snice-signature';
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `strokeColor` (attr: `stroke-color`) | `string` | `'rgb(23 23 23)'` | Pen stroke color |
| `strokeWidth` (attr: `stroke-width`) | `number` | `2` | Pen stroke width in pixels |
| `backgroundColor` (attr: `background-color`) | `string` | `''` | Pad background color (transparent if empty) |
| `readonly` | `boolean` | `false` | Disable drawing |

## Methods

#### `clear(): void`
Erase all strokes from the signature pad.

```typescript
signature.clear();
```

#### `toDataURL(type?: string): string`
Export the signature as a data URL string. Defaults to `'image/png'`.

```typescript
const dataUrl = signature.toDataURL();
const jpeg = signature.toDataURL('image/jpeg');
```

#### `toBlob(): Promise<Blob | null>`
Export the signature as a Blob. Returns `null` if the canvas is empty.

```typescript
const blob = await signature.toBlob();
if (blob) {
  const formData = new FormData();
  formData.append('signature', blob, 'signature.png');
}
```

#### `isEmpty(): boolean`
Returns `true` if no strokes have been drawn.

```typescript
if (signature.isEmpty()) {
  alert('Please sign first');
}
```

## Events

#### `signature-change`
Fired after a stroke is drawn. Indicates whether the pad has content.

**Event Detail:**
```typescript
{
  empty: boolean;  // true if the pad has no strokes
}
```

#### `signature-clear`
Fired when the pad is cleared via the `clear()` method.

**Event Detail:** `void`

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-color-border` | Pad border color | `rgb(226 226 226)` |
| `--snice-color-background` | Default pad background | `rgb(255 255 255)` |
| `--snice-border-radius-lg` | Pad corner radius | `0.5rem` |
| `--snice-focus-ring-width` | Focus ring width | `2px` |
| `--snice-focus-ring-color` | Focus ring color | `rgb(59 130 246 / 0.5)` |
| `--snice-focus-ring-offset` | Focus ring offset | `2px` |
| `--signature-bg` | Internal background (set via `backgroundColor` property) | -- |

## Examples

### Basic Signature Pad

```html
<snice-signature></snice-signature>
```

### Custom Stroke Color and Width

Use `stroke-color` and `stroke-width` to customize the pen appearance.

```html
<snice-signature
  stroke-color="rgb(0 0 128)"
  stroke-width="3"
></snice-signature>
```

### Custom Background Color

Use `background-color` to set the pad background, useful for creating a paper-like feel.

```html
<snice-signature
  background-color="rgb(255 255 240)"
></snice-signature>
```

### Save and Clear Signature

```html
<snice-signature id="sig-pad"></snice-signature>
<div style="margin-top: 1rem;">
  <button id="save-btn">Save</button>
  <button id="clear-btn">Clear</button>
</div>
<img id="preview" style="display: none; margin-top: 1rem; border: 1px solid #ccc;" />

<script type="module">
  import 'snice/components/signature/snice-signature';

  const sig = document.getElementById('sig-pad');
  const preview = document.getElementById('preview');

  document.getElementById('save-btn').addEventListener('click', () => {
    if (sig.isEmpty()) {
      alert('Please sign first');
      return;
    }
    const dataUrl = sig.toDataURL();
    preview.src = dataUrl;
    preview.style.display = 'block';
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    sig.clear();
    preview.style.display = 'none';
  });
</script>
```

### Upload Signature as Blob

```html
<snice-signature id="upload-sig"></snice-signature>
<button id="upload-btn">Upload Signature</button>

<script type="module">
  const sig = document.getElementById('upload-sig');

  document.getElementById('upload-btn').addEventListener('click', async () => {
    if (sig.isEmpty()) {
      alert('Please sign first');
      return;
    }

    const blob = await sig.toBlob();
    if (!blob) return;

    const formData = new FormData();
    formData.append('signature', blob, 'signature.png');

    await fetch('/api/upload-signature', {
      method: 'POST',
      body: formData
    });
  });
</script>
```

### Readonly Display

Use the `readonly` attribute to display a previously captured signature without allowing edits.

```html
<snice-signature readonly></snice-signature>
```

### Listening for Changes

```html
<snice-signature id="tracked-sig"></snice-signature>
<p id="sig-status">No signature</p>

<script type="module">
  const sig = document.getElementById('tracked-sig');
  const status = document.getElementById('sig-status');

  sig.addEventListener('signature-change', (e) => {
    status.textContent = e.detail.empty ? 'No signature' : 'Signature captured';
  });

  sig.addEventListener('signature-clear', () => {
    status.textContent = 'Signature cleared';
  });
</script>
```

## Accessibility

- **Touch support**: Works with both mouse and touch input for mobile signatures
- **Focus indicators**: Visible focus ring when the pad is focused via keyboard
- **Readonly mode**: When `readonly` is set, the pad is non-interactive
- **Canvas fallback**: The component uses a canvas element internally; screen readers can identify it via ARIA labeling

## Best Practices

1. **Provide a clear button**: Always pair the signature pad with a clear/reset button
2. **Validate before saving**: Use `isEmpty()` to check that the user actually signed before submitting
3. **Use appropriate stroke width**: A width of 2-3px works well for signatures; thicker lines can feel heavy
4. **Set a background color for exports**: If exporting the signature for documents, set a white background so it does not appear transparent
5. **Consider mobile users**: The pad works with touch; ensure it has enough height for comfortable signing
