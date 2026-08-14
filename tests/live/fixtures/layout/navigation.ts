class AppLayout extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display: block; }
        .navbar { display: flex; gap: 1rem; }
        .main-content { display: block; }
      </style>
      <nav class="navbar">
        <a href="#/">Home</a>
        <a href="#/todos">Todos</a>
        <a href="#/about">About</a>
      </nav>
      <main class="main-content"><slot name="page"></slot></main>
    `;
  }
}

class HomePage extends HTMLElement {}
class TodoPage extends HTMLElement {}
class AboutPage extends HTMLElement {}

customElements.define('app-layout', AppLayout);
customElements.define('home-page', HomePage);
customElements.define('todo-page', TodoPage);
customElements.define('about-page', AboutPage);

const app = document.querySelector('#app')!;
const layout = document.createElement('app-layout');
app.appendChild(layout);

const routes: Record<string, { tag: string; text: string }> = {
  '/': { tag: 'home-page', text: 'Home' },
  '/todos': { tag: 'todo-page', text: 'Todos' },
  '/about': { tag: 'about-page', text: 'About' },
};

function renderRoute() {
  const path = location.hash.slice(1) || '/';
  const route = routes[path] || routes['/'];
  layout.querySelector('[slot="page"]')?.remove();
  const page = document.createElement(route.tag);
  page.slot = 'page';
  page.textContent = route.text;
  layout.appendChild(page);
}

window.addEventListener('hashchange', renderRoute);
renderRoute();
