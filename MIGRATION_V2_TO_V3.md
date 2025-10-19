# Migration Guide: Snice v2.x → v3.0.0

## Breaking Changes Summary

Snice v3.0.0 introduces a complete rewrite of the rendering system with **differential rendering** and **tagged templates**, inspired by lit-html but with a custom implementation. This is a **major breaking change** with no backward compatibility.

### Removed APIs
- ❌ `html()` method
- ❌ `css()` method
- ❌ `@part` decorator
- ❌ `@on` decorator

### New APIs
- ✅ `html``template literals
- ✅ `css``template literals
- ✅ `@render()` decorator
- ✅ `@styles()` decorator
- ✅ Template event syntax (`@click`, `@input`, etc.)
- ✅ Template property binding (`.value`)
- ✅ Template boolean attributes (`?disabled`)
- ✅ Auto-rendering on property changes
- ✅ Differential rendering (only updates changed parts)

---

## Migration Steps

### Step 1: Update Rendering Methods

**Before (v2.x):**
```typescript
@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  html() {
    return `
      <div class="counter">
        <span>${this.count}</span>
        <button>Increment</button>
      </div>
    `;
  }

  css() {
    return `
      .counter {
        padding: 1rem;
        background: #f0f0f0;
      }
    `;
  }
}
```

**After (v3.0.0):**
```typescript
import { element, property, render, styles, html, css } from 'snice';

@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <div class="counter">
        <span>${this.count}</span>
        <button>Increment</button>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      .counter {
        padding: 1rem;
        background: #f0f0f0;
      }
    `;
  }
}
```

**Key Changes:**
- Import `html` and `css` tagged template functions
- Import `@render` and `@styles` decorators
- Replace `html()` with `@render()` method returning `html\`...\``
- Replace `css()` with `@styles()` method returning `css\`...\``

---

### Step 2: Replace Event Handlers

**Before (v2.x):**
```typescript
@element('my-button')
class MyButton extends HTMLElement {
  html() {
    return `<button>Click me</button>`;
  }

  @on('click', 'button')
  handleClick(event: Event) {
    console.log('Clicked!', event);
  }
}
```

**After (v3.0.0):**
```typescript
import { element, render, html } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <button @click=${this.handleClick}>Click me</button>
    `;
  }

  handleClick(event: Event) {
    console.log('Clicked!', event);
  }
}
```

**Key Changes:**
- Remove `@on` decorator
- Use `@click=${handler}` syntax in template
- Works with any DOM event: `@input`, `@change`, `@submit`, etc.

---

### Step 3: Automatic Re-rendering

**Before (v2.x):**
```typescript
@element('user-profile')
class UserProfile extends HTMLElement {
  @property()
  name = '';

  html() {
    return `<h1>${this.name}</h1>`;
  }

  @on('click', 'button')
  updateName() {
    this.name = 'New Name';
    // Manual re-render required!
    this.shadowRoot!.innerHTML = this.html();
  }
}
```

**After (v3.0.0):**
```typescript
import { element, property, render, html } from 'snice';

@element('user-profile')
class UserProfile extends HTMLElement {
  @property()
  name = '';

  @render()
  renderContent() {
    return html`
      <h1>${this.name}</h1>
      <button @click=${this.updateName}>Update</button>
    `;
  }

  updateName() {
    this.name = 'New Name';
    // Auto re-renders! No manual render needed!
  }
}
```

**Key Changes:**
- **Automatic re-rendering** when properties change
- **Differential rendering** - only updates changed parts
- **No manual `innerHTML` manipulation** needed

---

### Step 4: Replace @part with Differential Rendering

**Before (v2.x):**
```typescript
@element('todo-list')
class TodoList extends HTMLElement {
  todos = ['Task 1', 'Task 2'];

  html() {
    return `
      <div>
        <ul part="todos"></ul>
        <button>Add</button>
      </div>
    `;
  }

  @part('todos')
  renderTodos() {
    return this.todos.map(t => `<li>${t}</li>`).join('');
  }

  @on('click', 'button')
  addTodo() {
    this.todos.push('New Task');
    this.renderTodos(); // Manual partial update
  }
}
```

**After (v3.0.0):**
```typescript
import { element, render, html } from 'snice';

@element('todo-list')
class TodoList extends HTMLElement {
  todos = ['Task 1', 'Task 2'];

  @render()
  renderContent() {
    return html`
      <div>
        <ul>
          ${this.todos.map(t => html`<li>${t}</li>`)}
        </ul>
        <button @click=${this.addTodo}>Add</button>
      </div>
    `;
  }

  addTodo() {
    this.todos = [...this.todos, 'New Task'];
    // Differential rendering automatically updates only the new <li>!
  }
}
```

**Key Changes:**
- **Remove `@part` entirely**
- Use **nested templates** with `.map()`
- **Differential rendering handles partial updates automatically**
- Must **reassign arrays** to trigger render: `this.todos = [...]`

---

### Step 5: Property and Boolean Attribute Binding

**New in v3.0.0:**

```typescript
import { element, property, render, html } from 'snice';

@element('custom-input')
class CustomInput extends HTMLElement {
  @property()
  value = '';

  @property({ type: Boolean })
  disabled = false;

  @render()
  renderContent() {
    return html`
      <input
        .value=${this.value}
        ?disabled=${this.disabled}
        @input=${this.handleInput}
      />
    `;
  }

  handleInput(e: Event) {
    this.value = (e.target as HTMLInputElement).value;
  }
}
```

**Template Syntax:**
- `.value=${x}` - Sets **property**, not attribute (for form inputs)
- `?disabled=${bool}` - **Boolean attribute** (added if true, removed if false)
- `class=${x}` - Sets **attribute** (regular binding)

---

## Render Options

### Debouncing

Debounce renders for performance (useful for search inputs):

```typescript
@render({ debounce: 300 })
renderContent() {
  return html`<input .value=${this.searchTerm} @input=${this.onSearch} />`;
}

onSearch(e: Event) {
  this.searchTerm = (e.target as HTMLInputElement).value;
  // Renders only after 300ms of no changes
}
```

### Throttling

Limit render frequency:

```typescript
@render({ throttle: 100 })
renderContent() {
  return html`<div>Scroll: ${this.scrollY}</div>`;
}
```

### One-time Rendering

Disable auto-rendering (manual control):

```typescript
@render({ once: true })
renderContent() {
  return html`<div>Static content</div>`;
}

updateManually() {
  this.someData = 'new value';
  this.renderContent(); // Explicit call to re-render
}
```

### Synchronous Rendering

Skip microtask batching (immediate updates):

```typescript
@render({ sync: true })
renderContent() {
  return html`<div>${this.count}</div>`;
}
```

---

## Common Patterns

### Conditional Rendering

```typescript
@render()
renderContent() {
  return html`
    <div>
      ${this.isLoggedIn
        ? html`<span>Welcome, ${this.user.name}!</span>`
        : html`<a href="/login">Login</a>`
      }
    </div>
  `;
}
```

### Lists with Keys

For optimal performance, use unique keys when rendering lists:

```typescript
@render()
renderContent() {
  return html`
    <ul>
      ${this.items.map(item => html`
        <li key=${item.id}>
          ${item.name}
          <button @click=${() => this.remove(item.id)}>Remove</button>
        </li>
      `)}
    </ul>
  `;
}
```

### Nested Components

```typescript
@render()
renderContent() {
  return html`
    <div>
      <user-card userId=${this.userId}></user-card>
      <comment-list postId=${this.postId}></comment-list>
    </div>
  `;
}
```

---

## TypeScript Support

Update your imports:

```typescript
import {
  element,
  property,
  render,
  styles,
  html,
  css,
  type TemplateResult,
  type CSSResult,
  type RenderOptions
} from 'snice';
```

Type your render methods:

```typescript
@render()
renderContent(): TemplateResult {
  return html`<div>Content</div>`;
}

@styles()
componentStyles(): CSSResult {
  return css`:host { display: block; }`;
}
```

---

## Testing

Update your tests to work with the new rendering system:

**Before (v2.x):**
```typescript
const el = document.createElement('my-element') as MyElement;
document.body.appendChild(el);
expect(el.shadowRoot!.innerHTML).toContain('expected content');
```

**After (v3.0.0):**
```typescript
const el = document.createElement('my-element') as MyElement;
document.body.appendChild(el);

// Wait for initial render
await el.ready;

// Check rendered content
expect(el.shadowRoot!.textContent).toContain('expected content');

// Trigger property change
el.someProperty = 'new value';

// Wait for next microtask (auto-render)
await new Promise(resolve => queueMicrotask(resolve));

// Verify differential update
expect(el.shadowRoot!.textContent).toContain('new value');
```

---

## Performance Benefits

### v2.x (Manual)
- ❌ Full `innerHTML` replacement on every update
- ❌ All event listeners destroyed and recreated
- ❌ Manual `@part` updates required
- ❌ No batching of updates

### v3.0.0 (Differential)
- ✅ **Only changed parts updated**
- ✅ Event listeners preserved and reused
- ✅ **Automatic batching** (microtask queue)
- ✅ **Debounce/throttle** built-in
- ✅ **10-100x faster** for large components

---

## Need Help?

- Check the updated [README.md](./README.md) for full examples
- See [docs/](./docs/) for detailed API documentation
- Open an issue on GitLab for migration questions

---

## Quick Reference

| v2.x | v3.0.0 |
|------|--------|
| `html()` method | `@render()` with `html\`\`` |
| `css()` method | `@styles()` with `css\`\`` |
| `@on('click', 'button')` | `@click=${handler}` in template |
| `@part('name')` | Use `@render()` (differential rendering) |
| Manual `innerHTML` update | Automatic on property change |
| `this.shadowRoot!.innerHTML = ...` | Just update property: `this.count++` |

**The future is differential!** 🚀
