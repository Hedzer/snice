# snice-avatar-group

Row of overlapping avatars with "+N" overflow indicator.

## Properties

```typescript
avatars: AvatarGroupItem[] = [];   // Array of avatar data (set via JS)
max: number = 5;                    // Max visible before "+N"
size: 'small'|'medium'|'large' = 'medium';
overlap: number = 8;                // Overlap in px

interface AvatarGroupItem {
  src?: string;      // Image URL
  initials?: string; // Fallback initials
  name?: string;     // Name (used for initials/color/title)
  color?: string;    // Custom background color
}
```

## Events

- `avatar-click` → `{ avatar: AvatarGroupItem, index: number }`
- `overflow-click` → `{ remaining: number, avatars: AvatarGroupItem[] }`

## Slots

- `(default)` - `<snice-avatar>` elements for declarative mode

## CSS Parts

- `base` - The avatar group container
- `avatar` - Individual avatar buttons
- `overflow` - The "+N" overflow button

## Basic Usage

```html
<!-- Declarative -->
<snice-avatar-group max="3" size="medium">
  <snice-avatar name="Alice Johnson"></snice-avatar>
  <snice-avatar name="Bob Smith" src="/avatars/bob.jpg"></snice-avatar>
  <snice-avatar name="Carol Williams"></snice-avatar>
</snice-avatar-group>

<!-- Programmatic -->
<snice-avatar-group id="group" max="3" size="medium"></snice-avatar-group>
```

```typescript
group.avatars = [
  { name: 'Alice Johnson', initials: 'AJ' },
  { name: 'Bob Smith', src: '/avatars/bob.jpg' },
  { name: 'Carol', color: '#7c3aed' },
];

group.addEventListener('avatar-click', (e) => {
  console.log(e.detail.avatar.name, e.detail.index);
});

group.addEventListener('overflow-click', (e) => {
  console.log(`${e.detail.remaining} more:`, e.detail.avatars);
});
```

## Accessibility

- `role="group"` with `aria-label="Avatar group"`
- Each avatar is a `<button>` with title and aria-label
- Focus styles on all interactive elements
