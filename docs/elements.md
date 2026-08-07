<!-- AI: For the AI-optimized version of this doc, see docs/ai/elements.md -->
# Elements

Defining custom elements, choosing a render root, and extending existing elements.

| Topic | Documented in |
|---|---|
| Public input, state, attribute conversion | [Properties](./properties.md) |
| Connection, readiness, teardown, `@watch` | [Lifecycle](./lifecycle.md) |
| `@query` / `@queryAll` | [Queries](./queries.md) |
| `@styles`, host styling, icons | [Styling](./styling.md) |
| `@render`, templates, control flow | [Declarative Rendering](./rendering.md) |
| Template events, `@on`, `@dispatch` | [Events](./events.md) |

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

See [Queries](./queries.md) for resolving elements inside the render root.

### Native autofocus

Use the platform `autofocus` attribute or property; no focus controller is needed. Snice applies autofocus after the element is ready and the browser has had a frame to paint, which makes it reliable for late-upgraded custom elements and controls rendered inside open or closed shadow roots.

```html
<!-- A built-in Snice control forwards focus to its native control. -->
<snice-input autofocus label="Search"></snice-input>
```

```typescript
@element('search-panel')
class SearchPanel extends HTMLElement {
  @render()
  template() {
    return html`<input autofocus type="search">`;
  }
}
```

For a decorated host without its own effective `focus()` implementation, host-level `autofocus` targets the first native focusable control in its render root. Snice does not add `tabindex`. As with native autofocus, the first candidate wins; focus deliberately established by application code (including an `@ready` handler) is preserved. Assigning `element.autofocus = true` after initialization is also supported. The pass also covers a host that first appears in a LATER render (e.g. inside a conditional branch), not only elements present at initial mount.

Under jsdom the `autofocus` IDL property is not implemented, so `element.autofocus = true` is a no-op in tests — Snice's pass reads `hasAttribute('autofocus')`, which makes the attribute form (`?autofocus=${...}` in templates) the testable one.

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

## Full Example

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
