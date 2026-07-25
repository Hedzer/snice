# Properties

Human reference: docs/properties.md

Public inputs, internal state, attribute conversion, reflection. Elements: [Elements](elements.md). Template binding channels: [Bindings](bindings.md).

## Basic Usage

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

```html
<user-profile name="John Doe" age="30" verified></user-profile>
```

## `PropertyOptions`

```typescript
interface PropertyOptions {
  type?: String | Number | Boolean | Array | Object | Date | BigInt | SimpleArray;
  attribute?: string | boolean;  // custom attribute name, or false to disable attribute sync
  reflect?: boolean;             // property -> attribute; default true
  deep?: boolean;                // observe nested object/array/Map/Set writes
  converter?: PropertyConverter;  // custom converter
  hasChanged?: (value, oldValue) => boolean;
}
```

## Property Behavior

All properties automatically:
- Read from DOM attributes when present.
- Reflect property setter changes to corresponding attributes unless `reflect: false`.
- Convert between string attributes and typed properties.
- Trigger re-renders when changed.

Attribute conversion is one-way at the HTML boundary. Direct JavaScript assignment is already typed and stored exactly as assigned — preserves dates, union values, services, objects, and collection identity:

```typescript
const rows = [{ id: 1 }];
element.rows = rows;
element.rows === rows; // true
```

`type` and `converter.fromAttribute` process strings arriving from attributes; `converter.toAttribute` serializes reflection.

Use `reflect: false` for input-only attributes, `attribute: false` for JavaScript-only public properties, `@state()` for internal reactive fields:

```typescript
@property({ type: Number, reflect: false }) page = 1;
@property({ attribute: false }) service!: UserService;
@state() open = false;
@state({ deep: true }) model = { rows: [] as Row[] };
```

- `@state()`: never observes or writes an attribute.
- `deep: true`: tracks nested plain objects, arrays, `Map`, `Set` via native `Proxy`/`Reflect`; class instances and DOM objects remain intact. Targets modern evergreen browsers — not available in Internet Explorer.

**Initial field values (defaults like `name = 'Anonymous'`) are NOT reflected to attributes.** Only changes made via the property setter are reflected. `attribute: false` disables attribute sync entirely.

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

## Boolean Properties

```typescript
@property({ type: Boolean })
enabled = false;
```

- `<element>` or `<element enabled="">` -> `true`
- `<element enabled="true">` -> `true`
- `<element enabled="false">` -> `false`
- No attribute -> `false`

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

## `SimpleArray` Type

Safe reflection of arrays containing basic types.

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

```html
<tag-list tags="react，vue，angular"></tag-list>
```

- Separator: full-width comma (，)
- Supports string, number, and boolean types
- Type-safe serialization
