<!-- AI: For the AI-optimized version of this doc, see docs/ai/properties.md -->
# Properties

Public inputs, internal state, attribute conversion, and reflection. Elements themselves are covered in [Elements](./elements.md); template binding channels in [Binding Channels](./bindings.md).

## Basic Properties

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

## Property Options

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

## Property Behavior

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

### Controlled form properties

When rendering a controlled native or Snice form control, bind its JavaScript
property. Use `live()` when an owner render must restore state even though the
bound value equals the last value Snice committed:

```typescript
import { html, live, state } from 'snice';

@state() name = 'Ada';

html`<snice-input .value=${live(this.name)}></snice-input>`;
```

`live()` compares with the current DOM property, but it does not watch the DOM
or schedule a render. See [Live property values](./bindings.md#live-property-values)
for the modal-reseed example and exact timing.

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

## Custom Converters

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

## SimpleArray Type

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
