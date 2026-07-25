import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-dashboard';
import type { SniceLayoutDashboard } from '../../packages/components/src/layout/snice-layout-dashboard';

describe('snice-layout-dashboard', () => {
  let layout: SniceLayoutDashboard;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('renders header, toolbar, sidebar, main, and right rail regions', async () => {
      layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, '.header')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.toolbar')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'aside.sidebar')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.main')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'aside.right-sidebar')).toBeTruthy();
    });

    it('does not bake app chrome in: no search or user slots', async () => {
      layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="search"]')).toBeNull();
      expect(queryShadow(layout as HTMLElement, 'slot[name="user"]')).toBeNull();
      expect(queryShadow(layout as HTMLElement, 'slot[name="header"]')).toBeTruthy();
    });

    it('left sidebar is slottable with a placard-driven nav fallback', async () => {
      layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
      await wait(10);

      const nav = queryShadow(layout as HTMLElement, 'snice-nav');
      expect(nav).toBeTruthy();
      expect(nav!.closest('slot[name="sidebar"]')).toBeTruthy();
    });

    it('right rail content is slotted', async () => {
      const el = document.createElement('snice-layout-dashboard');
      el.innerHTML = '<div slot="right-sidebar">Activity feed</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 50));

      const slot = el.shadowRoot!.querySelector('slot[name="right-sidebar"]') as HTMLSlotElement;
      expect(slot.assignedNodes().map(n => n.textContent).join('')).toContain('Activity feed');
      el.remove();
    });
  });

  describe('sidebar collapse contract', () => {
    it('collapsed is observed and toggling flips it with aria-expanded', async () => {
      layout = await createComponent<SniceLayoutDashboard>('snice-layout-dashboard');
      await wait(10);

      const observed = (customElements.get('snice-layout-dashboard') as any).observedAttributes as string[];
      expect(observed).toContain('collapsed');

      const btn = queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.getAttribute('aria-expanded')).toBe('true');

      btn.click();
      await wait(20);
      expect((layout as any).collapsed).toBe(true);
      const after = queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement;
      expect(after.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-dashboard.css'), 'utf8');

    it('never deletes region content with display none in media queries', () => {
      const mediaBlocks = css.match(/@media[^{]*\{[\s\S]*?\n\}/g) ?? [];
      for (const block of mediaBlocks) {
        expect(block, 'sidebar/right-sidebar must collapse or stack, never display:none').not.toMatch(/\.(sidebar|right-sidebar)[^{]*\{[^}]*display:\s*none/);
      }
    });

    it('right rail stacks below main under 1024px instead of vanishing', () => {
      expect(css).toMatch(/@media \(max-width: 1024px\)[\s\S]*"[^"]*main[^"]*"[\s\S]*"[^"]*right-sidebar[^"]*"/);
    });

    it('left sidebar overlays via transform below 768px', () => {
      expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*\.sidebar[\s\S]*transform: translateX\(/);
      expect(css).toMatch(/\.sidebar--mobile-open\s*\{[^}]*transform: translateX\(0\)/);
    });

    it('sidebar width uses the shared layout token', () => {
      expect(css).toMatch(/width:\s*var\(--snice-layout-sidebar-width/);
    });
  });

  describe('frame behaviour', () => {
    const readCssSync = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('node:fs');
      const { resolve } = require('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-dashboard.css'), 'utf8');
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
      const observed = (customElements.get('snice-layout-dashboard') as any).observedAttributes as string[];
      expect(observed).toContain('contained');
    });
  });
});
