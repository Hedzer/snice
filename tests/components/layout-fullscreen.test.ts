import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-fullscreen';
import type { SniceLayoutFullscreen } from '../../packages/components/src/layout/snice-layout-fullscreen';

describe('snice-layout-fullscreen', () => {
  let layout: SniceLayoutFullscreen;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships background, overlay, page, and controls layers', async () => {
      layout = await createComponent<SniceLayoutFullscreen>('snice-layout-fullscreen');
      await wait(10);

      for (const name of ['background', 'overlay', 'page', 'controls']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });
  });

  describe('attribute contract', () => {
    it('observes the overlay boolean', () => {
      const observed = (customElements.get('snice-layout-fullscreen') as any).observedAttributes as string[];
      expect(observed).toContain('overlay');
    });

    it('overlay attribute drives the overlay stylesheet block', async () => {
      layout = await createComponent<SniceLayoutFullscreen>('snice-layout-fullscreen', { overlay: true });
      expect(layout.overlay).toBe(true);

      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-fullscreen.css'), 'utf8');
      expect(css).toContain(':host([overlay]) .overlay');
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-fullscreen.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('never sizes itself with 100vw, which overflows containers and ignores scrollbars', () => {
      expect(css).not.toMatch(/100vw/);
    });

    it('fills its pinned host rather than forcing viewport units inside', () => {
      expect(css).toMatch(/\.layout\s*\{[^}]*width:\s*100%/);
      expect(css).toMatch(/\.layout\s*\{[^}]*height:\s*100%/);
    });
  });

  describe('frame behaviour', () => {
    const readCssSync = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('node:fs');
      const { resolve } = require('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-fullscreen.css'), 'utf8');
    };

    it('pins itself to the viewport so body margins cannot inset the frame', () => {
      const css = readCssSync();
      expect(css).toMatch(/:host\(:not\(\[contained\]\)\)\s*\{[^}]*position:\s*fixed/);
      expect(css).toMatch(/:host\(:not\(\[contained\]\)\)\s*\{[^}]*inset:\s*0/);
    });

    it('contained sizes to the parent instead of the viewport', () => {
      const css = readCssSync();
      expect(css).toMatch(/:host\(\[contained\]\)\s*\{[^}]*position:\s*relative/);
    });

    it('observes the contained attribute', () => {
      const observed = (customElements.get('snice-layout-fullscreen') as any).observedAttributes as string[];
      expect(observed).toContain('contained');
    });
  });
});
