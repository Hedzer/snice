# Stat Component

Display statistics with labels, values, trends, and icons.

## Basic Usage

```html
<snice-stat
  label="Total Revenue"
  value="$45,231"
  change="+12%"
  trend="up"
  icon="💰">
</snice-stat>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Stat label |
| `value` | `string \| number` | `''` | Stat value |
| `change` | `string \| number` | `''` | Change indicator |
| `trend` | `'up' \| 'down' \| 'neutral'` | `'neutral'` | Trend direction |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Stat size |
| `icon` | `string` | `''` | Text/emoji icon |
| `iconImage` | `string` | `''` | Icon image URL |
| `colorValue` | `boolean` | `false` | Color value by trend |

## Examples

```html
<!-- With trend -->
<snice-stat label="Sales" value="$1,234" change="+25%" trend="up"></snice-stat>

<!-- Colored value -->
<snice-stat label="Revenue" value="$5,678" trend="up" color-value></snice-stat>

<!-- Different sizes -->
<snice-stat label="Users" value="1,234" size="small"></snice-stat>
<snice-stat label="Revenue" value="$56,789" size="large"></snice-stat>

<!-- With icons -->
<snice-stat label="Traffic" value="12.5K" icon="📊"></snice-stat>
```
