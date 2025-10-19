import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, controller, IController, render, html } from '../src';

describe('Angular Migration Examples', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Component with Service', () => {
    it('should migrate Angular component with service injection', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
          { id: 3, name: 'Charlie' }
        ]
      });

      @element('test-user-list')
      class UserList extends HTMLElement {
        users: any[] = [];

        @render()
        renderContent() {
          return html`
            <ul>
              ${this.users.map(user => html`<li>${user.name}</li>`)}
            </ul>
          `;
        }

        setUsers(users: any[]) {
          this.users = users;
          this.renderContent();
        }
      }

      @controller('test-user-service')
      class UserService implements IController {
        element: HTMLElement | null = null;
        
        async attach(element: HTMLElement) {
          const users = await this.getUsers();
          (element as any).setUsers(users);
        }
        
        async getUsers() {
          const response = await fetch('/api/users');
          return response.json();
        }
        
        async detach(element: HTMLElement) {}
      }

      const el = document.createElement('test-user-list');
      el.setAttribute('controller', 'test-user-service');
      container.appendChild(el);

      // Wait for controller to attach and fetch data
      await new Promise(resolve => setTimeout(resolve, 100));

      const listItems = el.shadowRoot?.querySelectorAll('li');
      expect(listItems?.length).toBe(3);
      expect(listItems?.[0].textContent).toBe('Alice');
      expect(listItems?.[1].textContent).toBe('Bob');
      expect(listItems?.[2].textContent).toBe('Charlie');
    });
  });

  describe('Dependency Injection Pattern', () => {
    it('should use singleton pattern for services', async () => {
      // Service as singleton
      class LoggerService {
        private static instance: LoggerService;
        public messages: string[] = [];
        
        static getInstance() {
          if (!this.instance) {
            this.instance = new LoggerService();
          }
          return this.instance;
        }
        
        log(message: string) {
          this.messages.push(message);
        }
      }

      @element('test-component-a')
      class ComponentA extends HTMLElement {
        private logger = LoggerService.getInstance();

        @render()
        renderContent() {
          return html`<button>Log from A</button>`;
        }

        connectedCallback() {
          super.connectedCallback?.();
          this.logger.log('Component A initialized');
        }
      }

      @element('test-component-b')
      class ComponentB extends HTMLElement {
        private logger = LoggerService.getInstance();

        @render()
        renderContent() {
          return html`<button>Log from B</button>`;
        }

        connectedCallback() {
          super.connectedCallback?.();
          this.logger.log('Component B initialized');
        }
      }

      const elA = document.createElement('test-component-a');
      const elB = document.createElement('test-component-b');
      
      container.appendChild(elA);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      container.appendChild(elB);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Both components should share the same logger instance
      const logger = LoggerService.getInstance();
      expect(logger.messages).toContain('Component A initialized');
      expect(logger.messages).toContain('Component B initialized');
      expect(logger.messages.length).toBe(2);
    });
  });

  describe('Template Directives', () => {
    it('should handle *ngFor equivalent with array.map', async () => {
      @element('test-ng-for')
      class NgForComponent extends HTMLElement {
        items = ['Apple', 'Banana', 'Cherry'];

        @render()
        renderContent() {
          return html`
            <ul>
              ${this.items.map(item => html`<li>${item}</li>`)}
            </ul>
          `;
        }
      }

      const el = document.createElement('test-ng-for');
      container.appendChild(el);
      await el.ready;

      const listItems = el.shadowRoot?.querySelectorAll('li');
      expect(listItems?.length).toBe(3);
      expect(listItems?.[0].textContent).toBe('Apple');
      expect(listItems?.[1].textContent).toBe('Banana');
      expect(listItems?.[2].textContent).toBe('Cherry');
    });

    it('should handle *ngIf equivalent with conditional rendering', async () => {
      @element('test-ng-if')
      class NgIfComponent extends HTMLElement {
        isVisible = true;

        @render()
        renderContent() {
          return html`
            <div>
              ${this.isVisible ? html`<p>Visible content</p>` : ''}
              <button @click=${this.toggle}>Toggle</button>
            </div>
          `;
        }

        toggle = () => {
          this.isVisible = !this.isVisible;
          this.renderContent();
        };
      }

      const el = document.createElement('test-ng-if');
      container.appendChild(el);
      await el.ready;

      // Initially visible
      let content = el.shadowRoot?.querySelector('p');
      expect(content?.textContent).toBe('Visible content');

      // Click to hide
      const button = el.shadowRoot?.querySelector('button');
      button?.click();
      await new Promise(resolve => queueMicrotask(resolve));

      content = el.shadowRoot?.querySelector('p');
      expect(content).toBeNull();

      // Click to show again
      const buttonAfterRerender = el.shadowRoot?.querySelector('button');
      buttonAfterRerender?.click();
      await new Promise(resolve => queueMicrotask(resolve));

      content = el.shadowRoot?.querySelector('p');
      expect(content?.textContent).toBe('Visible content');
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should map Angular lifecycle hooks to web component callbacks', async () => {
      let initialized = false;
      let destroyed = false;

      @element('test-lifecycle')
      class LifecycleComponent extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Lifecycle Component</div>`;
        }

        // ngOnInit equivalent
        connectedCallback() {
          super.connectedCallback?.();
          initialized = true;
        }

        // ngOnDestroy equivalent
        disconnectedCallback() {
          super.disconnectedCallback?.();
          destroyed = true;
        }
      }

      const el = document.createElement('test-lifecycle');
      container.appendChild(el);
      await el.ready;

      expect(initialized).toBe(true);
      expect(destroyed).toBe(false);

      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(destroyed).toBe(true);
    });
  });
});