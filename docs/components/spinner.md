# Spinner Component

The `<snice-spinner>` component provides an animated loading indicator.

## Basic Usage

```html
<snice-spinner></snice-spinner>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large' \| 'xl'` | `'medium'` | Spinner size |
| `color` | `'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'primary'` | Color variant |
| `label` | `string` | `''` | Accessible label |
| `thickness` | `number` | `4` | Stroke thickness |

## Examples

### Sizes

```html
<snice-spinner size="small"></snice-spinner>
<snice-spinner size="medium"></snice-spinner>
<snice-spinner size="large"></snice-spinner>
<snice-spinner size="xl"></snice-spinner>
```

### Colors

```html
<snice-spinner color="primary"></snice-spinner>
<snice-spinner color="success"></snice-spinner>
<snice-spinner color="warning"></snice-spinner>
<snice-spinner color="error"></snice-spinner>
<snice-spinner color="info"></snice-spinner>
```

### With Label

```html
<snice-spinner label="Loading data..."></snice-spinner>
```

### Loading State

```html
<div style="text-align: center; padding: 2rem;">
  <snice-spinner size="large" color="primary"></snice-spinner>
  <p>Loading content...</p>
</div>
```

### Inline Spinner

```html
<button disabled>
  <snice-spinner size="small"></snice-spinner>
  Processing...
</button>
```
