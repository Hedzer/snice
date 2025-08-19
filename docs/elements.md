# Elements API Documentation

Elements are the core building blocks of Snice components. They define custom HTML elements with encapsulated styling and behavior.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Lifecycle Methods](#lifecycle-methods)
- [Shadow DOM](#shadow-dom)
- [Properties](#properties)
- [Queries](#queries)
- [Styling](#styling)
- [Advanced Examples](#advanced-examples)

## Basic Usage

### Creating an Element

```typescript
import { element } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  html() {
    return `<button>Click me</button>`;
  }
}
```

### Element Decorator Options

The `@element` decorator accepts a single parameter:
- `tagName: string` - The custom element tag name (must contain a hyphen)

## Lifecycle Methods

### html() Method

Returns the HTML template for the element. Called once when the element connects to the DOM.

```typescript
@element('user-card')
class UserCard extends HTMLElement {
  html() {
    return `
      <div class="card">
        <h3>User Name</h3>
        <p>User details...</p>
      </div>
    `;
  }
}
```

**Async Support:**
```typescript
@element('async-content')
class AsyncContent extends HTMLElement {
  async html() {
    const data = await this.fetchData();
    return `<div>${data}</div>`;
  }
  
  async fetchData() {
    // Simulated async operation
    return 'Loaded content';
  }
}
```

### css() Method

Returns CSS styles scoped to the element's shadow DOM.

```typescript
@element('styled-card')
class StyledCard extends HTMLElement {
  html() {
    return `<div class="card">Content</div>`;
  }
  
  css() {
    return `
      .card {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
    `;
  }
}
```

**Array of Styles:**
```typescript
css() {
  return [
    this.baseStyles(),
    this.themeStyles(),
    this.responsiveStyles()
  ];
}
```

### connectedCallback()

Called when the element is added to the DOM. The @element decorator automatically handles shadow DOM setup, HTML/CSS rendering, and event handler initialization.

### disconnectedCallback()

Called when the element is removed from the DOM. The @element decorator automatically handles cleanup of event handlers and controllers.

### ready Promise

Every element has a `ready` promise that resolves when the element is fully initialized (shadow DOM created, HTML/CSS rendered, event handlers attached). Use this to ensure the element is ready before accessing its DOM or calling methods.

## Shadow DOM

All elements automatically use Shadow DOM for style encapsulation.

### Accessing Shadow Root

```typescript
@element('shadow-demo')
class ShadowDemo extends HTMLElement {
  html() {
    return `<div id="content">Hello</div>`;
  }
  
  updateContent(text: string) {
    const content = this.shadowRoot?.getElementById('content');
    if (content) {
      content.textContent = text;
    }
  }
}
```

## Properties

### Basic Properties

Properties can be configured to reflect to attributes and trigger updates.

```typescript
import { element, property } from 'snice';

@element('user-profile')
class UserProfile extends HTMLElement {
  @property()
  name = 'Anonymous';
  
  @property({ type: Number })
  age = 0;
  
  @property({ type: Boolean })
  verified = false;
  
  html() {
    return `
      <div>
        <h3>${this.name}</h3>
        <p>Age: ${this.age}</p>
        ${this.verified ? '<span>✓ Verified</span>' : ''}
      </div>
    `;
  }
}
```

### Property Options

```typescript
interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor;
  reflect?: boolean;        // Reflect to HTML attribute
  attribute?: string;        // Custom attribute name
  converter?: PropertyConverter;  // Custom converter
  hasChanged?: (value: any, oldValue: any) => boolean;
}
```

### Reflected Properties

Properties that sync with HTML attributes:

```typescript
@element('reflected-props')
class ReflectedProps extends HTMLElement {
  @property({ reflect: true })
  theme = 'light';
  
  @property({ reflect: true, attribute: 'user-id' })
  userId = '';
  
  html() {
    return `<div class="${this.theme}">User: ${this.userId}</div>`;
  }
}
```

Usage:
```html
<reflected-props theme="dark" user-id="123"></reflected-props>
```

### Custom Converters

```typescript
const dateConverter: PropertyConverter = {
  fromAttribute(value: string | null): Date | null {
    return value ? new Date(value) : null;
  },
  toAttribute(value: Date | null): string | null {
    return value ? value.toISOString() : null;
  }
};

@element('date-display')
class DateDisplay extends HTMLElement {
  @property({ converter: dateConverter, reflect: true })
  date: Date | null = null;
  
  html() {
    return `<time>${this.date?.toLocaleDateString() || 'No date'}</time>`;
  }
}
```

## Queries

### Single Element Query

```typescript
import { element, query } from 'snice';

@element('form-component')
class FormComponent extends HTMLElement {
  @query('input[type="text"]')
  textInput?: HTMLInputElement;
  
  @query('button[type="submit"]')
  submitButton?: HTMLButtonElement;
  
  @query('.error-message')
  errorDiv?: HTMLDivElement;
  
  html() {
    return `
      <form>
        <input type="text" placeholder="Enter text">
        <button type="submit">Submit</button>
        <div class="error-message"></div>
      </form>
    `;
  }
  
  getValue(): string {
    return this.textInput?.value || '';
  }
  
  showError(message: string) {
    if (this.errorDiv) {
      this.errorDiv.textContent = message;
      this.errorDiv.style.display = 'block';
    }
  }
}
```

### Multiple Elements Query

```typescript
import { element, queryAll } from 'snice';

@element('todo-list')
class TodoList extends HTMLElement {
  @queryAll('.todo-item')
  todoItems?: NodeListOf<HTMLElement>;
  
  @queryAll('input[type="checkbox"]')
  checkboxes?: NodeListOf<HTMLInputElement>;
  
  html() {
    return `
      <ul>
        <li class="todo-item">
          <input type="checkbox"> Task 1
        </li>
        <li class="todo-item">
          <input type="checkbox"> Task 2
        </li>
        <li class="todo-item">
          <input type="checkbox"> Task 3
        </li>
      </ul>
    `;
  }
  
  getCompletedCount(): number {
    if (!this.checkboxes) return 0;
    return Array.from(this.checkboxes).filter(cb => cb.checked).length;
  }
  
  highlightCompleted() {
    this.todoItems?.forEach((item, index) => {
      if (this.checkboxes?.[index]?.checked) {
        item.classList.add('completed');
      }
    });
  }
}
```

### Query Options

By default, `@query` and `@queryAll` search within the shadow DOM. You can control where queries search using the `light` and `shadow` options:

```typescript
import { element, query, queryAll } from 'snice';

@element('query-options')
class QueryOptions extends HTMLElement {
  // Query only in shadow DOM (default)
  @query('.shadow-only')
  shadowElement?: HTMLElement;
  
  // Query only in light DOM (slotted content)
  @query('.light-only', { light: true, shadow: false })
  lightElement?: HTMLElement;
  
  // Query in both light and shadow DOM
  @query('.anywhere', { light: true, shadow: true })
  anyElement?: HTMLElement;
  
  // Query all in light DOM only
  @queryAll('[slot="item"]', { light: true, shadow: false })
  slottedItems?: NodeListOf<HTMLElement>;
  
  // Query all in both contexts
  @queryAll('.item', { light: true, shadow: true })
  allItems?: NodeListOf<HTMLElement>;
  
  html() {
    return `
      <div class="shadow-only">Shadow Content</div>
      <slot name="item"></slot>
    `;
  }
}
```

Options:
- `light`: Boolean (default: `false`) - Search in light DOM (element's children)
- `shadow`: Boolean (default: `true`) - Search in shadow DOM

When both are `true`, `@query` returns the first match (shadow DOM is checked first), while `@queryAll` returns all matches from both contexts.

## Styling

### Scoped Styles

Styles are automatically scoped to the component's shadow DOM:

```typescript
@element('scoped-styles')
class ScopedStyles extends HTMLElement {
  html() {
    return `
      <div class="container">
        <h1>Title</h1>
        <p class="content">Content</p>
      </div>
    `;
  }
  
  css() {
    return `
      :host {
        display: block;
        padding: 20px;
      }
      
      .container {
        border: 1px solid #ccc;
      }
      
      h1 {
        color: blue;  /* Only affects h1 inside this component */
      }
    `;
  }
}
```

### Dynamic Styles

```typescript
@element('theme-component')
class ThemeComponent extends HTMLElement {
  @property()
  primaryColor = '#007bff';
  
  @property()
  fontSize = 16;
  
  html() {
    return `<div class="themed">Themed content</div>`;
  }
  
  css() {
    return `
      .themed {
        color: ${this.primaryColor};
        font-size: ${this.fontSize}px;
      }
    `;
  }
}
```

### Host Styling

Style the host element itself:

```typescript
@element('host-styled')
class HostStyled extends HTMLElement {
  css() {
    return `
      :host {
        display: block;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }
      
      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }
      
      :host(:hover) {
        background: #f0f0f0;
      }
      
      :host-context(.dark-theme) {
        background: #333;
        color: white;
      }
    `;
  }
}
```

## Advanced Examples

### Complex Form Component

```typescript
import { element, property, query, queryAll, on, watch } from 'snice';

@element('registration-form')
class RegistrationForm extends HTMLElement {
  @property({ type: Boolean })
  loading = false;
  
  @query('form')
  form?: HTMLFormElement;
  
  @query('#username')
  usernameInput?: HTMLInputElement;
  
  @query('#email')
  emailInput?: HTMLInputElement;
  
  @query('#password')
  passwordInput?: HTMLInputElement;
  
  @query('.error-container')
  errorContainer?: HTMLElement;
  
  @queryAll('.field-error')
  fieldErrors?: NodeListOf<HTMLElement>;
  
  @query('button[type="submit"]')
  submitButton?: HTMLButtonElement;
  
  html() {
    return `
      <form>
        <h2>Register</h2>
        
        <div class="field">
          <label for="username">Username</label>
          <input type="text" id="username" required>
          <span class="field-error" data-field="username"></span>
        </div>
        
        <div class="field">
          <label for="email">Email</label>
          <input type="email" id="email" required>
          <span class="field-error" data-field="email"></span>
        </div>
        
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" required minlength="8">
          <span class="field-error" data-field="password"></span>
        </div>
        
        <div class="error-container"></div>
        
        <button type="submit" ${this.loading ? 'disabled' : ''}>
          ${this.loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    `;
  }
  
  css() {
    return `
      :host {
        display: block;
        max-width: 400px;
        margin: 0 auto;
      }
      
      form {
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .field {
        margin-bottom: 20px;
      }
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      input:invalid {
        border-color: #dc3545;
      }
      
      .field-error {
        display: block;
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
        min-height: 16px;
      }
      
      .error-container {
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 20px;
        display: none;
      }
      
      .error-container:not(:empty) {
        display: block;
      }
      
      button {
        width: 100%;
        padding: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
      }
      
      button:hover:not(:disabled) {
        background: #0056b3;
      }
      
      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
  }
  
  @on('submit', 'form')
  async handleSubmit(event: Event) {
    event.preventDefault();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.loading = true;  // @watch will handle UI update
    this.clearErrors();
    
    try {
      const formData = {
        username: this.usernameInput?.value,
        email: this.emailInput?.value,
        password: this.passwordInput?.value
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dispatch success event
      this.dispatchEvent(new CustomEvent('registration-success', {
        detail: formData,
        bubbles: true
      }));
      
      this.form?.reset();
    } catch (error) {
      this.showError('Registration failed. Please try again.');
    } finally {
      this.loading = false;  // @watch will handle UI update
    }
  }
  
  validateForm(): boolean {
    let isValid = true;
    
    // Clear previous errors
    this.fieldErrors?.forEach(error => error.textContent = '');
    
    // Validate username
    if (!this.usernameInput?.value) {
      this.showFieldError('username', 'Username is required');
      isValid = false;
    } else if (this.usernameInput.value.length < 3) {
      this.showFieldError('username', 'Username must be at least 3 characters');
      isValid = false;
    }
    
    // Validate email
    if (!this.emailInput?.value) {
      this.showFieldError('email', 'Email is required');
      isValid = false;
    } else if (!this.emailInput.validity.valid) {
      this.showFieldError('email', 'Please enter a valid email');
      isValid = false;
    }
    
    // Validate password
    if (!this.passwordInput?.value) {
      this.showFieldError('password', 'Password is required');
      isValid = false;
    } else if (this.passwordInput.value.length < 8) {
      this.showFieldError('password', 'Password must be at least 8 characters');
      isValid = false;
    }
    
    return isValid;
  }
  
  showFieldError(field: string, message: string) {
    const errorElement = this.shadowRoot?.querySelector(`.field-error[data-field="${field}"]`) as HTMLElement;
    if (errorElement) {
      errorElement.textContent = message;
    }
  }
  
  showError(message: string) {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
    }
  }
  
  clearErrors() {
    if (this.errorContainer) {
      this.errorContainer.textContent = '';
    }
    this.fieldErrors?.forEach(error => error.textContent = '');
  }
  
  @watch('loading')
  updateLoadingState() {
    if (this.submitButton) {
      this.submitButton.disabled = this.loading;
      this.submitButton.textContent = this.loading ? 'Registering...' : 'Register';
    }
  }
}
```

### Data Table Component

```typescript
import { element, property, query, queryAll } from 'snice';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface TableRow {
  [key: string]: any;
}

@element('data-table')
class DataTable extends HTMLElement {
  @property({ type: Array })
  columns: TableColumn[] = [];
  
  @property({ type: Array })
  rows: TableRow[] = [];
  
  @property()
  sortColumn = '';
  
  @property()
  sortDirection: 'asc' | 'desc' = 'asc';
  
  @query('tbody')
  tbody?: HTMLElement;
  
  @queryAll('th[data-sortable]')
  sortableHeaders?: NodeListOf<HTMLElement>;
  
  html() {
    return `
      <table>
        <thead>
          <tr>
            ${this.columns.map(col => `
              <th 
                ${col.sortable ? 'data-sortable' : ''}
                data-key="${col.key}"
                style="${col.width ? `width: ${col.width}` : ''}"
              >
                ${col.label}
                ${col.sortable ? '<span class="sort-indicator"></span>' : ''}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${this.renderRows()}
        </tbody>
      </table>
    `;
  }
  
  css() {
    return `
      :host {
        display: block;
        overflow-x: auto;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      th {
        background: #f5f5f5;
        font-weight: bold;
        position: relative;
        user-select: none;
      }
      
      th[data-sortable] {
        cursor: pointer;
      }
      
      th[data-sortable]:hover {
        background: #e9e9e9;
      }
      
      .sort-indicator {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 4px 8px 4px;
        border-color: transparent transparent #999 transparent;
        opacity: 0.3;
      }
      
      th.sort-asc .sort-indicator {
        opacity: 1;
        border-color: transparent transparent #333 transparent;
      }
      
      th.sort-desc .sort-indicator {
        opacity: 1;
        transform: translateY(-50%) rotate(180deg);
        border-color: transparent transparent #333 transparent;
      }
      
      tbody tr:hover {
        background: #f9f9f9;
      }
      
      tbody tr:nth-child(even) {
        background: #fafafa;
      }
    `;
  }
  
  renderRows(): string {
    const sortedRows = this.getSortedRows();
    return sortedRows.map(row => `
      <tr>
        ${this.columns.map(col => `
          <td>${this.formatCell(row[col.key])}</td>
        `).join('')}
      </tr>
    `).join('');
  }
  
  formatCell(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  }
  
  getSortedRows(): TableRow[] {
    if (!this.sortColumn) {
      return this.rows;
    }
    
    return [...this.rows].sort((a, b) => {
      const aVal = a[this.sortColumn];
      const bVal = b[this.sortColumn];
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  connectedCallback() {
    super.connectedCallback?.();
    this.setupSortHandlers();
  }
  
  setupSortHandlers() {
    this.sortableHeaders?.forEach(header => {
      header.addEventListener('click', () => {
        const key = header.dataset.key!;
        
        if (this.sortColumn === key) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = key;
          this.sortDirection = 'asc';
        }
        
        this.updateSort();
      });
    });
  }
  
  updateSort() {
    // Update header classes
    this.sortableHeaders?.forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc');
      if (header.dataset.key === this.sortColumn) {
        header.classList.add(`sort-${this.sortDirection}`);
      }
    });
    
    // Update table body
    if (this.tbody) {
      this.tbody.innerHTML = this.renderRows();
    }
  }
  
  setData(columns: TableColumn[], rows: TableRow[]) {
    this.columns = columns;
    this.rows = rows;
    this.shadowRoot!.innerHTML = this.html() + `<style>${this.css()}</style>`;
    this.setupSortHandlers();
  }
}
```

## Lifecycle Decorators

### @ready and @dispose

Use `@ready` for initialization logic that needs to run after the shadow DOM is ready. Use `@dispose` for cleanup tasks when the element is removed from the DOM.

```typescript
import { element, ready, dispose } from 'snice';

@element('polling-element')
class PollingElement extends HTMLElement {
  private intervalId?: number;
  
  @ready()
  startPolling() {
    // Called after shadow DOM is ready
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 5000);
  }
  
  @dispose()
  stopPolling() {
    // Clean up when element is removed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
  
  html() {
    return `<div class="data">Loading...</div>`;
  }
  
  private updateData() {
    // Update logic
  }
}
```

Multiple methods can be decorated and they'll run in order:

```typescript
@element('multi-lifecycle')
class MultiLifecycle extends HTMLElement {
  @ready()
  async setupData() {
    // First ready method
  }
  
  @ready()
  setupListeners() {
    // Second ready method
  }
  
  @dispose()
  cleanup() {
    // Cleanup method
  }
}
```

## Parts - Selective Re-rendering

The `@part` decorator enables selective re-rendering of specific template sections, providing fine-grained control over DOM updates for performance optimization.

### Basic Usage

```typescript
import { element, part, property } from 'snice';

@element('user-dashboard')
class UserDashboard extends HTMLElement {
  @property()
  user = { name: 'Loading...', stats: { views: 0 } };
  
  notifications = [];

  html() {
    return `
      <header part="user-info"></header>
      <section part="stats"></section>
      <aside part="notifications"></aside>
    `;
  }

  @part('user-info')
  renderUserInfo() {
    return `
      <h1>${this.user.name}</h1>
      <button onclick="this.refreshUser()">Refresh</button>
    `;
  }

  @part('stats')
  renderStats() {
    return `
      <div class="stats">
        Views: ${this.user.stats.views}
      </div>
    `;
  }

  @part('notifications')
  renderNotifications() {
    return `
      <h3>Notifications (${this.notifications.length})</h3>
      ${this.notifications.map(n => `<div>${n}</div>`).join('')}
    `;
  }

  // Update specific parts independently
  updateUserName(newName: string) {
    this.user.name = newName;
    this.renderUserInfo(); // Only re-renders the header part
  }

  addNotification(notification: string) {
    this.notifications.unshift(notification);
    this.renderNotifications(); // Only re-renders the notifications part
  }
}
```

### Part Options - Performance Control

Control render frequency with throttle and debounce options:

```typescript
@element('performance-optimized')
class PerformanceOptimized extends HTMLElement {
  searchResults = [];
  liveStats = { count: 0 };

  html() {
    return `
      <div part="search-results"></div>
      <div part="live-stats"></div>
    `;
  }

  // Debounce: Wait 200ms after search stops before rendering
  @part('search-results', { debounce: 200 })
  renderSearchResults() {
    return this.searchResults.map(result => 
      `<div class="result">${result.title}</div>`
    ).join('');
  }

  // Throttle: Update stats at most once per 100ms
  @part('live-stats', { throttle: 100 })
  renderLiveStats() {
    return `<span>Live count: ${this.liveStats.count}</span>`;
  }

  // Methods automatically trigger part re-renders when called
  onSearchInput(query: string) {
    this.searchResults = this.performSearch(query);
    this.renderSearchResults(); // Debounced - waits for input to stop
  }

  onLiveUpdate(newCount: number) {
    this.liveStats.count = newCount;
    this.renderLiveStats(); // Throttled - max once per 100ms
  }
}
```

### Part Options Reference

```typescript
interface PartOptions {
  throttle?: number;  // Limit renders to once per N milliseconds
  debounce?: number;  // Delay renders until N milliseconds after last call
}
```

- **Throttle**: Limits render frequency. If you call the method multiple times rapidly, it will only render at most once per throttle period.
- **Debounce**: Delays rendering until calls stop. Each new call resets the timer.
- **Precedence**: If both are specified, debounce takes precedence over throttle.
- **Validation**: Non-positive values are ignored (render immediately).

### Async Parts

Part methods can be async for data fetching:

```typescript
@element('async-parts')
class AsyncParts extends HTMLElement {
  userId = '';

  html() {
    return `
      <div part="user-profile"></div>
      <div part="user-posts"></div>
    `;
  }

  @part('user-profile')
  async renderUserProfile() {
    if (!this.userId) return '<p>No user selected</p>';
    
    const user = await fetch(`/api/users/${this.userId}`).then(r => r.json());
    return `
      <div class="profile">
        <img src="${user.avatar}" alt="${user.name}">
        <h2>${user.name}</h2>
        <p>${user.bio}</p>
      </div>
    `;
  }

  @part('user-posts', { debounce: 300 })
  async renderUserPosts() {
    if (!this.userId) return '<p>No posts</p>';
    
    const posts = await fetch(`/api/users/${this.userId}/posts`).then(r => r.json());
    return posts.map(post => `
      <article>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
      </article>
    `).join('');
  }

  // Calling these methods triggers async rendering
  async loadUser(userId: string) {
    this.userId = userId;
    await this.renderUserProfile();
    await this.renderUserPosts();
  }
}
```

### How Parts Work

1. **Initial Render**: All parts are automatically rendered during element connection
2. **Part Elements**: DOM elements with `part="partName"` attributes are targeted for updates
3. **Method Wrapping**: `@part` decorated methods are wrapped to automatically update their corresponding DOM elements when called
4. **Performance**: Only the specific part's DOM is updated, not the entire component
5. **Error Handling**: Parts handle missing elements gracefully with console warnings

### Semi-Reactive Rendering with @watch

Combine `@part` with `@watch` for semi-reactive rendering where parts automatically update when their dependent properties change:

```typescript
import { element, part, property, watch } from 'snice';

@element('reactive-dashboard')
class ReactiveDashboard extends HTMLElement {
  @property()
  userName = 'Anonymous';
  
  @property({ type: Number })
  score = 0;
  
  @property()
  theme = 'light';
  
  notifications = [];

  html() {
    return `
      <header part="user-section"></header>
      <main part="score-display"></main>
      <aside part="notifications"></aside>
      <div part="theme-indicator"></div>
    `;
  }

  // Define parts that render specific data
  @part('user-section')
  renderUserSection() {
    return `
      <h1>Welcome, ${this.userName}!</h1>
      <button onclick="this.refreshProfile()">Refresh</button>
    `;
  }

  @part('score-display', { throttle: 100 })
  renderScoreDisplay() {
    return `
      <div class="score">
        <span class="label">Score:</span>
        <span class="value">${this.score}</span>
        <div class="progress-bar" style="width: ${Math.min(this.score, 100)}%"></div>
      </div>
    `;
  }

  @part('notifications', { debounce: 200 })
  renderNotifications() {
    return `
      <h3>Notifications (${this.notifications.length})</h3>
      ${this.notifications.slice(0, 5).map(n => `<div class="notification">${n}</div>`).join('')}
    `;
  }

  @part('theme-indicator')
  renderThemeIndicator() {
    return `<div class="theme-badge ${this.theme}">${this.theme.toUpperCase()}</div>`;
  }

  // Watch properties and automatically re-render corresponding parts
  @watch('userName')
  onUserNameChange() {
    this.renderUserSection(); // Automatically updates header when name changes
  }

  @watch('score')
  onScoreChange() {
    this.renderScoreDisplay(); // Throttled updates for frequent score changes
  }

  @watch('theme')
  onThemeChange() {
    this.renderThemeIndicator(); // Immediate theme updates
  }

  // Business logic methods that modify data
  updateUserName(newName: string) {
    this.userName = newName; // Triggers @watch -> renderUserSection()
  }

  incrementScore(points: number) {
    this.score += points; // Triggers @watch -> renderScoreDisplay() (throttled)
  }

  addNotification(message: string) {
    this.notifications.unshift(message);
    this.renderNotifications(); // Manual call (not property-based)
  }

  switchTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'; // Triggers @watch -> renderThemeIndicator()
  }
}
```

**Benefits of @part + @watch:**

- **Semi-Reactive**: Components automatically update when properties change
- **Selective**: Only affected parts re-render, not the entire component
- **Performance**: Combine with throttle/debounce for optimal rendering
- **Explicit**: You control which properties trigger which parts
- **Granular**: Different parts can have different performance characteristics

**Usage Patterns:**

```typescript
// 1. One-to-one: Property directly controls a part
@property({ attribute: 'user-name', reflect: true }) 
userName = '';

@part('user-display') 
renderUserDisplay() { return `<h1>${this.userName}</h1>`; }

@watch('userName') 
onUserNameChange() { this.renderUserDisplay(); }

// Usage: <my-element user-name="John"></my-element>

// 2. One-to-many: Property affects multiple parts
@property()
theme = 'light';

@watch('theme') 
onThemeChange() {
  this.renderHeader();  // Update header styling
  this.renderContent(); // Update content styling
  this.renderFooter();  // Update footer styling
}

// 3. Many-to-one: Multiple properties affect one part
@property({ attribute: 'first-name', reflect: true }) 
firstName = '';

@property({ attribute: 'last-name', reflect: true }) 
lastName = '';

@part('full-name') 
renderFullName() { return `${this.firstName} ${this.lastName}`; }

@watch('firstName', 'lastName') 
onNameChange() { this.renderFullName(); }

// Usage: <my-element first-name="John" last-name="Doe"></my-element>

// 4. Conditional rendering based on multiple properties
@property({ attribute: 'is-logged-in', type: Boolean, reflect: true }) 
isLoggedIn = false;

@property() 
user = null;

@part('user-area') 
renderUserArea() {
  return this.isLoggedIn && this.user 
    ? `<div>Welcome ${this.user.name}</div>`
    : `<div>Please log in</div>`;
}

@watch('isLoggedIn', 'user') 
onUserStateChange() { this.renderUserArea(); }

// Usage: <my-element is-logged-in></my-element>
```

### When to Use Parts

Parts are ideal for:

- **Complex components** with multiple independent sections
- **High-frequency updates** to specific areas (live data, animations)
- **Performance optimization** where full re-renders are expensive
- **Dynamic content** that changes at different rates
- **Dashboard-style** components with multiple data sources

### Best Practices

1. **Keep parts focused**: Each part should represent a logical, independent section
2. **Use meaningful names**: Part names should clearly describe what they render
3. **Consider performance**: Use throttle/debounce for high-frequency updates
4. **Handle errors**: Parts should gracefully handle missing or invalid data
5. **Avoid deep nesting**: Keep part templates relatively flat for better performance
6. **Test updates**: Verify that calling part methods actually updates the UI

```typescript
// Good: Focused, independent parts
@part('user-avatar')
renderAvatar() { /* ... */ }

@part('notification-count', { throttle: 500 })
renderNotificationCount() { /* ... */ }

// Avoid: Parts that depend heavily on each other
@part('everything')
renderEverything() { /* renders entire complex UI */ }
```

## Best Practices

1. **Keep elements focused**: Elements should handle presentation logic only
2. **Use Shadow DOM**: Take advantage of style encapsulation
3. **Avoid re-rendering**: Update specific elements rather than re-rendering the entire component
4. **Clean up resources**: Use @dispose for cleanup tasks
5. **Type your queries**: Use proper TypeScript types for queried elements
6. **Validate inputs**: Always validate and sanitize user inputs
7. **Use semantic HTML**: Maintain accessibility with proper HTML structure
8. **Handle errors gracefully**: Wrap async operations in try-catch blocks
9. **Use lifecycle decorators**: Prefer @ready and @dispose over overriding lifecycle methods