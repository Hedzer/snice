# snice

A lightweight TypeScript framework for building web components with decorators and routing.

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

```typescript
import { element, property } from 'snice';

@element('my-counter')
class MyCounter extends HTMLElement {
  @property()
  count = 0;

  html() {
    return `
      <button id="btn">Count: ${this.count}</button>
    `;
  }
}
```

## Events

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

## Complete Example

```typescript
import { element, property, on, query } from 'snice';

@element('todo-app')
class TodoApp extends HTMLElement {
  @property()
  todos: string[] = [];

  @query('input')
  input?: HTMLInputElement;

  html() {
    return `
      <div class="todo-app">
        <input type="text" placeholder="Add todo" />
        <button>Add</button>
        <ul>
          ${this.todos.map((todo, i) => `
            <li>
              ${todo}
              <button data-index="${i}">Delete</button>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  css() {
    return `
      .todo-app {
        max-width: 400px;
        margin: 0 auto;
      }
      input {
        width: 200px;
        padding: 5px;
      }
      button {
        padding: 5px 10px;
      }
    `;
  }

  @on('click', 'button:not([data-index])')
  addTodo() {
    if (this.input?.value) {
      this.todos = [...this.todos, this.input.value];
      this.innerHTML = this.html();
      this.input = this.querySelector('input');
      this.input!.value = '';
    }
  }

  @on('click', 'button[data-index]')
  deleteTodo(e: Event) {
    const index = (e.target as HTMLElement).dataset.index;
    this.todos = this.todos.filter((_, i) => i !== Number(index));
    this.innerHTML = this.html();
  }
}
```

## That's It!

No build step required for development. Just import and use.

## License

MIT