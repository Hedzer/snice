# snice-flip-card

3D card flip component with front/back faces, horizontal/vertical flip direction, and click or programmatic control.

## Properties

```ts
flipped: boolean = false                 // attr: flipped — Whether back face is showing
clickToFlip: boolean = true              // attr: click-to-flip — Enable click/keyboard to toggle
direction: FlipDirection = 'horizontal'  // attr: direction — 'horizontal' | 'vertical'
duration: number = 600                   // attr: duration — Flip animation duration in ms
```

## Slots

- `front` — Content for the front face
- `back` — Content for the back face

## Events

- `flip-change` -> `{ flipped: boolean, side: 'front' | 'back' }` — Fires on flip state change

## Methods

- `flip(): void` — Toggle between front and back
- `flipTo(side: 'front' | 'back'): void` — Flip to a specific side

## CSS Custom Properties

```css
--flip-duration   /* Animation duration, set automatically from duration property */
```

## CSS Parts

- `base` - The outer flip card container
- `front` - The front face container
- `back` - The back face container

## Keyboard

When `click-to-flip` is enabled:
- Enter / Space — Toggle flip

## Usage

```html
<snice-flip-card direction="horizontal" style="width: 300px; height: 200px;">
  <div slot="front">Front content</div>
  <div slot="back">Back content</div>
</snice-flip-card>
```

```js
const card = document.querySelector('snice-flip-card');
card.flipTo('back');
card.addEventListener('flip-change', e => console.log(e.detail.side));
```
