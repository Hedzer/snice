<!-- AI: For a low-token version of this doc, use docs/ai/components/avatar-group.md instead -->

# Avatar Group Component
`<snice-avatar-group>`

Displays a row of overlapping avatars with a "+N" overflow indicator when avatars exceed the maximum visible count.

## Basic Usage

```typescript
import 'snice/components/avatar-group/snice-avatar-group';
```

```html
<snice-avatar-group id="group"></snice-avatar-group>

<script>
  document.getElementById('group').avatars = [
    { name: 'Alice Johnson' },
    { name: 'Bob Smith' },
    { name: 'Carol Williams' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/avatar-group/snice-avatar-group';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-avatar-group.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `avatars` | `AvatarGroupItem[]` | `[]` | Array of avatar data (set via JavaScript) |
| `max` | `number` | `5` | Maximum visible avatars before "+N" |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Avatar size |
| `overlap` | `number` | `8` | Overlap amount in pixels |

### AvatarGroupItem

```typescript
interface AvatarGroupItem {
  src?: string;      // Image URL
  initials?: string; // Explicit initials (fallback)
  name?: string;     // Full name (auto-generates initials and color)
  color?: string;    // Custom background color
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `avatar-click` | `{ avatar: AvatarGroupItem, index: number }` | Fired when an avatar is clicked |
| `overflow-click` | `{ remaining: number, avatars: AvatarGroupItem[] }` | Fired when "+N" is clicked |

## Examples

### Basic Group

```html
<snice-avatar-group id="basic"></snice-avatar-group>

<script type="module">
  document.getElementById('basic').avatars = [
    { name: 'Alice Johnson' },
    { name: 'Bob Smith' },
    { name: 'Carol Williams' },
    { name: 'David Brown' },
    { name: 'Eve Davis' }
  ];
</script>
```

### With Overflow

Set `max` to control when the "+N" indicator appears.

```html
<snice-avatar-group id="overflow" max="3"></snice-avatar-group>

<script type="module">
  document.getElementById('overflow').avatars = [
    { name: 'Alice Johnson' },
    { name: 'Bob Smith' },
    { name: 'Carol Williams' },
    { name: 'David Brown' },
    { name: 'Eve Davis' },
    { name: 'Frank Miller' }
  ];
  // Shows 3 avatars + "+3"
</script>
```

### With Images

```html
<snice-avatar-group id="images"></snice-avatar-group>

<script type="module">
  document.getElementById('images').avatars = [
    { name: 'Alice', src: '/avatars/alice.jpg' },
    { name: 'Bob', src: '/avatars/bob.jpg' },
    { name: 'Carol', initials: 'CW' }  // Falls back to initials
  ];
</script>
```

### Sizes

Use the `size` attribute to change avatar sizes.

```html
<snice-avatar-group id="small" size="small"></snice-avatar-group>
<snice-avatar-group id="medium" size="medium"></snice-avatar-group>
<snice-avatar-group id="large" size="large"></snice-avatar-group>
```

### Custom Overlap

Use the `overlap` attribute to control spacing.

```html
<snice-avatar-group overlap="4"></snice-avatar-group>   <!-- Less overlap -->
<snice-avatar-group overlap="16"></snice-avatar-group>  <!-- More overlap -->
```

### Event Handling

```html
<snice-avatar-group id="events" max="3"></snice-avatar-group>

<script type="module">
  const group = document.getElementById('events');
  group.avatars = [
    { name: 'Alice Johnson' },
    { name: 'Bob Smith' },
    { name: 'Carol Williams' },
    { name: 'David Brown' },
    { name: 'Eve Davis' }
  ];

  group.addEventListener('avatar-click', (e) => {
    console.log(`Clicked: ${e.detail.avatar.name} (index ${e.detail.index})`);
  });

  group.addEventListener('overflow-click', (e) => {
    console.log(`${e.detail.remaining} more avatars`);
  });
</script>
```

### Custom Colors

```html
<snice-avatar-group id="colors"></snice-avatar-group>

<script type="module">
  document.getElementById('colors').avatars = [
    { name: 'Admin', color: '#7c3aed', initials: 'A' },
    { name: 'Editor', color: '#0891b2', initials: 'E' },
    { name: 'Viewer', color: '#059669', initials: 'V' }
  ];
</script>
```

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The avatar group container |
| `avatar` | Individual avatar buttons |
| `overflow` | The "+N" overflow button |

```css
snice-avatar-group::part(avatar) {
  border-width: 3px;
}

snice-avatar-group::part(overflow) {
  font-size: 0.75rem;
}
```

## Accessibility

- Group has `role="group"` with `aria-label="Avatar group"`
- Each avatar is a `<button>` with title and aria-label
- Overflow indicator shows count of remaining items
- All interactive elements receive focus styles
