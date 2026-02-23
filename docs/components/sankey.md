[//]: # (AI: For a low-token version of this doc, use docs/ai/components/sankey.md instead)

# Sankey
`<snice-sankey>`

An SVG-based Sankey diagram for visualizing flow between categories.

## Basic Usage

```typescript
import 'snice/components/sankey/snice-sankey';
```

```html
<snice-sankey id="diagram" show-labels show-values style="height: 300px;"></snice-sankey>

<script type="module">
  document.getElementById('diagram').data = {
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

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/sankey/snice-sankey';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-sankey.min.js"></script>
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

### Alignment Options

Use the `alignment` attribute to control how leaf nodes are positioned.

```html
<snice-sankey alignment="left" show-labels></snice-sankey>
<snice-sankey alignment="right" show-labels></snice-sankey>
<snice-sankey alignment="center" show-labels></snice-sankey>
<snice-sankey alignment="justify" show-labels></snice-sankey>
```

### Custom Node Width and Padding

Use `node-width` and `node-padding` to adjust the layout.

```html
<snice-sankey node-width="30" node-padding="20" show-labels style="height: 300px;"></snice-sankey>
```

### Animation

Set the `animation` attribute for animated rendering.

```html
<snice-sankey animation show-labels show-values></snice-sankey>
```

### Event Handling

```typescript
const sankey = document.querySelector('snice-sankey');

sankey.addEventListener('@snice/sankey-node-click', (e) => {
  console.log('Node:', e.detail.node.label);
});

sankey.addEventListener('@snice/sankey-link-click', (e) => {
  console.log('Link:', e.detail.link.source, '->', e.detail.link.target);
});

sankey.addEventListener('@snice/sankey-hover', (e) => {
  if (e.detail) {
    console.log('Hovering:', e.detail.type, e.detail.item);
  }
});
```

## Data Types

```typescript
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyNode {
  id: string;
  label?: string;   // Defaults to id
  color?: string;    // Auto-assigned if omitted
}

interface SankeyLink {
  source: string;    // Source node id
  target: string;    // Target node id
  value: number;     // Flow value (determines width)
  color?: string;    // Defaults to source color
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `SankeyData` | `{ nodes: [], links: [] }` | Nodes and links data (set via JS) |
| `nodeWidth` (attr: `node-width`) | `number` | `20` | Width of node rectangles |
| `nodePadding` (attr: `node-padding`) | `number` | `10` | Vertical padding between nodes |
| `alignment` | `'left' \| 'right' \| 'center' \| 'justify'` | `'justify'` | Leaf node alignment |
| `showLabels` (attr: `show-labels`) | `boolean` | `true` | Show node labels |
| `showValues` (attr: `show-values`) | `boolean` | `true` | Show node values |
| `animation` | `boolean` | `false` | Animate on initial render |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/sankey-node-click` | `{ node: SankeyNode }` | Node clicked |
| `@snice/sankey-link-click` | `{ link: SankeyLink }` | Link clicked |
| `@snice/sankey-hover` | `{ type: 'node' \| 'link', item } \| null` | Hover state changed |
