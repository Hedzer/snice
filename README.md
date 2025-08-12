# Snice

A lightweight TypeScript framework for building web components with decorators and routing.

## Core Philosophy: Imperative, Not Reactive

Snice takes an **imperative approach** to web components. Unlike reactive frameworks that automatically re-render when data changes, Snice components:

- **Render once** when connected to the DOM
- **Never re-render** automatically
- Require **explicit method calls** to update visual state
- Give you **full control** over when and how updates happen

This approach eliminates the complexity of reactive systems, virtual DOM diffing, and unexpected re-renders. You write straightforward code that does exactly what you tell it to do.

## Core Concepts

Snice provides a clear separation of concerns through decorators:

### Component Decorators
- **`@element`** - Creates custom HTML elements with encapsulated visual behavior and styling
- **`@controller`** - Handles data fetching, server communication, and business logic separate from visual components  
- **`@page`** - Sets up routing and navigation between different views

### Property & Query Decorators
- **`@property`** - Declares properties that can reflect to attributes
- **`@query`** - Queries a single element from shadow DOM
- **`@queryAll`** - Queries multiple elements from shadow DOM

### Event Decorators
- **`@on`** - Listens for events on elements
- **`@dispatch`** - Dispatches custom events after method execution
- **`@channel`** - Enables bidirectional communication between elements and controllers

This separation keeps your components focused: elements handle presentation, controllers manage data, and pages define navigation.

## Basic Component

```typescript
import { element } from 'snice';

@element('my-button')
class MyButton extends HTMLElement {
  html() {
    return `<button>Click me</button>`;
  }
}
```

That's it. Your component renders when added to the DOM:

```html
<my-button></my-button>
```

## The Imperative Way

In Snice, updates are explicit. Components expose methods that controllers or other components call to update state:

```typescript
import { element, property, query } from 'snice';

@element('counter-display')
class CounterDisplay extends HTMLElement {
  @property({ type: Number })
  count = 0;
  
  @query('.count')
  countElement?: HTMLElement;
  
  @query('.status')
  statusElement?: HTMLElement;

  html() {
    // Renders ONCE - no automatic re-rendering
    return `
      <div class="counter">
        <span class="count">${this.count}</span>
        <span class="status">Ready</span>
      </div>
    `;
  }
  
  // Imperative update methods - YOU control when updates happen
  setCount(newCount: number) {
    this.count = newCount;
    if (this.countElement) {
      this.countElement.textContent = String(newCount);
    }
  }
  
  setStatus(status: string) {
    if (this.statusElement) {
      this.statusElement.textContent = status;
    }
  }
  
  increment() {
    this.setCount(this.count + 1);
    this.setStatus('Incremented!');
  }
}
```

**Key Points:**
- The `html()` method runs **once** when the element connects
- Updates happen through **explicit method calls** like `setCount()`
- You have **full control** over what updates and when
- No surprises, no magic, no hidden re-renders

## Properties

Properties can be reflected to attributes but do NOT trigger re-renders. The HTML is rendered once when the element connects to the DOM. Use properties for initial configuration.

```typescript
import { element, property } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  @property({ reflect: true })
  name = 'Anonymous';
  
  @property({ reflect: true })
  role = 'User';
  
  @property({ type: Boolean })
  verified = false;

  html() {
    // This renders ONCE with the initial property values
    return `
      <div class="card">
        <h3>${this.name}</h3>
        <span class="role">${this.role}</span>
        ${this.verified ? '<span class="badge">✓ Verified</span>' : ''}
      </div>
    `;
  }
}
```

Use it with attributes:
```html
<user-card name="Jane Doe" role="Admin" verified></user-card>
```


## Queries

Query single elements with `@query`:

```typescript
import { element, query } from 'snice';

@element('my-form')
class MyForm extends HTMLElement {
  @query('input')
  input?: HTMLInputElement;

  html() {
    return `<input type="text" />`;
  }

  getValue() {
    return this.input?.value;
  }
}
```

Query multiple elements with `@queryAll`:

```typescript
import { element, queryAll } from 'snice';

@element('checkbox-group')
class CheckboxGroup extends HTMLElement {
  @queryAll('input[type="checkbox"]')
  checkboxes?: NodeListOf<HTMLInputElement>;

  html() {
    return `
      <input type="checkbox" value="option1" />
      <input type="checkbox" value="option2" />
      <input type="checkbox" value="option3" />
    `;
  }

  getSelectedValues() {
    if (!this.checkboxes) return [];
    return Array.from(this.checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
  }
}
```

## Events

Listen for events with `@on`:

```typescript
import { element, on } from 'snice';

@element('my-clicker')
class MyClicker extends HTMLElement {
  html() {
    return `<button>Click me</button>`;
  }

  @on('click', 'button')
  handleClick() {
    console.log('Button clicked!');
  }
}
```

## Dispatching Events

Automatically dispatch custom events with `@dispatch`:

```typescript
import { element, dispatch, on, query } from 'snice';

@element('toggle-switch')
class ToggleSwitch extends HTMLElement {
  private isOn = false;

  @query('.toggle')
  toggleButton?: HTMLElement;

  html() {
    return `
      <button class="toggle">
        <span class="slider"></span>
      </button>
    `;
  }
  
  css() {
    return `...`;
  }
  
  @on('click', '.toggle')
  @dispatch('toggled')
  toggle() {
    this.isOn = !this.isOn;
    this.toggleButton?.classList.toggle('on', this.isOn);

    // Return value becomes event detail
    return { on: this.isOn };
  }
}
```

The `@dispatch` decorator:
- Dispatches after the method completes
- Uses the return value as the event detail
- Works with async methods
- Bubbles by default

```typescript
// With options from EventInit
@dispatch('my-event', { bubbles: false, cancelable: true })

// Don't dispatch if method returns undefined
@dispatch('maybe-data', { dispatchOnUndefined: false })
```

## Styling

```typescript
@element('styled-card')
class StyledCard extends HTMLElement {
  html() {
    return `<div class="card">Hello</div>`;
  }

  css() {
    return `
      .card {
        padding: 20px;
        background: #f0f0f0;
        border-radius: 8px;
      }
    `;
  }
}
```

CSS is automatically scoped to your component.

## Routing

```typescript
import { Router } from 'snice';

const router = Router({
  target: '#app',
  routing_type: 'hash'
});

const { page, navigate, initialize } = router;

@page({ tag: 'home-page', routes: ['/'] })
class HomePage extends HTMLElement {
  html() {
    return `<h1>Home</h1>`;
  }
}

@page({ tag: 'about-page', routes: ['/about'] })
class AboutPage extends HTMLElement {
  html() {
    return `<h1>About</h1>`;
  }
}

// Page with URL parameter  
import { property } from 'snice';

@page({ tag: 'user-page', routes: ['/users/:userId'] })
class UserPage extends HTMLElement {
  @property()
  userId = '';
  
  html() {
    return `<h1>User ${this.userId}</h1>`;
  }
}

// Start the router
initialize();

// Navigate programmatically
navigate('/about');
navigate('/users/123');  // Sets id="123" on UserPage
```

## Controllers (Data Fetching)

Controllers handle server communication separately from visual components:

```typescript
import { controller, element } from 'snice';

@controller('user-controller')
class UserController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    const response = await fetch('/api/users');
    const users = await response.json();
    (element as any).setUsers(users);
  }

  async detach(element: HTMLElement) {
    // Cleanup
  }
}

@element('user-list')
class UserList extends HTMLElement {
  users: any[] = [];

  html() {
    return `
      <ul>
        ${this.users.map(u => `<li>${u.name}</li>`).join('')}
      </ul>
    `;
  }

  setUsers(users: any[]) {
    this.users = users;
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = this.html();
    }
  }
}
```

Use it:

```html
<user-list controller="user-controller"></user-list>
```

## Channels

Request/response between elements and controllers:

```typescript
// --- components/user-card.ts
@element('user-card')
class UserCard extends HTMLElement {
  @channel('get-data')
  async *fetchUserData() {
    // Yield sends request, await waits for response
    const user = await (yield { id: 123 });
    return user;
  }
  
  async loadUser() {
    const user = await this.fetchUserData();
    console.log(user);  // { name: 'Alice' }
  }
}

// --- controllers/user-controller.ts
@controller('user-controller')
class UserController {
  element: HTMLElement | null = null;
  
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}
  
  @channel('get-data')
  handleGetData(request) {
    console.log(request);  // { id: 123 }
    return { name: 'Alice' };
  }
}
```

## Complete Example

Here's how the pieces work together - a generic display component filled by a controller:

```typescript
import { element, controller, query } from 'snice';

// Generic card component - purely visual
@element('info-card')
class InfoCard extends HTMLElement {
  @query('.title')
  titleElement?: HTMLElement;
  
  @query('.content')
  contentElement?: HTMLElement;
  
  @query('.footer')
  footerElement?: HTMLElement;

  html() {
    return `
      <div class="card">
        <h2 class="title">Loading...</h2>
        <div class="content">
          <div class="skeleton"></div>
        </div>
        <div class="footer"></div>
      </div>
    `;
  }

  css() {
    return `
      .card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        max-width: 400px;
      }
      .title {
        margin: 0 0 15px 0;
        color: #333;
      }
      .content {
        min-height: 60px;
      }
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        height: 20px;
        border-radius: 4px;
        animation: loading 1.5s infinite;
      }
      .footer {
        margin-top: 15px;
        font-size: 0.9em;
        color: #666;
      }
      @keyframes loading {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
      }
    `;
  }
  
  // Methods the controller can call to update the display
  setTitle(title: string) {
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }
  }
  
  setContent(html: string) {
    if (this.contentElement) {
      this.contentElement.innerHTML = html;
    }
  }
  
  setFooter(text: string) {
    if (this.footerElement) {
      this.footerElement.textContent = text;
    }
  }
}

// Controller that fetches and populates data
@controller('weather-controller')
class WeatherController {
  element: HTMLElement | null = null;
  
  async attach(element: HTMLElement) {
    
    // Simulate fetching weather data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const weatherData = {
      location: 'San Francisco',
      temp: '72°F',
      conditions: 'Partly Cloudy',
      humidity: '65%'
    };
    
    // Update the generic card with specific data
    (element as any).setTitle(weatherData.location);
    (element as any).setContent(`
      <p><strong>${weatherData.temp}</strong></p>
      <p>${weatherData.conditions}</p>
      <p>Humidity: ${weatherData.humidity}</p>
    `);
    (element as any).setFooter('Updated just now');
  }
  
  async detach(element: HTMLElement) {
    // Cleanup if needed
  }
}
```

Use the same card with different controllers:
```html
<!-- Weather widget -->
<info-card controller="weather-controller"></info-card>

<!-- Stock widget - same card, different controller -->
<info-card controller="stock-controller"></info-card>

<!-- News widget - same card, different controller -->
<info-card controller="news-controller"></info-card>
```

## Decorator Reference

### Component Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@element(tagName)` | Defines a custom HTML element | `@element('my-button')` |
| `@controller(name)` | Creates a data controller | `@controller('user-controller')` |
| `@page(options)` | Defines a routable page component | `@page({ tag: 'home-page', routes: ['/'] })` |

### Property Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@property(options)` | Declares a property that can reflect to attributes | `@property({ type: Boolean, reflect: true })` |
| `@query(selector)` | Queries a single element from shadow DOM | `@query('.button')` |
| `@queryAll(selector)` | Queries multiple elements from shadow DOM | `@queryAll('input[type="checkbox"]')` |

### Event Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@on(event, selector?)` | Listens for DOM events | `@on('click', '.button')` |
| `@dispatch(eventName, options?)` | Dispatches custom events after method execution | `@dispatch('data-updated')` |
| `@channel(name, options?)` | Enables request/response communication | `@channel('fetch-data')` |

### Property Options

```typescript
interface PropertyOptions {
  type?: typeof String | typeof Number | typeof Boolean | typeof Array | typeof Object;  // Type converter
  reflect?: boolean;        // Reflect property to attribute
  attribute?: string | boolean;  // Custom attribute name or false to disable
  converter?: PropertyConverter;  // Custom converter
  hasChanged?: (value: any, oldValue: any) => boolean;  // Custom change detector
}

interface PropertyConverter {
  fromAttribute?(value: string | null, type?: any): any;
  toAttribute?(value: any, type?: any): string | null;
}
```

### Dispatch Options

```typescript
interface DispatchOptions extends EventInit {
  dispatchOnUndefined?: boolean;  // Whether to dispatch when method returns undefined
}
```

## Documentation

- [Elements API](./docs/elements.md) - Complete guide to creating elements with properties, queries, and styling
- [Controllers API](./docs/controllers.md) - Data fetching, business logic, and controller patterns
- [Events API](./docs/events.md) - Event handling, dispatching, and custom events
- [Channels API](./docs/channels.md) - Bidirectional communication between elements and controllers
- [Routing API](./docs/routing.md) - Single-page application routing with transitions
- [Migration Guide](./docs/migration-guide.md) - Migrating from React, Vue, Angular, and other frameworks

## License

MIT