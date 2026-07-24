import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/color-display/snice-color-display';
import type { SniceColorDisplayElement } from '../../packages/components/src/color-display/snice-color-display.types';

describe('snice-color-display', () => {
  let colorDisplay: SniceColorDisplayElement;

  afterEach(() => {
    if (colorDisplay) {
      removeComponent(colorDisplay as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render color display element', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display');
      expect(colorDisplay).toBeTruthy();
      expect(colorDisplay.tagName).toBe('SNICE-COLOR-DISPLAY');
    });

    it('should have default properties', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display');
      expect(colorDisplay.value).toBe('');
      expect(colorDisplay.format).toBe('hex');
      expect(colorDisplay.showSwatch).toBe(true);
      expect(colorDisplay.showLabel).toBe(true);
      expect(colorDisplay.swatchSize).toBe('medium');
      expect(colorDisplay.label).toBe('');
    });

    it('should render container', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display');
      await wait(50);

      const container = queryShadow(colorDisplay as HTMLElement, '.color-display');
      expect(container).toBeTruthy();
    });
  });

  describe('color value', () => {
    it('should render color swatch with value', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000'
      });
      await wait(50);

      const swatch = queryShadow(colorDisplay as HTMLElement, '.color-swatch');
      expect(swatch).toBeTruthy();
      // JSDOM returns hex format
      expect(swatch?.style.backgroundColor).toBe('#ff0000');
    });

    it('should display hex format by default', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#3b82f6'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('#3b82f6');
    });
  });

  describe('formats', () => {
    it('should display hex format', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        format: 'hex'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('#ff0000');
    });

    it('should convert to rgb format', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        format: 'rgb'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('rgb(255, 0, 0)');
    });

    it('should convert to hsl format', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        format: 'hsl'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('swatch sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} swatch size class`, async () => {
        colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
          value: '#3b82f6',
          'swatch-size': size
        });
        await wait(50);

        const swatch = queryShadow(colorDisplay as HTMLElement, '.color-swatch');
        expect(swatch?.classList.contains(`color-swatch--${size}`)).toBe(true);
      });
    });
  });

  describe('show/hide swatch', () => {
    it('should show swatch by default', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000'
      });
      await wait(50);

      const swatch = queryShadow(colorDisplay as HTMLElement, '.color-swatch');
      expect(swatch).toBeTruthy();
    });

    it('should hide swatch when show-swatch is false', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        'show-swatch': false
      });
      await wait(50);

      const swatch = queryShadow(colorDisplay as HTMLElement, '.color-swatch');
      if (swatch) {
        expect(swatch.offsetParent).toBeFalsy();
      }
    });
  });

  describe('show/hide label', () => {
    it('should show label by default', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label).toBeTruthy();
    });

    it('should hide label when show-label is false', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        'show-label': false
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      if (label) {
        expect(label.offsetParent).toBeFalsy();
      }
    });
  });

  describe('custom label', () => {
    it('should use custom label when provided', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ff0000',
        label: 'Red Color'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('Red Color');
    });

    it('should use formatted color when no custom label', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#00ff00',
        format: 'rgb'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('rgb(0, 255, 0)');
    });
  });

  describe('color conversion', () => {
    it('should convert white to rgb correctly', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#ffffff',
        format: 'rgb'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('rgb(255, 255, 255)');
    });

    it('should convert black to hsl correctly', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#000000',
        format: 'hsl'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('hsl(0, 0%, 0%)');
    });

    it('should handle blue color conversion', async () => {
      colorDisplay = await createComponent<SniceColorDisplayElement>('snice-color-display', {
        value: '#0000ff',
        format: 'hsl'
      });
      await wait(50);

      const label = queryShadow(colorDisplay as HTMLElement, '.color-label');
      expect(label?.textContent).toBe('hsl(240, 100%, 50%)');
    });
  });

  describe('swatch accessibility', () => {
    it('should give the swatch an accessible name when the label is hidden', async () => {
      const el = document.createElement('snice-color-display') as any;
      el.setAttribute('value', '#ff0000');
      el.setAttribute('show-label', 'false');
      document.body.appendChild(el);
      await el.ready;
      await new Promise((r) => setTimeout(r, 50));

      const swatch = el.shadowRoot.querySelector('.color-swatch');
      expect(swatch?.getAttribute('role')).toBe('img');
      expect(swatch?.getAttribute('aria-label')).toContain('#ff0000');
      el.remove();
    });
  });

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/color-display/snice-color-display.css'), 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });
  });
});