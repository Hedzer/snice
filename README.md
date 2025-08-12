# Snice

A lightweight TypeScript framework for building web components with decorators and routing.

## Core Concepts

Snice provides a clear separation of concerns through three main decorators:

- **`@element`** - Creates custom HTML elements with encapsulated visual behavior and styling
- **`@controller`** - Handles data fetching, server communication, and business logic separate from visual components  
- **`@page`** - Sets up routing and navigation between different views

This separation keeps your components focused: elements handle presentation, controllers manage data, and pages define navigation.

## Quick Start

```bash
npm install
npm run build
```

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
import { element, dispatch, on } from 'snice';

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

// Start the router
initialize();

// Navigate programmatically
navigate('/about');
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

  async detach() {
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
    this.innerHTML = this.html();
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

@controller('user-controller')
class UserController {
  @channel('get-data')
  handleGetData(request) {
    console.log(request);  // { id: 123 }
    return { name: 'Alice' };
  }
}

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
    this.element = element;
    
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

## License

MIT