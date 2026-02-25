import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/funnel/snice-funnel';
import type { SniceFunnelElement, FunnelStage } from '../../components/funnel/snice-funnel.types';

const SAMPLE_DATA: FunnelStage[] = [
  { label: 'Visitors', value: 10000 },
  { label: 'Leads', value: 5000 },
  { label: 'Opportunities', value: 2000 },
  { label: 'Customers', value: 500 },
];

describe('snice-funnel', () => {
  let funnel: SniceFunnelElement;

  afterEach(() => {
    if (funnel) {
      removeComponent(funnel as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render funnel element', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      expect(funnel).toBeTruthy();
      expect(funnel.tagName).toBe('SNICE-FUNNEL');
    });

    it('should have default properties', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      expect(funnel.data).toEqual([]);
      expect(funnel.variant).toBe('default');
      expect(funnel.orientation).toBe('vertical');
      expect(funnel.showLabels).toBe(true);
      expect(funnel.showValues).toBe(true);
      expect(funnel.showPercentages).toBe(true);
      expect(funnel.animation).toBe(false);
    });

    it('should render empty when no data', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      const svg = queryShadow(funnel as HTMLElement, '.funnel__svg');
      expect(svg).toBeNull();
    });
  });

  describe('data rendering', () => {
    it('should render stages from data', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(4);
    });

    it('should render SVG paths for stages', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const paths = queryShadowAll(funnel as HTMLElement, '.funnel__stage-shape');
      expect(paths.length).toBe(4);

      paths.forEach(path => {
        expect(path.getAttribute('d')).toBeTruthy();
        expect(path.getAttribute('fill')).toBeTruthy();
      });
    });

    it('should update when data changes', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      let stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(4);

      funnel.data = SAMPLE_DATA.slice(0, 2);
      await wait(200);

      stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(2);
    });
  });

  describe('labels and values', () => {
    it('should show labels by default', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const labels = queryShadowAll(funnel as HTMLElement, '.funnel__label');
      expect(labels.length).toBe(4);
      expect(labels[0].textContent?.trim()).toBe('Visitors');
    });

    it('should hide labels when show-labels is false', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        'show-labels': false
      });

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const labels = queryShadowAll(funnel as HTMLElement, '.funnel__label');
      expect(labels.length).toBe(0);
    });

    it('should show values by default', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const values = queryShadowAll(funnel as HTMLElement, '.funnel__value');
      expect(values.length).toBe(4);
    });

    it('should hide values when show-values is false', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        'show-values': false
      });

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const values = queryShadowAll(funnel as HTMLElement, '.funnel__value');
      expect(values.length).toBe(0);
    });

    it('should show percentages for non-first stages', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const percentages = queryShadowAll(funnel as HTMLElement, '.funnel__percentage');
      // First stage doesn't show percentage
      expect(percentages.length).toBe(3);
    });

    it('should hide percentages when show-percentages is false', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        'show-percentages': false
      });

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const percentages = queryShadowAll(funnel as HTMLElement, '.funnel__percentage');
      expect(percentages.length).toBe(0);
    });

    it('should format large values', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = [
        { label: 'Stage A', value: 1500000 },
        { label: 'Stage B', value: 50000 },
        { label: 'Stage C', value: 1200 },
      ];
      await wait(200);

      const values = queryShadowAll(funnel as HTMLElement, '.funnel__value');
      expect(values[0].textContent?.trim()).toBe('1.5M');
      expect(values[1].textContent?.trim()).toBe('50.0K');
      expect(values[2].textContent?.trim()).toBe('1.2K');
    });
  });

  describe('variants', () => {
    it('should support default variant', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      expect(funnel.variant).toBe('default');
    });

    it('should support gradient variant', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        variant: 'gradient'
      });

      expect(funnel.variant).toBe('gradient');
      expect(funnel.getAttribute('variant')).toBe('gradient');
    });

    it('should use custom colors from data', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = [
        { label: 'A', value: 100, color: 'rgb(255, 0, 0)' },
        { label: 'B', value: 50, color: 'rgb(0, 255, 0)' },
      ];
      await wait(200);

      const paths = queryShadowAll(funnel as HTMLElement, '.funnel__stage-shape');
      expect(paths[0].getAttribute('fill')).toBe('rgb(255, 0, 0)');
      expect(paths[1].getAttribute('fill')).toBe('rgb(0, 255, 0)');
    });
  });

  describe('orientation', () => {
    it('should default to vertical', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      expect(funnel.orientation).toBe('vertical');
    });

    it('should support horizontal orientation', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        orientation: 'horizontal'
      });

      funnel.data = SAMPLE_DATA;
      await wait(200);

      expect(funnel.orientation).toBe('horizontal');
      expect(funnel.getAttribute('orientation')).toBe('horizontal');

      const svg = queryShadow(funnel as HTMLElement, '.funnel__svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should emit funnel-click when stage path is clicked', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      let clickEvent: CustomEvent | null = null;
      funnel.addEventListener('funnel-click', (e) => {
        clickEvent = e as CustomEvent;
      });

      // Click on the path element with data-index (via event delegation)
      const path = queryShadow(funnel as HTMLElement, '.funnel__stage-shape');
      // The stage <g> has data-index, event bubbles up to container
      const stageG = queryShadow(funnel as HTMLElement, '.funnel__stage');
      stageG?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(clickEvent).toBeTruthy();
      expect(clickEvent!.detail.stage.label).toBe('Visitors');
      expect(clickEvent!.detail.index).toBe(0);
    });

    it('should emit funnel-hover on mousemove over stage', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      let hoverEvent: CustomEvent | null = null;
      funnel.addEventListener('funnel-hover', (e) => {
        hoverEvent = e as CustomEvent;
      });

      const stageG = queryShadow(funnel as HTMLElement, '.funnel__stage');
      stageG?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

      expect(hoverEvent).toBeTruthy();
      expect(hoverEvent!.detail.stage.label).toBe('Visitors');
      expect(hoverEvent!.detail.index).toBe(0);
    });
  });

  describe('tooltip', () => {
    it('should show tooltip on mousemove over stage', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const stageG = queryShadow(funnel as HTMLElement, '.funnel__stage');
      stageG?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
      await wait(200);

      const tooltip = queryShadow(funnel as HTMLElement, '.funnel__tooltip');
      expect(tooltip).toBeTruthy();

      const label = queryShadow(funnel as HTMLElement, '.funnel__tooltip-label');
      expect(label?.textContent?.trim()).toBe('Visitors');
    });

  });

  describe('accessibility', () => {
    it('should have role="img" on SVG', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const svg = queryShadow(funnel as HTMLElement, '.funnel__svg');
      expect(svg?.getAttribute('role')).toBe('img');
      expect(svg?.getAttribute('aria-label')).toBe('Funnel chart');
    });

    it('should have role="button" and tabindex on each stage', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(4);
      stages.forEach(stage => {
        expect(stage.getAttribute('role')).toBe('button');
        expect(stage.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have aria-label on stages', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages[0].getAttribute('aria-label')).toContain('Visitors');
      expect(stages[0].getAttribute('aria-label')).toContain('10000');
    });

    it('should support keyboard activation', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      let clickEvent: CustomEvent | null = null;
      funnel.addEventListener('funnel-click', (e) => {
        clickEvent = e as CustomEvent;
      });

      const stageG = queryShadow(funnel as HTMLElement, '.funnel__stage');
      stageG?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(clickEvent).toBeTruthy();
    });
  });

  describe('animation', () => {
    it('should not have animation attribute by default', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      expect(funnel.animation).toBe(false);
      expect(funnel.hasAttribute('animation')).toBe(false);
    });

    it('should set animation attribute', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel', {
        animation: true
      });

      expect(funnel.animation).toBe(true);
    });
  });

  describe('public API', () => {
    it('should set stages via setStages method', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.setStages(SAMPLE_DATA);
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(4);
    });

    it('should return empty string from exportImage when no data', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      const result = funnel.exportImage();
      expect(result).toBe('');
    });

    it('should export SVG data URL', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = SAMPLE_DATA;
      await wait(200);

      const result = funnel.exportImage('svg');
      expect(result).toContain('data:image/svg+xml');
    });
  });

  describe('edge cases', () => {
    it('should handle single stage', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = [{ label: 'Only', value: 100 }];
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(1);
    });

    it('should handle zero values', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = [
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
      ];
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(2);
    });

    it('should handle many stages', async () => {
      funnel = await createComponent<SniceFunnelElement>('snice-funnel');

      funnel.data = Array.from({ length: 10 }, (_, i) => ({
        label: `Stage ${i + 1}`,
        value: 10000 - i * 900,
      }));
      await wait(200);

      const stages = queryShadowAll(funnel as HTMLElement, '.funnel__stage');
      expect(stages.length).toBe(10);
    });
  });
});
