import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-landing';
import type { SniceLayoutLanding } from '../../packages/components/src/layout/snice-layout-landing';

describe('snice-layout-landing', () => {
  let layout: SniceLayoutLanding;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships brand, nav, cta, hero, page, and footer slots', async () => {
      layout = await createComponent<SniceLayoutLanding>('snice-layout-landing');
      await wait(10);

      for (const name of ['brand', 'nav', 'cta', 'hero', 'page', 'footer']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });

    it('leaves hero and page full-bleed so sections manage their own width', async () => {
      layout = await createComponent<SniceLayoutLanding>('snice-layout-landing');
      await wait(10);

      const hero = queryShadow(layout as HTMLElement, '.hero');
      const content = queryShadow(layout as HTMLElement, '.content');
      expect(hero!.querySelector('.container')).toBeNull();
      expect(content!.querySelector('.container')).toBeNull();
    });

    it('uses the slotted nav variant by default and snice-nav only when use-nav is set', async () => {
      layout = await createComponent<SniceLayoutLanding>('snice-layout-landing');
      await wait(10);
      expect(queryShadow(layout as HTMLElement, 'slot[name="nav"]')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'snice-nav')).toBeNull();

      layout.useNav = true;
      await wait(20);
      expect(queryShadow(layout as HTMLElement, 'snice-nav')).toBeTruthy();
    });
  });

  describe('attribute contract', () => {
    it('observes use-nav as a kebab-case attribute', () => {
      const observed = (customElements.get('snice-layout-landing') as any).observedAttributes as string[];
      expect(observed).toContain('use-nav');
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-landing.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('keeps a sticky translucent header', () => {
      expect(css).toMatch(/\.header\s*\{[^}]*position:\s*sticky/);
    });

    it('contains band content at the standard 80rem marketing wrapper', () => {
      expect(css).toMatch(/\.container\s*\{[^}]*max-width:\s*var\(--snice-layout-container,\s*80rem\)/);
    });
  });
});
