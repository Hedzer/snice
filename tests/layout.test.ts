import { describe, it, expect, beforeEach } from 'vitest';
import { Router, layout } from '../src/index';
import { ROUTER_CONTEXT } from '../src/symbols';

describe('Layout System', () => {
  let router: ReturnType<typeof Router>;
  let targetEl: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    targetEl = document.createElement('div');
    targetEl.id = 'app';
    document.body.appendChild(targetEl);
    
    // Reset window location
    window.location.hash = '';
  });

  describe('@layout decorator', () => {
    it('should define custom elements', () => {
      @layout('test-layout')
      class TestLayout extends HTMLElement {
        html() {
          return '<main><slot name="page"></slot></main>';
        }
      }
      
      expect(customElements.get('test-layout')).toBeDefined();
    });

    it('should create functional layout elements', () => {
      @layout('basic-layout')
      class BasicLayout extends HTMLElement {
        html() {
          return /*html*/`
            <nav>Navigation</nav>
            <main><slot name="page"></slot></main>
            <footer>Footer</footer>
          `;
        }
      }
      
      const layoutEl = document.createElement('basic-layout');
      targetEl.appendChild(layoutEl);
      
      // Wait for element to render
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          const nav = layoutEl.shadowRoot?.querySelector('nav');
          const footer = layoutEl.shadowRoot?.querySelector('footer');
          const slot = layoutEl.shadowRoot?.querySelector('slot[name="page"]');
          
          expect(nav?.textContent).toBe('Navigation');
          expect(footer?.textContent).toBe('Footer');
          expect(slot).toBeDefined();
          resolve(undefined);
        });
      });
    });
  });

  describe('Router layout integration', () => {
    beforeEach(() => {
      // Define test layout
      @layout('app-shell')
      class AppShell extends HTMLElement {
        html() {
          return /*html*/`
            <nav class="nav">
              <slot name="nav">Default Nav</slot>
            </nav>
            <main class="main">
              <slot name="page"></slot>
            </main>
            <footer class="footer">
              <slot name="footer">Default Footer</slot>
            </footer>
          `;
        }
      }

      @layout('minimal-layout')
      class MinimalLayout extends HTMLElement {
        html() {
          return /*html*/`
            <div class="minimal">
              <slot name="page"></slot>
            </div>
          `;
        }
      }
    });

    it('should use router default layout', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'home-page', routes: ['/'] })
      class HomePage extends HTMLElement {
        html() {
          return '<div class="home-content">Home Page</div>';
        }
      }
      
      initialize();
      await navigate('/');
      
      // Should have layout element in target
      const layoutEl = targetEl.querySelector('app-shell');
      expect(layoutEl).toBeDefined();
      
      // Should have page inside layout with slot="page"
      const pageEl = layoutEl?.querySelector('home-page[slot="page"]');
      expect(pageEl).toBeDefined();
    });

    it('should override layout per page', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'home-page', routes: ['/'] })
      class HomePage extends HTMLElement {
        html() {
          return '<div>Home with default layout</div>';
        }
      }
      
      @page({ tag: 'login-page', routes: ['/login'], layout: 'minimal-layout' })
      class LoginPage extends HTMLElement {
        html() {
          return '<div>Login with minimal layout</div>';
        }
      }
      
      initialize();
      
      // Start with home page (default layout)
      await navigate('/');
      expect(targetEl.querySelector('app-shell')).toBeDefined();
      expect(targetEl.querySelector('minimal-layout')).toBeNull();
      
      // Navigate to login (minimal layout)
      await navigate('/login');
      expect(targetEl.querySelector('app-shell')).toBeNull();
      expect(targetEl.querySelector('minimal-layout')).toBeDefined();
      
      // Page should be in new layout
      const pageEl = targetEl.querySelector('minimal-layout login-page[slot="page"]');
      expect(pageEl).toBeDefined();
    });

    it('should disable layout when set to false', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'home-page', routes: ['/'] })
      class HomePage extends HTMLElement {
        html() {
          return '<div>Home with layout</div>';
        }
      }
      
      @page({ tag: 'embed-page', routes: ['/embed'], layout: false })
      class EmbedPage extends HTMLElement {
        html() {
          return '<div>Embed without layout</div>';
        }
      }
      
      initialize();
      
      // Start with home page (has layout)
      await navigate('/');
      expect(targetEl.querySelector('app-shell')).toBeDefined();
      
      // Navigate to embed page (no layout)
      await navigate('/embed');
      expect(targetEl.querySelector('app-shell')).toBeNull();
      
      // Page should be directly in target
      const pageEl = targetEl.querySelector('embed-page');
      expect(pageEl).toBeDefined();
      expect(pageEl?.getAttribute('slot')).toBeNull();
    });

    it('should work without any layout configuration', async () => {
      router = Router({
        target: '#app',
        type: 'hash'
        // No layout specified
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'simple-page', routes: ['/'] })
      class SimplePage extends HTMLElement {
        html() {
          return '<div>Simple page</div>';
        }
      }
      
      initialize();
      await navigate('/');
      
      // Page should be directly in target, no layout wrapper
      const pageEl = targetEl.querySelector('simple-page');
      expect(pageEl).toBeDefined();
      expect(pageEl?.getAttribute('slot')).toBeNull();
      expect(targetEl.children.length).toBe(1);
    });

    it('should persist layout across page changes', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'page-one', routes: ['/one'] })
      class PageOne extends HTMLElement {
        html() {
          return '<div>Page One</div>';
        }
      }
      
      @page({ tag: 'page-two', routes: ['/two'] })
      class PageTwo extends HTMLElement {
        html() {
          return '<div>Page Two</div>';
        }
      }
      
      initialize();
      
      await navigate('/one');
      const layoutEl = targetEl.querySelector('app-shell');
      expect(layoutEl).toBeDefined();
      
      await navigate('/two');
      // Same layout element should still be there
      const layoutEl2 = targetEl.querySelector('app-shell');
      expect(layoutEl2).toBe(layoutEl); // Same reference
      
      // But page should have changed
      expect(layoutEl?.querySelector('page-one')).toBeNull();
      expect(layoutEl?.querySelector('page-two[slot="page"]')).toBeDefined();
    });

    it('should handle layout context correctly', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell',
        context: { user: 'test-user' }
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'context-page', routes: ['/'] })
      class ContextPage extends HTMLElement {
        html() {
          return '<div>Context Page</div>';
        }
      }
      
      initialize();
      await navigate('/');
      
      const layoutEl = targetEl.querySelector('app-shell');
      expect((layoutEl as any)?.[ROUTER_CONTEXT]).toEqual({ user: 'test-user' });
    });

    it('should not recreate layout when same layout is used', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'page-a', routes: ['/a'] })
      class PageA extends HTMLElement {
        html() {
          return '<div>Page A</div>';
        }
      }
      
      @page({ tag: 'page-b', routes: ['/b'] })
      class PageB extends HTMLElement {
        html() {
          return '<div>Page B</div>';
        }
      }
      
      @page({ tag: 'page-c', routes: ['/c'] })
      class PageC extends HTMLElement {
        html() {
          return '<div>Page C</div>';
        }
      }
      
      initialize();
      
      // Navigate to first page - creates layout
      await navigate('/a');
      const firstLayout = targetEl.querySelector('app-shell');
      expect(firstLayout).toBeDefined();
      
      // Add a custom property to track the same element
      (firstLayout as any)._testId = 'original-layout';
      
      // Navigate to second page with same layout
      await navigate('/b');
      const secondLayout = targetEl.querySelector('app-shell');
      expect(secondLayout).toBe(firstLayout); // Same reference
      expect((secondLayout as any)._testId).toBe('original-layout');
      
      // Navigate to third page, still same layout
      await navigate('/c');
      const thirdLayout = targetEl.querySelector('app-shell');
      expect(thirdLayout).toBe(firstLayout); // Same reference
      expect((thirdLayout as any)._testId).toBe('original-layout');
      
      // Verify page changed but layout persisted
      expect(thirdLayout?.querySelector('page-c[slot="page"]')).toBeDefined();
      expect(thirdLayout?.querySelector('page-a')).toBeNull();
      expect(thirdLayout?.querySelector('page-b')).toBeNull();
    });

    it('should recreate layout when different layout is needed', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'shell-page', routes: ['/shell'] })
      class ShellPage extends HTMLElement {
        html() {
          return '<div>Shell Page</div>';
        }
      }
      
      @page({ tag: 'minimal-page-test', routes: ['/minimal'], layout: 'minimal-layout' })
      class MinimalPageTest extends HTMLElement {
        html() {
          return '<div>Minimal Page</div>';
        }
      }
      
      initialize();
      
      // Start with app-shell layout
      await navigate('/shell');
      const appShellLayout = targetEl.querySelector('app-shell');
      expect(appShellLayout).toBeDefined();
      expect(targetEl.querySelector('minimal-layout')).toBeNull();
      
      // Track the original layout element
      (appShellLayout as any)._testId = 'app-shell-instance';
      
      // Switch to minimal layout
      await navigate('/minimal');
      const minimalLayout = targetEl.querySelector('minimal-layout');
      const newAppShellLayout = targetEl.querySelector('app-shell');
      
      // Should have minimal layout, no app-shell layout
      expect(minimalLayout).toBeDefined();
      expect(newAppShellLayout).toBeNull();
      
      // Track the minimal layout
      (minimalLayout as any)._testId = 'minimal-instance';
      
      // Switch back to app-shell
      await navigate('/shell');
      const finalAppShell = targetEl.querySelector('app-shell');
      const finalMinimal = targetEl.querySelector('minimal-layout');
      
      // Should have new app-shell, no minimal
      expect(finalAppShell).toBeDefined();
      expect(finalMinimal).toBeNull();
      
      // Should be a NEW instance, not the original
      expect(finalAppShell).not.toBe(appShellLayout);
      expect((finalAppShell as any)._testId).toBeUndefined();
    });

    it('should clean up old layouts properly', async () => {
      router = Router({
        target: '#app',
        type: 'hash',
        layout: 'app-shell'
      });

      const { page, initialize, navigate } = router;
      
      @page({ tag: 'default-page', routes: ['/default'] })
      class DefaultPage extends HTMLElement {
        html() {
          return '<div>Default</div>';
        }
      }
      
      @page({ tag: 'minimal-page', routes: ['/minimal'], layout: 'minimal-layout' })
      class MinimalPage extends HTMLElement {
        html() {
          return '<div>Minimal</div>';
        }
      }
      
      @page({ tag: 'no-layout-page', routes: ['/none'], layout: false })
      class NoLayoutPage extends HTMLElement {
        html() {
          return '<div>No Layout</div>';
        }
      }
      
      initialize();
      
      // Default layout
      await navigate('/default');
      expect(targetEl.querySelector('app-shell')).toBeDefined();
      expect(targetEl.querySelector('minimal-layout')).toBeNull();
      
      // Switch to minimal layout
      await navigate('/minimal');
      expect(targetEl.querySelector('app-shell')).toBeNull();
      expect(targetEl.querySelector('minimal-layout')).toBeDefined();
      
      // Switch to no layout
      await navigate('/none');
      expect(targetEl.querySelector('app-shell')).toBeNull();
      expect(targetEl.querySelector('minimal-layout')).toBeNull();
      expect(targetEl.querySelector('no-layout-page')).toBeDefined();
      
      // Back to default layout
      await navigate('/default');
      expect(targetEl.querySelector('app-shell')).toBeDefined();
      expect(targetEl.querySelector('minimal-layout')).toBeNull();
      expect(targetEl.querySelector('no-layout-page')).toBeNull();
    });
  });
});