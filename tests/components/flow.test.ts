import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/flow/snice-flow';
import type { SniceFlowElement, FlowNode, FlowEdge } from '../../components/flow/snice-flow.types';

const SAMPLE_NODES: FlowNode[] = [
  {
    id: 'start', x: 50, y: 50, label: 'Start', type: 'trigger',
    outputs: [{ id: 'out', label: 'Out' }],
  },
  {
    id: 'process', x: 300, y: 50, label: 'Process', type: 'transform',
    inputs: [{ id: 'in', label: 'In' }],
    outputs: [{ id: 'out', label: 'Out' }],
  },
  {
    id: 'end', x: 550, y: 50, label: 'End',
    inputs: [{ id: 'in', label: 'In' }],
  },
];

const SAMPLE_EDGES: FlowEdge[] = [
  { id: 'e1', source: 'start', target: 'process', sourcePort: 'out', targetPort: 'in' },
  { id: 'e2', source: 'process', target: 'end', sourcePort: 'out', targetPort: 'in' },
];

async function setFlowData(flow: SniceFlowElement, nodes: FlowNode[], edges: FlowEdge[]) {
  flow.nodes = nodes;
  flow.edges = edges;
  // @watch triggers rebuild via innerHTML, wait for it
  await wait(200);
}

describe('snice-flow', () => {
  let flow: SniceFlowElement;

  afterEach(() => {
    if (flow) {
      removeComponent(flow as HTMLElement);
    }
  });

  describe('basic rendering', () => {
    it('should render the element', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      expect(flow).toBeTruthy();
      expect(flow.tagName).toBe('SNICE-FLOW');
    });

    it('should have default properties', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      expect(flow.snapToGrid).toBe(true);
      expect(flow.gridSize).toBe(20);
      expect(flow.zoomEnabled).toBe(true);
      expect(flow.panEnabled).toBe(true);
      expect(flow.minimap).toBe(true);
      expect(flow.editable).toBe(true);
    });

    it('should render SVG container', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      const svg = queryShadow(flow as HTMLElement, '.flow__svg');
      expect(svg).toBeTruthy();
    });

    it('should render nodes container', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      const container = queryShadow(flow as HTMLElement, '.flow__nodes');
      expect(container).toBeTruthy();
    });

    it('should render minimap', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      const minimap = queryShadow(flow as HTMLElement, '.flow__minimap');
      expect(minimap).toBeTruthy();
    });
  });

  describe('data rendering', () => {
    it('should render nodes when data is set', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      const nodes = queryShadowAll(flow as HTMLElement, '.flow__node');
      expect(nodes.length).toBe(3);
    });

    it('should render edges when data is set', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      const edges = queryShadowAll(flow as HTMLElement, '.flow__edge');
      expect(edges.length).toBe(2);
    });

    it('should render node labels', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      const headers = queryShadowAll(flow as HTMLElement, '.flow__node-header');
      expect(headers.length).toBe(3);
      expect(headers[0].textContent).toContain('Start');
    });

    it('should render input ports', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      const inputPorts = queryShadowAll(flow as HTMLElement, '.flow__port:not(.flow__port--output)');
      expect(inputPorts.length).toBe(2);
    });

    it('should render output ports', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      const outputPorts = queryShadowAll(flow as HTMLElement, '.flow__port--output');
      expect(outputPorts.length).toBe(2);
    });

    it('should mark connected ports', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      const connectedPorts = queryShadowAll(flow as HTMLElement, '.flow__port--connected');
      expect(connectedPorts.length).toBeGreaterThan(0);
    });

    it('should render node type labels', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      const typeLabels = queryShadowAll(flow as HTMLElement, '.flow__node-type');
      expect(typeLabels.length).toBe(2);
    });
  });

  describe('public API', () => {
    it('should add a node via addNode', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      flow.addNode({ id: 'new', x: 100, y: 200, label: 'New Node', inputs: [{ id: 'in' }] });
      await wait(200);

      expect(flow.nodes.length).toBe(4);
    });

    it('should remove a node via removeNode', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      flow.removeNode('process');
      await wait(200);

      expect(flow.nodes.length).toBe(2);
      expect(flow.edges.length).toBe(0);
    });

    it('should add an edge via addEdge', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, []);

      flow.addEdge({ id: 'e-new', source: 'start', target: 'end', sourcePort: 'out', targetPort: 'in' });
      await wait(200);

      expect(flow.edges.length).toBe(1);
    });

    it('should remove an edge via removeEdge', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      flow.removeEdge('e1');
      await wait(200);

      expect(flow.edges.length).toBe(1);
    });

    it('should fit view without error', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      expect(() => flow.fitView()).not.toThrow();
    });
  });

  describe('events', () => {
    it('should emit edge-disconnect when removing an edge', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      await setFlowData(flow, SAMPLE_NODES, SAMPLE_EDGES);

      const handler = vi.fn();
      flow.addEventListener('edge-disconnect', handler);

      flow.removeEdge('e1');
      await wait(100);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('properties', () => {
    it('should accept snap-to-grid attribute', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow', { 'snap-to-grid': '' });
      expect(flow.snapToGrid).toBe(true);
    });

    it('should accept grid-size attribute', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow', { 'grid-size': '30' });
      expect(flow.gridSize).toBe(30);
    });
  });

  describe('animated edges', () => {
    it('should render animated edge class', async () => {
      flow = await createComponent<SniceFlowElement>('snice-flow');
      const animatedEdge: FlowEdge = {
        id: 'ea', source: 'start', target: 'end', sourcePort: 'out', targetPort: 'in', animated: true,
      };
      await setFlowData(flow, SAMPLE_NODES, [animatedEdge]);

      const animEdge = queryShadow(flow as HTMLElement, '.flow__edge--animated');
      expect(animEdge).toBeTruthy();
    });
  });
});
