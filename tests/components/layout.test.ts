import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout';
import type { SniceLayout } from '../../packages/components/src/layout/snice-layout';

describe('snice-layout', () => {
  let layout: SniceLayout;

  afterEach(() => {
    if (layout) {
      removeComponent(layout as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render layout element', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');

      expect(layout).toBeTruthy();
      expect(layout.tagName).toBe('SNICE-LAYOUT');
    });

    it('should have shadow root', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      expect(layout.shadowRoot).toBeTruthy();
    });

    it('should render layout structure', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      const baseEl = queryShadow(layout as HTMLElement, '.layout');
      expect(baseEl).toBeTruthy();

      const headerEl = queryShadow(layout as HTMLElement, '.header');
      expect(headerEl).toBeTruthy();

      const mainEl = queryShadow(layout as HTMLElement, '.main');
      expect(mainEl).toBeTruthy();

      const footerEl = queryShadow(layout as HTMLElement, '.footer');
      expect(footerEl).toBeTruthy();
    });

    it('should contain snice-nav in header', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      const navEl = queryShadow(layout as HTMLElement, 'snice-nav');
      expect(navEl).toBeTruthy();
    });
  });

  describe('slots', () => {
    it('should have brand slot', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      const brandSlot = queryShadow(layout as HTMLElement, 'slot[name="brand"]');
      expect(brandSlot).toBeTruthy();
    });

    it('should have page slot', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      const pageSlot = queryShadow(layout as HTMLElement, 'slot[name="page"]');
      expect(pageSlot).toBeTruthy();
    });

    it('should have footer slot', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      const footerSlot = queryShadow(layout as HTMLElement, 'slot[name="footer"]');
      expect(footerSlot).toBeTruthy();
    });
  });

  describe('API methods', () => {
    it('should have update method', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');

      expect(typeof layout.update).toBe('function');
    });

    it('should have updateNav method', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');

      expect(typeof layout.updateNav).toBe('function');
    });

    it('should accept update call without errors', async () => {
      layout = await createComponent<SniceLayout>('snice-layout');
      await wait(10);

      expect(() => {
        layout.update({} as any, [], '', {});
      }).not.toThrow();
    });
  });

  describe('stylesheet contracts (whole layout family)', () => {
    const dir = resolve(process.cwd(), 'packages/components/src/layout');

    it('should provide a fallback for every --snice-* variable reference in every layout css', () => {
      for (const file of readdirSync(dir).filter(f => f.endsWith('.css'))) {
        const css = readFileSync(join(dir, file), 'utf8');
        const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
        expect(missing, file).toEqual([]);
      }
    });

    it('should handle prefers-reduced-motion in every layout css', () => {
      for (const file of readdirSync(dir).filter(f => f.endsWith('.css'))) {
        const css = readFileSync(join(dir, file), 'utf8');
        expect(css, file).toContain('@media (prefers-reduced-motion: reduce)');
      }
    });

    it('inner layouts inherit the host height so contained shells never overflow', () => {
      for (const file of readdirSync(dir).filter(f => f.endsWith('.css'))) {
        const css = readFileSync(join(dir, file), 'utf8');
        const start = css.indexOf('.layout {');
        if (start === -1) continue;

        const block = css.slice(start, css.indexOf('}', start));
        expect(block, `${file}: .layout must not hardcode viewport height`).not.toMatch(/min-height:\s*100vh/);
        expect(block, `${file}: .layout should inherit the host height`).toMatch(/min-height:\s*inherit/);
      }
    });
  });
});