# snice-stat

Statistics display with trends and icons.

## Properties

```typescript
label: string = '';
value: string | number = '';
change: string | number = '';
trend: 'up'|'down'|'neutral' = 'neutral';
size: 'small'|'medium'|'large' = 'medium';
icon: string = '';
iconImage: string = '';
colorValue: boolean = false;
```

## Usage

```html
<snice-stat
  label="Revenue"
  value="$45,231"
  change="+12%"
  trend="up"
  icon="💰"
  color-value>
</snice-stat>
```
