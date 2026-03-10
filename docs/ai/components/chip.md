# snice-chip

Compact element for tags, filters, or selections.

## Properties

```typescript
label: string = '';
variant: 'default'|'primary'|'success'|'warning'|'error'|'info' = 'default';
size: 'small'|'medium'|'large' = 'medium';
removable: boolean = false;
selected: boolean = false;
disabled: boolean = false;
icon: string = '';      // URL, image file, emoji. Use slot for icon fonts.
avatar: string = '';    // Avatar image URL (takes precedence over icon slot)
```

## Events

- `chip-click` -> `{ label: string, selected: boolean }`
- `chip-remove` -> `{ label: string }`

## Slots

- `icon` - Custom icon content (overrides `icon` property; `avatar` takes precedence)

## CSS Parts

- `icon` - Icon wrapper element

## Basic Usage

```html
<snice-chip label="Tag"></snice-chip>
```

```typescript
import 'snice/components/chip/snice-chip';

// icon="star" renders as PLAIN TEXT. Use the icon slot for icon fonts.
chip.addEventListener('chip-click', (e) => console.log(e.detail));
chip.addEventListener('chip-remove', () => chip.remove());
```

## Accessibility

- Enter/Space to activate
- aria-selected, aria-disabled
- Remove button has aria-label
