# snice-switch

Toggle switch input for boolean selections. Form-associated.

## Properties

```typescript
checked: boolean = false;
disabled: boolean = false;
required: boolean = false;
invalid: boolean = false;
size: 'small'|'medium'|'large' = 'medium';
name: string = '';
value: string = 'on';
label: string = '';
labelOn: string = '';           // attr: label-on
labelOff: string = '';          // attr: label-off
loading: boolean = false;
```

## Events

- `switch-change` → `{ checked, switch }`

## Methods

- `toggle()` - Toggle switch state
- `focus()` - Focus the switch
- `blur()` - Remove focus
- `click()` - Programmatic click

## CSS Parts

- `input` - Hidden input element
- `track` - Switch track
- `thumb` - Switch thumb
- `spinner` - Loading spinner
- `label` - Label text

## Usage

```html
<snice-switch label="Enable notifications"></snice-switch>
<snice-switch checked label="Dark mode"></snice-switch>
<snice-switch size="small" label="Compact"></snice-switch>
<snice-switch label-on="On" label-off="Off"></snice-switch>
<snice-switch loading label="Saving..."></snice-switch>
<snice-switch disabled></snice-switch>
```
