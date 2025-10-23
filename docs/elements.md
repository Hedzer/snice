# Elements API Documentation

Elements are the core building blocks of Snice components. They define custom HTML elements with encapsulated styling and behavior using web components.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Lifecycle Methods](#lifecycle-methods)
- [Shadow DOM](#shadow-dom)
- [Properties](#properties)
- [Queries](#queries)
- [Styling](#styling)
- [Template Events](#template-events)
- [Advanced Examples](#advanced-examples)

## Basic Usage

### Creating an Element

```typescript
import { element, render, html } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() {
    return html`<button>Click me</button>`;
  }
}
```

### Element Decorator Options

The `@element` decorator accepts a single parameter:
- `tagName: string` - The custom element tag name (must contain a hyphen)

## Lifecycle Methods

### @render() Decorator

Returns a template using the `html` tagged template. Automatically re-renders when properties change due to differential rendering.

```typescript
import { element, render, html, property } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property()
  name = 'Anonymous';

  @render()
  renderContent() {
    return html`
      <div class="card">
        <h3>${this.name}</h3>
        <p>User details...</p>
      </div>
    `;
  }
}
```

**Auto-Rendering:**
- Template automatically re-renders when `@property()` decorated properties change
- Only changed parts of the DOM update (differential rendering)
- No manual re-render calls needed

**Render Options:**

The `@render()` decorator accepts an optional configuration object:

```typescript
@render({
  debounce?: number,    // Delay re-render (ms)
  throttle?: number,    // Limit re-render frequency (ms)
  once?: boolean,       // Render once, disable auto-rendering
  sync?: boolean,       // Synchronous rendering (skip batching)
  differential?: boolean // Disable differential rendering (default: true)
})
```

**Differential Rendering:**

By default, Snice uses differential rendering which only updates changed parts of the DOM. To disable this and re-render from scratch each time:

```typescript
@element('simple-list')
class SimpleList extends HTMLElement {
  @property({ type: Array })
  items = [];

  @render({ differential: false })
  renderContent() {
    // Must return a string when differential: false
    return `
      <ul>
        ${this.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }
}
```

**When to use `differential: false`:**
- Component has complex dynamic structure that changes between renders
- Template structure changes based on data (e.g., empty state vs. populated)
- Avoiding differential rendering issues with dynamic attributes
- Simple components where full re-render is acceptable

**Note:** When `differential: false`, the render method must return a string (not `html\`...\``) and still honors `<if>` and `<switch>/<case>` meta elements.

### @styles() Decorator

Returns CSS using the `css` tagged template, scoped to the element's shadow DOM.

```typescript
import { element, render, styles, html, css } from 'snice';

@element('styled-card')
class StyledCard extends HTMLElement {
  @render()
  renderContent() {
    return html`<div class="card">Content</div>`;
  }

  @styles()
  cardStyles() {
    return css`
      .card {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
      }
    `;
  }
}
```

**Multiple Style Methods:**
```typescript
@styles()
baseStyles() {
  return css`
    :host { display: block; }
    // ...
  `;
}

@styles()
themeStyles() {
  return css`
    .card { background: var(--bg-color); }
    // ...
  `;
}
```

### Lifecycle Decorators

**@ready()** - Called after shadow DOM is ready and initial render completes:

```typescript
import { element, ready, render, html } from 'snice';

@element('data-loader')
class DataLoader extends HTMLElement {
  @ready()
  async loadData() {
    // Called after element is fully initialized
    const data = await fetch('/api/data').then(r => r.json());
    this.data = data;
  }

  @render()
  renderContent() {
    return html`<div>Loading...</div>`;
  }
}
```

**@dispose()** - Called when element is removed from DOM:

```typescript
@element('polling-element')
class PollingElement extends HTMLElement {
  private intervalId?: number;

  @ready()
  startPolling() {
    this.intervalId = setInterval(() => {
      this.updateData();
    }, 5000);
  }

  @dispose()
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  @render()
  renderContent() {
    return html`<div>Polling...</div>`;
  }
}
```

### ready Promise

Every element has a `ready` promise that resolves when fully initialized:

```typescript
const el = document.createElement('my-element') as MyElement;
document.body.appendChild(el);
await (el as any).ready; // Wait for element to be ready
```

## Shadow DOM

All elements automatically use Shadow DOM for style encapsulation.

### Accessing Shadow Root

```typescript
@element('shadow-demo')
class ShadowDemo extends HTMLElement {
  @render()
  renderContent() {
    return html`<div id="content">Hello</div>`;
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

Properties automatically sync with DOM attributes and trigger re-renders:

```typescript
import { element, property, render, html } from 'snice';

@element('user-profile')
class UserProfile extends HTMLElement {
  @property()
  name = 'Anonymous';

  @property({ type: Number })
  age = 0;

  @property({ type: Boolean })
  verified = false;

  @render()
  renderContent() {
    return html`
      <div>
        <h3>${this.name}</h3>
        <p>Age: ${this.age}</p>
        ${this.verified ? html`<span>✓ Verified</span>` : ''}
      </div>
    `;
  }
}
```

Usage:
```html
<user-profile name="John Doe" age="30" verified></user-profile>
```

### Property Options

```typescript
interface PropertyOptions {
  type?: String | Number | Boolean | Array | Object | Date | BigInt | SimpleArray;
  attribute?: string;        // Custom attribute name
  converter?: PropertyConverter;  // Custom converter
  hasChanged?: (value: any, oldValue: any) => boolean;
}
```

### Property Behavior

All properties automatically:
- Read from DOM attributes when present
- Reflect changes to corresponding attributes
- Convert between string attributes and typed properties
- Trigger re-renders when changed

```typescript
@element('reflected-props')
class ReflectedProps extends HTMLElement {
  @property()
  theme = 'light';

  @property({ attribute: 'user-id' })
  userId = '';

  @render()
  renderContent() {
    return html`<div class="${this.theme}">User: ${this.userId}</div>`;
  }
}
```

**Boolean Properties:**

```typescript
@property({ type: Boolean })
enabled = false;
```

- `<element>` or `<element enabled="">` → `true`
- `<element enabled="true">` → `true`
- `<element enabled="false">` → `false`
- No attribute → `false`

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
  @property({ converter: dateConverter })
  date: Date | null = null;

  @render()
  renderContent() {
    return html`<time>${this.date?.toLocaleDateString() || 'No date'}</time>`;
  }
}
```

### SimpleArray Type

The `SimpleArray` type enables safe reflection of arrays containing basic types:

```typescript
import { element, property, SimpleArray, render, html } from 'snice';

@element('tag-list')
class TagList extends HTMLElement {
  @property({ type: SimpleArray })
  tags = ['javascript', 'typescript', 'web'];

  @render()
  renderContent() {
    return html`
      <ul>
        ${this.tags.map(tag => html`<li>${tag}</li>`)}
      </ul>
    `;
  }
}
```

Usage:
```html
<tag-list tags="react，vue，angular"></tag-list>
```

- Uses full-width comma (，) as separator
- Supports string, number, and boolean types
- Type-safe serialization

## Queries

### Single Element Query

```typescript
import { element, query, render, html } from 'snice';

@element('form-component')
class FormComponent extends HTMLElement {
  @query('input[type="text"]')
  textInput?: HTMLInputElement;

  @query('button[type="submit"]')
  submitButton?: HTMLButtonElement;

  @render()
  renderContent() {
    return html`
      <form>
        <input type="text" placeholder="Enter text">
        <button type="submit">Submit</button>
      </form>
    `;
  }

  getValue(): string {
    return this.textInput?.value || '';
  }
}
```

### Multiple Elements Query

```typescript
@element('todo-list')
class TodoList extends HTMLElement {
  @queryAll('.todo-item')
  todoItems?: NodeListOf<HTMLElement>;

  @queryAll('input[type="checkbox"]')
  checkboxes?: NodeListOf<HTMLInputElement>;

  @render()
  renderContent() {
    return html`
      <ul>
        <li class="todo-item"><input type="checkbox"> Task 1</li>
        <li class="todo-item"><input type="checkbox"> Task 2</li>
      </ul>
    `;
  }

  getCompletedCount(): number {
    if (!this.checkboxes) return 0;
    return Array.from(this.checkboxes).filter(cb => cb.checked).length;
  }
}
```

### Query Options

Control where queries search using `light` and `shadow` options:

```typescript
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

  @render()
  renderContent() {
    return html`
      <div class="shadow-only">Shadow Content</div>
      <slot></slot>
    `;
  }
}
```

## Styling

### Scoped Styles

Styles are automatically scoped to the component's shadow DOM:

```typescript
@element('scoped-styles')
class ScopedStyles extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div class="container">
        <h1>Title</h1>
        <p class="content">Content</p>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
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

  @property({ type: Number })
  fontSize = 16;

  @render()
  renderContent() {
    return html`<div class="themed">Themed content</div>`;
  }

  @styles()
  themeStyles() {
    return css`
      .themed {
        color: ${this.primaryColor};
        font-size: ${this.fontSize}px;
      }
    `;
  }
}
```

### Host Styling

```typescript
@element('host-styled')
class HostStyled extends HTMLElement {
  @styles()
  hostStyles() {
    return css`
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
    `;
  }

  @render()
  renderContent() {
    return html`<div>Content</div>`;
  }
}
```

## Template Events

Handle events directly in templates using `@event=${handler}` syntax:

### Basic Event Handling

```typescript
@element('click-counter')
class ClickCounter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <button @click=${this.increment}>Click me</button>
      <span>Count: ${this.count}</span>
    `;
  }

  increment() {
    this.count++;
    // Auto re-renders due to property change
  }
}
```

### Keyboard Shortcuts

Use dot notation for keyboard shortcuts:

```typescript
@element('keyboard-handler')
class KeyboardHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <input @keydown.enter=${this.handleEnter} placeholder="Press Enter">
      <input @keydown.ctrl+s=${this.handleSave} placeholder="Press Ctrl+S">
      <input @keydown.escape=${this.handleCancel} placeholder="Press Escape">
    `;
  }

  handleEnter(e: KeyboardEvent) {
    console.log('Enter pressed');
  }

  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Saving...');
  }

  handleCancel() {
    console.log('Cancelled');
  }
}
```

Keyboard syntax:
- `@keydown.enter` - Plain Enter (no modifiers)
- `@keydown.ctrl+s` - Ctrl+S combination
- `@keydown.~enter` - Enter with any modifiers
- `@keydown.escape`, `@keydown.down`, etc.

### Event Object Access

```typescript
@element('form-handler')
class FormHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleSubmit}>
        <input type="text" name="username" @input=${this.handleInput}>
        <button type="submit">Submit</button>
      </form>
    `;
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    console.log('Form data:', Object.fromEntries(formData));
  }

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Input changed:', input.value);
  }
}
```

## Advanced Examples

### Complex Form Component

```typescript
import { element, property, query, watch, render, styles, html, css } from 'snice';

@element('registration-form')
class RegistrationForm extends HTMLElement {
  @property({ type: Boolean })
  loading = false;

  @query('form')
  form?: HTMLFormElement;

  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleSubmit}>
        <h2>Register</h2>

        <div class="field">
          <label>Username</label>
          <input type="text" name="username" required>
        </div>

        <div class="field">
          <label>Email</label>
          <input type="email" name="email" required>
        </div>

        <button type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    `;
  }

  @styles()
  formStyles() {
    return css`
      :host {
        display: block;
        max-width: 400px;
        margin: 0 auto;
      }

      form {
        padding: 20px;
        background: white;
        border-radius: 8px;
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
      }

      button {
        width: 100%;
        padding: 10px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
  }

  async handleSubmit(event: Event) {
    event.preventDefault();

    this.loading = true;

    try {
      const formData = new FormData(this.form!);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.dispatchEvent(new CustomEvent('registration-success', {
        detail: Object.fromEntries(formData),
        bubbles: true
      }));

      this.form?.reset();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      this.loading = false;
    }
  }
}
```

### Watch Decorator

Use `@watch` to react to property changes:

```typescript
@element('reactive-component')
class ReactiveComponent extends HTMLElement {
  @property()
  userName = '';

  @property({ type: Number })
  score = 0;

  @watch('userName')
  onUserNameChange(oldVal: string, newVal: string) {
    console.log(`Name changed from ${oldVal} to ${newVal}`);
  }

  @watch('score')
  onScoreChange(oldVal: number, newVal: number) {
    if (newVal > 100) {
      console.log('High score achieved!');
    }
  }

  @render()
  renderContent() {
    return html`
      <div>
        <h1>${this.userName}</h1>
        <p>Score: ${this.score}</p>
      </div>
    `;
  }
}
```

### Conditional Rendering

```typescript
@element('conditional-content')
class ConditionalContent extends HTMLElement {
  @property({ type: Boolean })
  isLoggedIn = false;

  @render()
  renderContent() {
    return html`
      <if ${this.isLoggedIn}>
        <div>Welcome back!</div>
        <button @click=${this.logout}>Logout</button>
      </if>

      <if ${!this.isLoggedIn}>
        <a href="/login">Please login</a>
      </if>
    `;
  }

  logout() {
    this.isLoggedIn = false;
  }
}
```

## Best Practices

1. **Use @render() for templates**: Always return `html\`...\`` tagged templates
2. **Use @styles() for CSS**: Always return `css\`...\`` tagged templates
3. **Leverage auto-rendering**: Properties automatically trigger re-renders
4. **Use template events**: Handle events with `@event=${handler}` in templates
5. **Clean up resources**: Use @dispose() for cleanup tasks
6. **Type your queries**: Use proper TypeScript types for queried elements
7. **Handle errors**: Wrap async operations in try-catch blocks

## Removed in v3.0.0

- **@part decorator**: Removed in favor of differential rendering. Use `@render()` with templates instead.
- **html() method**: Replaced with `@render()` decorator
- **css() method**: Replaced with `@styles()` decorator
