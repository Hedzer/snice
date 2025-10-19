import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router, render, html, css, styles } from './test-imports';

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
});