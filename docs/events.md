# Events API Documentation

Snice provides powerful event handling capabilities through decorators for both listening to and dispatching events.

## Table of Contents
- [Event Listening with @on](#event-listening-with-on)
- [Event Dispatching with @dispatch](#event-dispatching-with-dispatch)
- [Event Delegation](#event-delegation)
- [Custom Events](#custom-events)
- [Shadow DOM Events](#shadow-dom-events)
- [Advanced Patterns](#advanced-patterns)

## Event Listening with @on

The `@on` decorator sets up event listeners that are automatically managed and cleaned up.

### Basic Usage

```typescript
import { element, on } from 'snice';

@element('click-counter')
class ClickCounter extends HTMLElement {
  count = 0;
  
  html() {
    return `
      <button>Click me</button>
      <span class="count">0</span>
    `;
  }
  
  @on('click', 'button')
  handleClick() {
    this.count++;
    this.updateCount();
  }
  
  updateCount() {
    const span = this.shadowRoot?.querySelector('.count');
    if (span) span.textContent = String(this.count);
  }
}
```

### @on Decorator Signature

```typescript
function on(eventName: string, selector?: string): MethodDecorator
```

- `eventName`: The DOM event to listen for
- `selector`: Optional CSS selector for event delegation

### Direct Event Handling

Listen to events directly on the host element:

```typescript
@element('hover-card')
class HoverCard extends HTMLElement {
  html() {
    return `<div class="content">Hover over me</div>`;
  }
  
  @on('mouseenter')
  handleMouseEnter() {
    this.classList.add('hovered');
  }
  
  @on('mouseleave')
  handleMouseLeave() {
    this.classList.remove('hovered');
  }
  
  @on('focus')
  handleFocus() {
    console.log('Element focused');
  }
  
  @on('blur')
  handleBlur() {
    console.log('Element blurred');
  }
}
```

### Event Object Access

Event handler methods receive the native Event object:

```typescript
@element('form-handler')
class FormHandler extends HTMLElement {
  html() {
    return `
      <form>
        <input type="text" name="username">
        <input type="email" name="email">
        <button type="submit">Submit</button>
      </form>
    `;
  }
  
  @on('submit', 'form')
  handleSubmit(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    console.log('Form data:', Object.fromEntries(formData));
  }
  
  @on('input', 'input')
  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log(`${input.name} changed to: ${input.value}`);
    
    // Access event properties
    console.log('Event type:', event.type);
    console.log('Event timestamp:', event.timeStamp);
    console.log('Is trusted:', event.isTrusted);
  }
}
```

## Event Dispatching with @dispatch

The `@dispatch` decorator automatically dispatches custom events after method execution.

### Basic Usage

```typescript
import { element, property, query, dispatch, on, watch } from 'snice';

@element('toggle-button')
class ToggleButton extends HTMLElement {
  @property({ type: Boolean })
  isOn = false;
  
  @query('button')
  button?: HTMLButtonElement;
  
  html() {
    return `<button>${this.isOn ? 'ON' : 'OFF'}</button>`;
  }
  
  @on('click', 'button')
  @dispatch('toggled')
  toggle() {
    this.isOn = !this.isOn;
    
    // Return value becomes event detail
    return { on: this.isOn, timestamp: Date.now() };
  }
  
  @watch('isOn')
  updateButton() {
    if (this.button) {
      this.button.textContent = this.isOn ? 'ON' : 'OFF';
    }
  }
}
```

### @dispatch Decorator Signature

```typescript
function dispatch(eventName: string, options?: DispatchOptions): MethodDecorator

interface DispatchOptions extends EventInit {
  dispatchOnUndefined?: boolean;  // Whether to dispatch when method returns undefined
}
```

### Dispatch Options

Configure event behavior with options:

```typescript
@element('data-loader')
class DataLoader extends HTMLElement {
  // Default: bubbles and composed
  @dispatch('data-loaded')
  loadData() {
    return { data: [1, 2, 3] };
  }
  
  // Non-bubbling event
  @dispatch('internal-update', { bubbles: false })
  updateInternal() {
    return { updated: true };
  }
  
  // Cancelable event
  @dispatch('before-save', { cancelable: true })
  beforeSave() {
    return { canSave: true };
  }
  
  // Don't dispatch if method returns undefined
  @dispatch('maybe-data', { dispatchOnUndefined: false })
  getMaybeData() {
    const data = Math.random() > 0.5 ? { value: 42 } : undefined;
    return data;
  }
}
```

### Async Method Support

`@dispatch` works with async methods:

```typescript
@element('async-fetcher')
class AsyncFetcher extends HTMLElement {
  @dispatch('fetch-complete')
  async fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    // Event dispatched after promise resolves
    return { data, status: response.status };
  }
  
  @dispatch('fetch-error', { dispatchOnUndefined: false })
  async fetchWithErrorHandling() {
    try {
      const response = await fetch('/api/data');
      return await response.json();
    } catch (error) {
      // Returning undefined prevents dispatch
      console.error('Fetch failed:', error);
      return undefined;
    }
  }
}
```

## Event Delegation

Use selectors to delegate events to child elements:

```typescript
@element('todo-list')
class TodoList extends HTMLElement {
  todos = [
    { id: 1, text: 'Task 1', done: false },
    { id: 2, text: 'Task 2', done: false },
    { id: 3, text: 'Task 3', done: false }
  ];
  
  html() {
    return `
      <ul>
        ${this.todos.map(todo => `
          <li data-id="${todo.id}">
            <input type="checkbox" ${todo.done ? 'checked' : ''}>
            <span>${todo.text}</span>
            <button class="delete">Delete</button>
          </li>
        `).join('')}
      </ul>
      <button class="add">Add Todo</button>
    `;
  }
  
  @on('change', 'input[type="checkbox"]')
  handleToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const li = checkbox.closest('li');
    const id = Number(li?.dataset.id);
    
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.done = checkbox.checked;
      this.onTodoToggled(todo);
    }
  }
  
  @on('click', '.delete')
  handleDelete(event: Event) {
    const button = event.target as HTMLButtonElement;
    const li = button.closest('li');
    const id = Number(li?.dataset.id);
    
    this.todos = this.todos.filter(t => t.id !== id);
    li?.remove();
    this.onTodoDeleted(id);
  }
  
  @on('click', '.add')
  @dispatch('todo-added')
  handleAdd() {
    const newTodo = {
      id: Date.now(),
      text: `Task ${this.todos.length + 1}`,
      done: false
    };
    
    this.todos.push(newTodo);
    this.render();
    
    return newTodo;
  }
  
  @dispatch('todo-toggled')
  onTodoToggled(todo: any) {
    return todo;
  }
  
  @dispatch('todo-deleted')
  onTodoDeleted(id: number) {
    return { id };
  }
  
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = this.html();
    }
  }
}
```

## Custom Events

### Listening to Custom Events

```typescript
@element('event-listener')
class EventListener extends HTMLElement {
  html() {
    return `
      <div class="status">Waiting for events...</div>
      <toggle-button></toggle-button>
    `;
  }
  
  @on('toggled', 'toggle-button')
  handleToggled(event: CustomEvent) {
    const { on, timestamp } = event.detail;
    this.updateStatus(`Toggle is ${on ? 'ON' : 'OFF'} at ${new Date(timestamp).toLocaleTimeString()}`);
  }
  
  updateStatus(message: string) {
    const status = this.shadowRoot?.querySelector('.status');
    if (status) status.textContent = message;
  }
}
```

### Creating and Dispatching Events Manually

```typescript
@element('manual-events')
class ManualEvents extends HTMLElement {
  sendNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    // Create custom event
    const event = new CustomEvent('notification', {
      detail: { message, type, timestamp: Date.now() },
      bubbles: true,
      composed: true  // Cross shadow DOM boundaries
    });
    
    // Dispatch event
    this.dispatchEvent(event);
  }
  
  sendCancelableAction() {
    const event = new CustomEvent('before-action', {
      detail: { action: 'delete' },
      bubbles: true,
      cancelable: true
    });
    
    const notCanceled = this.dispatchEvent(event);
    
    if (notCanceled) {
      // Proceed with action
      this.performAction();
    } else {
      console.log('Action was canceled');
    }
  }
  
  performAction() {
    console.log('Performing action');
  }
}
```

## Shadow DOM Events

### Event Composition

Events in Shadow DOM can be configured to cross shadow boundaries:

```typescript
@element('shadow-events')
class ShadowEvents extends HTMLElement {
  html() {
    return `
      <button class="internal">Internal Button</button>
      <button class="external">External Button</button>
    `;
  }
  
  @on('click', '.internal')
  handleInternal(event: Event) {
    // This event won't bubble outside shadow DOM
    const customEvent = new CustomEvent('internal-click', {
      bubbles: true,
      composed: false  // Stays within shadow DOM
    });
    this.dispatchEvent(customEvent);
  }
  
  @on('click', '.external')
  handleExternal(event: Event) {
    // This event will bubble outside shadow DOM
    const customEvent = new CustomEvent('external-click', {
      bubbles: true,
      composed: true  // Crosses shadow DOM boundary
    });
    this.dispatchEvent(customEvent);
  }
}
```

### Event Retargeting

Shadow DOM automatically retargets events:

```typescript
@element('event-retargeting')
class EventRetargeting extends HTMLElement {
  html() {
    return `
      <div class="container">
        <button>Click me</button>
      </div>
    `;
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    
    // Listen on document
    document.addEventListener('click', (event) => {
      // event.target will be the host element, not the button
      if (event.target === this) {
        console.log('Click came from shadow DOM');
        
        // Use event.composedPath() to get the actual path
        const path = event.composedPath();
        console.log('Actual target:', path[0]); // The button
      }
    });
  }
}
```

## Advanced Patterns

### Event Bus Pattern

```typescript
// Global event bus
class EventBus {
  private listeners = new Map<string, Set<Function>>();
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  off(event: string, handler: Function) {
    this.listeners.get(event)?.delete(handler);
  }
  
  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

const globalBus = new EventBus();

@element('event-publisher')
class EventPublisher extends HTMLElement {
  @on('click', 'button')
  @dispatch('local-event')
  handleClick() {
    // Dispatch local event
    const data = { timestamp: Date.now() };
    
    // Also emit to global bus
    globalBus.emit('global-event', data);
    
    return data;
  }
  
  html() {
    return `<button>Publish Event</button>`;
  }
}

@element('event-subscriber')
class EventSubscriber extends HTMLElement {
  connectedCallback() {
    super.connectedCallback?.();
    
    // Subscribe to global events
    globalBus.on('global-event', this.handleGlobalEvent.bind(this));
  }
  
  disconnectedCallback() {
    super.disconnectedCallback?.();
    
    // Unsubscribe from global events
    globalBus.off('global-event', this.handleGlobalEvent.bind(this));
  }
  
  handleGlobalEvent(data: any) {
    console.log('Received global event:', data);
  }
}
```

### Debounced Events

```typescript
@element('search-input')
class SearchInput extends HTMLElement {
  private debounceTimer?: number;
  
  html() {
    return `
      <input type="text" placeholder="Search...">
      <div class="results"></div>
    `;
  }
  
  @on('input', 'input')
  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.performSearch(value);
    }, 300);
  }
  
  @dispatch('search-performed')
  async performSearch(query: string) {
    if (!query) return undefined;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const results = [`Result 1 for ${query}`, `Result 2 for ${query}`];
    this.displayResults(results);
    
    return { query, results };
  }
  
  displayResults(results: string[]) {
    const resultsDiv = this.shadowRoot?.querySelector('.results');
    if (resultsDiv) {
      resultsDiv.innerHTML = results.map(r => `<div>${r}</div>`).join('');
    }
  }
}
```

### Event Validation

```typescript
@element('validated-form')
class ValidatedForm extends HTMLElement {
  html() {
    return `
      <form>
        <input type="email" name="email" required>
        <input type="password" name="password" required minlength="8">
        <button type="submit">Submit</button>
      </form>
    `;
  }
  
  @on('submit', 'form')
  handleSubmit(event: Event) {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    
    // Dispatch validation event
    const validationEvent = new CustomEvent('before-validate', {
      detail: { form },
      cancelable: true
    });
    
    if (!this.dispatchEvent(validationEvent)) {
      console.log('Validation canceled');
      return;
    }
    
    // Perform validation
    if (!form.checkValidity()) {
      this.dispatchValidationError(form);
      return;
    }
    
    // Dispatch success event
    this.dispatchSubmitSuccess(form);
  }
  
  @dispatch('validation-error')
  dispatchValidationError(form: HTMLFormElement) {
    const errors: Record<string, string> = {};
    
    Array.from(form.elements).forEach(element => {
      if (element instanceof HTMLInputElement && !element.validity.valid) {
        errors[element.name] = element.validationMessage;
      }
    });
    
    return { errors };
  }
  
  @dispatch('submit-success')
  dispatchSubmitSuccess(form: HTMLFormElement) {
    const formData = new FormData(form);
    return { data: Object.fromEntries(formData) };
  }
}
```

### Event Middleware

```typescript
type EventMiddleware = (event: CustomEvent, next: () => void) => void;

@element('middleware-component')
class MiddlewareComponent extends HTMLElement {
  private middlewares: EventMiddleware[] = [];
  
  constructor() {
    super();
    
    // Add logging middleware
    this.use((event, next) => {
      console.log('Event received:', event.type, event.detail);
      next();
      console.log('Event processed:', event.type);
    });
    
    // Add validation middleware
    this.use((event, next) => {
      if (event.detail && typeof event.detail === 'object') {
        next();
      } else {
        console.error('Invalid event detail');
      }
    });
  }
  
  use(middleware: EventMiddleware) {
    this.middlewares.push(middleware);
  }
  
  @on('click', 'button')
  handleClick() {
    this.processWithMiddleware('action-clicked', { action: 'click' });
  }
  
  processWithMiddleware(eventName: string, detail: any) {
    const event = new CustomEvent(eventName, { detail });
    
    let index = 0;
    const next = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware(event, next);
      } else {
        // All middleware processed, dispatch event
        this.dispatchEvent(event);
      }
    };
    
    next();
  }
  
  html() {
    return `<button>Click with middleware</button>`;
  }
}
```

## Best Practices

1. **Event Naming**: Use kebab-case for custom event names
2. **Event Detail**: Include relevant data in event detail
3. **Bubbling**: Consider whether events should bubble
4. **Composition**: Use `composed: true` for cross-shadow-DOM events
5. **Cleanup**: Event handlers are automatically cleaned up
6. **Error Handling**: Wrap event handlers in try-catch for resilience
7. **Performance**: Use event delegation for dynamic content
8. **Type Safety**: Type your event handlers properly