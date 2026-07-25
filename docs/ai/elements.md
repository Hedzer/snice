# Elements

Human reference: docs/elements.md

Defining custom elements, choosing a render root, extending existing elements.

| Topic | Doc |
|---|---|
| Public input, state, attribute conversion | [Properties](properties.md) |
| Connection, readiness, teardown, `@watch` | [Lifecycle](lifecycle.md) |
| `@query` / `@queryAll` | [Queries](queries.md) |
| `@styles`, host styling, icons | [Styling](styling.md) |
| `@render`, templates, control flow | [Declarative Rendering](rendering.md) |
| Template events, `@on`, `@dispatch` | [Events](events.md) |

## Basic Usage

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

Convention-based authoring: extend optional `SniceElement`, implement `render()` directly.

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

Plain `HTMLElement` subclasses + decorated `@render`/`@styles` methods remain fully supported.

## `@element` Decorator Options

```typescript
@element(tagName: string, options?: ElementOptions)

interface ElementOptions {
  formAssociated?: boolean;              // default false
  renderRoot?: 'shadow' | 'light';
  shadow?: 'open' | 'closed' | false;    // false = light-DOM shorthand
  delegatesFocus?: boolean;              // forwarded to attachShadow()
}
```

`tagName` must contain a hyphen.

## Render Roots / Shadow DOM

- Default: open shadow root.
- Open/closed shadow roots and light DOM share the same differential renderer, lifecycle, event binding, styles, and query decorators.

```typescript
@element('closed-card', { shadow: 'closed' })
class ClosedCard extends HTMLElement { /* ... */ }

@element('light-card', { renderRoot: 'light' })
class LightCard extends HTMLElement { /* ... */ }

@element('focus-card', { delegatesFocus: true })
class FocusCard extends HTMLElement { /* ... */ }
```

- `shadow: false` is shorthand for `renderRoot: 'light'`.
- Framework-managed queries continue to work with a closed root.
- `createRenderRoot()` override may return the host element or a `ShadowRoot` for a custom policy.
- See [Queries](queries.md) for resolving elements inside the render root.

## Extending Elements

Elements can extend other elements, including Snice's built-in components. Child inherits parent's properties, watchers, event handlers, lifecycle hooks, and styles, then adds/overrides its own.

### Example: Currency Input extends `snice-input`

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

`currency-input` inherits everything from `snice-input` — label rendering, variants, sizes, validation, focus/blur events, clearable, keyboard handling — without re-implementing any of it. Adds a currency symbol prefix, numeric restriction, formatting.

### What Inherits

| Feature | Behavior |
|---|---|
| `@property` | Child gets all parent properties. Child can override defaults or type. |
| `@watch` | Both parent and child watchers fire. |
| `@on` | Both parent and child handlers fire. |
| `@ready`, `@reconnect`, `@dispose` | All three fire on parent and child. |
| `@dispatch` | Inherited via prototype. |
| `@render` | Child **replaces** parent's render. If child doesn't declare `@render`, parent's is used. |
| `@styles` | **Concatenated** — parent styles first, child second (child wins via cascade). |
| `formAssociated` | Inherited. |

Each child class needs its own `@element('tag-name')` with a unique tag name.

## Full Example: Separation of Concerns

Elements handle visual behavior — render the form, emit events. Business logic (API calls, validation) belongs in controllers.

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
