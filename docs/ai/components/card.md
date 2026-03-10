# snice-card

Container for grouped content with variants, slots, and interactive states.

## Properties

```typescript
variant: 'elevated'|'bordered'|'flat' = 'elevated';
size: 'small'|'medium'|'large' = 'medium';
clickable: boolean = false;
selected: boolean = false;
disabled: boolean = false;
```

## Events

- `card-click` -> `{ selected: boolean }`

## Slots

- `(default)` - Card body content
- `image` - Image at top of card
- `header` - Card header
- `footer` - Card footer

## CSS Parts

- `base` - Outer card container
- `header` - Card header section
- `body` - Card body section
- `footer` - Card footer section

## Basic Usage

```html
<snice-card>
  <div slot="header">Title</div>
  <p>Card body content</p>
  <div slot="footer"><button>Action</button></div>
</snice-card>
```

```typescript
import 'snice/components/card/snice-card';

card.addEventListener('card-click', (e) => {
  console.log('Selected:', e.detail.selected);
});
```

## Accessibility

- Clickable cards are keyboard accessible
- ARIA roles and states for interactive cards
- Clear focus indicators
