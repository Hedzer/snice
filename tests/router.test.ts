import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '../src/router';

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
        routing_type: 'hash'
      });
    });

    it('should register pages with routes', () => {
      const { page } = router;
      
      @page({ tag: 'test-page', routes: ['/test'] })
      class TestPage extends HTMLElement {
        html() {
          return '<div>Test Page</div>';
        }
      }
      
      expect(customElements.get('test-page')).toBeDefined();
    });

    it('should navigate to registered routes', () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'home-page', routes: ['/'] })
      class HomePage extends HTMLElement {
        html() {
          return '<div>Home</div>';
        }
      }
      
      @page({ tag: 'about-page', routes: ['/about'] })
      class AboutPage extends HTMLElement {
        html() {
          return '<div>About</div>';
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

    it('should handle route parameters', () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'user-page', routes: ['/user/:id'] })
      class UserPage extends HTMLElement {
        html() {
          const id = this.getAttribute('id');
          return `<div>User ${id}</div>`;
        }
      }
      
      initialize();
      navigate('/user/123');
      
      const userPage = targetEl.querySelector('user-page');
      expect(userPage).toBeDefined();
      expect(userPage?.getAttribute('id')).toBe('123');
    });

    it('should show default 404 when no 404 page is registered', () => {
      const { initialize, navigate } = router;
      
      initialize();
      
      // Navigate to non-existent route should show default 404
      navigate('/non-existent');
      expect(targetEl.innerHTML).toContain('404');
      expect(targetEl.innerHTML).toContain('Page not found');
    });

    it('should use custom 404 page when registered', () => {
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'custom-404', routes: ['/404'] })
      class Custom404 extends HTMLElement {
        html() {
          return '<div>Custom 404 Page</div>';
        }
      }
      
      initialize();
      
      // Navigate to non-existent route should show custom 404 page
      navigate('/non-existent');
      const customNotFound = targetEl.querySelector('custom-404');
      expect(customNotFound).toBeDefined();
      expect(customNotFound?.innerHTML).toContain('Custom 404 Page');
    });

    it('should respond to hashchange events', async () => {
      const { page, initialize } = router;
      
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
    it('should add html and css methods support', () => {
      const router = Router({
        target: '#app',
        routing_type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'styled-page', routes: ['/styled'] })
      class StyledPage extends HTMLElement {
        html() {
          return '<div class="content">Styled Content</div>';
        }
        
        css() {
          return '.content { color: red; }';
        }
      }
      
      initialize();
      navigate('/styled');
      
      const styledPage = targetEl.querySelector('styled-page');
      expect(styledPage).toBeDefined();
      expect(styledPage?.innerHTML).toContain('Styled Content');
      
      const style = styledPage?.querySelector('style[data-component-css]');
      expect(style).toBeDefined();
      expect(style?.textContent).toContain('.content { color: red; }');
    });

    it('should handle css returning array', () => {
      const router = Router({
        target: '#app',
        routing_type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'multi-style', routes: ['/multi'] })
      class MultiStyle extends HTMLElement {
        html() {
          return '<div>Multi Style</div>';
        }
        
        css() {
          return [
            '.one { color: red; }',
            '.two { color: blue; }'
          ];
        }
      }
      
      initialize();
      navigate('/multi');
      
      const multiPage = targetEl.querySelector('multi-style');
      const style = multiPage?.querySelector('style[data-component-css]');
      expect(style?.textContent).toContain('.one { color: red; }');
      expect(style?.textContent).toContain('.two { color: blue; }');
    });
  });

  describe('multiple routes per page', () => {
    it('should handle multiple routes for same page', () => {
      const router = Router({
        target: '#app',
        routing_type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'multi-route', routes: ['/route1', '/route2', '/route3'] })
      class MultiRoute extends HTMLElement {
        html() {
          return '<div>Multi Route Page</div>';
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