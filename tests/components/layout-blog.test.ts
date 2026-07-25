import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-blog';
import type { SniceLayoutBlog } from '../../packages/components/src/layout/snice-layout-blog';

describe('snice-layout-blog', () => {
  let layout: SniceLayoutBlog;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('ships brand, nav, page, sidebar, and footer slots', async () => {
      layout = await createComponent<SniceLayoutBlog>('snice-layout-blog');
      await wait(10);

      for (const name of ['brand', 'nav', 'page', 'sidebar', 'footer']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });
  });

  describe('sidebar column', () => {
    it('collapses the sidebar column when nothing is slotted so the article centers', async () => {
      layout = await createComponent<SniceLayoutBlog>('snice-layout-blog');
      await wait(30);

      const contentArea = queryShadow(layout as HTMLElement, '.content-area');
      expect(contentArea!.classList.contains('content-area--with-sidebar')).toBe(false);
      const aside = queryShadow(layout as HTMLElement, 'aside.sidebar');
      expect(aside!.classList.contains('sidebar--empty')).toBe(true);
    });

    it('shows the sidebar column when content is slotted', async () => {
      const el = document.createElement('snice-layout-blog');
      el.innerHTML = '<div slot="page"><p>Post body</p></div><div slot="sidebar">About the author</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 60));

      const contentArea = el.shadowRoot!.querySelector('.content-area');
      expect(contentArea!.classList.contains('content-area--with-sidebar')).toBe(true);
      const aside = el.shadowRoot!.querySelector('aside.sidebar');
      expect(aside!.classList.contains('sidebar--empty')).toBe(false);
      el.remove();
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-blog.css'), 'utf8');

    it('keeps a reading measure on the article', () => {
      expect(css).toMatch(/\.article\s*\{[^}]*max-width/);
    });

    it('centers the article instead of pinning it to the sidebar edge', () => {
      expect(css).not.toMatch(/^\.article\s*\{[^}]*justify-self:\s*end/m);
      expect(css).toMatch(/^\.article\s*\{[^}]*margin-inline:\s*auto/m);
    });

    it('stacks the sidebar below the article on narrow screens instead of deleting it', () => {
      expect(css).toMatch(/@media \(max-width: 968px\)[\s\S]*\.content-area--with-sidebar[\s\S]*grid-template-columns:\s*1fr/);
      const mediaBlocks = css.match(/@media[^{]*\{[\s\S]*?\n\}/g) ?? [];
      for (const block of mediaBlocks) {
        expect(block).not.toMatch(/\.sidebar[^{]*\{[^}]*display:\s*none/);
      }
    });
  });
});
