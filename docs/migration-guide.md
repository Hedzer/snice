# Migration Guide

This guide helps you migrate from other frameworks to Snice or upgrade between Snice versions.

## Table of Contents
- [Migrating from React](#migrating-from-react)
- [Migrating from Vue](#migrating-from-vue)
- [Migrating from Angular](#migrating-from-angular)
- [Migrating from LitElement](#migrating-from-litelement)
- [Migrating from Vanilla Web Components](#migrating-from-vanilla-web-components)

## Migrating from React

### Component Structure

**React Component:**
```jsx
import React, { useState, useEffect } from 'react';

function UserCard({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(data => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

**Snice Equivalent:**
```typescript
import { element, property, query, watch } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property()
  userId = '';
  
  @query('.content')
  content?: HTMLElement;
  
  private user: any = null;
  private loading = true;
  
  html() {
    return `
      <div class="user-card">
        <div class="content">Loading...</div>
      </div>
    `;
  }
  
  @watch('userId')
  async fetchUser() {
    if (!this.userId) return;
    
    this.loading = true;
    this.updateContent();
    
    const response = await fetch(`/api/users/${this.userId}`);
    this.user = await response.json();
    this.loading = false;
    this.updateContent();
  }
  
  @watch('loading')
  @watch('user')
  updateContent() {
    if (!this.content) return;
    
    if (this.loading) {
      this.content.innerHTML = 'Loading...';
    } else if (this.user) {
      this.content.innerHTML = `
        <h3>${this.user.name}</h3>
        <p>${this.user.email}</p>
      `;
    }
  }
}
```

### State Management

**React with useState:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**Snice Equivalent:**
```typescript
import { element, property, query, on, watch } from 'snice';

@element('counter-element')
class CounterElement extends HTMLElement {
  @property()
  count = 0;
  
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
  }
  
  @watch('count')
  updateCount() {
    if (this.countDisplay) {
      this.countDisplay.textContent = String(this.count);
    }
  }
}
```

### Event Handling

**React:**
```jsx
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Snice:**
```typescript
import { element, on } from 'snice';

@element('form-element')
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
    // Handle form
  }
}
```

## Migrating from Vue

### Single File Component

**Vue SFC:**
```vue
<template>
  <div class="todo-item" :class="{ completed: todo.done }">
    <input type="checkbox" v-model="todo.done" @change="toggleTodo">
    <span>{{ todo.text }}</span>
    <button @click="deleteTodo">Delete</button>
  </div>
</template>

<script>
export default {
  props: ['todo'],
  methods: {
    toggleTodo() {
      this.$emit('toggle', this.todo.id);
    },
    deleteTodo() {
      this.$emit('delete', this.todo.id);
    }
  }
}
</script>

<style scoped>
.todo-item {
  padding: 10px;
}
.completed {
  opacity: 0.5;
}
</style>
```

**Snice Equivalent:**
```typescript
import { element, property, on, dispatch } from 'snice';

@element('todo-item')
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
```

### Computed Properties

**Vue:**
```vue
<script>
export default {
  data() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    };
  },
  computed: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
}
</script>
```

**Snice:**
```typescript
import { element } from 'snice';

@element('name-display')
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
```

## Migrating from Angular

### Component with Service

**Angular:**
```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <ul>
      <li *ngFor="let user of users">
        {{ user.name }}
      </li>
    </ul>
  `
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  
  constructor(private userService: UserService) {}
  
  ngOnInit() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }
}

@Injectable()
export class UserService {
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

**Snice Equivalent:**
```typescript
import { element, controller, IController } from 'snice';

@element('user-list')
class UserList extends HTMLElement {
  users: any[] = [];
  
  html() {
    return `
      <ul>
        ${this.users.map(user => `<li>${user.name}</li>`).join('')}
      </ul>
    `;
  }
  
  setUsers(users: any[]) {
    this.users = users;
    this.render();
  }
  
  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = this.html();
    }
  }
}

@controller('user-service')
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
```

### Dependency Injection

**Angular:**
```typescript
@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

@Component({...})
export class MyComponent {
  constructor(private logger: LoggerService) {
    this.logger.log('Component initialized');
  }
}
```

**Snice Pattern:**
```typescript
// Service as singleton
class LoggerService {
  private static instance: LoggerService;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new LoggerService();
    }
    return this.instance;
  }
  
  log(message: string) {
    console.log(message);
  }
}

import { element } from 'snice';

@element('my-component')
class MyComponent extends HTMLElement {
  private logger = LoggerService.getInstance();
  
  connectedCallback() {
    super.connectedCallback?.();
    this.logger.log('Component initialized');
  }
}
```

## Migrating from LitElement

### Basic Component

**LitElement:**
```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  @property({ type: String })
  name = 'World';
  
  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }
  `;
  
  render() {
    return html`
      <h1>Hello, ${this.name}!</h1>
      <button @click=${this.handleClick}>Click me</button>
    `;
  }
  
  handleClick() {
    this.name = 'Clicked';
  }
}
```

**Snice Equivalent:**
```typescript
import { element, property, query, on, watch } from 'snice';

@element('my-element')
class MyElement extends HTMLElement {
  @property({ reflect: true })
  name = 'World';
  
  @query('h1')
  heading?: HTMLHeadingElement;
  
  html() {
    return `
      <h1>Hello, ${this.name}!</h1>
      <button>Click me</button>
    `;
  }
  
  css() {
    return `
      :host {
        display: block;
        padding: 16px;
      }
    `;
  }
  
  @on('click', 'button')
  handleClick() {
    this.name = 'Clicked';
  }
  
  @watch('name')
  updateHeading() {
    if (this.heading) {
      this.heading.textContent = `Hello, ${this.name}!`;
    }
  }
}
```

### Reactive Updates

**LitElement (Reactive):**
```typescript
@customElement('reactive-element')
export class ReactiveElement extends LitElement {
  @property({ type: Number })
  count = 0;
  
  render() {
    return html`
      <div>Count: ${this.count}</div>
      <button @click=${() => this.count++}>Increment</button>
    `;
  }
}
```

**Snice (Imperative with @watch):**
```typescript
import { element, property, query, on, watch } from 'snice';

@element('imperative-element')
class ImperativeElement extends HTMLElement {
  @property()
  count = 0;
  
  @query('.count')
  countDisplay?: HTMLElement;
  
  html() {
    return `
      <div>Count: <span class="count">0</span></div>
      <button>Increment</button>
    `;
  }
  
  @on('click', 'button')
  increment() {
    this.count++;
  }
  
  @watch('count')
  updateCountDisplay() {
    if (this.countDisplay) {
      this.countDisplay.textContent = String(this.count);
    }
  }
}
```

## Migrating from Vanilla Web Components

### Basic Web Component

**Vanilla:**
```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
      </style>
      <div>Hello World</div>
      <button>Click me</button>
    `;
    
    this.shadowRoot.querySelector('button')
      .addEventListener('click', this.handleClick.bind(this));
  }
  
  disconnectedCallback() {
    // Manual cleanup
  }
  
  handleClick() {
    console.log('Clicked');
  }
}

customElements.define('my-component', MyComponent);
```

**Snice:**
```typescript
import { element, on } from 'snice';

@element('my-component')
class MyComponent extends HTMLElement {
  html() {
    return `<div>Hello World</div><button>Click me</button>`;
  }
  
  css() {
    return `:host { display: block; }`;
  }
  
  @on('click', 'button')
  handleClick() {
    console.log('Clicked');
  }
}
```

### Attribute Handling

**Vanilla:**
```javascript
class AttributeComponent extends HTMLElement {
  static get observedAttributes() {
    return ['color', 'size'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'color':
        this.style.color = newValue;
        break;
      case 'size':
        this.style.fontSize = newValue + 'px';
        break;
    }
  }
}
```

**Snice:**
```typescript
import { element, property } from 'snice';

@element('attribute-component')
class AttributeComponent extends HTMLElement {
  @property({ reflect: true })
  color = '';
  
  @property({ type: Number, reflect: true })
  size = 16;
  
  html() {
    return `<div>Styled content</div>`;
  }
  
  css() {
    return `
      :host {
        color: ${this.color || 'inherit'};
        font-size: ${this.size}px;
      }
    `;
  }
}
```

## Migration Checklist

### Before Migration
- [ ] Inventory existing components
- [ ] Identify shared state/services
- [ ] Document component dependencies
- [ ] Plan migration phases

### During Migration
- [ ] Start with leaf components (no children)
- [ ] Convert state management patterns
- [ ] Update event handling
- [ ] Migrate routing if applicable
- [ ] Update build configuration

### After Migration
- [ ] Test all components
- [ ] Update documentation
- [ ] Train team on Snice patterns
- [ ] Remove old framework dependencies

## Common Patterns Comparison

### Conditional Rendering

**React:** `{isVisible && <Component />}`
**Vue:** `<component v-if="isVisible" />`
**Angular:** `<component *ngIf="isVisible"></component>`
**Snice:** Include in initial HTML or manipulate DOM imperatively

### List Rendering

**React:** `{items.map(item => <Item key={item.id} />)}`
**Vue:** `<item v-for="item in items" :key="item.id" />`
**Angular:** `<item *ngFor="let item of items"></item>`
**Snice:** `${items.map(item => \`<item-element>\`).join('')}`

### Two-Way Binding

**React:** Controlled components with onChange
**Vue:** `v-model`
**Angular:** `[(ngModel)]`
**Snice:** Explicit event handlers and DOM updates

## Performance Considerations

1. **No Virtual DOM**: Snice updates DOM directly, which can be more efficient for targeted updates
2. **No Reactive Overhead**: No proxy objects or dependency tracking
3. **Shadow DOM**: Built-in style encapsulation without runtime overhead
4. **Native Web Components**: Works with browser's component model

## Using @watch for Reactive Updates

Snice provides the `@watch` decorator to automatically call methods when properties change, bridging the gap between reactive frameworks and imperative updates:

### Watching Single Properties

```typescript
import { element, property, query, watch } from 'snice';

@element('user-status')
class UserStatus extends HTMLElement {
  @property()
  status: 'online' | 'offline' | 'away' = 'offline';
  
  @query('.status-indicator')
  indicator?: HTMLElement;
  
  html() {
    return `
      <div class="status-indicator">●</div>
      <span>${this.status}</span>
    `;
  }
  
  @watch('status')
  updateStatusIndicator() {
    if (!this.indicator) return;
    
    const colors = {
      online: 'green',
      offline: 'gray',
      away: 'yellow'
    };
    
    this.indicator.style.color = colors[this.status];
  }
}
```

### Watching Multiple Properties

```typescript
@element('price-calculator')
class PriceCalculator extends HTMLElement {
  @property({ type: Number })
  price = 0;
  
  @property({ type: Number })
  quantity = 1;
  
  @property({ type: Number })
  discount = 0;
  
  @query('.total')
  totalDisplay?: HTMLElement;
  
  html() {
    return `
      <div>
        <div>Price: $${this.price}</div>
        <div>Quantity: ${this.quantity}</div>
        <div>Discount: ${this.discount}%</div>
        <div class="total">Total: $0</div>
      </div>
    `;
  }
  
  @watch('price')
  @watch('quantity')
  @watch('discount')
  calculateTotal() {
    const subtotal = this.price * this.quantity;
    const discountAmount = subtotal * (this.discount / 100);
    const total = subtotal - discountAmount;
    
    if (this.totalDisplay) {
      this.totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
    }
  }
}
```

### Async Operations with @watch

```typescript
@element('data-fetcher')
class DataFetcher extends HTMLElement {
  @property()
  searchTerm = '';
  
  @query('.results')
  resultsDiv?: HTMLElement;
  
  html() {
    return `
      <input type="text" placeholder="Search...">
      <div class="results"></div>
    `;
  }
  
  @on('input', 'input')
  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value;
  }
  
  @watch('searchTerm')
  async performSearch() {
    if (!this.searchTerm) {
      if (this.resultsDiv) {
        this.resultsDiv.innerHTML = '';
      }
      return;
    }
    
    // Show loading state
    if (this.resultsDiv) {
      this.resultsDiv.innerHTML = 'Searching...';
    }
    
    // Perform search
    const response = await fetch(`/api/search?q=${this.searchTerm}`);
    const results = await response.json();
    
    // Display results
    if (this.resultsDiv) {
      this.resultsDiv.innerHTML = results
        .map((r: any) => `<div>${r.title}</div>`)
        .join('');
    }
  }
}
```

## Best Practices for Migration

1. **Start Small**: Migrate one component at a time
2. **Maintain Compatibility**: Web Components work alongside other frameworks
3. **Gradual Migration**: Run old and new systems in parallel
4. **Test Thoroughly**: Ensure functionality is preserved
5. **Document Differences**: Help team understand the imperative approach
6. **Use @watch**: Leverage the @watch decorator for reactive-like updates without the overhead