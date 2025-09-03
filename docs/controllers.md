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
3. Element's `ready` promise is awaited
4. `attach()` method is called
5. Event and channel handlers are set up
6. `@snice/controller-attached` event is dispatched

### Detachment Flow

1. `detach()` method is called
2. `element` property is set to null
3. Event and channel handlers are cleaned up
4. Controller scope is cleaned up
5. `@snice/controller-detached` event is dispatched

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
    
    tbody.innerHTML = this.data.map(row => `
      <tr>
        <td>${row.id}</td>
        <td>${row.name}</td>
        <td>${row.status}</td>
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
    return `
      <h3>${data.title}</h3>
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
      this.element.innerHTML = JSON.stringify(data, null, 2);
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

### State Management Controller

```typescript
interface AppState {
  user: { id: string; name: string } | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

@controller('state-controller')
class StateController implements IController {
  element: HTMLElement | null = null;
  private state: AppState = {
    user: null,
    theme: 'light',
    notifications: []
  };
  
  private stateListeners = new Set<(state: AppState) => void>();
  
  async attach(element: HTMLElement) {
    // Load initial state
    await this.loadState();
    
    // Subscribe element to state changes
    const updateElement = (state: AppState) => {
      this.updateElementWithState(element, state);
    };
    
    this.stateListeners.add(updateElement);
    
    // Initial render
    updateElement(this.state);
  }
  
  async detach(element: HTMLElement) {
    // Clean up listeners
    this.stateListeners.clear();
    
    // Save state
    await this.saveState();
  }
  
  // Public methods for state management
  setUser(user: AppState['user']) {
    this.updateState({ ...this.state, user });
  }
  
  setTheme(theme: AppState['theme']) {
    this.updateState({ ...this.state, theme });
  }
  
  addNotification(notification: Omit<Notification, 'id'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString()
    };
    
    this.updateState({
      ...this.state,
      notifications: [...this.state.notifications, newNotification]
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(newNotification.id);
    }, 5000);
  }
  
  removeNotification(id: string) {
    this.updateState({
      ...this.state,
      notifications: this.state.notifications.filter(n => n.id !== id)
    });
  }
  
  private updateState(newState: AppState) {
    this.state = newState;
    
    // Notify all listeners
    this.stateListeners.forEach(listener => listener(this.state));
    
    // Persist state
    this.saveState();
  }
  
  private updateElementWithState(element: HTMLElement, state: AppState) {
    // Update element based on state
    element.setAttribute('data-theme', state.theme);
    
    // If element has state methods, call them
    if ('setState' in element && typeof element.setState === 'function') {
      (element as any).setState(state);
    }
    
    // Dispatch state change event
    element.dispatchEvent(new CustomEvent('state-changed', {
      detail: state,
      bubbles: true
    }));
  }
  
  private async loadState() {
    try {
      const saved = localStorage.getItem('app-state');
      if (saved) {
        this.state = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
  
  private async saveState() {
    try {
      localStorage.setItem('app-state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }
}
```

### WebSocket Controller

```typescript
@controller('websocket-controller')
class WebSocketController implements IController {
  element: HTMLElement | null = null;
  private ws?: WebSocket;
  private reconnectTimer?: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  
  async attach(element: HTMLElement) {
    this.connect();
  }
  
  async detach(element: HTMLElement) {
    this.disconnect();
  }
  
  private connect() {
    try {
      this.ws = new WebSocket('ws://localhost:8080');
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.onConnected();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError(error);
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onDisconnected();
        this.scheduleReconnect();
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  }
  
  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onReconnectFailed();
      return;
    }
    
    this.reconnectAttempts++;
    
    console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    
    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
  
  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      // Update element with message
      if (this.element && 'onMessage' in this.element) {
        (this.element as any).onMessage(message);
      }
      
      // Dispatch event
      this.element?.dispatchEvent(new CustomEvent('ws-message', {
        detail: message,
        bubbles: true
      }));
      
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }
  
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, queuing message');
      // Could implement message queue here
    }
  }
  
  private onConnected() {
    this.element?.classList.remove('disconnected');
    this.element?.classList.add('connected');
  }
  
  private onDisconnected() {
    this.element?.classList.remove('connected');
    this.element?.classList.add('disconnected');
  }
  
  private onError(error: Event) {
    this.element?.classList.add('error');
  }
  
  private onReconnectFailed() {
    this.element?.classList.add('reconnect-failed');
    
    // Show user notification
    if (this.element) {
      const notification = document.createElement('div');
      notification.className = 'connection-error';
      notification.textContent = 'Connection lost. Please refresh the page.';
      this.element.appendChild(notification);
    }
  }
}
```

## Controller Registry

Controllers are automatically registered when decorated with `@controller`:

```typescript
import { getController } from 'snice';

// Get controller instance from an element
const element = document.querySelector('#my-element');
const controller = getController(element);

if (controller) {
  console.log('Controller found:', controller);
}
```

## Best Practices

1. **Separation of Concerns**: Keep controllers focused on data and business logic
2. **Cleanup Resources**: Always clean up timers, listeners, and connections
3. **Error Handling**: Handle errors gracefully in async operations
4. **Type Safety**: Use TypeScript generics for element types
5. **State Management**: Consider using a state controller for complex state
6. **Abort Requests**: Cancel pending requests when detaching
7. **Memory Management**: Clear references to prevent memory leaks
8. **Event Delegation**: Use event delegation for dynamic content