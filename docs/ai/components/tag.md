# snice-tag

Display-only tag/token for labeling and categorization. Simpler than chip (no selection state).

## Properties

```typescript
variant: 'default'|'primary'|'success'|'warning'|'danger'|'info' = 'default';
size: 'small'|'medium'|'large' = 'medium';
removable: boolean = false;  // Show remove button
outline: boolean = false;    // Outlined style
pill: boolean = false;       // Fully rounded corners
```

## Events

- `tag-remove` -> `{ tag: SniceTagElement }`

## Slots

- `(default)` - Tag label content
- `icon` - Leading icon

## CSS Parts

- `base` - The tag container span
- `icon` - The icon slot wrapper
- `label` - The label slot wrapper

## Basic Usage

```html
<snice-tag>Label</snice-tag>
<snice-tag variant="primary">Primary</snice-tag>
<snice-tag variant="success">Active</snice-tag>
<snice-tag variant="danger">Critical</snice-tag>
<snice-tag variant="primary" outline>Outlined</snice-tag>
<snice-tag pill variant="info">Rounded</snice-tag>
<snice-tag removable>Removable</snice-tag>
<snice-tag variant="success"><span slot="icon">&#10003;</span>Approved</snice-tag>
<snice-tag size="small">Small</snice-tag>
<snice-tag size="large">Large</snice-tag>
```
