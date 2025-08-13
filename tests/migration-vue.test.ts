import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, on, dispatch, query } from '../src';

describe('Vue Migration Examples', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('Single File Component', () => {
    it('should migrate Vue SFC with props, events, and styling', async () => {
      let toggleEventFired = false;
      let deleteEventFired = false;
      let toggledId: number | null = null;
      let deletedId: number | null = null;

      @element('test-todo-item')
      class TodoItem extends HTMLElement {
        @property({ type: Object })
        todo = { id: 0, text: '', done: false };
        
        html() {
          return `
            <div class="todo-item ${this.todo.done ? 'completed' : ''}">
              <input type="checkbox" ${this.todo.done ? 'checked' : ''}>
              <span>${this.todo.text}</span>
              <button class="delete">Delete</button>
            </div>
          `;
        }
        
        css() {
          return `
            .todo-item {
              padding: 10px;
            }
            .completed {
              opacity: 0.5;
            }
          `;
        }
        
        @on('change', 'input[type="checkbox"]')
        @dispatch('toggle')
        toggleTodo() {
          return { id: this.todo.id };
        }
        
        @on('click', '.delete')
        @dispatch('delete')
        deleteTodo() {
          return { id: this.todo.id };
        }
      }

      const el = document.createElement('test-todo-item');
      (el as any).todo = { id: 42, text: 'Test todo', done: false };
      
      // Listen for custom events
      el.addEventListener('toggle', (e: Event) => {
        toggleEventFired = true;
        toggledId = (e as CustomEvent).detail.id;
      });
      
      el.addEventListener('delete', (e: Event) => {
        deleteEventFired = true;
        deletedId = (e as CustomEvent).detail.id;
      });

      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial render
      const todoDiv = el.shadowRoot?.querySelector('.todo-item');
      expect(todoDiv?.classList.contains('completed')).toBe(false);
      
      const checkbox = el.shadowRoot?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
      
      const span = el.shadowRoot?.querySelector('span');
      expect(span?.textContent).toBe('Test todo');

      // Test toggle event
      checkbox?.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(toggleEventFired).toBe(true);
      expect(toggledId).toBe(42);

      // Test delete event
      const deleteBtn = el.shadowRoot?.querySelector('.delete');
      deleteBtn?.dispatchEvent(new Event('click', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(deleteEventFired).toBe(true);
      expect(deletedId).toBe(42);

      // Check styles are applied
      const styles = el.shadowRoot?.querySelector('style');
      expect(styles?.textContent).toContain('.todo-item');
      expect(styles?.textContent).toContain('padding: 10px');
      expect(styles?.textContent).toContain('.completed');
      expect(styles?.textContent).toContain('opacity: 0.5');
    });
  });

  describe('Computed Properties', () => {
    it('should handle computed properties with getters', async () => {
      @element('test-name-display')
      class NameDisplay extends HTMLElement {
        private firstName = 'John';
        private lastName = 'Doe';
        
        get fullName() {
          return `${this.firstName} ${this.lastName}`;
        }
        
        html() {
          return `<div>${this.fullName}</div>`;
        }
        
        updateName(first: string, last: string) {
          this.firstName = first;
          this.lastName = last;
          this.render();
        }
        
        render() {
          if (this.shadowRoot) {
            this.shadowRoot.innerHTML = this.html();
          }
        }
      }

      const el = document.createElement('test-name-display');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial render
      let div = el.shadowRoot?.querySelector('div');
      expect(div?.textContent).toBe('John Doe');

      // Update name
      (el as any).updateName('Jane', 'Smith');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Re-query the div after re-render
      div = el.shadowRoot?.querySelector('div');
      expect(div?.textContent).toBe('Jane Smith');
    });
  });

  describe('v-model equivalent', () => {
    it('should handle two-way binding manually', async () => {
      @element('test-input-binding')
      class InputBinding extends HTMLElement {
        private value = '';
        
        @query('input')
        input?: HTMLInputElement;
        
        @query('.display')
        display?: HTMLElement;
        
        html() {
          return `
            <div>
              <input type="text" value="${this.value}">
              <p class="display">Value: ${this.value}</p>
            </div>
          `;
        }
        
        @on('input', 'input')
        handleInput(event: Event) {
          const target = event.target as HTMLInputElement;
          this.value = target.value;
          this.updateDisplay();
        }
        
        updateDisplay() {
          if (this.display) {
            this.display.textContent = `Value: ${this.value}`;
          }
        }
      }

      const el = document.createElement('test-input-binding');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
      const display = el.shadowRoot?.querySelector('.display');

      // Initial state
      expect(display?.textContent).toBe('Value: ');

      // Simulate typing
      input.value = 'Hello Vue';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(display?.textContent).toBe('Value: Hello Vue');
    });
  });

  describe('List Rendering', () => {
    it('should render lists with array.map', async () => {
      @element('test-list-render')
      class ListRender extends HTMLElement {
        items = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' }
        ];
        
        html() {
          return `
            <ul>
              ${this.items.map(item => `<li data-id="${item.id}">${item.name}</li>`).join('')}
            </ul>
          `;
        }
        
        addItem(item: { id: number; name: string }) {
          this.items.push(item);
          this.render();
        }
        
        render() {
          if (this.shadowRoot) {
            this.shadowRoot.innerHTML = this.html();
          }
        }
      }

      const el = document.createElement('test-list-render');
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check initial render
      const items = el.shadowRoot?.querySelectorAll('li');
      expect(items?.length).toBe(3);
      expect(items?.[0].textContent).toBe('Item 1');
      expect(items?.[1].textContent).toBe('Item 2');
      expect(items?.[2].textContent).toBe('Item 3');

      // Add new item
      (el as any).addItem({ id: 4, name: 'Item 4' });
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedItems = el.shadowRoot?.querySelectorAll('li');
      expect(updatedItems?.length).toBe(4);
      expect(updatedItems?.[3].textContent).toBe('Item 4');
    });
  });
});