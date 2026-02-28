import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders, wait } from './test-utils';
import '../../components/progress-ring/snice-progress-ring';
import type { SniceProgressRingElement } from '../../components/progress-ring/snice-progress-ring.types';

describe('snice-progress-ring', () => {
  let el: SniceProgressRingElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render progress-ring element', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-PROGRESS-RING');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring');
      expect(el.value).toBe(0);
      expect(el.max).toBe(100);
      expect(el.size).toBe('medium');
      expect(el.thickness).toBe(4);
      expect(el.color).toBe('');
      expect(el.showValue).toBe(false);
      expect(el.label).toBe('');
    });

    it('should render SVG track and fill circles', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring');
      await wait(50);

      const track = queryShadow(el as HTMLElement, '.progress-ring__track');
      const fill = queryShadow(el as HTMLElement, '.progress-ring__fill');

      expect(track).toBeTruthy();
      expect(fill).toBeTruthy();
    });
  });

  describe('value display', () => {
    it('should show percentage when show-value is true', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50,
        'show-value': true
      });
      await wait(50);

      const valueEl = queryShadow(el as HTMLElement, '.progress-ring__value');
      expect(valueEl).toBeTruthy();
      expect(valueEl?.textContent?.trim()).toBe('50%');
    });

    it('should not show value when show-value is false', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50
      });
      await wait(50);

      const valueEl = queryShadow(el as HTMLElement, '.progress-ring__value');
      expect(valueEl).toBeNull();
    });

    it('should show label when provided', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50,
        label: 'Loading'
      });
      await wait(50);

      const labelEl = queryShadow(el as HTMLElement, '.progress-ring__label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent?.trim()).toBe('Loading');
    });

    it('should update display when value changes', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        'show-value': true,
        value: 10
      });

      const tracker = trackRenders(el as HTMLElement);
      el.value = 75;
      await tracker.next();

      const valueEl = queryShadow(el as HTMLElement, '.progress-ring__value');
      expect(valueEl?.textContent?.trim()).toBe('75%');
    });
  });

  describe('SVG rendering', () => {
    it('should set stroke-dasharray on fill circle', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50
      });
      await wait(50);

      const fill = queryShadow(el as HTMLElement, '.progress-ring__fill');
      const dashArray = fill?.getAttribute('stroke-dasharray');
      expect(dashArray).toBeTruthy();
      expect(Number(dashArray)).toBeGreaterThan(0);
    });

    it('should set correct offset for 0%', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 0
      });
      await wait(50);

      const fill = queryShadow(el as HTMLElement, '.progress-ring__fill');
      const dashArray = Number(fill?.getAttribute('stroke-dasharray'));
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashOffset).toBeCloseTo(dashArray, 0);
    });

    it('should set correct offset for 100%', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 100
      });
      await wait(50);

      const fill = queryShadow(el as HTMLElement, '.progress-ring__fill');
      const dashOffset = Number(fill?.getAttribute('stroke-dashoffset'));
      expect(dashOffset).toBeCloseTo(0, 0);
    });

    it('should apply custom thickness', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        thickness: 8
      });
      await wait(50);

      const track = queryShadow(el as HTMLElement, '.progress-ring__track');
      const fill = queryShadow(el as HTMLElement, '.progress-ring__fill');
      expect(track?.getAttribute('stroke-width')).toBe('8');
      expect(fill?.getAttribute('stroke-width')).toBe('8');
    });
  });

  describe('sizes', () => {
    it('should support different sizes', async () => {
      const sizes = ['small', 'medium', 'large'];

      for (const size of sizes) {
        el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
          size,
          value: 50
        });

        expect(el.size).toBe(size);
        expect(el.getAttribute('size')).toBe(size);
        removeComponent(el as HTMLElement);
      }
    });
  });

  describe('color', () => {
    it('should apply custom color via CSS variable', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        color: '#ff5500'
      });
      await wait(50);

      expect((el as HTMLElement).style.getPropertyValue('--progress-ring-color')).toBe('#ff5500');
    });

    it('should remove custom color when reset to empty', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        color: '#ff5500'
      });

      const tracker = trackRenders(el as HTMLElement);
      el.color = '';
      await tracker.next();

      expect((el as HTMLElement).style.getPropertyValue('--progress-ring-color')).toBe('');
    });
  });

  describe('progress-complete event', () => {
    it('should dispatch progress-complete when reaching max', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 90
      });
      await wait(50);

      let detail: any = null;
      (el as HTMLElement).addEventListener('progress-complete', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      el.value = 100;

      expect(detail).toBeTruthy();
      expect(detail.value).toBe(100);
      expect(detail.max).toBe(100);
    });
  });

  describe('accessibility', () => {
    it('should have role="progressbar"', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50
      });
      await wait(50);

      const ring = queryShadow(el as HTMLElement, '[role="progressbar"]');
      expect(ring).toBeTruthy();
    });

    it('should set aria-valuenow', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 42
      });
      await wait(50);

      const ring = queryShadow(el as HTMLElement, '[role="progressbar"]');
      expect(ring?.getAttribute('aria-valuenow')).toBe('42');
    });

    it('should set aria-valuemin and aria-valuemax', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50,
        max: 200
      });
      await wait(50);

      const ring = queryShadow(el as HTMLElement, '[role="progressbar"]');
      expect(ring?.getAttribute('aria-valuemin')).toBe('0');
      expect(ring?.getAttribute('aria-valuemax')).toBe('200');
    });

    it('should set aria-label from label property', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50,
        label: 'Upload progress'
      });
      await wait(50);

      const ring = queryShadow(el as HTMLElement, '[role="progressbar"]');
      expect(ring?.getAttribute('aria-label')).toBe('Upload progress');
    });
  });

  describe('max', () => {
    it('should support custom max value', async () => {
      el = await createComponent<SniceProgressRingElement>('snice-progress-ring', {
        value: 50,
        max: 200,
        'show-value': true
      });
      await wait(50);

      const valueEl = queryShadow(el as HTMLElement, '.progress-ring__value');
      expect(valueEl?.textContent?.trim()).toBe('25%'); // 50/200 = 25%
    });
  });
});
