import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, property, render, html } from '../src';

describe('Router URL Parameters', () => {
  let container: HTMLElement;
  let router: ReturnType<typeof Router>;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'test-app';
    document.body.appendChild(container);

    // Clear any existing custom elements
    if (customElements.get('user-page')) {
      // Can't undefine, but we'll redefine it
    }

    // Create router
    router = Router({
      target: '#test-app',
      type: 'hash'
    });
  });

  afterEach(() => {
    // Clean up
    container.remove();
    window.location.hash = '';
  });

  it('should pass URL parameters to page component and render correctly', async () => {
    const { page, initialize, navigate } = router;

    // Define page with URL parameter
    @page({ tag: 'user-page', routes: ['/users/:id'] })
    class UserPage extends HTMLElement {
      id = '';  // Automatically set from URL

      @render()
      renderContent() {
        return html`<h1>User ${this.id}</h1>`;
      }
    }

    // Initialize router
    initialize();

    // Navigate to user page with ID
    navigate('/users/123');

    // Wait for navigation to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Check that the element was created
    const userPageElement = container.querySelector('user-page');
    expect(userPageElement).toBeTruthy();
    await (userPageElement as any)?.ready;

    // Check that the ID was set as an attribute
    expect(userPageElement?.getAttribute('id')).toBe('123');

    // Check that the ID property was set
    expect((userPageElement as any)?.id).toBe('123');

    // Check that the HTML was rendered correctly with the ID
    const heading = userPageElement?.shadowRoot?.querySelector('h1');
    expect(heading?.textContent).toBe('User 123');
  });

  it('should handle multiple parameters', async () => {
    const { page, initialize, navigate } = router;

    @page({ tag: 'blog-post', routes: ['/blog/:year/:month/:slug'] })
    class BlogPost extends HTMLElement {
      @property()
      year = '';

      @property()
      month = '';

      @property()
      slug = '';

      @render()
      renderContent() {
        return html`<article>
          <h1>${this.slug}</h1>
          <time>${this.year}-${this.month}</time>
        </article>`;
      }
    }

    initialize();
    navigate('/blog/2024/03/hello-world');

    await new Promise(resolve => setTimeout(resolve, 50));

    const blogElement = container.querySelector('blog-post') as any;
    expect(blogElement).toBeTruthy();
    
    // Wait for element to be ready
    if (blogElement.ready) {
      await blogElement.ready;
    }
    
    // Check all parameters were set as attributes
    expect(blogElement?.getAttribute('year')).toBe('2024');
    expect(blogElement?.getAttribute('month')).toBe('03');
    expect(blogElement?.getAttribute('slug')).toBe('hello-world');

    // Check rendered content
    const title = blogElement?.shadowRoot?.querySelector('h1');
    const time = blogElement?.shadowRoot?.querySelector('time');
    expect(title?.textContent).toBe('hello-world');
    expect(time?.textContent).toBe('2024-03');
  });

  it('should update when navigating to different parameter values', async () => {
    const { page, initialize, navigate } = router;

    @page({ tag: 'item-page', routes: ['/items/:id'] })
    class ItemPage extends HTMLElement {
      id = '';

      @render()
      renderContent() {
        return html`<div>Item ID: ${this.id}</div>`;
      }
    }

    initialize();
    
    // Navigate to first item
    navigate('/items/first');
    await new Promise(resolve => setTimeout(resolve, 10));

    let itemElement = container.querySelector('item-page');
    let content = itemElement?.shadowRoot?.querySelector('div');
    expect(content?.textContent).toBe('Item ID: first');

    // Navigate to second item
    navigate('/items/second');
    await new Promise(resolve => setTimeout(resolve, 10));

    // Element should be replaced with new one
    itemElement = container.querySelector('item-page');
    content = itemElement?.shadowRoot?.querySelector('div');
    expect(content?.textContent).toBe('Item ID: second');
  });

  it('should handle special characters in parameters', async () => {
    const { page, initialize, navigate } = router;

    @page({ tag: 'search-page', routes: ['/search/:query'] })
    class SearchPage extends HTMLElement {
      @property()
      query = '';

      @render()
      renderContent() {
        return html`<div>Searching for: ${this.query}</div>`;
      }
    }

    initialize();
    
    // Test with encoded special characters
    navigate('/search/hello%20world');
    await new Promise(resolve => setTimeout(resolve, 50));

    const searchElement = container.querySelector('search-page') as any;
    
    // Wait for element to be ready
    if (searchElement?.ready) {
      await searchElement.ready;
    }
    
    const content = searchElement?.shadowRoot?.querySelector('div');
    
    // Browser automatically decodes %20 to space when setting attributes
    expect(content?.textContent).toBe('Searching for: hello world');
  });

  it('should render HTML before parameters are set if navigated directly', async () => {
    const { page, initialize } = router;

    @page({ tag: 'product-page', routes: ['/products/:id'] })
    class ProductPage extends HTMLElement {
      id = '';  // Default empty

      @render()
      renderContent() {
        // Should handle empty ID gracefully
        return html`<div>Product: ${this.id || 'Loading...'}</div>`;
      }
    }

    initialize();
    
    // Set hash directly (simulating direct navigation)
    window.location.hash = '#/products/42';
    
    // Trigger hashchange event
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    
    await new Promise(resolve => setTimeout(resolve, 10));

    const productElement = container.querySelector('product-page');
    const content = productElement?.shadowRoot?.querySelector('div');
    
    // Should show the product ID
    expect(content?.textContent).toBe('Product: 42');
  });
});