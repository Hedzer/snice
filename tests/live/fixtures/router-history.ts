import { Router, html, render } from '../../../packages/core/src/index';

const requestedType = new URL(location.href).searchParams.get('type');
const type = requestedType === 'pushstate' ? 'pushstate' : 'hash';
if (type === 'pushstate') history.replaceState(null, '', '/');

const { page, initialize, navigate } = Router({ target: '#app', type });

@page({ tag: 'router-history-home', routes: ['/'] })
class RouterHistoryHome extends HTMLElement {
  @render()
  renderPage() {
    return html`<h1>Home</h1>`;
  }
}

@page({ tag: 'router-history-about', routes: ['/about'] })
class RouterHistoryAbout extends HTMLElement {
  @render()
  renderPage() {
    return html`<h1>About</h1>`;
  }
}

Object.assign(window, { routerNavigate: navigate });
initialize();

declare global {
  interface Window {
    routerNavigate(path: string): Promise<void>;
  }
}
