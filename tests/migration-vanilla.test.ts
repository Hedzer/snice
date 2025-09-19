import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, on, query, queryAll } from '../src';

describe('Vanilla Web Components Migration', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Basic Web Component', () => {
    it('should migrate vanilla web component with shadow DOM', async () => {
      let clickCount = 0;

      @element('test-my-component')
      class MyComponent extends HTMLElement {
        html() {
          return `<div>Hello World</div><button>Click me</button>`;
        }
        
        css() {
          return `:host { display: block; }`;
        }
        
        @on('click', 'button')
        handleClick() {
          clickCount++;
        }
      }

      const el = document.createElement('test-my-component');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check shadow DOM content
      const div = el.shadowRoot?.querySelector('div');
      expect(div?.textContent).toBe('Hello World');

      // Check button exists
      const button = el.shadowRoot?.querySelector('button');
      expect(button?.textContent).toBe('Click me');

      // Test event handler
      button?.click();
      expect(clickCount).toBe(1);

      // Check styles
      const style = el.shadowRoot?.querySelector('style');
      expect(style?.textContent).toContain(':host { display: block; }');
    });
  });

  describe('Attribute Handling', () => {
    it('should handle attributes with @property decorator', async () => {
      @element('test-attribute-component')
      class AttributeComponent extends HTMLElement {
        @property()
        color = '';
        
        @property({ type: Number })
        size = 16;
        
        @query('div')
        content?: HTMLElement;
        
        html() {
          return `<div>Styled content</div>`;
        }
        
        css() {
          return `
            :host {
              display: block;
            }
          `;
        }
        
        connectedCallback() {
          super.connectedCallback?.();
          // Manually read attributes and set properties
          const colorAttr = this.getAttribute('color');
          const sizeAttr = this.getAttribute('size');
          if (colorAttr) this.color = colorAttr;
          if (sizeAttr) this.size = Number(sizeAttr);
        }
        
        // Method to update styles imperatively
        updateStyles() {
          if (this.content) {
            this.content.style.color = this.color || 'inherit';
            this.content.style.fontSize = `${this.size}px`;
          }
        }
      }

      const el = document.createElement('test-attribute-component');
      // Set attributes before adding to DOM
      el.setAttribute('color', 'red');
      el.setAttribute('size', '24');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // After connectedCallback, properties should be set from attributes
      expect((el as any).color).toBe('red');
      expect((el as any).size).toBe(24);
      
      // Update styles using the method
      (el as any).updateStyles();
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const div = el.shadowRoot?.querySelector('div') as HTMLElement;
      expect(div?.style.color).toBe('red');
      expect(div?.style.fontSize).toBe('24px');

      // Test property reflection
      (el as any).color = 'blue';
      (el as any).size = 32;
      (el as any).updateStyles();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(el.getAttribute('color')).toBe('blue');
      expect(el.getAttribute('size')).toBe('32');
      expect(div?.style.color).toBe('blue');
      expect(div?.style.fontSize).toBe('32px');
    });
  });

  describe('Manual Event Listeners vs Decorators', () => {
    it('should simplify event handling with @on decorator', async () => {
      const events: string[] = [];

      @element('test-event-handling')
      class EventHandling extends HTMLElement {
        html() {
          return `
            <button class="btn1">Button 1</button>
            <button class="btn2">Button 2</button>
            <input type="text" />
          `;
        }
        
        @on('click', '.btn1')
        handleBtn1() {
          events.push('btn1');
        }
        
        @on('click', '.btn2')
        handleBtn2() {
          events.push('btn2');
        }
        
        @on('input', 'input')
        handleInput(event: Event) {
          const target = event.target as HTMLInputElement;
          events.push(`input: ${target.value}`);
        }
      }

      const el = document.createElement('test-event-handling');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      const btn1 = el.shadowRoot?.querySelector('.btn1') as HTMLElement;
      const btn2 = el.shadowRoot?.querySelector('.btn2') as HTMLElement;
      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      // Test button clicks
      btn1?.click();
      btn2?.click();
      
      // Test input
      input.value = 'test';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      expect(events).toEqual(['btn1', 'btn2', 'input: test']);
    });
  });

  describe('Lifecycle Methods', () => {
    it('should automatically handle shadow DOM creation', async () => {
      let connected = false;
      let disconnected = false;

      @element('test-auto-shadow')
      class AutoShadow extends HTMLElement {
        html() {
          return `<p>Shadow DOM content</p>`;
        }
        
        connectedCallback() {
          super.connectedCallback?.();
          connected = true;
        }
        
        disconnectedCallback() {
          super.disconnectedCallback?.();
          disconnected = true;
        }
      }

      const el = document.createElement('test-auto-shadow');
      
      // Before connecting, no shadow root
      expect(el.shadowRoot).toBeNull();
      
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // After connecting, shadow root is created automatically
      expect(el.shadowRoot).not.toBeNull();
      expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('Shadow DOM content');
      expect(connected).toBe(true);
      
      // Test disconnection
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(disconnected).toBe(true);
    });
  });

  describe('Query Selectors', () => {
    it('should simplify element queries with @query and @queryAll', async () => {
      @element('test-queries')
      class QueriesComponent extends HTMLElement {
        @query('.title')
        titleElement?: HTMLElement;
        
        @query('input')
        inputElement?: HTMLInputElement;
        
        @queryAll('.item')
        items?: NodeListOf<HTMLElement>;
        
        html() {
          return `
            <h1 class="title">Title</h1>
            <input type="text" value="initial" />
            <ul>
              <li class="item">Item 1</li>
              <li class="item">Item 2</li>
              <li class="item">Item 3</li>
            </ul>
          `;
        }
        
        updateTitle(text: string) {
          if (this.titleElement) {
            this.titleElement.textContent = text;
          }
        }
        
        getValue() {
          return this.inputElement?.value;
        }
        
        getItemCount() {
          return this.items?.length || 0;
        }
      }

      const el = document.createElement('test-queries') as any;
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Test @query
      expect(el.titleElement?.textContent).toBe('Title');
      el.updateTitle('New Title');
      expect(el.titleElement?.textContent).toBe('New Title');

      // Test @query for input
      expect(el.getValue()).toBe('initial');
      el.inputElement.value = 'updated';
      expect(el.getValue()).toBe('updated');

      // Test @queryAll
      expect(el.getItemCount()).toBe(3);
      expect(el.items[0].textContent).toBe('Item 1');
      expect(el.items[1].textContent).toBe('Item 2');
      expect(el.items[2].textContent).toBe('Item 3');
    });
  });
});