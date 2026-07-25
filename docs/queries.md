<!-- AI: For the AI-optimized version of this doc, see docs/ai/queries.md -->
# Queries

Resolve elements inside a render root with `@query` and `@queryAll` instead of reaching for `querySelector`.

## Single Element Query

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

## Multiple Elements Query

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

## Query Options

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

## Accessing Shadow DOM Elements

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
