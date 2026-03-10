# snice-flip-card

3D card flip component with front/back faces, horizontal/vertical direction, click or programmatic control.

## Properties

```typescript
flipped: boolean = false;                 // Whether back face is showing
clickToFlip: boolean = true;              // attribute: click-to-flip
direction: 'horizontal'|'vertical' = 'horizontal';
duration: number = 600;                   // Flip animation duration in ms
```

## Methods

- `flip()` - Toggle between front and back
- `flipTo(side: 'front'|'back')` - Flip to a specific side

## Events

- `flip-change` → `{ flipped: boolean, side: 'front'|'back' }`

## Slots

- `front` - Content for the front face
- `back` - Content for the back face

## CSS Parts

- `base` - The outer flip card container
- `front` - The front face container
- `back` - The back face container

## CSS Custom Properties

- `--flip-duration` - Animation duration (set automatically from `duration` property)

## Basic Usage

```typescript
import 'snice/components/flip-card/snice-flip-card';
```

```html
<snice-flip-card direction="horizontal" style="width: 300px; height: 200px;">
  <div slot="front">Front content</div>
  <div slot="back">Back content</div>
</snice-flip-card>
```

```typescript
card.flipTo('back');
card.addEventListener('flip-change', e => console.log(e.detail.side));
```

## Keyboard Navigation

When `click-to-flip` is enabled:
- Enter / Space - Toggle flip

## Accessibility

- `role="button"` with `aria-label` on the card
- `tabindex="0"` when click-to-flip is enabled
- Enter/Space keyboard activation
