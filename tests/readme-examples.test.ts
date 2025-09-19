import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router, property, element, controller, query, on, dispatch, watch, SimpleArray } from '../src';

describe('README Examples', () => {
  let container: HTMLElement;
  let router: ReturnType<typeof Router>;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-app';
    document.body.appendChild(container);

    router = Router({
      target: '#test-app',
      type: 'hash'
    });
  });

  afterEach(() => {
    container.remove();
    window.location.hash = '';
  });

  it('should work with userId parameter as shown in README', async () => {
    const { page, initialize, navigate } = router;

    // Exact example from README
    @page({ tag: 'user-page', routes: ['/users/:userId'] })
    class UserPage extends HTMLElement {
      @property()
      userId = '';
      
      html() {
        return `<h1>User ${this.userId}</h1>`;
      }
    }

    initialize();
    navigate('/users/123');

    await new Promise(resolve => setTimeout(resolve, 50));

    const userPageElement = container.querySelector('user-page');
    expect(userPageElement).toBeTruthy();

    // Check that userId was set as attribute
    expect(userPageElement?.getAttribute('userId')).toBe('123');

    // Check that userId property was set
    expect((userPageElement as any)?.userId).toBe('123');

    // Check rendered content
    const heading = userPageElement?.shadowRoot?.querySelector('h1');
    expect(heading?.textContent).toBe('User 123');
  });

  it('should work with basic element example from README', () => {
    // Basic component example from README
    @element('my-button')
    class MyButton extends HTMLElement {
      html() {
        return `<button>Click me</button>`;
      }
    }

    document.body.innerHTML = '<my-button></my-button>';
    const button = document.querySelector('my-button');
    expect(button).toBeTruthy();
    expect(button?.shadowRoot?.querySelector('button')?.textContent).toBe('Click me');
    
    document.body.innerHTML = '';
  });

  it('should work with counter display imperative updates example', () => {
    // Imperative counter example from README
    @element('counter-display')
    class CounterDisplay extends HTMLElement {
      @property({ type: Number })
      count = 0;
      
      @query('.count')
      countElement!: HTMLSpanElement;
      
      @query('.status')
      statusElement!: HTMLSpanElement;

      html() {
        return `
          <div class="counter">
            <span class="count">${this.count}</span>
            <span class="status">Ready</span>
          </div>
        `;
      }
      
      setCount(newCount: number) {
        this.count = newCount;
        this.countElement.textContent = String(newCount);
      }
      
      setStatus(status: string) {
        this.statusElement.textContent = status;
      }
      
      increment() {
        this.setCount(this.count + 1);
        this.setStatus('Incremented!');
      }
    }

    document.body.innerHTML = '<counter-display></counter-display>';
    const counter = document.querySelector('counter-display') as any;
    
    // Initial state
    expect(counter.shadowRoot.querySelector('.count').textContent).toBe('0');
    expect(counter.shadowRoot.querySelector('.status').textContent).toBe('Ready');
    
    // Test imperative updates
    counter.increment();
    expect(counter.shadowRoot.querySelector('.count').textContent).toBe('1');
    expect(counter.shadowRoot.querySelector('.status').textContent).toBe('Incremented!');
    
    document.body.innerHTML = '';
  });

  it('should work with theme toggle watch example', async () => {
    // Theme toggle with @watch example from README
    @element('theme-toggle')
    class ThemeToggle extends HTMLElement {
      @property()
      theme: 'light' | 'dark' = 'light';
      
      @query('.icon')
      icon!: HTMLSpanElement;
      
      html() {
        return `
          <button>
            <span class="icon">🌞</span>
          </button>
        `;
      }
      
      @watch('theme')
      updateTheme(oldValue: string, newValue: string) {
        if (this.icon) {
          this.icon.textContent = newValue === 'dark' ? '🌙' : '🌞';
        }
      }
      
      @on('click', 'button')
      toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
      }
    }

    document.body.innerHTML = '<theme-toggle></theme-toggle>';
    const toggle = document.querySelector('theme-toggle') as any;
    
    // Wait for element to be ready
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Initial state
    expect(toggle.shadowRoot.querySelector('.icon').textContent).toBe('🌞');
    
    // Click to toggle
    toggle.shadowRoot.querySelector('button').click();
    expect(toggle.shadowRoot.querySelector('.icon').textContent).toBe('🌙');
    expect(toggle.theme).toBe('dark');
    
    document.body.innerHTML = '';
  });

  it('should work with toggle switch dispatch example', () => {
    // Toggle switch with @dispatch example from README
    @element('toggle-switch')
    class ToggleSwitch extends HTMLElement {
      private isOn = false;

      @query('.toggle')
      toggleButton!: HTMLElement;

      html() {
        return `<button class="toggle">OFF</button>`;
      }
      
      @on('click', '.toggle')
      @dispatch('toggled')
      toggle() {
        this.isOn = !this.isOn;
        this.toggleButton.textContent = this.isOn ? 'ON' : 'OFF';
        return { on: this.isOn };
      }
    }

    document.body.innerHTML = '<toggle-switch></toggle-switch>';
    const toggle = document.querySelector('toggle-switch') as any;
    
    let eventFired = false;
    let eventDetail: any;
    
    toggle.addEventListener('toggled', (e: CustomEvent) => {
      eventFired = true;
      eventDetail = e.detail;
    });
    
    // Initial state
    expect(toggle.shadowRoot.querySelector('.toggle').textContent).toBe('OFF');
    
    // Click to toggle
    toggle.shadowRoot.querySelector('.toggle').click();
    expect(toggle.shadowRoot.querySelector('.toggle').textContent).toBe('ON');
    expect(eventFired).toBe(true);
    expect(eventDetail).toEqual({ on: true });
    
    document.body.innerHTML = '';
  });

  it('should work with SimpleArray property example', async () => {
    // SimpleArray example from README
    @element('tag-list')
    class TagList extends HTMLElement {
      @property({ type: SimpleArray })
      tags = ['javascript', 'typescript', 'web'];
      
      html() {
        return `<div>${this.tags.join(', ')}</div>`;
      }
    }

    document.body.innerHTML = '<tag-list tags="react，vue，angular"></tag-list>';
    const tagList = document.querySelector('tag-list') as any;
    
    // Wait for element to be ready and attributes processed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should parse the attribute to property
    expect(tagList.tags).toEqual(['react', 'vue', 'angular']);
    
    // But HTML renders once with initial values, so display won't change
    // This is the imperative philosophy - updates require explicit method calls
    expect(tagList.shadowRoot.querySelector('div').textContent).toBe('javascript, typescript, web');
    
    document.body.innerHTML = '';
  });

  it('should work with element-controller communication example', async () => {
    // Element-controller example from README
    interface IUserCard extends HTMLElement {
      userId: string;
      showUser(user: any): void;
    }

    @element('user-card')
    class UserCard extends HTMLElement implements IUserCard {
      @property({ attribute: 'user-id' })
      userId = '';
      
      @query('h3')
      nameElement!: HTMLHeadingElement;
      
      @query('p')
      emailElement!: HTMLParagraphElement;
      
      html() {
        return `
          <div class="card">
            <h3>Loading...</h3>
            <p>Please wait...</p>
          </div>
        `;
      }
      
      showUser(user: any) {
        this.nameElement.textContent = user.name;
        this.emailElement.textContent = user.email;
      }
    }

    @controller('user-loader')
    class UserLoaderController {
      element!: IUserCard;
      
      async attach(element: IUserCard) {
        // Simulate API call
        const user = { name: 'Jane Doe', email: 'jane@example.com' };
        element.showUser(user);
      }
      
      async detach(element: IUserCard) { /* Cleanup */ }
    }

    document.body.innerHTML = '<user-card user-id="123" controller="user-loader"></user-card>';
    const userCard = document.querySelector('user-card') as any;
    
    // Wait for controller to attach and process
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Initial HTML shows loading state
    expect(userCard.userId).toBe('123');
    
    // Controller should have called showUser to update the display
    expect(userCard.shadowRoot.querySelector('h3').textContent).toBe('Jane Doe');
    expect(userCard.shadowRoot.querySelector('p').textContent).toBe('jane@example.com');
    
    document.body.innerHTML = '';
  });
});