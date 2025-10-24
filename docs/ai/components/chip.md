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
icon: string = '';
avatar: string = '';
```

## Events

- `click` - Chip clicked
- `remove` - Remove button clicked

## Usage

```html
<!-- Basic -->
<snice-chip label="Tag"></snice-chip>

<!-- Variants -->
<snice-chip label="Default" variant="default"></snice-chip>
<snice-chip label="Primary" variant="primary"></snice-chip>
<snice-chip label="Success" variant="success"></snice-chip>
<snice-chip label="Warning" variant="warning"></snice-chip>
<snice-chip label="Error" variant="error"></snice-chip>
<snice-chip label="Info" variant="info"></snice-chip>

<!-- Removable -->
<snice-chip label="Removable" removable></snice-chip>

<!-- Selected state -->
<snice-chip label="Selected" selected></snice-chip>

<!-- Disabled -->
<snice-chip label="Disabled" disabled></snice-chip>

<!-- With icon -->
<snice-chip label="Favorite" icon="★"></snice-chip>

<!-- With avatar -->
<snice-chip label="John Doe" avatar="/user.jpg"></snice-chip>

<!-- Sizes -->
<snice-chip label="Small" size="small"></snice-chip>
<snice-chip label="Medium" size="medium"></snice-chip>
<snice-chip label="Large" size="large"></snice-chip>

<!-- Events -->
<snice-chip id="chip" label="Click me" removable></snice-chip>
<script>
const chip = document.querySelector('#chip');
chip.addEventListener('click', () => console.log('Clicked'));
chip.addEventListener('remove', () => chip.remove());
</script>
```

## Features

- 6 color variants
- 3 sizes
- Removable with X button
- Selected state
- Icon or avatar
- Click and remove events
