# Pixel to Rem Conversion Guide

> **Related**: See [THEME_INTEGRATION_GUIDE.md](./THEME_INTEGRATION_GUIDE.md) for theme integration patterns with fallback defaults.

## Hybrid Strategy: What to Convert

### 🟢 Convert to REM (scales with user preferences):
- **Padding & Margins**: `padding`, `margin`, `gap`
- **Font Sizes**: `font-size` 
- **Icon/Component Sizes**: `--icon-size`, `--component-height`, `width`/`height` for content
- **Spacing Values**: Internal component spacing that should feel proportional to text

### 🔴 Keep as PX (stays fixed):
- **Borders**: `border-width`, `outline-width` (for crisp 1px lines)
- **Border Radius**: `border-radius` (for consistent rounded corners)
- **Box Shadows**: `box-shadow` (for consistent depth perception)
- **Small Offsets**: `outline-offset`, small `translateY` in animations
- **Divider thickness**: `1px` lines should stay crisp

## Conversion Reference (16px = 1rem)

```css
/* Common Conversions */
4px   → 0.25rem
6px   → 0.375rem
8px   → 0.5rem
10px  → 0.625rem
12px  → 0.75rem
14px  → 0.875rem
16px  → 1rem
18px  → 1.125rem
20px  → 1.25rem
24px  → 1.5rem
32px  → 2rem
40px  → 2.5rem
48px  → 3rem
64px  → 4rem
96px  → 6rem
```

## Conversion Script

Run this find-replace script on each CSS file:

```bash
# Common spacing values
sed -i 's/: 4px/: 0.25rem \/\* 4px \*\//g' $file
sed -i 's/: 6px/: 0.375rem \/\* 6px \*\//g' $file
sed -i 's/: 8px/: 0.5rem \/\* 8px \*\//g' $file
sed -i 's/: 12px/: 0.75rem \/\* 12px \*\//g' $file
sed -i 's/: 14px/: 0.875rem \/\* 14px \*\//g' $file
sed -i 's/: 16px/: 1rem \/\* 16px \*\//g' $file
sed -i 's/: 18px/: 1.125rem \/\* 18px \*\//g' $file
sed -i 's/: 20px/: 1.25rem \/\* 20px \*\//g' $file
sed -i 's/: 24px/: 1.5rem \/\* 24px \*\//g' $file
sed -i 's/: 32px/: 2rem \/\* 32px \*\//g' $file
sed -i 's/: 40px/: 2.5rem \/\* 40px \*\//g' $file
sed -i 's/: 48px/: 3rem \/\* 48px \*\//g' $file
sed -i 's/: 64px/: 4rem \/\* 64px \*\//g' $file

# Revert specific properties that should stay px
sed -i 's/border: 0.0625rem \/\* 1px \*\//border: 1px/g' $file
sed -i 's/border-width: 0.0625rem \/\* 1px \*\//border-width: 1px/g' $file
sed -i 's/outline: 0.125rem \/\* 2px \*\//outline: 2px/g' $file
sed -i 's/outline-width: 0.125rem \/\* 2px \*\//outline-width: 2px/g' $file
sed -i 's/outline-offset: 0.125rem \/\* 2px \*\//outline-offset: 2px/g' $file
```

## Component-Specific Notes

### Progress Component
- Convert bar `height` and circular `size` to rem
- Keep `border-width` as px
- Convert `padding` in labels to rem

### Skeleton Component  
- Convert `gap`, `height`, `border-radius` to rem for better scaling
- Keep thin borders as px

### Modal/Toast/Tooltip
- Convert `padding`, `font-size`, `gap` to rem
- Keep `border`, `box-shadow`, `border-radius` as px for crisp UI

### Input/Select Components
- Convert `padding`, `font-size`, `height` to rem for better accessibility
- Keep `border-width`, `outline` as px
- Border radius can stay px for consistency

### Form Components (Radio, Checkbox, Switch)
- Convert component `size`, `gap`, `font-size` to rem 
- Keep `border-width`, small `border-radius` as px

## Testing Checklist

After conversion:

1. **Visual Check**: Components should look the same at default browser font size (16px)
2. **Accessibility Test**: Increase browser font size to 20px - components should scale proportionally
3. **Responsive Test**: Check components at different screen sizes
4. **Border Crispness**: 1px borders should remain crisp, not blurry
5. **Consistent Shadows**: Box shadows should look consistent across components

## Examples

### Before (pixels only):
```css
.button {
  padding: 12px 24px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### After (hybrid rem/px):
```css  
.button {
  padding: 0.75rem 1.5rem; /* 12px 24px */
  font-size: 0.875rem; /* 14px */
  border: 1px solid #ccc; /* Keep px for crisp borders */
  border-radius: 4px; /* Keep px for consistent corners */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Keep px for consistent depth */
}
```