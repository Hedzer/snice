# snice-divider

Separator line with optional text.

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

## Usage

```html
<!-- Basic -->
<snice-divider></snice-divider>

<!-- With text -->
<snice-divider text="OR"></snice-divider>

<!-- Text alignment -->
<snice-divider text="Start" align="start"></snice-divider>
<snice-divider text="Center" align="center"></snice-divider>
<snice-divider text="End" align="end"></snice-divider>

<!-- Variants -->
<snice-divider variant="solid"></snice-divider>
<snice-divider variant="dashed"></snice-divider>
<snice-divider variant="dotted"></snice-divider>

<!-- Spacing -->
<snice-divider spacing="none"></snice-divider>
<snice-divider spacing="small"></snice-divider>
<snice-divider spacing="medium"></snice-divider>
<snice-divider spacing="large"></snice-divider>

<!-- Vertical -->
<div style="display: flex; height: 50px;">
  <span>Left</span>
  <snice-divider orientation="vertical"></snice-divider>
  <span>Right</span>
</div>

<!-- Custom color -->
<snice-divider color="#3b82f6"></snice-divider>

<!-- Capped (rounded ends) -->
<snice-divider capped></snice-divider>
```

**CSS Parts:**
- `base` - Outer divider container
- `line` - The divider line(s)
- `text` - Optional text label

## Features

- Horizontal or vertical
- 3 line styles (solid/dashed/dotted)
- Optional text label
- Text alignment (start/center/end)
- 4 spacing options
- Custom color
- Capped ends
- Custom text background
