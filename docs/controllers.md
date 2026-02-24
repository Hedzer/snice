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

```typescript
@controller('table-controller')
class TableController implements IController<HTMLTableElement> {
  element: HTMLTableElement | null = null;
  private data: any[] = [];

  async attach(element: HTMLTableElement) {
    // Fetch data
    this.data = await this.fetchData();

    // Render table
    this.renderTable();
  }

  async detach(element: HTMLTableElement) {
    // Clear table
    const tbody = element.querySelector('tbody');
    if (tbody) {
      tbody.innerHTML = '';
    }
  }

  private async fetchData() {
    const response = await fetch('/api/data');
    return response.json();
  }

  private renderTable() {
    if (!this.element) return;

    const tbody = this.element.querySelector('tbody');
    if (!tbody) return;

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    tbody.innerHTML = this.data.map(row => `
      <tr>
        <td>${esc(String(row.id))}</td>
        <td>${esc(row.name)}</td>
        <td>${esc(row.status)}</td>
      </tr>
    `).join('');
  }
}
```

## Resource Cleanup

Controllers should clean up resources in the `detach` method:

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

Controllers can use `@query` and `@queryAll` to access elements:

```typescript
import { controller, query, queryAll, IController } from 'snice';

@controller('dashboard-controller')
class DashboardController implements IController {
  element: HTMLElement | null = null;

  @query('.status-indicator')
  statusIndicator?: HTMLElement;

  @query('#refresh-button')
  refreshButton?: HTMLButtonElement;

  @queryAll('.data-card')
  dataCards?: NodeListOf<HTMLElement>;

  async attach(element: HTMLElement) {
    // Queries work on the attached element
    this.updateStatus('Loading...');

    // Fetch and display data
    await this.loadDashboardData();

    this.updateStatus('Ready');
  }

  async detach(element: HTMLElement) {
    this.updateStatus('Offline');
  }

  private updateStatus(status: string) {
    if (this.statusIndicator) {
      this.statusIndicator.textContent = status;
    }
  }

  private async loadDashboardData() {
    // Load data for each card
    this.dataCards?.forEach(async (card, index) => {
      const data = await this.fetchCardData(index);
      card.innerHTML = this.renderCard(data);
    });
  }

  private async fetchCardData(index: number) {
    // Simulate API call
    return { title: `Card ${index + 1}`, value: Math.random() * 100 };
  }

  private renderCard(data: any) {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
      <h3>${esc(data.title)}</h3>
      <p>${data.value.toFixed(2)}</p>
    `;
  }
}
```

## Advanced Patterns

### Data Fetching Controller

```typescript
@controller('data-fetcher')
class DataFetcherController implements IController {
  element: HTMLElement | null = null;
  private abortController?: AbortController;
  private pollingInterval?: number;

  async attach(element: HTMLElement) {
    // Initial data load
    await this.fetchAndRender();

    // Set up polling
    this.pollingInterval = setInterval(() => {
      this.fetchAndRender();
    }, 30000); // Poll every 30 seconds
  }

  async detach(element: HTMLElement) {
    // Cancel any pending requests
    this.abortController?.abort();

    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private async fetchAndRender() {
    try {
      // Cancel previous request if still pending
      this.abortController?.abort();
      this.abortController = new AbortController();

      // Show loading state
      this.setLoadingState(true);

      // Fetch data with timeout
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Render data
      this.renderData(data);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        this.renderError(error.message);
      }
    } finally {
      this.setLoadingState(false);
    }
  }

  private setLoadingState(loading: boolean) {
    if (!this.element) return;

    if (loading) {
      this.element.classList.add('loading');
      this.element.setAttribute('aria-busy', 'true');
    } else {
      this.element.classList.remove('loading');
      this.element.setAttribute('aria-busy', 'false');
    }
  }

  private renderData(data: any) {
    if (!this.element) return;

    // Type guard for custom element
    if ('setData' in this.element && typeof this.element.setData === 'function') {
      this.element.setData(data);
    } else {
      // Fallback for native elements
      this.element.textContent = JSON.stringify(data, null, 2);
    }
  }

  private renderError(message: string) {
    if (!this.element) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `Error: ${message}`;

    this.element.innerHTML = '';
    this.element.appendChild(errorDiv);
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

## Controller Registry

Controllers are automatically registered when decorated with `@controller`. Access controller instances via the `@snice/controller-attached` event:

```typescript
element.addEventListener('@snice/controller-attached', (e: CustomEvent) => {
  const controller = e.detail.controller;
  console.log('Controller attached:', controller);
});
```

