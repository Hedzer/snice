import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/sankey/snice-sankey';
import type { SniceSankeyElement } from '../../components/sankey/snice-sankey.types';

const SAMPLE_DATA = {
  nodes: [
    { id: 'a', label: 'Source A' },
    { id: 'b', label: 'Source B' },
    { id: 'c', label: 'Target C' },
    { id: 'd', label: 'Target D' }
  ],
  links: [
    { source: 'a', target: 'c', value: 50 },
    { source: 'a', target: 'd', value: 30 },
    { source: 'b', target: 'c', value: 40 },
    { source: 'b', target: 'd', value: 60 }
  ]
};

describe('snice-sankey', () => {
  let sankey: SniceSankeyElement;

  afterEach(() => {
    if (sankey) {
      removeComponent(sankey as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render sankey element', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      expect(sankey).toBeTruthy();
      expect(sankey.tagName).toBe('SNICE-SANKEY');
    });

    it('should have default properties', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      expect(sankey.nodeWidth).toBe(20);
      expect(sankey.nodePadding).toBe(10);
      expect(sankey.alignment).toBe('justify');
      expect(sankey.showLabels).toBe(true);
      expect(sankey.showValues).toBe(true);
      expect(sankey.animation).toBe(false);
    });

    it('should accept data property', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      expect(sankey.data.nodes).toHaveLength(4);
      expect(sankey.data.links).toHaveLength(4);
    });
  });

  describe('rendering', () => {
    it('should render SVG when data is provided', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const svg = queryShadow(sankey as HTMLElement, '.sankey__svg');
      expect(svg).toBeTruthy();
    });

    it('should render nodes as rectangles', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const nodes = queryShadowAll(sankey as HTMLElement, '.sankey__node');
      expect(nodes.length).toBe(4);
    });

    it('should render links as paths', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const links = queryShadowAll(sankey as HTMLElement, '.sankey__link');
      expect(links.length).toBe(4);
    });

    it('should render node rects with fill color', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = {
        nodes: [
          { id: 'a', label: 'A', color: '#ff0000' },
          { id: 'b', label: 'B', color: '#00ff00' }
        ],
        links: [{ source: 'a', target: 'b', value: 10 }]
      };
      await tracker.next();

      const rects = queryShadowAll(sankey as HTMLElement, '.sankey__node rect');
      expect(rects.length).toBe(2);
      expect(rects[0].getAttribute('fill')).toBe('#ff0000');
      expect(rects[1].getAttribute('fill')).toBe('#00ff00');
    });

    it('should render labels when showLabels is true', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const labels = queryShadowAll(sankey as HTMLElement, '.sankey__label');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should not render labels when showLabels is false', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.showLabels = false;
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const labels = queryShadowAll(sankey as HTMLElement, '.sankey__label');
      expect(labels.length).toBe(0);
    });

    it('should render link paths with bezier curves', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const paths = queryShadowAll(sankey as HTMLElement, '.sankey__link path');
      expect(paths.length).toBe(4);
      paths.forEach(path => {
        const d = path.getAttribute('d');
        expect(d).toContain('M');
        expect(d).toContain('C');
      });
    });
  });

  describe('properties', () => {
    it('should accept custom nodeWidth', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey', {
        'node-width': '30'
      });
      expect(sankey.nodeWidth).toBe(30);
    });

    it('should accept custom nodePadding', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey', {
        'node-padding': '15'
      });
      expect(sankey.nodePadding).toBe(15);
    });

    it('should accept alignment property', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey', {
        alignment: 'left'
      });
      expect(sankey.alignment).toBe('left');
    });
  });

  describe('layout', () => {
    it('should assign different depths to source and target nodes', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = {
        nodes: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' }
        ],
        links: [{ source: 'a', target: 'b', value: 10 }]
      };
      await tracker.next();

      const rects = queryShadowAll(sankey as HTMLElement, '.sankey__node rect');
      expect(rects.length).toBe(2);
      const x0 = Number(rects[0].getAttribute('x'));
      const x1 = Number(rects[1].getAttribute('x'));
      expect(x1).toBeGreaterThan(x0);
    });

    it('should set node width from nodeWidth property', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey', {
        'node-width': '25'
      });
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const rects = queryShadowAll(sankey as HTMLElement, '.sankey__node rect');
      rects.forEach(rect => {
        expect(Number(rect.getAttribute('width'))).toBe(25);
      });
    });

    it('should handle empty data gracefully', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = { nodes: [], links: [] };
      await tracker.next();

      const svg = queryShadow(sankey as HTMLElement, '.sankey__svg');
      expect(svg).toBeNull();
    });
  });

  describe('events', () => {
    it('should emit sankey-node-click on node click', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      let clickedNode: any = null;
      sankey.addEventListener('@snice/sankey-node-click', ((e: CustomEvent) => {
        clickedNode = e.detail.node;
      }) as EventListener);

      const node = queryShadow(sankey as HTMLElement, '.sankey__node');
      node?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickedNode).toBeTruthy();
      expect(clickedNode.id).toBeTruthy();
    });

    it('should emit sankey-link-click on link click', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      let clickedLink: any = null;
      sankey.addEventListener('@snice/sankey-link-click', ((e: CustomEvent) => {
        clickedLink = e.detail.link;
      }) as EventListener);

      const link = queryShadow(sankey as HTMLElement, '.sankey__link');
      link?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickedLink).toBeTruthy();
      expect(clickedLink.source).toBeTruthy();
      expect(clickedLink.target).toBeTruthy();
    });
  });

  describe('tooltip', () => {
    it('should have tooltip element', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const tooltip = queryShadow(sankey as HTMLElement, '.sankey__tooltip');
      expect(tooltip).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have role="img"', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const container = queryShadow(sankey as HTMLElement, '[role="img"]');
      expect(container).toBeTruthy();
    });

    it('should have aria-label', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = SAMPLE_DATA;
      await tracker.next();

      const container = queryShadow(sankey as HTMLElement, '[role="img"]');
      expect(container?.getAttribute('aria-label')).toBe('Sankey diagram');
    });
  });

  describe('data updates', () => {
    it('should re-render when data changes', async () => {
      sankey = await createComponent<SniceSankeyElement>('snice-sankey');
      const tracker = trackRenders(sankey as HTMLElement);
      sankey.data = {
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [{ source: 'a', target: 'b', value: 10 }]
      };
      await tracker.next();

      let nodes = queryShadowAll(sankey as HTMLElement, '.sankey__node');
      expect(nodes.length).toBe(2);

      sankey.data = SAMPLE_DATA;
      await tracker.next();

      nodes = queryShadowAll(sankey as HTMLElement, '.sankey__node');
      expect(nodes.length).toBe(4);
    });
  });
});
