# snice-sparkline

Compact inline chart for visualizing trends and patterns.

## Properties

```typescript
data: number[] = [];
type: 'line'|'bar'|'area' = 'line';
color: 'primary'|'success'|'warning'|'danger'|'muted' = 'primary';
customColor: string = '';          // attr: custom-color, overrides color
width: number = 100;
height: number = 30;
strokeWidth: number = 2;          // attr: stroke-width
showDots: boolean = false;        // attr: show-dots
showArea: boolean = false;        // attr: show-area
smooth: boolean = false;
min?: number;
max?: number;
```

## CSS Parts

- `container` - Container div
- `svg` - SVG element
- `line` - Line/path element
- `area` - Area polygon/path
- `bar` - Bar rect
- `dot` - Dot circle

## Usage

```html
<snice-sparkline id="chart"></snice-sparkline>
<script>document.getElementById('chart').data = [10, 20, 15, 25, 30];</script>

<snice-sparkline type="bar" color="success"></snice-sparkline>
<snice-sparkline type="area" color="danger" min="0"></snice-sparkline>
<snice-sparkline smooth show-area show-dots width="150" height="40"></snice-sparkline>
<snice-sparkline custom-color="#9333ea"></snice-sparkline>
<snice-sparkline min="0" max="100"></snice-sparkline>
```
