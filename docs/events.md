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
interface OnOptions {
  capture?: boolean;       // Use capture phase instead of bubble phase
  once?: boolean;          // Remove listener after first trigger
  passive?: boolean;       // Passive listener (can't preventDefault)
  preventDefault?: boolean; // Automatically call preventDefault on the event
  stopPropagation?: boolean; // Automatically call stopPropagation on the event
  debounce?: number;       // Debounce the handler by specified milliseconds
  throttle?: number;       // Throttle the handler by specified milliseconds
}

function on(eventName: string, selectorOrOptions?: string | OnOptions, options?: OnOptions): MethodDecorator
```

- `eventName`: The DOM event to listen for (supports key modifiers with `:`)
- `selectorOrOptions`: Either a CSS selector for delegation OR options object
- `options`: Options object (when second parameter is a selector)

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

### Keyboard Events with Key Modifiers

The `@on` decorator supports key modifiers for keyboard events using the `:` syntax. This allows you to listen for specific keys without manual checking in your handler.

**Important:** By default, key modifiers match **exactly** - `@on('keydown:Enter')` will only trigger on plain Enter with no modifier keys pressed. Use the `~` prefix if you want to match a key regardless of modifiers.

#### Basic Key Modifiers (Exact Match)

Use the exact `e.key` value after the colon. By default, these only match when NO modifier keys are pressed:

```typescript
@element('keyboard-handler')
class KeyboardHandler extends HTMLElement {
  html() {
    return `
      <input type="text" class="search" placeholder="Press Enter to search">
      <textarea class="editor" placeholder="Press Escape to cancel"></textarea>
      <div class="list" tabindex="0">Use arrow keys to navigate</div>
    `;
  }
  
  @on('keydown:Enter', '.search')  // Only plain Enter (no modifiers)
  handleSearchSubmit(e: KeyboardEvent) {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    console.log('Searching for:', input.value);
  }
  
  @on('keydown:Escape', '.editor')  // Only plain Escape
  handleCancel() {
    console.log('Edit cancelled');
    this.resetEditor();
  }
  
  @on('keydown:ArrowDown', '.list')  // Only plain ArrowDown
  handleNextItem(e: KeyboardEvent) {
    e.preventDefault();
    this.selectNextItem();
  }
  
  @on('keydown:ArrowUp', '.list')  // Only plain ArrowUp
  handlePrevItem(e: KeyboardEvent) {
    e.preventDefault();
    this.selectPrevItem();
  }
  
  @on('keydown:Space', '.editor')  // Only plain Space key (or use ' ')
  handleSpace() {
    console.log('Space pressed');
  }
  
  @on('keydown:Tab')  // Only plain Tab (no Shift+Tab, etc.)
  handleTab(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Tab navigation');
  }
}
```

#### Matching Keys with Any Modifiers

Use the `~` prefix to match a key regardless of modifier keys. This is useful when you want the same behavior whether modifiers are pressed or not:

```typescript
@element('search-handler')
class SearchHandler extends HTMLElement {
  html() {
    return `
      <input class="search" placeholder="Search...">
      <textarea class="editor"></textarea>
    `;
  }
  
  @on('keydown:~Enter', '.search')  // Enter with or without modifiers
  handleSearch(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Searching (any Enter combination)');
    this.performSearch();
  }
  
  @on('keydown:Enter', '.editor')  // Only plain Enter
  handleSubmit(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Submitting (plain Enter only)');
    this.submit();
  }
  
  @on('keydown:ctrl+Enter', '.editor')  // Only Ctrl+Enter
  handleNewLine(e: KeyboardEvent) {
    console.log('Adding new line (Ctrl+Enter)');
    // Let default behavior add the line
  }
}
```

**Default behavior:** Without any prefix, `@on('keydown:Enter')` matches ONLY when Enter is pressed with no modifiers. Use `~` prefix for the old behavior of matching regardless of modifiers.

#### Modifier Key Combinations

Use `+` to combine modifier keys with regular keys. When you specify modifiers, **only that exact combination** will trigger the handler:

```typescript
@element('shortcut-handler')
class ShortcutHandler extends HTMLElement {
  html() {
    return `
      <div class="editor" contenteditable="true">
        Try keyboard shortcuts:
        Ctrl+S to save, Ctrl+Enter to submit
      </div>
    `;
  }
  
  @on('keydown:ctrl+s', '.editor')
  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Saving document...');
    this.saveContent();
  }
  
  @on('keydown:ctrl+Enter', '.editor')
  handleSubmit(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Submitting form...');
    this.submitForm();
  }
  
  @on('keydown:shift+Tab')
  handleShiftTab(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Navigate backwards');
  }
  
  @on('keydown:alt+ArrowLeft')
  handleBack(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Go back');
  }
  
  @on('keydown:meta+k')  // Cmd+K on Mac
  handleCommandPalette(e: KeyboardEvent) {
    e.preventDefault();
    this.openCommandPalette();
  }
  
  @on('keydown:ctrl+shift+p')
  handlePreferences(e: KeyboardEvent) {
    e.preventDefault();
    this.openPreferences();
  }
}
```

**Important:** When using modifier combinations like `ctrl+s`, the handler will **only** trigger when exactly those modifiers are pressed. For example, `@on('keydown:ctrl+s')` will NOT trigger if both Ctrl and Shift are pressed - it requires Ctrl and only Ctrl.

#### Key Values Reference

The key modifier uses the exact `KeyboardEvent.key` values, with one exception: you can use `Space` instead of a literal space character ` `. Common examples:

- `Enter` - Enter/Return key
- `Escape` - Escape key
- `Space` or ` ` - Space key (use `Space` for better readability)
- `Tab` - Tab key
- `Backspace` - Backspace key
- `Delete` - Delete key
- `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` - Arrow keys
- `Home`, `End`, `PageUp`, `PageDown` - Navigation keys
- `a` through `z` - Letter keys (case sensitive)
- `0` through `9` - Number keys
- `F1` through `F12` - Function keys

Modifier keys for combinations:
- `ctrl` - Control key
- `shift` - Shift key
- `alt` - Alt/Option key
- `meta` or `cmd` - Windows/Command key

#### Real-World Example

```typescript
@element('search-input')
class SearchInput extends HTMLElement {
  @property()
  value = '';
  
  @query('.results')
  results?: HTMLElement;
  
  selectedIndex = -1;
  
  html() {
    return `
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search...">
        <div class="results" hidden></div>
      </div>
    `;
  }
  
  @on('keydown:ArrowDown', '.search-input')
  selectNext(e: KeyboardEvent) {
    e.preventDefault();
    const items = this.results?.querySelectorAll('.result-item');
    if (items && this.selectedIndex < items.length - 1) {
      this.selectedIndex++;
      this.highlightItem();
    }
  }
  
  @on('keydown:ArrowUp', '.search-input')
  selectPrevious(e: KeyboardEvent) {
    e.preventDefault();
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.highlightItem();
    }
  }
  
  @on('keydown:Enter', '.search-input')
  submitSearch(e: KeyboardEvent) {
    e.preventDefault();
    if (this.selectedIndex >= 0) {
      this.selectResult(this.selectedIndex);
    } else {
      this.performSearch();
    }
  }
  
  @on('keydown:Escape', '.search-input')
  closeResults() {
    this.results?.setAttribute('hidden', '');
    this.selectedIndex = -1;
  }
  
  @on('keydown:ctrl+a', '.search-input')
  selectAll(e: KeyboardEvent) {
    // Browser handles Ctrl+A by default for input fields
    console.log('Select all triggered');
  }
  
  private highlightItem() {
    // Implementation
  }
  
  private selectResult(index: number) {
    // Implementation
  }
  
  private performSearch() {
    // Implementation
  }
}
```

### Event Handler Options

The `@on` decorator supports various options to control event handling behavior:

#### Automatic preventDefault and stopPropagation

```typescript
@element('form-handler')
class FormHandler extends HTMLElement {
  html() {
    return `
      <form>
        <input type="text" name="username">
        <button type="submit">Submit</button>
      </form>
    `;
  }
  
  // Automatically prevent default form submission
  @on('submit', 'form', { preventDefault: true })
  handleSubmit(e: Event) {
    // No need to call e.preventDefault() manually
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    console.log('Form submitted:', Object.fromEntries(data));
  }
  
  // Stop event from bubbling up
  @on('click', 'button', { stopPropagation: true })
  handleButtonClick() {
    console.log('Button clicked - event won\'t bubble');
  }
}
```

#### Debounce and Throttle

Perfect for handling high-frequency events like input, scroll, or resize:

```typescript
@element('search-box')
class SearchBox extends HTMLElement {
  html() {
    return `
      <input type="text" class="search" placeholder="Search...">
      <div class="results"></div>
    `;
  }
  
  // Debounce: Wait 300ms after user stops typing
  @on('input', '.search', { debounce: 300 })
  async handleSearch(e: Event) {
    const query = (e.target as HTMLInputElement).value;
    const results = await this.fetchResults(query);
    this.displayResults(results);
  }
  
  // Throttle: Execute at most once every 100ms
  @on('scroll', '.results', { throttle: 100, passive: true })
  handleScroll(e: Event) {
    const element = e.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 10) {
      this.loadMore();
    }
  }
  
  private async fetchResults(query: string) {
    // Fetch implementation
    return [];
  }
  
  private displayResults(results: any[]) {
    // Display implementation
  }
  
  private loadMore() {
    console.log('Loading more results...');
  }
}
```

#### Once Option

Remove the listener after it fires once:

```typescript
@element('tutorial-popup')
class TutorialPopup extends HTMLElement {
  html() {
    return `
      <div class="popup">
        <p>Click anywhere to dismiss this tutorial</p>
      </div>
    `;
  }
  
  // Only listen for the first click
  @on('click', { once: true })
  dismiss() {
    this.remove();
  }
}
```

#### Capture Phase

Listen during the capture phase instead of bubble phase:

```typescript
@element('event-interceptor')
class EventInterceptor extends HTMLElement {
  html() {
    return `
      <div class="container">
        <button class="btn">Click me</button>
      </div>
    `;
  }
  
  // Capture phase fires before bubble phase
  @on('click', { capture: true })
  handleCapturePhase(e: Event) {
    console.log('Capture phase - fires first');
  }
  
  @on('click', '.btn')
  handleBubblePhase(e: Event) {
    console.log('Bubble phase - fires second');
  }
}
```

#### Passive Listeners

For better scroll/touch performance:

```typescript
@element('touch-handler')
class TouchHandler extends HTMLElement {
  html() {
    return `<div class="touchable">Swipe me</div>`;
  }
  
  // Passive: Can't preventDefault, better performance
  @on('touchstart', '.touchable', { passive: true })
  handleTouchStart(e: TouchEvent) {
    // Can't call e.preventDefault() with passive: true
    console.log('Touch started');
  }
}
```

#### Combining Options

You can combine multiple options:

```typescript
@element('advanced-handler')
class AdvancedHandler extends HTMLElement {
  html() {
    return `<input type="text" class="input">`;
  }
  
  @on('input', '.input', { 
    debounce: 300,
    preventDefault: true,
    stopPropagation: true
  })
  handleInput(e: Event) {
    // Debounced, prevents default, stops propagation
    console.log('Processed input');
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
  debounce?: number;              // Debounce the dispatch by specified milliseconds
  throttle?: number;              // Throttle the dispatch by specified milliseconds
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

### Debounce and Throttle for @dispatch

Control the frequency of dispatched events:

```typescript
@element('live-editor')
class LiveEditor extends HTMLElement {
  private content = '';

  html() {
    return `
      <textarea class="editor"></textarea>
      <div class="preview"></div>
    `;
  }
  
  @on('input', '.editor')
  @dispatch('content-changed', { debounce: 500 })
  handleInput(e: Event) {
    this.content = (e.target as HTMLTextAreaElement).value;
    return { content: this.content };
  }
  
  @on('scroll', '.editor')
  @dispatch('scroll-position', { throttle: 100 })
  handleScroll(e: Event) {
    const element = e.target as HTMLElement;
    return { 
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight
    };
  }
}

// Listen for the debounced/throttled events
const editor = document.querySelector('live-editor');
editor?.addEventListener('content-changed', (e: CustomEvent) => {
  // This fires 500ms after user stops typing
  console.log('Content updated:', e.detail.content);
});

editor?.addEventListener('scroll-position', (e: CustomEvent) => {
  // This fires at most once per 100ms during scrolling
  console.log('Scroll position:', e.detail.scrollTop);
});
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