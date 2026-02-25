# Controllers API Documentation

Controllers handle data fetching, business logic, and server communication separately from visual components. They can be attached to any HTML element, including native elements.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Controller Lifecycle](#controller-lifecycle)
- [Native Element Controllers](#native-element-controllers)
- [Resource Cleanup](#resource-cleanup)
- [Event Handling in Controllers](#event-handling-in-controllers)
- [Query Selectors in Controllers](#query-selectors-in-controllers)
- [Advanced Patterns](#advanced-patterns)

## Basic Usage

### Creating a Controller

```typescript
import { controller, IController } from 'snice';

@controller('user-controller')
class UserController implements IController<HTMLElement> {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    // Called when controller is attached to an element
    console.log('Controller attached to', element);
  }

  async detach(element: HTMLElement) {
    // Called when controller is detached from an element
    console.log('Controller detached from', element);
  }
}
```

### Attaching Controllers to Elements

Controllers can be attached via the `controller` attribute:

```html
<!-- Custom element -->
<user-list controller="user-controller"></user-list>

<!-- Native element (requires useNativeElementControllers()) -->
<div controller="user-controller"></div>
```

### IController Interface

```typescript
interface IController<T extends HTMLElement = HTMLElement> {
  element: T | null | undefined;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}
```

## Controller Lifecycle

### Attachment Flow

1. Controller instance is created
2. `element` property is set
3. Router context is passed (if available)
4. Element's `ready` promise is awaited
5. `attach()` method is called
6. Observers are set up
7. Channel/response handlers are set up
8. Event handlers are set up
9. `@snice/controller-attached` event is dispatched

### Detachment Flow

1. `detach()` method is called
2. `element` property is set to null
3. Observers are cleaned up
4. Channel/response handlers are cleaned up
5. Event handlers are cleaned up
6. Controller scope is cleaned up
7. `@snice/controller-detached` event is dispatched

### Example with Lifecycle Logging

```typescript
@controller('lifecycle-controller')
class LifecycleController implements IController {
  element: HTMLElement | null = null;
  private intervalId?: number;

  async attach(element: HTMLElement) {
    console.log('1. Controller attaching to', element.tagName);

    // Wait for any async initialization
    await this.initialize();

    // Set up recurring tasks
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 5000);

    console.log('2. Controller attached');
  }

  async detach(element: HTMLElement) {
    console.log('3. Controller detaching from', element.tagName);

    // Clean up resources
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Perform async cleanup
    await this.cleanup();

    console.log('4. Controller detached');
  }

  private async initialize() {
    // Async initialization logic
  }

  private async cleanup() {
    // Async cleanup logic
  }

  private updateData() {
    console.log('Updating data...');
  }
}
```

## Native Element Controllers

Enable controller support for native HTML elements:

```typescript
import { useNativeElementControllers } from 'snice';

// Enable at application start
useNativeElementControllers();
```

This allows you to attach controllers to any HTML element:

```html
<div controller="content-controller">
  <p>Content managed by controller</p>
</div>

<table controller="table-controller">
  <tbody></tbody>
</table>

<form controller="form-controller">
  <input type="text" name="username">
</form>
```

### Example: Table Controller

Controllers provide specific behaviors (data fetching, sorting, filtering) to generic visual components. The component handles rendering — the controller handles data:

```typescript
@controller('table-controller')
class TableController implements IController<HTMLTableElement> {
  element: HTMLTableElement | null = null;

  async attach(element: HTMLTableElement) {
    const data = await fetch('/api/data').then(r => r.json());

    // Pass data to the element — if it's a custom element, call its API
    if ('setData' in element && typeof (element as any).setData === 'function') {
      (element as any).setData(data);
    }
  }

  async detach() {}
}
```

## Resource Cleanup

The framework auto-cleans `@on`, `@observe`, and `@respond` handlers. Clean up your own resources (WebSockets, timers, manual listeners) in `detach`:

```typescript
import { controller, IController } from 'snice';

@controller('resource-controller')
class ResourceController implements IController {
  element: HTMLElement | null = null;
  private websocket?: WebSocket;
  private eventHandler?: (e: MessageEvent) => void;

  async attach(element: HTMLElement) {
    // Open websocket
    this.websocket = new WebSocket('ws://localhost:8080');

    // Set up event listener
    this.eventHandler = (e: MessageEvent) => this.handleMessage(e);
    this.websocket.addEventListener('message', this.eventHandler);
  }

  async detach(element: HTMLElement) {
    // Clean up resources
    if (this.websocket) {
      if (this.eventHandler) {
        this.websocket.removeEventListener('message', this.eventHandler);
      }
      this.websocket.close();
      this.websocket = undefined;
    }
    this.eventHandler = undefined;
  }

  private handleMessage(event: MessageEvent) {
    console.log('Received:', event.data);
  }
}
```

## Event Handling in Controllers

Controllers can use the `@on` decorator to handle events from their attached element:

```typescript
import { controller, on, IController } from 'snice';

@controller('form-controller')
class FormController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;

  async attach(element: HTMLFormElement) {
    console.log('Form controller attached');
  }

  async detach(element: HTMLFormElement) {
    console.log('Form controller detached');
  }

  @on('submit')
  handleSubmit(event: Event) {
    event.preventDefault();
    console.log('Form submitted');
    this.processForm();
  }

  @on('input', 'input[type="text"]')
  handleTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Text input changed:', input.value);
  }

  @on('change', 'select')
  handleSelectChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    console.log('Select changed:', select.value);
  }

  private processForm() {
    if (!this.element) return;

    const formData = new FormData(this.element);
    console.log('Processing form data:', Object.fromEntries(formData));
  }
}
```

## Query Selectors in Controllers

Controllers can use `@query` and `@queryAll` to access elements. **Important:** By default, `@query` searches the shadow DOM. When attached to native elements (no shadow root), use `{ light: true }`:

```typescript
import { controller, query, queryAll, IController } from 'snice';

@controller('form-validation-controller')
class FormValidationController implements IController<HTMLFormElement> {
  element: HTMLFormElement | null = null;

  // light: true is required — native elements have no shadow root
  @query('.error-message', { light: true })
  errorEl?: HTMLElement;

  @queryAll('input[required]', { light: true })
  requiredInputs?: NodeListOf<HTMLInputElement>;

  async attach() {}
  async detach() {}

  @on('submit')
  handleSubmit(event: Event) {
    const invalid = Array.from(this.requiredInputs || []).filter(i => !i.value.trim());

    if (invalid.length > 0) {
      event.preventDefault();
      invalid[0].focus();
      if (this.errorEl) {
        this.errorEl.textContent = `${invalid.length} required field(s) missing`;
      }
    }
  }
}
```

## Advanced Patterns

### Data Fetching Controller

Controllers own data fetching. Pass results to the element via its API or dispatch events — don't manipulate DOM directly:

```typescript
@controller('data-fetcher')
class DataFetcherController implements IController {
  element: HTMLElement | null = null;
  private abortController?: AbortController;
  private pollingInterval?: number;

  async attach(element: HTMLElement) {
    await this.fetchData();

    // Poll every 30 seconds
    this.pollingInterval = setInterval(() => this.fetchData(), 30000);
  }

  async detach() {
    this.abortController?.abort();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private async fetchData() {
    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });
      const data = await response.json();

      // Pass data to element — let the element handle rendering
      this.element?.dispatchEvent(new CustomEvent('data-loaded', {
        detail: data,
        bubbles: true
      }));
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        this.element?.dispatchEvent(new CustomEvent('data-error', {
          detail: { message: error.message },
          bubbles: true
        }));
      }
    }
  }
}
```

### Theme Controller

```typescript
@controller('theme-controller')
class ThemeController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    const saved = localStorage.getItem('theme') || 'light';
    element.setAttribute('data-theme', saved);
  }

  async detach(element: HTMLElement) {}

  @on('click', '[data-set-theme]')
  handleThemeToggle(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const theme = target.dataset.setTheme!;
    this.element?.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
}
```

### WebSocket Controller

```typescript
@controller('ws-controller')
class WebSocketController implements IController {
  element: HTMLElement | null = null;
  private ws?: WebSocket;
  private reconnectTimer?: number;

  async attach(element: HTMLElement) {
    this.connect();
  }

  async detach(element: HTMLElement) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  private connect() {
    this.ws = new WebSocket('wss://api.example.com/ws');

    this.ws.onmessage = (event) => {
      this.element?.dispatchEvent(new CustomEvent('ws-message', {
        detail: JSON.parse(event.data),
        bubbles: true
      }));
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
```

## Accessing Controllers

### Via Event

Listen for attachment on the element itself (the event does **not** bubble):

```typescript
element.addEventListener('@snice/controller-attached', (e: CustomEvent) => {
  console.log('Name:', e.detail.name);           // controller name string
  console.log('Instance:', e.detail.controller);  // IController instance
});
```

### Auto-Cleanup

The framework automatically cleans up `@on` handlers, observers, and `@respond` handlers during detach. Manual cleanup in `detach()` is only needed for resources you manage yourself (WebSockets, intervals, manual event listeners).

