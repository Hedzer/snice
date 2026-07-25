import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-centered';
import type { SniceLayoutCentered } from '../../packages/components/src/layout/snice-layout-centered';

describe('snice-layout-centered', () => {
  let layout: SniceLayoutCentered;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships page, brand, and footer slots for the standard auth page shape', async () => {
      layout = await createComponent<SniceLayoutCentered>('snice-layout-centered');
      await wait(10);

      for (const name of ['page', 'brand', 'footer']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });

    it('hides brand and footer regions when nothing is slotted', async () => {
      layout = await createComponent<SniceLayoutCentered>('snice-layout-centered');
      await wait(30);

      expect(queryShadow(layout as HTMLElement, '.brand')!.classList.contains('brand--empty')).toBe(true);
      expect(queryShadow(layout as HTMLElement, '.footer')!.classList.contains('footer--empty')).toBe(true);
    });

    it('shows brand above the card when slotted', async () => {
      const el = document.createElement('snice-layout-centered');
      el.innerHTML = '<div slot="brand">Acme</div><div slot="page">form</div><div slot="footer"><a href="#">Privacy</a></div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));

      const brand = el.shadowRoot!.querySelector('.brand');
      const footer = el.shadowRoot!.querySelector('.footer');
      expect(brand!.classList.contains('brand--empty')).toBe(false);
      expect(footer!.classList.contains('footer--empty')).toBe(false);
      el.remove();
    });
  });

  describe('card measure', () => {
    it('defaults the card to the standard 24rem auth width', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-centered.css'), 'utf8');

      expect(css).toMatch(/^\.container\s*\{[^}]*max-width:\s*24rem/m);
      expect(css).toMatch(/:host\(\[width="md"\]\) \.container \{ max-width: 24rem; \}/);
    });
  });

  describe('width variants', () => {
    it('keeps the width attribute contract', async () => {
      layout = await createComponent<SniceLayoutCentered>('snice-layout-centered', { width: 'lg' });

      expect(layout.width).toBe('lg');
      const observed = (customElements.get('snice-layout-centered') as any).observedAttributes as string[];
      expect(observed).toContain('width');
    });
  });
});
