# snice-segmented-control

Multi-option switcher with sliding indicator. One selected at a time.

## Properties

```typescript
value: string = '';  // user selection updates this before value-change dispatches
options: SegmentedControlOption[] = [];  // JS only: { value, label, icon?, disabled? }
size: 'small'|'medium'|'large' = 'medium';
disabled: boolean = false;
```

## Events

- `value-change` → `{ value: string, previousValue: string, option: SegmentedControlOption, control }`

`value` is self-mutating: selecting an option assigns it before the event is
dispatched. An owner that must reassert an unchanged value on a later render
should use a `.value=${live(value)}` property binding.

## CSS Parts

- `base` - Root container
- `base-disabled` - Added to `base` while the control is `disabled`
- `indicator` - Sliding selection indicator
- `segment` - Individual option button
- `segment-selected` - Added to `segment` while that option is selected
- `segment-disabled` - Added to `segment` while that option is disabled
- `icon` - Option icon image inside a segment
- `label` - Option label text inside a segment

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
