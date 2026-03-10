import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, render, html, css, styles } from './test-imports';

let uniqueCounter = 0;
function uniqueName(prefix: string): string {
  return `${prefix}-${++uniqueCounter}`;
}

describe('Router', () => {
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

  describe('hash routing', () => {
    beforeEach(() => {
      router = Router({
        target: '#app',
        type: 'hash'
      });
    });

    it('should register pages with routes', () => {
      const { page } = router;
      
      @page({ tag: 'test-page', routes: ['/test'] })
      class TestPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test Page</div>`;
        }
      }
      
      expect(customElements.get('test-page')).toBeDefined();
    });

    it('should navigate to registered routes', () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'home-page', routes: ['/'] })
      class HomePage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Home</div>`;
        }
      }

      @page({ tag: 'about-page', routes: ['/about'] })
      class AboutPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>About</div>`;
        }
      }
      
      initialize();
      
      // Should show home page initially
      expect(targetEl.querySelector('home-page')).toBeDefined();
      
      // Navigate to about
      navigate('/about');
      expect(targetEl.querySelector('about-page')).toBeDefined();
      expect(targetEl.querySelector('home-page')).toBeNull();
    });

    it('should handle route parameters', async () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'user-page', routes: ['/user/:id'] })
      class UserPage extends HTMLElement {
        @render()
        renderContent() {
          const id = this.getAttribute('id');
          return html`<div>User ${id}</div>`;
        }
      }
      
      initialize();
      await navigate('/user/123');
      
      const userPage = targetEl.querySelector('user-page');
      expect(userPage).toBeDefined();
      expect(userPage?.getAttribute('id')).toBe('123');
    });

    it('should show default 404 when no 404 page is registered', async () => {
      const { initialize, navigate } = router;
      
      initialize();
      
      // Navigate to non-existent route should show default 404
      await navigate('/non-existent');
      expect(targetEl.innerHTML).toContain('404');
      expect(targetEl.innerHTML).toContain('Page not found');
    });

    it('should use custom 404 page when registered', async () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'custom-404', routes: ['/404'] })
      class Custom404 extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Custom 404 Page</div>`;
        }
      }
      
      initialize();
      
      // Navigate to non-existent route should show custom 404 page
      await navigate('/non-existent');
      const customNotFound = targetEl.querySelector('custom-404');
      expect(customNotFound).toBeDefined();
      expect(customNotFound?.shadowRoot?.innerHTML).toContain('Custom 404 Page');
    });

    it('should respond to hashchange events', async () => {
      const { page, initialize } = router;
      
      @page({ tag: 'page-one', routes: ['/one'] })
      class PageOne extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Page One</div>`;
        }
      }

      @page({ tag: 'page-two', routes: ['/two'] })
      class PageTwo extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Page Two</div>`;
        }
      }
      
      initialize();
      
      // Change hash
      window.location.hash = '#/one';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      
      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(targetEl.querySelector('page-one')).toBeDefined();
      
      // Change hash again
      window.location.hash = '#/two';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(targetEl.querySelector('page-two')).toBeDefined();
      expect(targetEl.querySelector('page-one')).toBeNull();
    });
  });

  describe('page decorator', () => {
    it('should add html and css methods support', async () => {
      const router = Router({
        target: '#app',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'styled-page', routes: ['/styled'] })
      class StyledPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div class="content">Styled Content</div>`;
        }

        @styles()
        componentStyles() {
          return css`.content { color: red; }`;
        }
      }
      
      initialize();
      await navigate('/styled');
      
      const styledPage = targetEl.querySelector('styled-page');
      expect(styledPage).toBeDefined();
      await (styledPage as any)?.ready;
      expect(styledPage?.shadowRoot?.innerHTML).toContain('Styled Content');

      const style = styledPage?.shadowRoot?.querySelector('style');
      expect(style).toBeDefined();
      expect(style?.textContent).toContain('.content { color: red; }');
    });

    it('should handle css returning array', async () => {
      const router = Router({
        target: '#app',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'multi-style', routes: ['/multi'] })
      class MultiStyle extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Multi Style</div>`;
        }

        @styles()
        componentStyles() {
          return css`.one { color: red; } .two { color: blue; }`;
        }
      }
      
      initialize();
      await navigate('/multi');
      
      const multiPage = targetEl.querySelector('multi-style');
      await (multiPage as any)?.ready;
      const style = multiPage?.shadowRoot?.querySelector('style');
      expect(style?.textContent).toContain('.one { color: red; }');
      expect(style?.textContent).toContain('.two { color: blue; }');
    });
  });

  describe('multiple routes per page', () => {
    it('should handle multiple routes for same page', () => {
      const router = Router({
        target: '#app',
        type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'multi-route', routes: ['/route1', '/route2', '/route3'] })
      class MultiRoute extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Multi Route Page</div>`;
        }
      }
      
      initialize();
      
      // All routes should show the same page
      navigate('/route1');
      expect(targetEl.querySelector('multi-route')).toBeDefined();
      
      navigate('/route2');
      expect(targetEl.querySelector('multi-route')).toBeDefined();
      
      navigate('/route3');
      expect(targetEl.querySelector('multi-route')).toBeDefined();
    });
  });

  describe('guards', () => {
    it('should allow navigation when async guard resolves to true', async () => {
      const tagName = uniqueName('async-allow-page');
      const router = Router({
        target: '#app',
        type: 'hash',
        context: { user: { name: 'Alice' } }
      });
      const { page, initialize, navigate } = router;

      const asyncGuard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      };

      @page({ tag: tagName, routes: ['/async-allow'], guards: asyncGuard })
      class AsyncAllowPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Async Allowed</div>`;
        }
      }

      initialize();
      await navigate('/async-allow');

      const el = targetEl.querySelector(tagName);
      expect(el).toBeDefined();
      expect(el).not.toBeNull();
    });

    it('should block navigation when async guard resolves to false', async () => {
      const tagName = uniqueName('async-deny-page');
      const router = Router({
        target: '#app',
        type: 'hash',
        context: { user: null }
      });
      const { page, initialize, navigate } = router;

      const asyncGuard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return false;
      };

      @page({ tag: tagName, routes: ['/async-deny'], guards: asyncGuard })
      class AsyncDenyPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Should Not See This</div>`;
        }
      }

      initialize();
      await navigate('/async-deny');

      const el = targetEl.querySelector(tagName);
      expect(el).toBeNull();
      // Should render 403
      expect(targetEl.innerHTML).toContain('403');
    });

    it('should require all guards to pass with mixed sync and async guards', async () => {
      const tagName = uniqueName('mixed-guard-page');
      const router = Router({
        target: '#app',
        type: 'hash',
        context: { user: { role: 'admin' } }
      });
      const { page, initialize, navigate } = router;

      const syncGuard = () => true;
      const asyncGuard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      };

      @page({ tag: tagName, routes: ['/mixed-guards'], guards: [syncGuard, asyncGuard] })
      class MixedGuardPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Mixed Guards Passed</div>`;
        }
      }

      initialize();
      await navigate('/mixed-guards');

      const el = targetEl.querySelector(tagName);
      expect(el).toBeDefined();
      expect(el).not.toBeNull();
    });

    it('should block when any guard in mixed array fails', async () => {
      const tagName = uniqueName('mixed-fail-page');
      const router = Router({
        target: '#app',
        type: 'hash',
        context: {}
      });
      const { page, initialize, navigate } = router;

      const syncGuard = () => true;
      const asyncGuardFail = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return false;
      };

      @page({ tag: tagName, routes: ['/mixed-fail'], guards: [syncGuard, asyncGuardFail] })
      class MixedFailPage extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Should Not See This</div>`;
        }
      }

      initialize();
      await navigate('/mixed-fail');

      const el = targetEl.querySelector(tagName);
      expect(el).toBeNull();
      expect(targetEl.innerHTML).toContain('403');
    });
  });
});