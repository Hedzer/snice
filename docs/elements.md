<!-- AI: For the AI-optimized version of this doc, see docs/ai/api.md -->
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
- [Declarative Rendering](./rendering.md)
- [Extending Elements](#extending-elements)
- [Advanced Examples](#advanced-examples) (Watch, Context, Conditionals)

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

For convention-based authoring, extend the optional `SniceElement` base and implement `render()` directly:

```typescript
import { SniceElement, css, element, html, state } from 'snice';

@element('my-counter')
class MyCounter extends SniceElement {
  static styles = css`:host { display: inline-block; }`;
  @state() count = 0;

  render() {
    return html`<button @click=${() => this.count++}>${this.count}</button>`;
  }
}
```

Plain `HTMLElement` subclasses and decorated render/style methods remain fully supported.

### Element Decorator Options

The `@element` decorator accepts:
- `tagName: string` - The custom element tag name (must contain a hyphen)
- `options?: ElementOptions` - Optional configuration
  - `formAssociated?: boolean` - Enable form association (default: false)
  - `renderRoot?: 'shadow' | 'light'` - Select shadow or light DOM rendering
  - `shadow?: 'open' | 'closed' | false` - Shadow mode, or light-DOM shorthand
  - `delegatesFocus?: boolean` - Forwarded to `attachShadow()`

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

**Note:** When `differential: false`, the render method must return a string (not `html\`...\``). Declarative bindings and virtual control flow (`<if>`, `<case>`, and related tags) are not available in the raw-string mode.

### Imperative Rendering

Use `@render({ once: true })` with `@watch` and `@query` to render the template once, then update the DOM directly. Property changes fire watchers instead of triggering re-renders.

```typescript
@element('user-card')
class UserCard extends HTMLElement {
  @property() name = '';
  @property() role = '';

  @query('.name') $name!: HTMLElement;
  @query('.role') $role!: HTMLElement;

  @render({ once: true })
  template() {
    return html`
      <div class="card">
        <h3 class="name">${this.name}</h3>
        <span class="role">${this.role}</span>
      </div>
    `;
  }

  @watch('name', 'role')
  update(oldVal: any, newVal: any, prop: string) {
    if (!this.$name) return;
    this.$name.textContent = this.name;
    this.$role.textContent = this.role;
  }
}
```

**How it works:**

1. `@render({ once: true })` renders the template on first connect, then blocks all subsequent auto-renders. The initial render uses current property values via normal interpolation, so the DOM starts correct.
2. `@query` provides getters that re-query the shadow DOM on each access — no stale references.
3. `@watch` fires **synchronously** in the property setter, before `requestRender` is called. Since `once: true` blocks the render anyway, only the watcher runs.

**Timing on property change:**
1. Property setter runs
2. Value reflected to attribute (if applicable)
3. `@watch` methods fire synchronously
4. `requestRender()` called but immediately returns (blocked by `once`)

**When to use imperative rendering:**

- The template structure never changes — only content within fixed elements updates
- Updates are expensive (e.g., syntax highlighting, canvas operations) and you want precise control over what changes
- You need to coordinate async operations (fetching data, animations) without re-renders interfering
- Performance-critical components where differential rendering overhead matters

**Compared to declarative rendering:**

| | Declarative (`@render()`) | Imperative (`@render({ once: true })`) |
|---|---|---|
| Template re-renders | Automatic on property change | Never (after first render) |
| DOM updates | Differential (only changed parts) | Manual via `@watch` + `@query` |
| Boilerplate | Less — just use interpolation | More — explicit update methods |
| Control | Framework manages updates | You manage updates |

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

**Note:** Only one `@styles()` method is supported per element. If multiple are declared, only the last one is used. Combine all styles in a single method:

```typescript
@styles()
componentStyles() {
  return css`
    :host { display: block; }
    .card { background: var(--bg-color); }
  `;
}
```

### Lifecycle Decorators

**@ready()** - Called after styles are applied and event handlers are set up. The initial render may still be completing in a microtask — use `@query` (which re-queries each access) to safely access rendered DOM:

```typescript
import { element, ready, query, render, html } from 'snice';

@element('auto-resize-textarea')
class AutoResizeTextarea extends HTMLElement {
  @query('textarea') textarea?: HTMLTextAreaElement;

  @ready()
  adjustHeight() {
    if (this.textarea) {
      this.textarea.style.height = `${this.textarea.scrollHeight}px`;
    }
  }

  @render()
  renderContent() {
    return html`<textarea @input=${this.adjustHeight}></textarea>`;
  }
}
```

**@reconnect()** - Called every time the element is connected AFTER the first connect. `@ready` only fires once; `@dispose` fires on every disconnect. The gap between is "what should run on a reconnect?" — for most components nothing extra is needed because framework-managed handlers (`@on`, `@observe`, `@respond`, `@context`) are re-established automatically. Use `@reconnect` only when the component wires its own long-lived global subscription in `@ready` (e.g. `document.addEventListener` for outside-click) and tears it down in `@dispose`:

```typescript
@element('outside-click-listener')
class OutsideClick extends HTMLElement {
  private handler = () => { /* ... */ };

  @ready()
  init() {
    document.addEventListener('click', this.handler);
  }

  @reconnect()
  onReconnect() {
    document.addEventListener('click', this.handler);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('click', this.handler);
  }
}
```

**@dispose()** - Called when element is removed from DOM:

```typescript
@element('animated-element')
class AnimatedElement extends HTMLElement {
  private rafId?: number;

  @ready()
  startAnimation() {
    const animate = () => {
      // Update animation frame
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  @dispose()
  stopAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  @render()
  renderContent() {
    return html`<canvas width="300" height="200"></canvas>`;
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

## Render Roots and Shadow DOM

Elements use an open shadow root by default. Open/closed shadow roots and light DOM share the same differential renderer, lifecycle, event binding, styles, and query decorators.

```typescript
@element('closed-card', { shadow: 'closed' })
class ClosedCard extends HTMLElement { /* ... */ }

@element('light-card', { renderRoot: 'light' })
class LightCard extends HTMLElement { /* ... */ }

@element('focus-card', { delegatesFocus: true })
class FocusCard extends HTMLElement { /* ... */ }
```

`shadow: false` is shorthand for `renderRoot: 'light'`. Framework-managed queries continue to work with a closed root. A `createRenderRoot()` override may return the host element or a `ShadowRoot` for a custom policy.

### Accessing Shadow DOM Elements

Use `@query` instead of manual `shadowRoot.querySelector`:

```typescript
@element('shadow-demo')
class ShadowDemo extends HTMLElement {
  @query('#content') content?: HTMLElement;

  @render()
  renderContent() {
    return html`<div id="content">Hello</div>`;
  }

  updateContent(text: string) {
    if (this.content) {
      this.content.textContent = text;
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
  attribute?: string | boolean;  // Custom attribute name, or false to disable attribute sync
  reflect?: boolean;             // Property → attribute; default true
  deep?: boolean;                // Observe nested object/array/Map/Set writes
  converter?: PropertyConverter;  // Custom converter
  hasChanged?: (value, oldValue) => boolean;
}
```

### Property Behavior

All properties automatically:
- Read from DOM attributes when present
- Reflect property setter changes to corresponding attributes unless `reflect: false`
- Convert between string attributes and typed properties
- Trigger re-renders when changed

Attribute conversion is intentionally one-way at the HTML boundary. A direct JavaScript assignment is already typed and is stored exactly as assigned:

```typescript
const rows = [{ id: 1 }];
element.rows = rows;
element.rows === rows; // true
```

This preserves dates, union values, services, objects, and collection identity. `type` and `converter.fromAttribute` process strings arriving from attributes; `converter.toAttribute` serializes reflection.

Use `reflect: false` for input-only attributes, `attribute: false` for JavaScript-only public properties, and `@state()` for internal reactive fields:

```typescript
@property({ type: Number, reflect: false }) page = 1;
@property({ attribute: false }) service!: UserService;
@state() open = false;
@state({ deep: true }) model = { rows: [] as Row[] };
```

`@state()` never observes or writes an attribute. `deep: true` tracks nested plain objects, arrays, `Map`, and `Set` using native `Proxy` and `Reflect`; class instances and DOM objects remain intact. Deep observation targets modern evergreen browsers and is not available in Internet Explorer.

**Note:** Initial field values (defaults like `name = 'Anonymous'`) are NOT reflected to attributes. Only changes made via the property setter are reflected. Set `attribute: false` to disable attribute sync entirely.

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

`@styles()` is called **once** during initialization and does not update on property changes. For dynamic styling, use CSS custom properties set in the template:

```typescript
@element('theme-component')
class ThemeComponent extends HTMLElement {
  @property()
  accentColor = '#007bff';

  @render()
  renderContent() {
    return html`
      <div class="themed" style="--accent: ${this.accentColor}">
        Themed content
      </div>
    `;
  }

  @styles()
  themeStyles() {
    return css`
      .themed {
        color: var(--accent);
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

### Icons

Many Snice components accept an `icon` property (or `prefix-icon` / `suffix-icon` for inputs). The icon value is auto-detected:

| Value | Rendered As |
|-------|-------------|
| `"search"`, `"check_circle"` | Ligature icon with icon font |
| `"🔍"`, `"$"` | Text/emoji as-is |
| `"https://example.com/icon.svg"` | `<img>` element |
| `"logo.png"`, `"icon.svg"` | `<img>` element |
| `"img://url"` | Explicit `<img>` |
| `"text://content"` | Explicit `<span>` |

#### Changing the Icon Font

By default, ligature icons (lowercase words like `search`, `home`, `check_circle`) use **Material Symbols Outlined**. To use a different icon font like Font Awesome, set the `--snice-icon-font` CSS custom property:

```css
:root {
  --snice-icon-font: 'Font Awesome 6 Free';
}
```

Make sure to load the corresponding font in your HTML:

```html
<!-- Material Symbols (default) -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap">

<!-- Or Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
```

#### Icon Slots

For full control over icon rendering (e.g., using a specific icon library class), use named slots instead of the `icon` attribute:

```html
<snice-input label="Search">
  <span slot="prefix-icon" class="fa-solid fa-magnifying-glass"></span>
</snice-input>

<snice-button>
  <svg slot="icon" viewBox="0 0 24 24">...</svg>
  Submit
</snice-button>
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

## Extending Elements

Elements can extend other elements — including Snice's built-in components. The child inherits the parent's properties, watchers, event handlers, lifecycle hooks, and styles, then adds or overrides its own.

### Example: Currency Input

Extend `snice-input` to create an input that prefixes a currency symbol, restricts to numeric entry, and formats the value on blur:

```typescript
import { element, property, watch, on, render, styles, html, css } from 'snice';
import 'snice/components/input/snice-input';
import { SniceInput } from 'snice/components/input/snice-input';

@element('currency-input')
class CurrencyInput extends SniceInput {
  @property() currency = 'USD';

  // Snice input already has: value, label, placeholder, disabled,
  // size, variant, error-text, helper-text, clearable, prefix-icon,
  // suffix-icon, and all associated watchers and events.

  connectedCallback() {
    super.connectedCallback();
    this.updatePrefix();
  }

  @watch('currency')
  updatePrefix() {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    this.prefixIcon = symbols[this.currency] || this.currency;
  }

  @on('input', 'input')
  restrictNumeric(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    input.value = input.value.replace(/[^\d.]/g, '');
    this.value = input.value;
  }

  @on('blur', 'input')
  formatValue() {
    const num = parseFloat(this.value);
    if (!isNaN(num)) {
      this.value = num.toFixed(2);
    }
  }

  @styles()
  currencyStyles() {
    return css`
      /* Parent input styles are inherited — add currency-specific tweaks */
      :host { --input-text-align: right; }
    `;
  }
}
```

```html
<currency-input label="Price" currency="EUR" placeholder="0.00"></currency-input>
```

The `currency-input` inherits everything from `snice-input` — label rendering, variants, sizes, validation, focus/blur events, clearable, keyboard handling — without re-implementing any of it. It adds a currency symbol prefix, numeric restriction, and formatting.

### What inherits

| Feature | Behavior |
|---------|----------|
| `@property` | Child gets all parent properties. Child can override defaults or type. |
| `@watch` | Both parent and child watchers fire. |
| `@on` | Both parent and child handlers fire. |
| `@ready`, `@reconnect`, `@dispose` | All three fire on parent and child. |
| `@dispatch` | Inherited via prototype. |
| `@render` | Child **replaces** parent's render. If child doesn't declare `@render`, parent's is used. |
| `@styles` | **Concatenated** — parent styles first, child second (child wins via cascade). |
| `formAssociated` | Inherited. |

Each child class needs its own `@element('tag-name')` with a unique tag name.

## Advanced Examples

### Form Component

Elements handle visual behavior — they render the form and emit events. Business logic (API calls, validation) belongs in controllers:

```typescript
import { element, property, query, dispatch, render, styles, html, css } from 'snice';

@element('registration-form')
class RegistrationForm extends HTMLElement {
  @property({ type: Boolean })
  loading = false;

  @query('form') form?: HTMLFormElement;

  @dispatch('register-submit')
  handleSubmit(event: Event) {
    event.preventDefault();
    return Object.fromEntries(new FormData(this.form!));
  }

  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleSubmit}>
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
      }

      .field {
        margin-bottom: 1rem;
      }

      label {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: bold;
      }

      input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--snice-color-border, #ddd);
        border-radius: 4px;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `;
  }
}
```

### Watch Decorator

Use `@watch` to react to property changes. Handlers receive three arguments: `(oldValue, newValue, propertyName)`.

```typescript
@element('reactive-component')
class ReactiveComponent extends HTMLElement {
  @property()
  userName = '';

  @property({ type: Number })
  score = 0;

  @watch('userName')
  onUserNameChange(oldVal: string, newVal: string, prop: string) {
    console.log(`${prop} changed from ${oldVal} to ${newVal}`);
  }

  @watch('score')
  onScoreChange(oldVal: number, newVal: number) {
    if (newVal > 100) {
      console.log('High score achieved!');
    }
  }

  // Wildcard watcher — fires on any @property change
  @watch('*')
  onAnyChange(oldVal: any, newVal: any, prop: string) {
    console.log(`${prop}: ${oldVal} → ${newVal}`);
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

**Initial values.** By default a watcher fires once during initialization with the element's starting value — from markup (`<reactive-component user-name="Ada">`) or the field default — with `oldValue` undefined, then again on every later change:

```typescript
@watch('userName')
onUserNameChange(oldVal: string | undefined, newVal: string) {
  // Init:   (undefined, 'Ada')
  // Change: ('Ada', 'Grace')
}
```

Pass `{ immediate: false }` as the last argument for a change-only watcher — one that must not run on mount, such as a watcher that dispatches an event:

```typescript
@watch('value', { immediate: false })
onValueChange(oldVal: string, newVal: string) {
  this.dispatchChange();   // only on real changes, never on mount
}
```

The options object always comes after the property names, so it works with multiple watched properties too: `@watch('width', 'height', { immediate: false })`.

### @context() Decorator

Receive router context updates. The decorated method is called whenever the router context changes (navigation, app context update, etc.):

```typescript
import { element, context, property, render, html } from 'snice';
import type { Context, Placard } from 'snice';

@element('nav-bar')
class NavBar extends HTMLElement {
  @property({ type: Array })
  placards: Placard[] = [];

  @property()
  currentRoute = '';

  @context()
  onContextUpdate(ctx: Context) {
    this.placards = ctx.navigation.placards;
    this.currentRoute = ctx.navigation.route;
  }

  @render()
  renderContent() {
    return html`
      <nav>
        ${this.placards
          .filter(p => p.show !== false)
          .map(p => html`
            <a href="${p.href || ''}" class="${this.currentRoute === p.name ? 'active' : ''}">
              ${p.icon} ${p.title}
            </a>
          `)}
      </nav>
    `;
  }
}
```

**Context Options:**

```typescript
@context({ debounce: 300 })   // Wait 300ms after last change
@context({ throttle: 500 })   // At most once per 500ms
@context({ once: true })       // Only called once, then auto-unregisters
```

The `Context` object provides:
- `ctx.application` — App context (theme, auth, config, etc.)
- `ctx.navigation.route` — Current route path
- `ctx.navigation.params` — Route parameters
- `ctx.navigation.placards` — All registered page placards
- `ctx.fetch` — Fetch with middleware support (see Fetcher docs)

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
        <else-if ${this.sessionExpired}>
          <button @click=${this.login}>Sign in again</button>
        </else-if>
        <else>
          <a href="/login">Please login</a>
        </else>
      </if>
    `;
  }

  logout() {
    this.isLoggedIn = false;
  }
}
```

The virtual control-flow tags add no wrapper elements and retain each branch's DOM identity. See [Declarative Rendering](./rendering.md) for typed `<when>` branches, `repeat()`, binding channels, explicit form events, and direct async values.
