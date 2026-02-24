# Events API Documentation

Event handling in Snice provides two powerful approaches: **template event syntax** and the **`@on` decorator**. The `@on` decorator works in **both elements AND controllers** with full event delegation, keyboard modifiers, debounce/throttle, and more. Additionally, the `@dispatch` decorator enables automatic custom event dispatching.

## Table of Contents
- [Template Event Syntax](#template-event-syntax)
- [@on Decorator](#on-decorator)
- [@dispatch Decorator](#dispatch-decorator)
- [Custom Events](#custom-events)
- [Event Delegation](#event-delegation)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Best Practices](#best-practices)

## Template Event Syntax (Preferred for Elements)

The recommended way to handle events in elements is using template event syntax with `@event=${handler}`:

### Basic Usage

```typescript
import { element, property, render, html } from 'snice';

@element('click-counter')
class ClickCounter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <div class="counter">
        <button @click=${this.increment}>Increment</button>
        <button @click=${this.decrement}>Decrement</button>
        <button @click=${this.reset}>Reset</button>
        <span class="count">${this.count}</span>
      </div>
    `;
  }

  increment() {
    this.count++;
  }

  decrement() {
    this.count--;
  }

  reset() {
    this.count = 0;
  }
}
```

### Event Object Access

```typescript
@element('form-handler')
class FormHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <form @submit=${this.handleSubmit}>
        <input
          type="text"
          name="username"
          @input=${this.handleInput}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        >
        <button type="submit">Submit</button>
      </form>
    `;
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    console.log('Form submitted:', Object.fromEntries(formData));
  }

  handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Input value:', input.value);
  }

  handleFocus(event: Event) {
    console.log('Input focused');
  }

  handleBlur(event: Event) {
    console.log('Input blurred');
  }
}
```

### Multiple Event Types

```typescript
@element('file-upload')
class FileUpload extends HTMLElement {
  @property({ type: Boolean })
  dragOver = false;

  @render()
  renderContent() {
    return html`
      <div
        class="dropzone ${this.dragOver ? 'drag-over' : ''}"
        @dragenter=${this.handleDragEnter}
        @dragover=${this.handleDragOver}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
        Drop files here
      </div>
    `;
  }

  handleDragEnter(e: DragEvent) {
    e.preventDefault();
    this.dragOver = true;
  }

  handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  handleDragLeave(e: DragEvent) {
    this.dragOver = false;
  }

  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver = false;
    const files = Array.from(e.dataTransfer?.files || []);
    console.log('Files dropped:', files);
  }
}
```

### Keyboard Shortcuts in Templates

Template event syntax supports keyboard shortcuts using dot notation:

```typescript
@element('keyboard-input')
class KeyboardInput extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div>
        <input
          @keydown.enter=${this.handleEnter}
          placeholder="Press Enter"
        >

        <input
          @keydown.ctrl+s=${this.handleSave}
          placeholder="Press Ctrl+S"
        >

        <input
          @keydown.escape=${this.handleCancel}
          placeholder="Press Escape"
        >

        <input
          @keydown.~enter=${this.handleAnyEnter}
          placeholder="Press Enter with any modifiers"
        >
      </div>
    `;
  }

  handleEnter(e: KeyboardEvent) {
    console.log('Enter pressed (no modifiers)');
  }

  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Ctrl+S pressed');
  }

  handleCancel(e: KeyboardEvent) {
    console.log('Escape pressed');
  }

  handleAnyEnter(e: KeyboardEvent) {
    console.log('Enter pressed (with any modifiers)');
  }
}
```

**Keyboard Shortcut Syntax:**
- `@keydown.enter` - Plain Enter (no modifiers)
- `@keydown.ctrl+s` - Ctrl+S combination
- `@keydown.ctrl+shift+s` - Multiple modifiers
- `@keydown.~enter` - Enter with any modifiers
- `@keydown.escape`, `@keydown.down`, etc. - Named keys

### Arrow Functions in Templates

Use arrow functions for inline event handling or passing parameters:

```typescript
@element('task-list')
class TaskList extends HTMLElement {
  @property()
  tasks = [
    { id: 1, name: 'Task 1', completed: false },
    { id: 2, name: 'Task 2', completed: false }
  ];

  @render()
  renderContent() {
    return html`
      <ul>
        ${this.tasks.map(task => html`
          <li>
            <input
              type="checkbox"
              ?checked=${task.completed}
              @change=${(e: Event) => this.toggleTask(task.id, e)}
            >
            <span>${task.name}</span>
            <button @click=${() => this.deleteTask(task.id)}>Delete</button>
          </li>
        `)}
      </ul>
    `;
  }

  toggleTask(id: number, e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = checkbox.checked;
      // Trigger re-render
      this.tasks = [...this.tasks];
    }
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
}
```

## @on Decorator

The `@on` decorator works in **both elements AND controllers**. It provides powerful event delegation, keyboard modifiers, debounce/throttle, and automatic event handling features.

**Use `@on` when you need:**
- Event delegation with CSS selectors
- Keyboard modifier matching (`Enter`, `ctrl+s`, etc.)
- Debounce or throttle
- Multiple events on one handler (accepts `string[]`: `@on(['mouseenter', 'focus'])`)
- Automatic preventDefault or stopPropagation

### Basic Controller Usage

```typescript
import { controller, on, IController } from 'snice';

@controller('button-controller')
class ButtonController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    console.log('Controller attached');
  }

  async detach(element: HTMLElement) {
    console.log('Controller detached');
  }

  @on('click')
  handleClick(event: MouseEvent) {
    console.log('Button clicked');
  }

  @on('mouseenter')
  handleMouseEnter(event: MouseEvent) {
    console.log('Mouse entered');
  }

  @on('mouseleave')
  handleMouseLeave(event: MouseEvent) {
    console.log('Mouse left');
  }
}
```

### Event Delegation with Selector

```typescript
@controller('list-controller')
class ListController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Handle clicks on list items
  @on('click', '.list-item')
  handleItemClick(event: MouseEvent) {
    const item = event.target as HTMLElement;
    console.log('Item clicked:', item.textContent);
  }

  // Handle clicks on delete buttons
  @on('click', '.delete-button')
  handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    const button = event.target as HTMLElement;
    const item = button.closest('.list-item');
    item?.remove();
  }

  // Handle input on text fields
  @on('input', 'input[type="text"]')
  handleTextInput(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Text changed:', input.value);
  }
}
```

### Keyboard Events with @on

```typescript
@controller('editor-controller')
class EditorController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('keydown:Enter', 'textarea')
  handleEnter(event: KeyboardEvent) {
    console.log('Enter pressed in textarea');
  }

  @on('keydown:Ctrl+S')
  handleSave(event: KeyboardEvent) {
    event.preventDefault();
    console.log('Save shortcut triggered');
    this.save();
  }

  @on('keydown:Escape')
  handleEscape(event: KeyboardEvent) {
    console.log('Escape pressed');
    this.cancel();
  }

  private save() {
    console.log('Saving...');
  }

  private cancel() {
    console.log('Cancelling...');
  }
}
```

### @on Options

```typescript
interface OnOptions {
  // Standard event listener options
  capture?: boolean;           // Use capture phase instead of bubble phase
  once?: boolean;              // Remove listener after first trigger
  passive?: boolean;           // Passive listener (can't preventDefault)

  // Automatic event handling
  preventDefault?: boolean;    // Automatically call preventDefault on the event
  stopPropagation?: boolean;   // Automatically call stopPropagation on the event

  // Timing controls
  debounce?: number;           // Debounce the handler by specified milliseconds
  throttle?: number;           // Throttle the handler by specified milliseconds
}
```

#### Throttling

```typescript
@controller('scroll-controller')
class ScrollController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Throttle scroll events to max once per 100ms
  @on('scroll', null, { throttle: 100 })
  handleScroll(event: Event) {
    const element = event.target as HTMLElement;
    console.log('Scroll position:', element.scrollTop);
  }
}
```

#### Debouncing

```typescript
@controller('search-controller')
class SearchController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Debounce input events by 300ms
  @on('input', 'input[type="search"]', { debounce: 300 })
  handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    console.log('Searching for:', input.value);
    this.performSearch(input.value);
  }

  private async performSearch(query: string) {
    // Search implementation
  }
}
```

### Using @on in Elements (Alternative)

While template syntax is preferred, `@on` can also be used in elements:

```typescript
import { element, on, render, html } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  @render()
  renderContent() {
    return html`<button class="btn">Click me</button>`;
  }

  @on('click', '.btn')
  handleClick(event: MouseEvent) {
    console.log('Button clicked via @on decorator');
  }

  @on('input', 'input', { debounce: 300 })
  handleInput(event: Event) {
    console.log('Input debounced');
  }
}
```

**Note:** For new element code, prefer template event syntax for better readability and type safety.

## @dispatch Decorator

Auto-dispatch custom events after method execution:

### Basic Usage

```typescript
import { element, dispatch, render, html } from 'snice';

@element('value-input')
class ValueInput extends HTMLElement {
  private value = '';

  @render()
  renderContent() {
    return html`
      <input
        type="text"
        .value=${this.value}
        @input=${this.handleInput}
      >
    `;
  }

  handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setValue(input.value);
  }

  @dispatch('value-changed')
  setValue(newValue: string) {
    this.value = newValue;
    return { value: newValue }; // Event detail
  }
}
```

Usage:
```typescript
const input = document.querySelector('value-input');
input.addEventListener('value-changed', (e: CustomEvent) => {
  console.log('New value:', e.detail.value);
});
```

### Event Options

Events dispatched by `@dispatch` default to `bubbles: true` and `composed: true` (crosses shadow DOM boundaries). Override if needed:

```typescript
@element('status-indicator')
class StatusIndicator extends HTMLElement {
  @render()
  renderContent() {
    return html`<div>Status</div>`;
  }

  // Defaults: bubbles: true, composed: true
  @dispatch('status-changed')
  updateStatus(status: string) {
    return {
      status,
      timestamp: Date.now()
    };
  }
}
```

### DispatchOptions

```typescript
interface DispatchOptions extends EventInit {
  dispatchOnUndefined?: boolean; // Skip dispatch when return is undefined (default: true)
  debounce?: number;             // Debounce dispatch by ms
  throttle?: number;             // Throttle dispatch by ms
}
```

### Debounce/Throttle

```typescript
@element('search-box')
class SearchBox extends HTMLElement {
  @render()
  renderContent() {
    return html`<input @input=${this.handleInput}>`;
  }

  handleInput(e: Event) {
    this.emitSearch((e.target as HTMLInputElement).value);
  }

  @dispatch('search-query', { debounce: 300 })
  emitSearch(query: string) {
    return { query };
  }
}
```

### Async Methods

`@dispatch` works with async methods — the event dispatches after the promise resolves:

```typescript
@dispatch('validation-complete')
async validate() {
  const result = await this.runValidation();
  return { valid: result.isValid, errors: result.errors };
}
```

### Multiple Events

```typescript
@element('color-picker')
class ColorPicker extends HTMLElement {
  @property() color = '#000000';

  @render()
  renderContent() {
    return html`
      <input type="color" .value=${this.color} @input=${this.handleInput}>
      <button @click=${this.confirm}>OK</button>
    `;
  }

  handleInput(e: Event) {
    this.changeColor((e.target as HTMLInputElement).value);
  }

  @dispatch('color-preview')
  changeColor(color: string) {
    this.color = color;
    return { color };
  }

  @dispatch('color-selected')
  confirm() {
    return { color: this.color };
  }
}
```

## Custom Events

### Dispatching Manually

```typescript
@element('manual-dispatcher')
class ManualDispatcher extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <button @click=${this.notify}>Notify</button>
    `;
  }

  notify() {
    // Dispatch custom event manually
    this.dispatchEvent(new CustomEvent('notification', {
      detail: { message: 'Hello!', level: 'info' },
      bubbles: true,
      composed: true
    }));
  }
}
```

### Listening to Custom Events

```typescript
@element('event-listener')
class EventListener extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <manual-dispatcher @notification=${this.handleNotification}></manual-dispatcher>
    `;
  }

  handleNotification(e: CustomEvent) {
    console.log('Received notification:', e.detail);
  }
}
```

## Event Delegation

### Controller Event Delegation

```typescript
@controller('table-controller')
class TableController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  // Single event listener handles all rows
  @on('click', 'tr')
  handleRowClick(event: MouseEvent) {
    const row = (event.target as HTMLElement).closest('tr');
    console.log('Row clicked:', row?.dataset.id);
  }

  // Handle button clicks in cells
  @on('click', 'button.edit')
  handleEdit(event: MouseEvent) {
    const button = event.target as HTMLButtonElement;
    const row = button.closest('tr');
    console.log('Edit row:', row?.dataset.id);
  }

  @on('click', 'button.delete')
  handleDelete(event: MouseEvent) {
    event.stopPropagation(); // Don't trigger row click
    const button = event.target as HTMLButtonElement;
    const row = button.closest('tr');
    row?.remove();
  }
}
```

### Template Event Delegation

For dynamic content, use controllers with `@on` for event delegation, or handle events on a parent element:

```typescript
@element('dynamic-list')
class DynamicList extends HTMLElement {
  @property()
  items = ['Item 1', 'Item 2', 'Item 3'];

  @render()
  renderContent() {
    return html`
      <ul @click=${this.handleListClick}>
        ${this.items.map((item, index) => html`
          <li data-index="${index}">
            ${item}
            <button class="delete">Delete</button>
          </li>
        `)}
      </ul>
    `;
  }

  handleListClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Handle delete button
    if (target.classList.contains('delete')) {
      const li = target.closest('li');
      const index = parseInt(li?.dataset.index || '-1');
      if (index >= 0) {
        this.items = this.items.filter((_, i) => i !== index);
      }
      return;
    }

    // Handle li click
    if (target.tagName === 'LI') {
      console.log('Item clicked:', target.textContent);
    }
  }
}
```

## Keyboard Shortcuts

### Template Syntax (Preferred)

```typescript
@element('shortcut-handler')
class ShortcutHandler extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <div>
        <input @keydown.enter=${this.submit} placeholder="Press Enter">
        <input @keydown.ctrl+s=${this.save} placeholder="Ctrl+S to save">
        <input @keydown.ctrl+shift+s=${this.saveAs} placeholder="Ctrl+Shift+S for Save As">
        <input @keydown.escape=${this.cancel} placeholder="Escape to cancel">
        <input @keydown.~enter=${this.submitAny} placeholder="Enter with any mods">
      </div>
    `;
  }

  submit(e: KeyboardEvent) {
    console.log('Submit');
  }

  save(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save');
  }

  saveAs(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save As');
  }

  cancel(e: KeyboardEvent) {
    console.log('Cancel');
  }

  submitAny(e: KeyboardEvent) {
    console.log('Submit with any modifiers');
  }
}
```

### @on Decorator Syntax

```typescript
@controller('keyboard-controller')
class KeyboardController implements IController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}

  @on('keydown:Enter')
  handleEnter(e: KeyboardEvent) {
    console.log('Enter pressed');
  }

  @on('keydown:Ctrl+S')
  handleSave(e: KeyboardEvent) {
    e.preventDefault();
    console.log('Save');
  }

  @on('keydown:Escape')
  handleEscape(e: KeyboardEvent) {
    console.log('Escape');
  }
}
```


