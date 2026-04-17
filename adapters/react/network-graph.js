// GENERATED FILE — DO NOT EDIT.
// Source: components/network-graph/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * NetworkGraph - React adapter for snice-network-graph
 *
 * This is an auto-generated React wrapper for the Snice network-graph component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/network-graph';
 * import { NetworkGraph } from 'snice/react';
 *
 * function MyComponent() {
 *   return <NetworkGraph />;
 * }
 * ```
 */
export const NetworkGraph = createReactAdapter({
    tagName: 'snice-network-graph',
    properties: ["data", "layout", "chargeStrength", "linkDistance", "zoomEnabled", "dragEnabled", "showLabels", "animation"],
    events: { "node-click": "onNodeClick", "edge-click": "onEdgeClick", "node-drag": "onNodeDrag", "graph-zoom": "onGraphZoom" },
    formAssociated: false
});
//# sourceMappingURL=network-graph.js.map