# Sankey Component

The sankey component renders an SVG-based Sankey diagram for visualizing flow between categories. It shows nodes connected by curved links, where link width is proportional to flow value. Ideal for energy flows, budget breakdowns, user journeys, and conversion funnels.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Events](#events)
- [Types](#types)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

## Basic Usage

```html
<snice-sankey id="my-sankey" show-labels show-values></snice-sankey>

<script type="module">
  import 'snice/components/sankey/snice-sankey';

  document.getElementById('my-sankey').data = {
    nodes: [
      { id: 'source', label: 'Source', color: '#2196f3' },
      { id: 'target', label: 'Target', color: '#4caf50' }
    ],
    links: [
      { source: 'source', target: 'target', value: 100 }
    ]
  };
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `SankeyData` | `{ nodes: [], links: [] }` | Data containing nodes and links |
| `nodeWidth` | `number` | `20` | Width of node rectangles in pixels |
| `nodePadding` | `number` | `10` | Vertical padding between nodes in pixels |
| `alignment` | `'left' \| 'right' \| 'center' \| 'justify'` | `'justify'` | How leaf nodes are aligned |
| `showLabels` | `boolean` | `true` | Whether to show node labels |
| `showValues` | `boolean` | `true` | Whether to show node values |
| `animation` | `boolean` | `false` | Whether to animate on initial render |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/sankey-node-click` | `{ node: SankeyNode }` | Fired when a node is clicked |
| `@snice/sankey-link-click` | `{ link: SankeyLink }` | Fired when a link is clicked |
| `@snice/sankey-hover` | `{ type: 'node' \| 'link', item: SankeyNode \| SankeyLink } \| null` | Fired when hover state changes |

## Types

```typescript
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyNode {
  id: string;        // Unique identifier
  label?: string;    // Display label (defaults to id)
  color?: string;    // Node color (auto-assigned if omitted)
}

interface SankeyLink {
  source: string;    // Source node id
  target: string;    // Target node id
  value: number;     // Flow value (determines link width)
  color?: string;    // Link color (defaults to source node color)
}
```

## Examples

### Energy Flow

```html
<snice-sankey id="energy" show-labels show-values animation style="height: 400px;"></snice-sankey>

<script type="module">
  document.getElementById('energy').data = {
    nodes: [
      { id: 'solar', label: 'Solar', color: '#f59e0b' },
      { id: 'wind', label: 'Wind', color: '#3b82f6' },
      { id: 'electric', label: 'Electricity', color: '#8b5cf6' },
      { id: 'residential', label: 'Residential', color: '#10b981' },
      { id: 'commercial', label: 'Commercial', color: '#06b6d4' }
    ],
    links: [
      { source: 'solar', target: 'electric', value: 120 },
      { source: 'wind', target: 'electric', value: 90 },
      { source: 'electric', target: 'residential', value: 130 },
      { source: 'electric', target: 'commercial', value: 80 }
    ]
  };
</script>
```

### Budget Breakdown

```html
<snice-sankey id="budget" show-labels show-values style="height: 300px;"></snice-sankey>

<script type="module">
  document.getElementById('budget').data = {
    nodes: [
      { id: 'salary', label: 'Salary', color: '#10b981' },
      { id: 'housing', label: 'Housing', color: '#ef4444' },
      { id: 'food', label: 'Food', color: '#f59e0b' },
      { id: 'savings', label: 'Savings', color: '#06b6d4' }
    ],
    links: [
      { source: 'salary', target: 'housing', value: 1500 },
      { source: 'salary', target: 'food', value: 600 },
      { source: 'salary', target: 'savings', value: 900 }
    ]
  };
</script>
```

### With Event Handling

```html
<snice-sankey id="clickable" show-labels style="height: 300px;"></snice-sankey>
<div id="output"></div>

<script type="module">
  const sankey = document.getElementById('clickable');
  const output = document.getElementById('output');

  sankey.data = {
    nodes: [
      { id: 'a', label: 'Source A' },
      { id: 'b', label: 'Source B' },
      { id: 'c', label: 'Target C' }
    ],
    links: [
      { source: 'a', target: 'c', value: 50 },
      { source: 'b', target: 'c', value: 30 }
    ]
  };

  sankey.addEventListener('@snice/sankey-node-click', (e) => {
    output.textContent = `Clicked node: ${e.detail.node.label}`;
  });

  sankey.addEventListener('@snice/sankey-link-click', (e) => {
    output.textContent = `Clicked link: ${e.detail.link.source} -> ${e.detail.link.target}`;
  });
</script>
```

### Custom Node Width and Padding

```html
<snice-sankey id="custom" node-width="30" node-padding="20" show-labels style="height: 300px;"></snice-sankey>
```

### Alignment Options

```html
<!-- Left-aligned (sources at left) -->
<snice-sankey alignment="left" show-labels></snice-sankey>

<!-- Right-aligned (sinks at right) -->
<snice-sankey alignment="right" show-labels></snice-sankey>

<!-- Center-aligned (isolated nodes centered) -->
<snice-sankey alignment="center" show-labels></snice-sankey>

<!-- Justified (default, sinks pushed to right) -->
<snice-sankey alignment="justify" show-labels></snice-sankey>
```

## Accessibility

- **ARIA role**: The diagram container has `role="img"` for screen reader support
- **ARIA label**: `aria-label="Sankey diagram"` describes the visualization
- **Keyboard navigation**: Nodes and links are interactive via click events
- **Hover feedback**: Visual dimming of non-connected elements on hover
- **Color independence**: Labels and values provide non-color context

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1, Shadow DOM, and SVG support
- Uses ResizeObserver for responsive sizing

## Best Practices

1. **Set explicit height**: The component needs a defined height (via CSS or style attribute) since it uses `display: block`
2. **Provide labels**: Always include `label` on nodes for clarity
3. **Use meaningful colors**: Assign colors that distinguish categories; auto-colors work for quick prototyping
4. **Keep data manageable**: Sankey diagrams work best with 5-20 nodes and clear flow direction
5. **Enable animation**: Use `animation` for initial presentation or when data changes
6. **Handle events**: Use click events for drill-down or detail views
7. **Responsive layout**: The component automatically resizes via ResizeObserver
8. **Test dark mode**: The component uses theme variables with fallbacks for both themes
