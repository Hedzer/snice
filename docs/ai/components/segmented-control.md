# snice-segmented-control

Multi-option switcher with sliding indicator. One selected at a time.

## Properties

```typescript
value: string = '';
options: SegmentedControlOption[] = [];  // JS only: { value, label, icon?, disabled? }
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
```

## Events

- `value-change` → `{ value: string, previousValue: string, option: SegmentedControlOption, control }`

## CSS Parts

- `base` - Root container
- `indicator` - Sliding selection indicator
- `segment` - Individual option button

## Basic Usage

```html
<snice-segmented-control value="week"></snice-segmented-control>
```

```typescript
control.options = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
];
control.addEventListener('value-change', (e) => console.log(e.detail.value));
```

## Accessibility

- ARIA radiogroup/radio roles
- Sliding indicator animates between selections
- First non-disabled option selected if no value set
