# snice-avatar-group

Row of overlapping avatars with "+N" overflow indicator.

## Properties

```typescript
avatars: AvatarGroupItem[] = [];  // Array of avatar data (set via JS property)
max: number = 5;                   // Max visible before "+N"
size: 'small'|'medium'|'large' = 'medium';
overlap: number = 8;               // Overlap in px
```

```typescript
interface AvatarGroupItem {
  src?: string;      // Image URL
  initials?: string; // Fallback initials
  name?: string;     // Name (used for initials/color/title)
  color?: string;    // Custom background color
}
```

## Slots

- `(default)` - `<snice-avatar>` elements for declarative mode

## Events

- `avatar-click` → `{ avatar: AvatarGroupItem, index: number }`
- `overflow-click` → `{ remaining: number, avatars: AvatarGroupItem[] }`

## Usage

```html
<snice-avatar-group id="group" max="3" size="medium"></snice-avatar-group>
```

```typescript
const group = document.getElementById('group');
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

**CSS Parts:**
- `base` - The avatar group container
- `avatar` - Individual avatar buttons
- `overflow` - The "+N" overflow button
