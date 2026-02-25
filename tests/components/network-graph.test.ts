import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/network-graph/snice-network-graph';
import type { SniceNetworkGraphElement, NetworkGraphData } from '../../components/network-graph/snice-network-graph.types';

const SAMPLE_DATA: NetworkGraphData = {
  nodes: [
    { id: 'a', label: 'Node A', group: 'group1' },
    { id: 'b', label: 'Node B', group: 'group1' },
    { id: 'c', label: 'Node C', group: 'group2' },
    { id: 'd', label: 'Node D', group: 'group2' },
  ],
  edges: [
    { source: 'a', target: 'b', label: 'AB' },
    { source: 'b', target: 'c' },
    { source: 'c', target: 'd', weight: 3 },
    { source: 'a', target: 'd' },
  ],
};

async function setGraphData(graph: SniceNetworkGraphElement, data: NetworkGraphData) {
  graph.animation = false;
  graph.data = data;
  // Wait for watch callbacks and RAF to complete
  await wait(200);
}

describe('snice-network-graph', () => {
  let graph: SniceNetworkGraphElement;

  afterEach(() => {
    if (graph) {
      removeComponent(graph as HTMLElement);
    }
  });

  describe('basic rendering', () => {
    it('should render the element', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      expect(graph).toBeTruthy();
      expect(graph.tagName).toBe('SNICE-NETWORK-GRAPH');
    });

    it('should have default properties', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      expect(graph.layout).toBe('force');
      expect(graph.chargeStrength).toBe(-300);
      expect(graph.linkDistance).toBe(80);
      expect(graph.zoomEnabled).toBe(true);
      expect(graph.dragEnabled).toBe(true);
      expect(graph.showLabels).toBe(true);
      expect(graph.animation).toBe(true);
    });

    it('should render SVG container', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      const svg = queryShadow(graph as HTMLElement, '.network-graph__svg');
      expect(svg).toBeTruthy();
    });

    it('should have accessible role', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      const container = queryShadow(graph as HTMLElement, '[role="img"]');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('aria-label')).toBe('Network graph visualization');
    });
  });

  describe('data rendering', () => {
    it('should render nodes when data is set', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, SAMPLE_DATA);

      const nodes = queryShadowAll(graph as HTMLElement, '.network-graph__node');
      expect(nodes.length).toBe(4);
    });

    it('should render edges when data is set', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, SAMPLE_DATA);

      const edges = queryShadowAll(graph as HTMLElement, '.network-graph__edge');
      expect(edges.length).toBe(4);
    });

    it('should render node circles with colors', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'x', color: 'rgb(255, 0, 0)' }],
        edges: [],
      });

      const circle = queryShadow(graph as HTMLElement, '.network-graph__node-circle');
      expect(circle).toBeTruthy();
      expect(circle?.getAttribute('fill')).toBe('rgb(255, 0, 0)');
    });

    it('should render node labels when showLabels is true', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'x', label: 'Test Node' }],
        edges: [],
      });

      const label = queryShadow(graph as HTMLElement, '.network-graph__node-label');
      expect(label).toBeTruthy();
      expect(label?.textContent?.trim()).toBe('Test Node');
    });

    it('should hide labels when showLabels is false', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      graph.animation = false;
      graph.showLabels = false;
      graph.data = {
        nodes: [{ id: 'x', label: 'Hidden' }],
        edges: [],
      };
      await wait(200);

      const label = queryShadow(graph as HTMLElement, '.network-graph__node-label');
      expect(label).toBeNull();
    });

    it('should render edge labels', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ source: 'a', target: 'b', label: 'connects' }],
      });

      const edgeLabel = queryShadow(graph as HTMLElement, '.network-graph__edge-label');
      expect(edgeLabel).toBeTruthy();
      expect(edgeLabel?.textContent?.trim()).toBe('connects');
    });
  });

  describe('layouts', () => {
    it('should support force layout', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, SAMPLE_DATA);

      expect(graph.layout).toBe('force');
      const nodes = queryShadowAll(graph as HTMLElement, '.network-graph__node');
      expect(nodes.length).toBe(4);
    });

    it('should support circular layout', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      graph.animation = false;
      graph.layout = 'circular';
      graph.data = SAMPLE_DATA;
      await wait(200);

      expect(graph.layout).toBe('circular');
      const nodes = queryShadowAll(graph as HTMLElement, '.network-graph__node');
      expect(nodes.length).toBe(4);
    });

    it('should support grid layout', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      graph.animation = false;
      graph.layout = 'grid';
      graph.data = SAMPLE_DATA;
      await wait(200);

      expect(graph.layout).toBe('grid');
      const nodes = queryShadowAll(graph as HTMLElement, '.network-graph__node');
      expect(nodes.length).toBe(4);
    });
  });

  describe('properties', () => {
    it('should accept charge-strength attribute', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph', {
        'charge-strength': -500,
      });

      expect(graph.chargeStrength).toBe(-500);
    });

    it('should accept link-distance attribute', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph', {
        'link-distance': 120,
      });

      expect(graph.linkDistance).toBe(120);
    });

    it('should accept zoom-enabled attribute', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      expect(graph.zoomEnabled).toBe(true);
    });

    it('should accept drag-enabled attribute', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      expect(graph.dragEnabled).toBe(true);
    });
  });

  describe('node sizing', () => {
    it('should size nodes by degree when no custom size', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'hub' }, { id: 'leaf1' }, { id: 'leaf2' }, { id: 'leaf3' }],
        edges: [
          { source: 'hub', target: 'leaf1' },
          { source: 'hub', target: 'leaf2' },
          { source: 'hub', target: 'leaf3' },
        ],
      });

      const circles = queryShadowAll(graph as HTMLElement, '.network-graph__node-circle');
      expect(circles.length).toBe(4);

      // Hub has degree 3, leaves have degree 1
      const hubRadius = Number(circles[0].getAttribute('r'));
      const leafRadius = Number(circles[1].getAttribute('r'));
      expect(hubRadius).toBeGreaterThan(leafRadius);
    });

    it('should use custom size when provided', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'big', size: 25 }],
        edges: [],
      });

      const circle = queryShadow(graph as HTMLElement, '.network-graph__node-circle');
      expect(circle?.getAttribute('r')).toBe('25');
    });
  });

  describe('color coding', () => {
    it('should color nodes by group', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [
          { id: 'a', group: 'alpha' },
          { id: 'b', group: 'beta' },
          { id: 'c', group: 'alpha' },
        ],
        edges: [],
      });

      const circles = queryShadowAll(graph as HTMLElement, '.network-graph__node-circle');
      expect(circles.length).toBe(3);
      const colorA = circles[0].getAttribute('fill');
      const colorB = circles[1].getAttribute('fill');
      const colorC = circles[2].getAttribute('fill');

      // Same group should have same color
      expect(colorA).toBe(colorC);
      // Different groups should have different colors
      expect(colorA).not.toBe(colorB);
    });

    it('should use custom node color over group color', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'x', group: 'alpha', color: 'rgb(0, 128, 0)' }],
        edges: [],
      });

      const circle = queryShadow(graph as HTMLElement, '.network-graph__node-circle');
      expect(circle?.getAttribute('fill')).toBe('rgb(0, 128, 0)');
    });
  });

  describe('tooltip', () => {
    it('should render tooltip container', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      const tooltip = queryShadow(graph as HTMLElement, '.network-graph__tooltip');
      expect(tooltip).toBeTruthy();
    });

  });

  describe('empty state', () => {
    it('should render without errors when data is empty', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      graph.data = { nodes: [], edges: [] };
      await wait(100);

      const nodes = queryShadowAll(graph as HTMLElement, '.network-graph__node');
      const edges = queryShadowAll(graph as HTMLElement, '.network-graph__edge');
      expect(nodes.length).toBe(0);
      expect(edges.length).toBe(0);
    });
  });

  describe('edge rendering', () => {
    it('should apply custom edge color', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ source: 'a', target: 'b', color: 'rgb(255, 0, 0)' }],
      });

      const edge = queryShadow(graph as HTMLElement, '.network-graph__edge');
      expect(edge?.getAttribute('stroke')).toBe('rgb(255, 0, 0)');
    });

    it('should apply edge weight as stroke-width', async () => {
      graph = await createComponent<SniceNetworkGraphElement>('snice-network-graph');
      await setGraphData(graph, {
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ source: 'a', target: 'b', weight: 5 }],
      });

      const edge = queryShadow(graph as HTMLElement, '.network-graph__edge');
      expect(edge?.getAttribute('stroke-width')).toBe('5');
    });
  });
});
