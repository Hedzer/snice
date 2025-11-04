# snice-switch

Toggle switch input for boolean selections.

## Properties

```typescript
checked: boolean = false;        // Switch state
disabled: boolean = false;       // Disabled state
required: boolean = false;       // Form required
invalid: boolean = false;        // Invalid state styling
size: 'small'|'medium'|'large' = 'medium';
name: string = '';              // Form field name
value: string = 'on';           // Form field value when checked
label: string = '';             // Label text
labelOn: string = '';           // Label shown when on
labelOff: string = '';          // Label shown when off
```

## Methods

```typescript
toggle()      // Toggle switch state
focus()       // Focus the switch
blur()        // Remove focus
click()       // Programmatic click
```

## Events

```typescript
'switch-change' // { checked, switch }
```

## Usage

```html
<snice-switch label="Enable notifications"></snice-switch>
```

```typescript
switchEl.addEventListener('switch-change', (e) => {
  console.log(e.detail.checked);
});
```

## CSS Parts

```css
::part(track)   // Switch track
::part(thumb)   // Switch thumb
::part(label)   // Label text
```
