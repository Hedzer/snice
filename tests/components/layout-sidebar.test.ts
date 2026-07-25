import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-sidebar';
import type { SniceLayoutSidebar } from '../../packages/components/src/layout/snice-layout-sidebar';

describe('snice-layout-sidebar', () => {
  let layout: SniceLayoutSidebar;

  afterEach(() => {
    if (layout) {
      removeComponent(layout as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render layout element', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(layout).toBeTruthy();
      expect(layout.tagName).toBe('SNICE-LAYOUT-SIDEBAR');
    });

    it('should have shadow root', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(layout.shadowRoot).toBeTruthy();
    });

    it('should render layout structure', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, '.layout')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.header')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.main')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, '.footer')).toBeTruthy();
    });

    it('renders a persistent aside sidebar, not a modal drawer', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'aside.sidebar')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'snice-drawer')).toBeNull();
    });

    it('should contain snice-nav as the sidebar slot fallback', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const nav = queryShadow(layout as HTMLElement, 'snice-nav');
      expect(nav).toBeTruthy();
      expect(nav!.closest('slot[name="sidebar"]'), 'nav must be slot fallback so apps can replace it').toBeTruthy();
    });

    it('ships a scrim for the mobile overlay state', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, '.scrim')).toBeTruthy();
    });
  });

  describe('slots', () => {
    it('should have brand slot', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="brand"]')).toBeTruthy();
    });

    it('should have header slot', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="header"]')).toBeTruthy();
    });

    it('should have page slot', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="page"]')).toBeTruthy();
    });

    it('should have footer slot', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'slot[name="footer"]')).toBeTruthy();
    });
  });

  describe('API methods', () => {
    it('should have update method', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(typeof layout.update).toBe('function');
    });

    it('should have updateNav method', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(typeof layout.updateNav).toBe('function');
    });

    it('should accept update call without errors', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(() => {
        layout.update({} as any, [], '', {});
      }).not.toThrow();
    });

    it('should accept updateNav call without errors', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      expect(() => {
        layout.updateNav({} as any, {});
      }).not.toThrow();
    });

    it('should update nav synchronously without rAF', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const placards = [
        { title: 'Home', route: '/', icon: 'home' },
        { title: 'About', route: '/about', icon: 'info' },
      ];

      // update should work synchronously after @ready
      expect(() => {
        layout.update({} as any, placards as any, '/', {});
      }).not.toThrow();
    });
  });

  describe('sidebar toggle', () => {
    it('should have sidebar toggle button', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const toggleBtn = queryShadow(layout as HTMLElement, '.sidebar-toggle');
      expect(toggleBtn).toBeTruthy();
    });

    it('should have handleSidebarToggle method', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(typeof layout.handleSidebarToggle).toBe('function');
    });
  });

  describe('collapsed property', () => {
    it('should default to false', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      expect(layout.collapsed).toBe(false);
    });

    it('should accept collapsed attribute', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar', { collapsed: true });

      expect(layout.collapsed).toBe(true);
    });

    it('is observed as an attribute so authored collapsed works', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');

      const observed = (customElements.get('snice-layout-sidebar') as any).observedAttributes as string[];
      expect(observed).toContain('collapsed');
    });

    it('sidebar is visible by default and hides via the collapsed class', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const sidebar = queryShadow(layout as HTMLElement, 'aside.sidebar');
      expect(sidebar!.classList.contains('sidebar--collapsed')).toBe(false);

      layout.collapsed = true;
      await wait(20);
      const after = queryShadow(layout as HTMLElement, 'aside.sidebar');
      expect(after!.classList.contains('sidebar--collapsed')).toBe(true);
    });

    it('desktop toggle flips collapsed and reflects aria-expanded', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const btn = queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement;
      expect(btn.getAttribute('aria-expanded')).toBe('true');

      btn.click();
      await wait(20);
      expect(layout.collapsed).toBe(true);
      const btnAfter = queryShadow(layout as HTMLElement, '.sidebar-toggle') as HTMLButtonElement;
      expect(btnAfter.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('collapse modes', () => {
    it('observes collapse-mode and defaults to rail', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      const observed = (customElements.get('snice-layout-sidebar') as any).observedAttributes as string[];
      expect(observed).toContain('collapse-mode');
      expect((layout as any).collapseMode).toBe('rail');
    });

    it('rail mode keeps the sidebar visible at icon width when collapsed', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar', { collapsed: true });
      await wait(20);

      const sidebar = queryShadow(layout as HTMLElement, 'aside.sidebar');
      expect(sidebar!.classList.contains('sidebar--rail')).toBe(true);
      expect(sidebar!.classList.contains('sidebar--collapsed')).toBe(true);
    });

    it('offcanvas mode hides the sidebar entirely when collapsed', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar', {
        collapsed: true,
        'collapse-mode': 'offcanvas',
      });
      await wait(20);

      const sidebar = queryShadow(layout as HTMLElement, 'aside.sidebar');
      expect(sidebar!.classList.contains('sidebar--rail')).toBe(false);
      expect(sidebar!.classList.contains('sidebar--collapsed')).toBe(true);
    });

    it('none mode drops the toggle so the sidebar is static', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar', { 'collapse-mode': 'none' });
      await wait(20);

      expect(queryShadow(layout as HTMLElement, '.sidebar-toggle')).toBeNull();
    });
  });

  describe('keyboard shortcut', () => {
    it('ctrl/cmd+b toggles the sidebar', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(20);
      expect(layout.collapsed).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }));
      await wait(20);
      expect(layout.collapsed).toBe(true);
    });

    it('stops listening once disconnected', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(20);
      const el = layout as unknown as HTMLElement;
      el.parentNode!.removeChild(el);
      await wait(20);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }));
      await wait(20);
      expect(layout.collapsed).toBe(false);
    });
  });

  describe('stylesheet contracts', () => {
    const readCss = async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-sidebar.css'), 'utf8');
    };

    it('sidebar participates in flow with a width token and collapses by width', async () => {
      const css = await readCss();
      expect(css).toMatch(/\.sidebar\s*\{[^}]*width:\s*var\(--snice-layout-sidebar-width/);
      expect(css).toMatch(/\.sidebar--collapsed\s*\{[^}]*width:\s*0/);
    });

    it('below the mobile breakpoint the sidebar overlays via transform with a scrim', async () => {
      const css = await readCss();
      expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*\.sidebar[\s\S]*transform: translateX\(/);
      expect(css).toMatch(/\.sidebar--mobile-open\s*\{[^}]*transform: translateX\(0\)/);
      expect(css).toMatch(/\.scrim--visible/);
    });

    it('never hides the sidebar with display none', async () => {
      const css = await readCss();
      expect(css).not.toMatch(/\.sidebar[^{]*\{[^}]*display:\s*none/);
    });

    it('rail collapse keeps an icon-width column instead of zero width', async () => {
      const css = await readCss();
      expect(css).toMatch(/\.sidebar--rail\.sidebar--collapsed\s*\{[^}]*width:\s*var\(--snice-layout-rail-collapsed-width,\s*3rem\)/);
    });

    it('gives slotted sidebar links hover and focus affordances', async () => {
      const css = await readCss();
      expect(css).toMatch(/\.sidebar ::slotted\(a:hover\)/);
      expect(css).toMatch(/\.sidebar ::slotted\(a:focus-visible\)/);
    });

    it('rail clips nav labels to one line instead of wrapping them into fragments', async () => {
      const css = await readCss();
      expect(css).toMatch(/\.sidebar--rail\.sidebar--collapsed ::slotted\(\*\)\s*\{[^}]*white-space:\s*nowrap/);
    });
  });

  describe('frame behaviour', () => {
    const readCssSync = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('node:fs');
      const { resolve } = require('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-sidebar.css'), 'utf8');
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
      const observed = (customElements.get('snice-layout-sidebar') as any).observedAttributes as string[];
      expect(observed).toContain('contained');
    });
  });
});
