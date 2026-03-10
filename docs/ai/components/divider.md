# snice-divider

Separator line with optional text label.

## Properties

```typescript
orientation: 'horizontal'|'vertical' = 'horizontal';
variant: 'solid'|'dashed'|'dotted' = 'solid';
spacing: 'none'|'small'|'medium'|'large' = 'medium';
align: 'start'|'center'|'end' = 'center';
text: string = '';
textBackground: string = '';   // attribute: text-background
color: string = '';
capped: boolean = false;
```

## CSS Custom Properties

- `--divider-color` - Line color (default: `var(--snice-color-border)`)
- `--divider-thickness` - Line thickness (default: `1px`)
- `--divider-text-bg` - Text label background
- `--divider-text-padding` - Text label padding (default: `0 1rem`)
- `--divider-text-gap` - Gap around text label (default: `1rem`)

## CSS Parts

- `base` - Outer divider container
- `line` - The divider line(s)
- `text` - Optional text label

## Basic Usage

```html
<snice-divider></snice-divider>
<snice-divider text="OR"></snice-divider>
<snice-divider text="Start" align="start"></snice-divider>
<snice-divider variant="dashed" capped></snice-divider>
<snice-divider orientation="vertical"></snice-divider>
<snice-divider color="#3b82f6"></snice-divider>
```
