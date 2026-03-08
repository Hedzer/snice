# snice-segmented-control

Multi-option switcher with sliding indicator. One selected at a time.

## Properties

```typescript
value: string = '';
options: SegmentedControlOption[] = [];  // { value, label, icon?, disabled? }
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
```

## CSS Parts

- `base` - Root container
- `indicator` - Sliding selection indicator
- `segment` - Individual option button

## Events

- `value-change` → `{ value, previousValue, option, control }`

## Usage

```html
<snice-segmented-control></snice-segmented-control>
```

```typescript
control.options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];
control.value = 'week';
control.addEventListener('value-change', (e) => console.log(e.detail.value));
```

## Notes

- Options set via JS property (array), not child elements
- Sliding indicator animates between selections
- If no value set, first non-disabled option is selected
- ARIA radiogroup/radio roles for accessibility
- Diff from tabs: no content panes, just a value selector
- Diff from switch: more than two options
