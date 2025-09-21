# Theme Integration Guide

## Core Principle: Always Provide Fallback Defaults

Every CSS custom property reference MUST include a fallback value that works without the theme system. This ensures components are self-contained and functional even if the theme isn't loaded.

## Pattern: `var(--theme-property, fallback-value)`

### ✅ Correct Examples from Existing Components

```css
/* Login Component - Perfect theme integration */
:host {
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
}

.login--card {
  background: var(--snice-color-background-element, rgb(252 251 249));
  border: 1px solid var(--snice-color-border, rgb(226 226 226));
  border-radius: var(--snice-border-radius-lg, 0.5rem);
  padding: var(--snice-spacing-xl, 2rem);
  box-shadow: var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));
}

.login__title {
  font-size: var(--snice-font-size-2xl, 1.5rem);
  font-weight: var(--snice-font-weight-bold, 700);
  color: var(--snice-color-text, rgb(23 23 23));
}
```

```css
/* Button Component - Perfect theme integration */
.button {
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
  font-weight: var(--snice-font-weight-medium, 500);
  transition:
    color var(--snice-transition-fast, 150ms) ease,
    background-color var(--snice-transition-fast, 150ms) ease;
}

.button:focus-visible {
  box-shadow: 0 0 0 var(--snice-focus-ring-width, 2px) var(--snice-focus-ring-color, rgb(59 130 246 / 0.5));
}

.button--primary {
  background-color: var(--snice-color-primary, rgb(37 99 235));
  color: var(--snice-color-text-inverse, rgb(250 250 250));
}
```

```css
/* Modal Component - Good theme integration */
:host {
  --modal-panel-bg: var(--snice-color-background, white);
  --modal-border-radius: var(--snice-border-radius-lg, 8px);
  --modal-padding: var(--snice-spacing-lg, 1.5rem);
}
```

### ❌ Bad Examples (Don't Do This)

```css
/* Missing fallbacks - NEVER do this */
.bad-component {
  background: var(--snice-color-background); /* Will be transparent if theme not loaded */
  color: var(--snice-color-text); /* Will inherit, might be wrong */
  font-size: var(--snice-font-size-md); /* Will be browser default */
}

/* Hard-coded values without theme - NEVER do this */
.also-bad {
  background: #ffffff; /* Should use theme with fallback */
  color: #111827; /* Should use theme with fallback */
  padding: 1rem; /* Should use spacing token with fallback */
}
```

## Theme Property Categories

### 🎨 Colors
```css
/* Semantic colors - always provide RGB fallbacks */
color: var(--snice-color-text, rgb(23 23 23));
background: var(--snice-color-background, rgb(255 255 255));
border-color: var(--snice-color-border, rgb(226 226 226));

/* State colors */
color: var(--snice-color-primary, rgb(37 99 235));
background: var(--snice-color-success, rgb(22 163 74));
border-color: var(--snice-color-danger, rgb(220 38 38));

/* Text hierarchy */
color: var(--snice-color-text, rgb(23 23 23));
color: var(--snice-color-text-secondary, rgb(82 82 82));
color: var(--snice-color-text-tertiary, rgb(115 115 115));
```

### 📏 Spacing
```css
/* Use spacing tokens with rem fallbacks */
padding: var(--snice-spacing-md, 1rem);
margin: var(--snice-spacing-lg, 1.5rem);
gap: var(--snice-spacing-sm, 0.75rem);

/* Common spacing values */
var(--snice-spacing-3xs, 0.125rem)  /* 2px */
var(--snice-spacing-2xs, 0.25rem)   /* 4px */
var(--snice-spacing-xs, 0.5rem)     /* 8px */
var(--snice-spacing-sm, 0.75rem)    /* 12px */
var(--snice-spacing-md, 1rem)       /* 16px */
var(--snice-spacing-lg, 1.5rem)     /* 24px */
var(--snice-spacing-xl, 2rem)       /* 32px */
```

### 🔤 Typography
```css
/* Font properties */
font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);
font-size: var(--snice-font-size-md, 1rem);
font-weight: var(--snice-font-weight-medium, 500);
line-height: var(--snice-line-height-normal, 1.5);
```

### 🎭 Visual Effects
```css
/* Shadows with full fallback */
box-shadow: var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1));

/* Border radius */
border-radius: var(--snice-border-radius-md, 0.25rem);

/* Transitions */
transition: color var(--snice-transition-fast, 150ms) ease;
```

### 🎯 Focus States
```css
/* Focus ring with fallbacks */
.element:focus-visible {
  outline: var(--snice-focus-ring-width, 2px) solid var(--snice-focus-ring-color, rgb(59 130 246 / 0.5));
  outline-offset: var(--snice-focus-ring-offset, 2px);
}
```

## Component-Specific Patterns

### :host Defaults
```css
:host {
  /* Always set display and font-family with fallbacks */
  display: block;
  font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);

  /* Add containment for performance */
  contain: layout style paint;
}
```

### Local CSS Variables (Two-Tier System)
```css
/* Define local variables that use theme with fallbacks */
:host {
  --component-bg: var(--snice-color-background, white);
  --component-text: var(--snice-color-text, rgb(23 23 23));
  --component-border: var(--snice-color-border, rgb(226 226 226));
  --component-padding: var(--snice-spacing-lg, 1.5rem);
}

/* Then use local variables in selectors */
.component {
  background: var(--component-bg);
  color: var(--component-text);
  border: 1px solid var(--component-border);
  padding: var(--component-padding);
}
```

## Implementation Checklist

### ✅ For Every Component:

1. **Always use fallbacks**: Every `var()` must have a fallback value
2. **Use semantic tokens**: Prefer `--snice-color-text` over `--snice-color-gray-900`
3. **Consistent sizing**: Use `--snice-spacing-*` tokens for padding/margins
4. **Theme typography**: Use `--snice-font-*` tokens for fonts
5. **Proper focus states**: Use `--snice-focus-*` tokens for accessibility
6. **Add containment**: Use `contain: layout style paint` for performance
7. **Test without theme**: Component should look good with fallbacks only

### 🔍 Testing:
1. **Default**: Component works with theme loaded
2. **Fallback**: Component works with theme.css removed
3. **Dark mode**: Component adapts to `[data-theme="dark"]`
4. **Accessibility**: Focus states are visible and meet contrast standards

## Migration Pattern

### Before (Hard-coded):
```css
.drawer {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 20px;
  font-size: 16px;
  transition: transform 0.3s ease;
}
```

### After (Theme-integrated):
```css
.drawer {
  background: var(--snice-color-background, white);
  border: 1px solid var(--snice-color-border, rgb(229 231 235));
  padding: var(--snice-spacing-lg, 1.25rem);
  font-size: var(--snice-font-size-md, 1rem);
  transition: transform var(--snice-transition-medium, 250ms) ease;
}
```

## Dos and Don'ts

### ✅ DO:
- Always provide fallback values
- Use semantic color names (`text`, `background`, `primary`)
- Use spacing tokens for consistency
- Test components without theme loaded
- Follow the two-tier variable pattern for complex components

### ❌ DON'T:
- Use theme variables without fallbacks
- Mix hard-coded values with theme values
- Use generic color names in fallbacks (use specific RGB values)
- Forget to test accessibility in both light and dark modes
- Skip containment optimization for performance

## Real-World Example: Drawer Component

```css
:host {
  /* Component-specific variables with theme integration */
  --drawer-bg: var(--snice-color-background, white);
  --drawer-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1));
  --drawer-transition: transform var(--snice-transition-medium, 250ms) cubic-bezier(0.4, 0, 0.2, 1);
  --drawer-z-index: var(--snice-z-index-modal, 1050);

  display: block;
  contain: layout style paint;
}

.drawer-header {
  padding: var(--snice-spacing-md, 1rem) var(--snice-spacing-lg, 1.5rem);
  border-bottom: 1px solid var(--snice-color-border, rgb(229 231 235));
}

.drawer-title {
  font-size: var(--snice-font-size-lg, 1.125rem);
  font-weight: var(--snice-font-weight-semibold, 600);
  color: var(--snice-color-text, rgb(23 23 23));
  margin: 0;
}
```

This ensures the component:
- Works perfectly with the theme system
- Has sensible fallbacks if theme isn't loaded
- Follows consistent patterns across all components
- Maintains accessibility and performance standards