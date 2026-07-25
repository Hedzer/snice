import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-docs';
import type { SniceLayoutDocs } from '../../packages/components/src/layout/snice-layout-docs';

describe('snice-layout-docs', () => {
  let layout: SniceLayoutDocs;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('renders the three panes: nav tree, prose, and on-this-page rail', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'nav.sidebar')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'main.content')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'aside.toc')).toBeTruthy();
    });

    it('ships every documented slot', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(10);

      for (const name of ['brand', 'header', 'sidebar', 'page', 'toc', 'footer']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });

    it('uses landmark elements so assistive technology can skip between regions', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'header')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'nav.sidebar')!.getAttribute('aria-label')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'aside.toc')!.getAttribute('aria-label')).toBeTruthy();
    });

    it('offers a skip link as the first focusable element', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(10);

      const skip = queryShadow(layout as HTMLElement, '.skip-link') as HTMLAnchorElement;
      expect(skip).toBeTruthy();
      expect(skip.getAttribute('href')).toBe('#snice-docs-main');
      const main = queryShadow(layout as HTMLElement, 'main.content');
      expect(main!.id).toBe('snice-docs-main');
    });

    it('hides the on-this-page rail when nothing is slotted into it', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(30);

      expect(queryShadow(layout as HTMLElement, 'aside.toc')!.classList.contains('toc--empty')).toBe(true);
    });

    it('shows the rail once table-of-contents content is slotted', async () => {
      const el = document.createElement('snice-layout-docs');
      el.innerHTML = '<nav slot="toc"><a href="#intro">Intro</a></nav><div slot="page">Body</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));

      expect(el.shadowRoot!.querySelector('aside.toc')!.classList.contains('toc--empty')).toBe(false);
      el.remove();
    });
  });

  describe('navigation contract', () => {
    it('observes contained and the sidebar open state', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');

      const observed = (customElements.get('snice-layout-docs') as any).observedAttributes as string[];
      expect(observed).toContain('contained');
    });

    it('toggles the sidebar on narrow screens and reports it with aria-expanded', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(20);

      const toggle = queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement;
      expect(toggle).toBeTruthy();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      await wait(20);
      expect((layout as any).sidebarOpen).toBe(true);
      expect((queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement).getAttribute('aria-expanded')).toBe('true');
    });

    it('takes placard updates from the router without throwing', async () => {
      layout = await createComponent<SniceLayoutDocs>('snice-layout-docs');
      await wait(10);

      expect(() => layout.update({} as any, [], '', {})).not.toThrow();
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-docs.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('sizes the nav and rail from layout hooks', () => {
      expect(css).toMatch(/var\(--snice-layout-docs-nav-width,\s*18\.75rem\)/);
      expect(css).toMatch(/var\(--snice-layout-docs-toc-width,\s*18\.75rem\)/);
    });

    it('keeps the prose at a reading measure', () => {
      expect(css).toMatch(/\.prose\s*\{[^}]*max-width:\s*var\(--snice-layout-measure/);
    });

    it('drops the rail before the nav, matching docs-site convention', () => {
      expect(css).toMatch(/@media \(max-width: 1152px\)[\s\S]*\.toc[\s\S]*display:\s*none/);
      expect(css).toMatch(/@media \(max-width: 996px\)[\s\S]*\.sidebar[\s\S]*transform: translateX\(/);
    });

    it('scroll-margin keeps anchored headings clear of the sticky header', () => {
      expect(css).toMatch(/scroll-margin-top/);
    });
  });
});
