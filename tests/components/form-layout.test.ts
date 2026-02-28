import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/form-layout/snice-form-layout';
import type { SniceFormLayoutElement } from '../../components/form-layout/snice-form-layout.types';

describe('snice-form-layout', () => {
  let layout: SniceFormLayoutElement;

  afterEach(() => {
    if (layout) {
      removeComponent(layout as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render form-layout element', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout');

      expect(layout).toBeTruthy();
      expect(layout.tagName).toBe('SNICE-FORM-LAYOUT');
    });

    it('should have default properties', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout');

      expect(layout.columns).toBe(1);
      expect(layout.labelPosition).toBe('top');
      expect(layout.labelWidth).toBe('8rem');
      expect(layout.gap).toBe('medium');
      expect(layout.variant).toBe('default');
    });

    it('should render base container', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout');
      await wait(50);

      const base = queryShadow(layout as HTMLElement, '.form-layout');
      expect(base).toBeTruthy();
    });

    it('should render default slot', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout');
      await wait(50);

      const slot = queryShadow(layout as HTMLElement, 'slot');
      expect(slot).toBeTruthy();
    });
  });

  describe('columns', () => {
    it('should accept columns property', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
        columns: 2
      });

      expect(layout.columns).toBe(2);
    });

    it('should set CSS custom property for columns', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
        columns: 3
      });
      await wait(50);

      const base = queryShadow(layout as HTMLElement, '.form-layout') as HTMLElement;
      expect(base?.style.getPropertyValue('--form-columns')).toBe('3');
    });
  });

  describe('label-position', () => {
    const positions = ['top', 'left', 'right'];

    positions.forEach(pos => {
      it(`should apply ${pos} label position class`, async () => {
        layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
          'label-position': pos
        });
        await wait(50);

        const base = queryShadow(layout as HTMLElement, '.form-layout');
        expect(base?.classList.contains(`form-layout--labels-${pos}`)).toBe(true);
      });
    });
  });

  describe('gap variants', () => {
    const gaps = ['small', 'medium', 'large'];

    gaps.forEach(gap => {
      it(`should apply ${gap} gap class`, async () => {
        layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
          gap
        });
        await wait(50);

        const base = queryShadow(layout as HTMLElement, '.form-layout');
        expect(base?.classList.contains(`form-layout--gap-${gap}`)).toBe(true);
      });
    });
  });

  describe('variant styles', () => {
    const variants = ['default', 'compact', 'inline'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
          variant
        });
        await wait(50);

        const base = queryShadow(layout as HTMLElement, '.form-layout');
        expect(base?.classList.contains(`form-layout--${variant}`)).toBe(true);
      });
    });
  });

  describe('label-width', () => {
    it('should accept custom label-width', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
        'label-width': '12rem'
      });

      expect(layout.labelWidth).toBe('12rem');
    });

    it('should set CSS custom property for label width', async () => {
      layout = await createComponent<SniceFormLayoutElement>('snice-form-layout', {
        'label-width': '10rem'
      });
      await wait(50);

      const base = queryShadow(layout as HTMLElement, '.form-layout') as HTMLElement;
      expect(base?.style.getPropertyValue('--form-label-width')).toBe('10rem');
    });
  });

  describe('slot content', () => {
    it('should accept slotted children', async () => {
      layout = document.createElement('snice-form-layout') as SniceFormLayoutElement;
      const child = document.createElement('div');
      child.textContent = 'Form field';
      layout.appendChild(child);
      document.body.appendChild(layout as HTMLElement);
      await (layout as any).ready;

      const slot = queryShadow(layout as HTMLElement, 'slot') as HTMLSlotElement;
      expect(slot?.assignedNodes().length).toBeGreaterThan(0);
    });
  });
});
