import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/layout/snice-layout-sidebar';
import type { SniceLayoutSidebar } from '../../components/layout/snice-layout-sidebar';

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

    it('should contain snice-drawer in body area', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const drawer = queryShadow(layout as HTMLElement, 'snice-drawer.sidebar-drawer');
      expect(drawer).toBeTruthy();
    });

    it('should contain snice-nav inside the drawer', async () => {
      layout = await createComponent<SniceLayoutSidebar>('snice-layout-sidebar');
      await wait(10);

      const nav = queryShadow(layout as HTMLElement, 'snice-nav');
      expect(nav).toBeTruthy();
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
  });
});
