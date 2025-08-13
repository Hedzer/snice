import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, query, controller, on, dispatch } from '../src';

describe('React Migration Examples', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Component Structure', () => {
    it('should migrate React component with state and controller', async () => {
      // Mock fetch for testing
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ name: 'John Doe', email: 'john@example.com' })
      });

      @element('test-user-card')
      class UserCard extends HTMLElement {
        @property()
        userId = '';
        
        @query('.content')
        content?: HTMLElement;
        
        html() {
          return `
            <div class="user-card">
              <div class="content">Loading...</div>
            </div>
          `;
        }
        
        setUser(user: any) {
          if (this.content) {
            this.content.innerHTML = `
              <h3>${user.name}</h3>
              <p>${user.email}</p>
            `;
          }
        }
      }

      @controller('test-user-controller')
      class UserController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          const userId = element.getAttribute('user-id');
          const user = await this.fetchUser(userId!);
          (element as any).setUser(user);
        }
        
        async detach(element: HTMLElement) {}
        
        async fetchUser(userId: string) {
          const response = await fetch(`/api/users/${userId}`);
          return response.json();
        }
      }

      // Create and test the element
      const el = document.createElement('test-user-card');
      el.setAttribute('user-id', '123');
      el.setAttribute('controller', 'test-user-controller');
      container.appendChild(el);

      // Wait for controller to attach and fetch data
      await new Promise(resolve => setTimeout(resolve, 100));

      const content = el.shadowRoot?.querySelector('.content');
      expect(content?.innerHTML).toContain('John Doe');
      expect(content?.innerHTML).toContain('john@example.com');
    });
  });

  describe('State Management', () => {
    it('should handle counter state imperatively', async () => {
      @element('test-counter-element')
      class CounterElement extends HTMLElement {
        private count = 0;
        
        @query('.count')
        countDisplay?: HTMLElement;
        
        html() {
          return `
            <div>
              <p>Count: <span class="count">0</span></p>
              <button>Increment</button>
            </div>
          `;
        }
        
        @on('click', 'button')
        increment() {
          this.count++;
          this.updateCount();
        }
        
        updateCount() {
          if (this.countDisplay) {
            this.countDisplay.textContent = String(this.count);
          }
        }
      }

      const el = document.createElement('test-counter-element');
      container.appendChild(el);

      await new Promise(resolve => setTimeout(resolve, 10));

      const button = el.shadowRoot?.querySelector('button');
      const countDisplay = el.shadowRoot?.querySelector('.count');

      expect(countDisplay?.textContent).toBe('0');

      // Click the button
      button?.dispatchEvent(new Event('click', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(countDisplay?.textContent).toBe('1');

      // Click again
      button?.dispatchEvent(new Event('click', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(countDisplay?.textContent).toBe('2');
    });
  });

  describe('Event Handling', () => {
    it('should handle form submission', async () => {
      let formSubmitted = false;

      @element('test-form-element')
      class FormElement extends HTMLElement {
        html() {
          return `
            <form>
              <input type="text" />
              <button type="submit">Submit</button>
            </form>
          `;
        }
        
        @on('submit', 'form')
        handleSubmit(event: Event) {
          event.preventDefault();
          formSubmitted = true;
        }
      }

      const el = document.createElement('test-form-element');
      container.appendChild(el);

      await new Promise(resolve => setTimeout(resolve, 10));

      const form = el.shadowRoot?.querySelector('form');
      form?.dispatchEvent(new Event('submit', { bubbles: true }));

      expect(formSubmitted).toBe(true);
    });
  });
});