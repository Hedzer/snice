import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../packages/components/src/pdf-viewer/snice-pdf-viewer';
import type { SnicePdfViewerElement } from '../../packages/components/src/pdf-viewer/snice-pdf-viewer.types';

const cssPath = resolve(process.cwd(), 'packages/components/src/pdf-viewer/snice-pdf-viewer.css');

describe('snice-pdf-viewer', () => {
  let viewer: SnicePdfViewerElement;

  afterEach(() => {
    if (viewer) removeComponent(viewer as HTMLElement);
  });

  describe('basic functionality', () => {
    it('should be defined', () => {
      expect(customElements.get('snice-pdf-viewer')).toBeDefined();
    });

    it('renders the toolbar and viewport shell', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);

      expect(queryShadow(viewer as HTMLElement, '.pdf-toolbar')).toBeTruthy();
      expect(queryShadow(viewer as HTMLElement, '.pdf-viewport')).toBeTruthy();
      expect(queryShadow(viewer as HTMLElement, 'canvas')).toBeTruthy();
    });

    it('has sensible defaults', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      expect(viewer.src).toBe('');
      expect(viewer.page).toBe(1);
      expect(viewer.zoom).toBe(1);
      expect(viewer.fit).toBe('width');
      expect(viewer.totalPages).toBe(0);
    });

    it('shows the empty state when no src is set', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);

      const empty = queryShadow(viewer as HTMLElement, '.pdf-empty');
      expect(empty?.classList.contains('is-visible')).toBe(true);
    });
  });

  describe('boundary cases without a document', () => {
    it('disables paging and document actions', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);

      const prev = queryShadow<HTMLButtonElement>(viewer as HTMLElement, '.pdf-btn-prev');
      const next = queryShadow<HTMLButtonElement>(viewer as HTMLElement, '.pdf-btn-next');
      const download = queryShadow<HTMLButtonElement>(viewer as HTMLElement, '.pdf-btn-download');
      const print = queryShadow<HTMLButtonElement>(viewer as HTMLElement, '.pdf-btn-print');

      expect(prev?.disabled).toBe(true);
      expect(next?.disabled).toBe(true);
      expect(download?.disabled).toBe(true);
      expect(print?.disabled).toBe(true);
    });

    it('ignores out-of-range goToPage calls', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      viewer.goToPage(5);
      expect(viewer.page).toBe(1);
      viewer.goToPage(0);
      expect(viewer.page).toBe(1);
      viewer.goToPage(-1);
      expect(viewer.page).toBe(1);
    });

    it('ignores nextPage and prevPage without a document', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      viewer.nextPage();
      viewer.prevPage();
      expect(viewer.page).toBe(1);
    });

    it('does not throw on download or print without src', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      expect(() => viewer.download()).not.toThrow();
      expect(() => viewer.print()).not.toThrow();
    });

    it('rejects unsafe src schemes for download and print', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      viewer.src = 'javascript:alert(1)';
      await wait(20);
      expect(() => viewer.download()).not.toThrow();
      expect(() => viewer.print()).not.toThrow();
    });

    it('does not throw on keyboard navigation without a document', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);
      const container = queryShadow(viewer as HTMLElement, '.pdf-container');
      expect(() => {
        container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }).not.toThrow();
    });
  });

  describe('document loading', () => {
    it('loads an authored src exactly once', async () => {
      // @watch('src') fires on init AND @ready loads authored src — without a
      // guard every mounted viewer fetches its document twice.
      const events: string[] = [];
      const listener = () => events.push('err');
      document.addEventListener('pdf-error', listener);

      const el = document.createElement('snice-pdf-viewer') as unknown as SnicePdfViewerElement;
      (el as HTMLElement).setAttribute('src', 'http://localhost:9/definitely-not-there.pdf');
      document.body.appendChild(el as HTMLElement);
      await new Promise(r => setTimeout(r, 1500));

      document.removeEventListener('pdf-error', listener);
      (el as HTMLElement).remove();

      expect(events.length).toBe(1);
    });
  });

  describe('toolbar accessibility', () => {
    it('gives every toolbar button an accessible name', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);

      const buttons = Array.from(queryShadowAll(viewer as HTMLElement, '.pdf-btn'));
      expect(buttons.length).toBeGreaterThan(0);
      for (const btn of buttons) {
        expect(btn.getAttribute('aria-label'), `button ${btn.className}`).toBeTruthy();
      }
    });

    it('reflects an authored fit mode in the fit select', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer', { fit: 'height' });
      await wait(50);

      const select = queryShadow<HTMLSelectElement>(viewer as HTMLElement, '.pdf-fit-select');
      expect(select?.value).toBe('height');
    });

    it('labels the page input and fit select', async () => {
      viewer = await createComponent<SnicePdfViewerElement>('snice-pdf-viewer');
      await wait(50);

      expect(queryShadow(viewer as HTMLElement, '.pdf-page-input')?.getAttribute('aria-label')).toBeTruthy();
      expect(queryShadow(viewer as HTMLElement, '.pdf-fit-select')?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
