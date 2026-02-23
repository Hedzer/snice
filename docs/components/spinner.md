[//]: # (AI: For a low-token version of this doc, use docs/ai/components/spinner.md instead)

# Spinner
`<snice-spinner>`

An animated loading indicator.

## Basic Usage

```typescript
import 'snice/components/spinner/snice-spinner';
```

```html
<snice-spinner></snice-spinner>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/spinner/snice-spinner';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-spinner.min.js"></script>
```

## Examples

### Sizes

Use the `size` attribute to change the spinner's size.

```html
<snice-spinner size="small"></snice-spinner>
<snice-spinner size="medium"></snice-spinner>
<snice-spinner size="large"></snice-spinner>
<snice-spinner size="xl"></snice-spinner>
```

### Colors

Use the `color` attribute to change the spinner's color.

```html
<snice-spinner color="primary"></snice-spinner>
<snice-spinner color="success"></snice-spinner>
<snice-spinner color="warning"></snice-spinner>
<snice-spinner color="error"></snice-spinner>
<snice-spinner color="info"></snice-spinner>
```

### With Label

Set the `label` attribute for an accessible description.

```html
<snice-spinner label="Loading data..."></snice-spinner>
```

### Inline

Use a small spinner inline with text.

```html
<button disabled>
  <snice-spinner size="small"></snice-spinner>
  Processing...
</button>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large' \| 'xl'` | `'medium'` | Spinner size |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color variant |
| `label` | `string` | `''` | Accessible label |
| `thickness` | `number` | `4` | Stroke thickness |
