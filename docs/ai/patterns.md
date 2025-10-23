# Common Patterns

## Element
```typescript
@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number }) count = 0;

  @render()
  renderContent() {
    return html`
      <div>${this.count}</div>
      <button @click=${() => this.count++}>+</button>
    `;
  }

  @styles()
  componentStyles() {
    return css`:host { display: block; }`;
  }
}
```

## Controller
```typescript
@controller('data-loader')
class DataLoader implements IController {
  element: HTMLElement;

  async attach(el: HTMLElement) {
    this.element = el;
  }

  async detach() {}

  @on('click', '.item')
  handleClick(e: Event) {}
}

// Usage: <my-list controller="data-loader"></my-list>
```

## Page + Router
```typescript
// main.ts
const { page, navigate, initialize } = Router({
  target: '#app',
  context: new AppContext(),
  layout: 'app-shell'
});

// page.ts
@page({ tag: 'user-page', routes: ['/users/:id'], guards: isAuth })
class UserPage extends HTMLElement {
  @property() id = '';
  private appContext?: AppContext;

  @context()
  handleContext(ctx: Context<AppContext>) {
    this.appContext = ctx.application;
    this.requestRender();
  }

  @ready()
  async load() {
    const user = await fetch(`/api/users/${this.id}`).then(r => r.json());
    // ...
  }
}
```

## Layout
```typescript
@layout('app-shell')
class AppShell extends HTMLElement implements Layout {
  placards: Placard[] = [];
  route = '';

  @render()
  renderContent() {
    return html`
      <nav>${this.placards.map(p => html`<a href="#/${p.name}">${p.title}</a>`)}</nav>
      <slot name="page"></slot>
    `;
  }

  update(ctx, placards, route, params) {
    this.placards = placards;
    this.route = route;
  }
}
```

## Request/Response
```typescript
// Controller
@controller('api')
class API {
  @respond('fetch-user')
  async fetchUser(req, respond) {
    const user = await fetch(`/api/users/${req.id}`).then(r => r.json());
    respond(user);
  }
}

// Element
@element('user-profile')
class UserProfile extends HTMLElement {
  @request('fetch-user')
  fetchUser!: (data: { id: string }) => Promise<User>;

  async loadUser(id: string) {
    const user = await this.fetchUser({ id });
  }
}
```

## Conditional Rendering
```typescript
html`
  <if ${isLoggedIn}>
    <span>Welcome, ${user.name}</span>
  </if>
  <if ${!isLoggedIn}>
    <a href="/login">Login</a>
  </if>

  <case ${status}>
    <when value="loading"><spinner></spinner></when>
    <when value="error"><error-msg></error-msg></when>
    <default><content></content></default>
  </case>
`
```

## Lists + Keys
```typescript
html`
  <ul>
    ${items.map(item => html`
      <li key=${item.id}>
        ${item.name}
        <button @click=${() => this.remove(item.id)}>×</button>
      </li>
    `)}
  </ul>
`
```

## Form Binding
```typescript
@element('my-form')
class MyForm extends HTMLElement {
  @property() value = '';
  @property({ type: Boolean }) disabled = false;

  @render()
  renderContent() {
    return html`
      <input
        .value=${this.value}
        ?disabled=${this.disabled}
        @input=${(e: Event) => {
          this.value = (e.target as HTMLInputElement).value;
          this.dispatchValueChange();
        }}
      />
    `;
  }

  @dispatch('value-changed')
  dispatchValueChange() {
    return { value: this.value };
  }
}
```

## Keyboard Shortcuts
```typescript
@element('editor')
class Editor extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <textarea
        @keydown:ctrl+s=${this.save}
        @keydown:ctrl+z=${this.undo}
        @keydown:escape=${this.close}
      ></textarea>
    `;
  }

  @on('keydown:ctrl+shift+s')
  saveAs() {}
}
```

## Watchers
```typescript
@element('data-viewer')
class DataViewer extends HTMLElement {
  @property() userId = '';
  @property() data = null;

  @watch('userId')
  async onUserIdChange(oldId, newId) {
    if (newId) {
      this.data = await fetch(`/api/users/${newId}`).then(r => r.json());
    }
  }
}
```

## Observers
```typescript
@element('resize-detector')
class ResizeDetector extends HTMLElement {
  @query('.content') content!: HTMLElement;

  @observe(() => this.content, { childList: true, subtree: true })
  handleMutation(mutations: MutationRecord[]) {
    console.log('Content changed', mutations);
  }
}
```

## Debounce/Throttle
```typescript
@element('search-box')
class SearchBox extends HTMLElement {
  @render()
  renderContent() {
    return html`
      <input @input=${this.search} />
    `;
  }

  @on('input', 'input', { debounce: 300 })
  search(e: Event) {
    const query = (e.target as HTMLInputElement).value;
    // Debounced search
  }
}
```
