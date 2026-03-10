#!/usr/bin/env node
import { mkdirSync, cpSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const out = join(root, 'public');

try { mkdirSync(out, { recursive: true }); } catch {}

mkdirSync(join(out, 'theme'), { recursive: true });
cpSync(join(root, 'components/theme/theme.css'), join(out, 'theme/theme.css'));

const cdnDir = join(root, 'dist/cdn');
const componentsOut = join(out, 'components');
mkdirSync(componentsOut, { recursive: true });
mkdirSync(cdnDir, { recursive: true });

const components = readdirSync(cdnDir).filter(c => c !== 'runtime').sort();
for (const comp of components) {
  const src = join(cdnDir, comp, `snice-${comp}.min.js`);
  try { cpSync(src, join(componentsOut, `snice-${comp}.min.js`)); } catch {}
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

// Shared CSS
const css = `/* Snice website styles */
* { box-sizing: border-box; margin: 0; padding: 0; }
/* scroll-behavior: smooth removed - caused unwanted page scroll */
body {
  font-family: var(--snice-font-family);
  background: var(--snice-color-background);
  color: var(--snice-color-text);
  line-height: 1.6;
  font-size: 15px;
}
a { color: var(--snice-color-primary); }
code { font-family: var(--snice-font-family-mono); }
.wrap { max-width: 1100px; margin: 0 auto; padding: 0 2rem; }

header {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--snice-color-border);
  position: sticky;
  top: 0;
  background: var(--snice-color-background);
  z-index: 100;
}
header .wrap { display: flex; justify-content: space-between; align-items: center; }
header h1 { font-size: 1.25rem; font-weight: 600; }
header h1 a { color: inherit; text-decoration: none; }
header nav { display: flex; gap: 1.5rem; align-items: center; }
header nav a { color: var(--snice-color-text-secondary); text-decoration: none; font-size: 0.9rem; }
header nav a:hover, header nav a.active { color: var(--snice-color-text); }
.theme-btn {
  background: none; border: none; color: var(--snice-color-text-secondary);
  cursor: pointer; padding: 0.25rem;
}
.theme-btn:hover { color: var(--snice-color-text); }

.hero {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem;
  padding: 4rem 0;
  align-items: start;
}
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; gap: 2rem; } }
.hero-text h2 {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  letter-spacing: -0.03em;
}
.hero-text p {
  color: var(--snice-color-text-secondary);
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  max-width: 400px;
}
.hero-text .install {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--snice-color-background-secondary);
  border: 1px solid var(--snice-color-border);
  border-radius: 6px;
  padding: 0.6rem 1rem;
  font-family: var(--snice-font-family-mono);
  font-size: 0.9rem;
}
.hero-text .install button {
  background: none; border: none; color: var(--snice-color-text-tertiary);
  cursor: pointer; padding: 0;
}
.hero-text .install button:hover { color: var(--snice-color-primary); }
.hero-code pre {
  background: var(--snice-color-background-tertiary);
  border: 1px solid var(--snice-color-border);
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 0.8rem;
  line-height: 1.7;
  overflow-x: auto;
}

/* Syntax highlighting */
.c { color: hsl(var(--snice-color-gray-500)); }
.k { color: hsl(300 50% 65%); }
.s { color: hsl(25 70% 60%); }
.d { color: hsl(50 80% 70%); }
.t { color: hsl(170 60% 55%); }
.f { color: hsl(210 80% 75%); }
.h { color: hsl(355 70% 65%); }

.pitch {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--snice-color-border);
  border: 1px solid var(--snice-color-border);
  border-radius: 8px;
  overflow: hidden;
  margin: 3rem 0;
}
@media (max-width: 700px) { .pitch { grid-template-columns: repeat(2, 1fr); } }
.pitch-item {
  background: var(--snice-color-background);
  padding: 1.25rem;
}
.pitch-item strong { display: block; font-size: 0.9rem; margin-bottom: 0.25rem; }
.pitch-item span { font-size: 0.8rem; color: var(--snice-color-text-secondary); }

.templates-section, .mcp-section {
  margin: 3rem 0;
  padding: 2rem;
  background: var(--snice-color-surface);
  border: 1px solid var(--snice-color-border);
  border-radius: 8px;
}
.templates-section h3, .mcp-section h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.templates-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}
@media (max-width: 600px) { .templates-grid { grid-template-columns: 1fr; } }
.template-card {
  padding: 1.5rem;
  background: var(--snice-color-background);
  border: 1px solid var(--snice-color-border);
  border-radius: 6px;
}
.template-card h4 { font-size: 1rem; margin-bottom: 0.5rem; }
.template-card p { font-size: 0.85rem; color: var(--snice-color-text-secondary); margin-bottom: 1rem; }
.template-card .install { margin: 0; }
.template-card .install code { font-size: 0.75rem; }
.mcp-section p { color: var(--snice-color-text-secondary); margin-bottom: 1rem; font-size: 0.9rem; }

.page-title {
  padding: 3rem 0 2rem;
  border-bottom: 1px solid var(--snice-color-border);
  margin-bottom: 2rem;
}
.page-title h2 { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
.page-title p { color: var(--snice-color-text-secondary); }

/* Decorators page */
.dec-section {
  padding: 2rem 0;
  border-bottom: 1px solid var(--snice-color-border);
}
.dec-section:last-child { border-bottom: none; }
.dec-section h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--snice-color-primary);
}
.dec-section h3 code { font-size: 1.1rem; }
.dec-section .desc {
  color: var(--snice-color-text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.dec-section pre {
  background: var(--snice-color-background-tertiary);
  border: 1px solid var(--snice-color-border);
  border-radius: 6px;
  padding: 1rem;
  font-size: 0.75rem;
  line-height: 1.6;
  overflow-x: auto;
}
.dec-section .doc-link {
  margin-top: 0.75rem;
  font-size: 0.8rem;
}

/* Components page */
.comp-section {
  padding: 2rem 0;
  border-bottom: 1px solid var(--snice-color-border);
}
.comp-section:last-child { border-bottom: none; }
.comp-section h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
.comp-desc {
  color: var(--snice-color-text-tertiary);
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
.comp-demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}
.comp-demo-large {
  background: var(--snice-color-background-secondary);
  border: 1px solid var(--snice-color-border);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.comp-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 2rem;
}
.comp-tag {
  background: var(--snice-color-background-secondary);
  border: 1px solid var(--snice-color-border);
  border-radius: 3px;
  padding: 0.25rem 0.5rem;
  font-family: var(--snice-font-family-mono);
  font-size: 0.7rem;
  color: var(--snice-color-text-tertiary);
}

footer {
  border-top: 1px solid var(--snice-color-border);
  padding: 2rem 0;
  margin-top: 2rem;
  font-size: 0.8rem;
  color: var(--snice-color-text-tertiary);
}
footer .wrap { display: flex; justify-content: space-between; }
footer a { color: var(--snice-color-text-secondary); text-decoration: none; }
`;

const header = (active) => `
  <header>
    <div class="wrap">
      <h1><a href="index.html" style="display:inline-flex;align-items:center;gap:0.5rem"><img src="images/snice-logo.png" alt="Snice" width="28" height="28" style="border-radius:50%">Snice</a></h1>
      <nav>
        <a href="guide.html"${active === 'guide' ? ' class="active"' : ''}>Guide</a>
        <a href="docs.html"${active === 'docs' ? ' class="active"' : ''}>Docs</a>
        <a href="decorators.html"${active === 'decorators' ? ' class="active"' : ''}>Decorators</a>
        <a href="components.html"${active === 'components' ? ' class="active"' : ''}>Components</a>
        <a href="themes.html"${active === 'themes' ? ' class="active"' : ''}>Themes</a>

        <a href="https://gitlab.com/Hedzer/snice">Source</a>
        <button class="theme-btn" onclick="var t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',t);localStorage.setItem('snice-theme',t)" title="Toggle theme">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        </button>
        <a href="themes.html" id="theme-dot" class="theme-dot" hidden></a>
      </nav>
    </div>
  </header>`;

const footer = `
  <footer>
    <div class="wrap">
      <span>Snice v${pkg.version} · MIT</span>
      <span><a href="https://www.npmjs.com/package/snice">npm</a> · <a href="https://gitlab.com/Hedzer/snice">GitLab</a></span>
    </div>
  </footer>`;

const head = (title) => `<!-- GENERATED FILE — do not edit directly. Source: scripts/build-website.js -->
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<script>document.documentElement.setAttribute('data-theme',localStorage.getItem('snice-theme')||'dark')</script>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Load runtime + code-block + grammars first to prevent layout shift -->
  <script src="components/snice-runtime.min.js"></script>
  <script src="components/snice-code-block.min.js"></script>
  <script>fetch('grammars/snice.json');</script>
  <title>${title} - Snice</title>
  <meta name="description" content="TypeScript web components with separation of concerns">
  <link rel="icon" type="image/png" href="images/snice-logo.png">
  <meta property="og:title" content="${title} - Snice">
  <meta property="og:description" content="TypeScript web components with separation of concerns">
  <meta property="og:image" content="images/snice-logo.png">
  <link rel="stylesheet" href="theme/theme.css">
  <link rel="stylesheet" href="styles.css">
  <script>(function(){var p=localStorage.getItem('snice-theme-preset');var c=localStorage.getItem('snice-theme-custom');if(p){var s=document.createElement('style');s.id='snice-theme-preset';s.textContent=p;document.head.appendChild(s)}if(c){var s=document.createElement('style');s.id='snice-theme-custom';s.textContent=c;document.head.appendChild(s)}var n=localStorage.getItem('snice-theme-preset-name');if(n&&n!=='default'){document.addEventListener('DOMContentLoaded',function(){var d=document.getElementById('theme-dot');if(d){d.hidden=false;d.title=n.charAt(0).toUpperCase()+n.slice(1)+' theme';d.style.background='var(--snice-color-primary)'}})}})()</script>
</head>
<body>`;

// INDEX PAGE
const indexHtml = `${head('Home')}
${header('home')}
  <main class="wrap">
    <section class="hero">
      <div class="hero-text">
        <h2>Web components with clear governance</h2>
        <p>Pages fetch data. Elements render UI. Controllers swap behavior. Keep your code where it belongs.</p>
        <div class="install">
          <code>npm install snice</code>
          <button onclick="navigator.clipboard.writeText('npm install snice')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="hero-code">
        <pre><code><span class="d">@element</span>(<span class="s">'user-card'</span>)
<span class="k">class</span> <span class="t">UserCard</span> <span class="k">extends</span> HTMLElement {
  <span class="d">@property</span>() name = <span class="s">''</span>;
  <span class="d">@property</span>() role = <span class="s">''</span>;

  <span class="d">@render</span>()
  <span class="f">template</span>() {
    <span class="k">return</span> html\`
      &lt;div class="card"&gt;
        &lt;h3&gt;\${this.name}&lt;/h3&gt;
        &lt;span&gt;\${this.role}&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }
}
<span class="c">// &lt;user-card name="Alice" role="Engineer"&gt;</span></code></pre>
      </div>
    </section>

    <div class="pitch">
      <div class="pitch-item"><strong>Pages</strong><span>Fetch data, understand intent</span></div>
      <div class="pitch-item"><strong>Elements</strong><span>Pure UI, no business logic</span></div>
      <div class="pitch-item"><strong>Controllers</strong><span>Swap behavior at runtime</span></div>
      <div class="pitch-item"><strong>Context</strong><span>Global state, one place</span></div>
    </div>

    <section class="templates-section">
      <h3>Quick Start</h3>
      <div class="templates-grid">
        <div class="template-card">
          <h4>Snice App</h4>
          <p>Routing, auth, guards, middleware, services</p>
          <div class="install">
            <code>npx snice create-app my-app</code>
            <button onclick="navigator.clipboard.writeText('npx snice create-app my-app')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="template-card">
          <h4>React + Snice</h4>
          <p>React router, hooks, guards, layouts</p>
          <div class="install">
            <code>npx snice create-app my-app --template=react</code>
            <button onclick="navigator.clipboard.writeText('npx snice create-app my-app --template=react')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="mcp-section">
      <h3>AI-Assisted Development</h3>
      <p>Use the snice MCP server with Claude Code for intelligent component scaffolding and documentation lookup.</p>
      <div class="install">
        <code>claude mcp add snice -- npx snice mcp</code>
        <button onclick="navigator.clipboard.writeText('claude mcp add snice -- npx snice mcp')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </section>
  </main>
${footer}
</body>
</html>`;

// DECORATORS PAGE
const decoratorsHtml = `${head('Decorators & Patterns')}
${header('decorators')}
  <main class="wrap">

    <div class="dec-section">
      <h3><code>@element</code></h3>
      <p class="desc">Register a custom element. Extends HTMLElement with reactive properties and lifecycle.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@element('my-card')
class MyCard extends HTMLElement {
  @property() title = '';
  @property({ type: Number }) count = 0;

  @render()
  template() {
    return html\`&lt;h1&gt;\${this.title}&lt;/h1&gt;\`;
  }
}</snice-code-block>
      <p class="doc-link"><a href="docs.html#elements">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@page</code></h3>
      <p class="desc">Routable page component with route parameters, guards, and lifecycle hooks.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Guard receives context + route params
const auth: Guard&lt;AppContext&gt; = (ctx, params) =&gt; ctx.isAuthenticated();

@page({ tag: 'user-page', routes: ['/users/:id'], guards: [auth] })
class UserPage extends HTMLElement {
  // Route param :id auto-binds to this property
  @property() id = '';
  @property() user = null;

  @ready()
  async load() {
    // this.id is already set from URL
    this.user = await fetch(\`/api/users/\${this.id}\`).then(r =&gt; r.json());
  }
}</snice-code-block>
      <p class="doc-link"><a href="docs.html#routing">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@controller</code></h3>
      <p class="desc">Hot-swap logic on any element — keep your UI, change what it does.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@controller('weather')
class WeatherData {
  async attach(el) {
    const data = await fetch('/api/weather').then(r =&gt; r.json());
    this.city = data.city;
    el.icon = 'cloud';
    el.label = data.city;
    el.value = \`\${data.temp}°\`;
  }

  @on('click')
  viewDetails() {
    navigate(\`/weather/\${this.city}\`);
  }
}

&lt;stat-card controller="weather"&gt;&lt;/stat-card&gt;</snice-code-block>
      <p class="doc-link"><a href="docs.html#controllers">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@layout</code></h3>
      <p class="desc">Page wrapper for the routing system. Layouts persist across route changes and wrap page content.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@layout('app-shell')
class AppShell extends HTMLElement {
  @render()
  template() {
    return html\`
      &lt;nav&gt;&lt;a href="/"&gt;Home&lt;/a&gt;&lt;/nav&gt;
      &lt;main&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/main&gt;
      &lt;footer&gt;© 2025&lt;/footer&gt;
    \`;
  }
}

// Pages reference the layout
@page({ tag: 'home-page', routes: ['/'], layout: 'app-shell' })
class HomePage extends HTMLElement { }</snice-code-block>
      <p class="doc-link"><a href="docs.html#routing">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@property</code> & <code>@watch</code></h3>
      <p class="desc">Reactive properties that trigger re-renders. Watch for changes.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@property() name = '';
@property({ type: Number }) count = 0;
@property({ type: Boolean, reflect: true }) active = false;

@watch('count')
onCountChange(newVal, oldVal) {
  console.log(\`Count: \${oldVal} → \${newVal}\`);
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@render</code> & <code>@styles</code></h3>
      <p class="desc">Template method with differential rendering. Scoped CSS styles.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@render()
template() {
  return html\`
    &lt;div class="card"&gt;
      &lt;h3&gt;\${this.title}&lt;/h3&gt;
      &lt;if \${this.expanded}&gt;
        &lt;p&gt;\${this.content}&lt;/p&gt;
      &lt;/if&gt;
    &lt;/div&gt;
  \`;
}

@styles()
componentStyles() {
  return css\`
    :host { display: block; }
    .card { padding: 1rem; border-radius: 8px; }
  \`;
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@ready</code> & <code>@dispose</code></h3>
      <p class="desc">Lifecycle hooks for initialization and cleanup.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@ready()
onMount() {
  this.interval = setInterval(() =&gt; this.tick(), 1000);
  console.log('Component connected');
}

@dispose()
cleanup() {
  clearInterval(this.interval);
  this.subscription?.unsubscribe();
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@moved</code> & <code>@adopted</code></h3>
      <p class="desc">Execute when an element is moved between documents (e.g. into an iframe).</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@moved()
onMoved() {
  // Element was moved in the DOM (e.g. reparented)
  this.recalculateLayout();
}

@adopted()
onAdopted() {
  // Element was adopted into a new document (e.g. iframe)
  this.reattachStyles();
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@query</code> & <code>@queryAll</code></h3>
      <p class="desc">DOM element references within shadow DOM.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">@query('input') inputEl;
@queryAll('.item') items;

@ready()
setup() {
  this.inputEl.focus();
  console.log(\`Found \${this.items.length} items\`);
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@on</code> & <code>@dispatch</code></h3>
      <p class="desc">Event delegation and custom event emission.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// @on: delegated event listener
@on('click', '.entry')
editEntry(e) {
  this.selected = e.target.dataset.id;
  this.editing = true;
}

@on('click', 'button.save')
handleSave(e) { this.save(); }

// @dispatch: return value becomes event.detail
@dispatch('status-changed')
updateStatus(status) {
  this.status = status;
  return { status };
}

// Stacked: DOM event triggers custom event
@on('click', '.item')
@dispatch('item-selected')
handleItemClick(e) {
  return { id: e.target.dataset.id };
}</snice-code-block>
      <p class="doc-link"><a href="docs.html#events">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@context</code></h3>
      <p class="desc">Receive router navigation context updates.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Method receives Context on route changes
@context()
handleContext(ctx: Context) {
  this.user = ctx.application.user;
  this.route = ctx.navigation.route;
}</snice-code-block>
      <p class="doc-link"><a href="docs.html#routing">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@observe</code></h3>
      <p class="desc">Watch for intersection, resize, media query, or DOM mutation changes.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Fires when element enters/exits viewport
@observe('self', 'intersection', { threshold: 0.5 })
onVisible(entry: IntersectionObserverEntry) {
  this.visible = entry.isIntersecting;
}

// Fires when element is resized
@observe('self', 'resize')
onResize(entry: ResizeObserverEntry) {
  this.compact = entry.contentRect.width &lt; 400;
}

// Fires when media query matches/unmatches
@observe('self', 'media:(prefers-color-scheme: dark)')
onDarkMode(matches: boolean) {
  this.darkMode = matches;
}

// Fires on child DOM mutations
@observe('self', 'mutation:childList,attributes')
onMutation(records: MutationRecord[]) {
  this.updateCount();
}</snice-code-block>
      <p class="doc-link"><a href="docs.html#observe">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@request</code> & <code>@respond</code></h3>
      <p class="desc">Async generator pattern for parent-child communication.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Requester: async generator yields payload, awaits response
@request('fetch-user')
async *fetchUser(id: string) {
  const user = await (yield { id });
  return user;
}

// Responder: receives payload, returns response
@respond('fetch-user')
async handleFetchUser({ id }) {
  return await fetch(\`/api/users/\${id}\`).then(r =&gt; r.json());
}

// Usage: const user = await this.fetchUser('123');</snice-code-block>
      <p class="doc-link"><a href="docs.html#request-response">Full documentation →</a></p>
    </div>

    <div class="dec-section">
      <h3><code>@debounce</code> & <code>@throttle</code></h3>
      <p class="desc">Rate-limit method execution. Debounce waits for quiet; throttle limits frequency.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Wait 300ms after last call before executing
@debounce(300)
onSearchInput(query: string) {
  this.results = await this.search(query);
}

// Execute at most once per 100ms
@throttle(100)
onScroll(e: Event) {
  this.scrollY = window.scrollY;
}

// Works with @on for event-driven debounce
@on('input', '.search')
@debounce(250)
handleSearch(e: Event) {
  this.query = e.target.value;
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3><code>@once</code> & <code>@memoize</code></h3>
      <p class="desc">Execute a method only once, or cache return values for repeated calls.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Only runs once, subsequent calls are no-ops
@once()
initialize() {
  this.setupWebSocket();
  this.loadConfig();
}

// Cache results — same arguments return cached value
@memoize()
computeExpensiveValue(input: string) {
  return heavyComputation(input);
}

// Per-instance: each element instance runs once
@once(true)
onFirstRender() {
  analytics.track('component-viewed');
}</snice-code-block>
    </div>

    <div class="dec-section">
      <h3>Template Syntax</h3>
      <p class="desc">Property binding, conditionals, loops, and event shortcuts.</p>
      <snice-code-block language="snice" grammar="grammars/snice.json?v=e716039">// Property binding
html\`&lt;input .value=\${this.text}&gt;\`

// Conditionals
html\`&lt;if \${this.loading}&gt;&lt;snice-spinner&gt;&lt;/snice-spinner&gt;&lt;/if&gt;\`
html\`&lt;if \${this.error}&gt;&lt;span&gt;\${this.error}&lt;/span&gt;&lt;/if&gt;\`

// Loops (use .map())
html\`\${this.items.map(item =&gt; html\`&lt;li key=\${item.id}&gt;\${item.name}&lt;/li&gt;\`)}\`

// Keyboard shortcuts
html\`&lt;input @keydown:ctrl+s=\${this.save}&gt;\`
html\`&lt;div @keydown:escape=\${this.close}&gt;\`</snice-code-block>
    </div>
  </main>
${footer}
</body>
</html>`;

// COMPONENTS PAGE
const componentsHtml = `${head('Components')}
${header('components')}
  <main class="wrap">
    <div class="page-title">
      <h2>${components.length} Components</h2>
      <p>Pre-built UI components. Use standalone or with React/Vue/Angular.</p>
    </div>

    <div class="comp-section">
      <h3>Buttons</h3>
      <p class="comp-desc">All variants, sizes, and states</p>
      <div class="comp-demo-row">
        <snice-button variant="default">Default</snice-button>
        <snice-button variant="primary">Primary</snice-button>
        <snice-button variant="success">Success</snice-button>
        <snice-button variant="warning">Warning</snice-button>
        <snice-button variant="danger">Danger</snice-button>
        <snice-button variant="text">Text</snice-button>
      </div>
      <div class="comp-demo-row">
        <snice-button variant="primary" outline>Outline</snice-button>
        <snice-button variant="success" outline>Success</snice-button>
        <snice-button variant="danger" outline>Danger</snice-button>
      </div>
      <div class="comp-demo-row">
        <snice-button variant="primary" size="small">Small</snice-button>
        <snice-button variant="primary" size="medium">Medium</snice-button>
        <snice-button variant="primary" size="large">Large</snice-button>
      </div>
      <div class="comp-demo-row">
        <snice-button variant="primary" pill>Pill Button</snice-button>
        <snice-button variant="primary" circle>+</snice-button>
        <snice-button variant="success" circle>✓</snice-button>
        <snice-button variant="danger" circle>×</snice-button>
      </div>
      <div class="comp-demo-row">
        <snice-button variant="primary" loading>Loading</snice-button>
        <snice-button variant="primary" disabled>Disabled</snice-button>
      </div>
    </div>

    <div class="comp-section">
      <h3>Form Controls</h3>
      <p class="comp-desc">Inputs, selects, toggles, and sliders</p>
      <div class="comp-demo-large">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <snice-input label="Email" placeholder="Enter your email" type="email"></snice-input>
          <snice-input label="Password" placeholder="Enter password" type="password"></snice-input>
        </div>
        <snice-textarea label="Message" placeholder="Type your message here..." rows="3" style="margin-bottom:1rem"></snice-textarea>
        <div style="display:flex;gap:2rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem">
          <snice-checkbox label="Remember me" checked></snice-checkbox>
          <snice-checkbox label="Subscribe to newsletter"></snice-checkbox>
          <snice-switch checked>Notifications</snice-switch>
        </div>
        <div style="display:flex;gap:1rem;align-items:center">
          <snice-radio name="plan" label="Free" value="free" checked></snice-radio>
          <snice-radio name="plan" label="Pro" value="pro"></snice-radio>
          <snice-radio name="plan" label="Enterprise" value="enterprise"></snice-radio>
        </div>
      </div>
      <div class="comp-demo-large">
        <div style="margin-bottom:1rem">
          <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500">Volume</label>
          <snice-slider value="75" show-value></snice-slider>
        </div>
        <div>
          <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500">Rating (1-5)</label>
          <snice-slider min="1" max="5" value="4" step="1" show-value show-ticks variant="warning"></snice-slider>
        </div>
      </div>
    </div>

    <div class="comp-section">
      <h3>Select / Dropdown</h3>
      <p class="comp-desc">Searchable, multi-select, and custom dropdowns</p>
      <div class="comp-demo-large">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <snice-select label="Country" placeholder="Select a country..." searchable clearable>
            <snice-option value="us">United States</snice-option>
            <snice-option value="uk">United Kingdom</snice-option>
            <snice-option value="ca">Canada</snice-option>
            <snice-option value="au">Australia</snice-option>
            <snice-option value="de">Germany</snice-option>
            <snice-option value="fr">France</snice-option>
            <snice-option value="jp">Japan</snice-option>
          </snice-select>
          <snice-select label="Department" value="engineering">
            <snice-option value="engineering">Engineering</snice-option>
            <snice-option value="design">Design</snice-option>
            <snice-option value="marketing">Marketing</snice-option>
            <snice-option value="sales">Sales</snice-option>
          </snice-select>
        </div>
        <snice-select label="Skills" placeholder="Select multiple..." multiple searchable clearable style="width:100%">
          <snice-option value="js">JavaScript</snice-option>
          <snice-option value="ts">TypeScript</snice-option>
          <snice-option value="react">React</snice-option>
          <snice-option value="vue">Vue</snice-option>
          <snice-option value="node">Node.js</snice-option>
          <snice-option value="python">Python</snice-option>
          <snice-option value="go">Go</snice-option>
          <snice-option value="rust">Rust</snice-option>
        </snice-select>
      </div>
    </div>

    <div class="comp-section">
      <h3>Progress & Loading</h3>
      <p class="comp-desc">Linear progress bars and spinners</p>
      <div class="comp-demo-large">
        <div style="margin-bottom:0.75rem">
          <small style="color:var(--snice-color-text-secondary)">Download Progress</small>
          <snice-progress value="65" show-label></snice-progress>
        </div>
        <div style="margin-bottom:0.75rem">
          <small style="color:var(--snice-color-text-secondary)">Upload Complete</small>
          <snice-progress value="100" color="success" show-label></snice-progress>
        </div>
        <div style="margin-bottom:0.75rem">
          <small style="color:var(--snice-color-text-secondary)">Storage Warning</small>
          <snice-progress value="89" color="warning" show-label></snice-progress>
        </div>
        <div>
          <small style="color:var(--snice-color-text-secondary)">Processing</small>
          <snice-progress indeterminate></snice-progress>
        </div>
      </div>
      <div class="comp-demo-row">
        <snice-spinner size="small"></snice-spinner>
        <snice-spinner></snice-spinner>
        <snice-spinner size="large"></snice-spinner>
        <snice-progress variant="circular" value="75" size="medium" show-label></snice-progress>
      </div>
    </div>

    <div class="comp-section">
      <h3>Alerts</h3>
      <p class="comp-desc">Contextual feedback messages</p>
      <div class="comp-demo-large">
        <snice-alert variant="info" title="Information" dismissible>
          This is an informational message. Use it to provide helpful context.
        </snice-alert>
        <snice-alert variant="success" title="Success" dismissible style="margin-top:0.75rem">
          Your changes have been saved successfully.
        </snice-alert>
        <snice-alert variant="warning" title="Warning" dismissible style="margin-top:0.75rem">
          Please review your input before continuing.
        </snice-alert>
        <snice-alert variant="error" title="Error" dismissible style="margin-top:0.75rem">
          An error occurred. Please try again.
        </snice-alert>
      </div>
    </div>

    <div class="comp-section">
      <h3>Badges</h3>
      <p class="comp-desc">Notification indicators and count displays</p>
      <div class="comp-demo-row" style="gap:2rem">
        <snice-badge count="5" variant="error">
          <snice-button variant="default">Messages</snice-button>
        </snice-badge>
        <snice-badge dot variant="error" pulse>
          <snice-button variant="default">Notifications</snice-button>
        </snice-badge>
        <snice-badge count="150" max="99" variant="primary">
          <snice-button variant="default">Updates</snice-button>
        </snice-badge>
      </div>
      <div class="comp-demo-row" style="margin-top:1rem">
        <span>Status: <snice-badge inline content="Active" variant="success"></snice-badge></span>
        <span>Priority: <snice-badge inline content="High" variant="error"></snice-badge></span>
        <span>Type: <snice-badge inline content="New" variant="primary"></snice-badge></span>
      </div>
    </div>

    <div class="comp-section">
      <h3>Chips</h3>
      <p class="comp-desc">Tags, filters, and selections</p>
      <div class="comp-demo-row">
        <snice-chip label="Default"></snice-chip>
        <snice-chip label="React" variant="primary"></snice-chip>
        <snice-chip label="TypeScript" variant="success"></snice-chip>
        <snice-chip label="JavaScript" variant="warning"></snice-chip>
        <snice-chip label="CSS" variant="error"></snice-chip>
      </div>
      <div class="comp-demo-row">
        <snice-chip label="Removable" removable></snice-chip>
        <snice-chip label="Filter" variant="primary" removable></snice-chip>
        <snice-chip label="Selected" variant="success" selected></snice-chip>
      </div>
    </div>

    <div class="comp-section">
      <h3>Avatars</h3>
      <p class="comp-desc">User profile images with fallback initials</p>
      <div class="comp-demo-row">
        <snice-avatar name="Alice Johnson" size="xs"></snice-avatar>
        <snice-avatar name="Bob Smith" size="small"></snice-avatar>
        <snice-avatar name="Carol Davis" size="medium"></snice-avatar>
        <snice-avatar name="David Wilson" size="large"></snice-avatar>
        <snice-avatar name="Eve Brown" size="xl"></snice-avatar>
      </div>
      <div class="comp-demo-row">
        <snice-avatar name="John Doe" shape="circle"></snice-avatar>
        <snice-avatar name="Jane Doe" shape="rounded"></snice-avatar>
        <snice-avatar name="Jim Doe" shape="square"></snice-avatar>
        <snice-avatar src="assets/avatars/pravatar-100-1.jpg" name="User"></snice-avatar>
        <snice-avatar src="assets/avatars/pravatar-100-2.jpg" name="User"></snice-avatar>
      </div>
    </div>

    <div class="comp-section">
      <h3>Cards</h3>
      <p class="comp-desc">Content containers with header/footer slots</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">
        <snice-card variant="elevated">
          <h4 slot="header">Elevated Card</h4>
          <p style="margin:0;color:var(--snice-color-text-secondary);font-size:0.875rem">Cards with shadow appear to float above the surface.</p>
          <div slot="footer"><snice-button variant="primary" size="small">Action</snice-button></div>
        </snice-card>
        <snice-card variant="outlined">
          <h4 slot="header">Outlined Card</h4>
          <p style="margin:0;color:var(--snice-color-text-secondary);font-size:0.875rem">Outlined cards have a subtle border.</p>
          <div slot="footer"><snice-button variant="default" size="small" outline>Learn More</snice-button></div>
        </snice-card>
      </div>
    </div>

    <div class="comp-section">
      <h3>Skeleton</h3>
      <p class="comp-desc">Loading placeholders</p>
      <div class="comp-demo-large" style="display:flex;gap:1rem;align-items:flex-start">
        <snice-skeleton variant="circular" width="48px" height="48px"></snice-skeleton>
        <div style="flex:1">
          <snice-skeleton variant="text" width="40%"></snice-skeleton>
          <snice-skeleton variant="text" width="100%" style="margin-top:0.5rem"></snice-skeleton>
          <snice-skeleton variant="text" width="80%" style="margin-top:0.5rem"></snice-skeleton>
        </div>
      </div>
    </div>

    <div class="comp-section">
      <h3>Divider</h3>
      <p class="comp-desc">Content separators in horizontal and vertical orientations</p>
      <div class="comp-demo-large">
        <div style="margin-bottom:1rem">
          <snice-divider text="OR"></snice-divider>
        </div>
        <div style="display:flex;gap:1rem;align-items:center;height:2.5rem">
          <span style="color:var(--snice-color-text-secondary);font-size:0.875rem">Home</span>
          <snice-divider orientation="vertical"></snice-divider>
          <span style="color:var(--snice-color-text-secondary);font-size:0.875rem">Products</span>
          <snice-divider orientation="vertical"></snice-divider>
          <span style="color:var(--snice-color-text-secondary);font-size:0.875rem">About</span>
          <snice-divider orientation="vertical"></snice-divider>
          <span style="color:var(--snice-color-text-secondary);font-size:0.875rem">Contact</span>
        </div>
        <snice-divider variant="dashed" style="margin:1rem 0"></snice-divider>
        <snice-divider variant="dotted" style="margin:0"></snice-divider>
      </div>
    </div>

    <div class="comp-section">
      <h3>Breadcrumbs</h3>
      <p class="comp-desc">Navigation path indicators</p>
      <div class="comp-demo-large">
        <snice-breadcrumbs id="demo-breadcrumbs" separator="/"></snice-breadcrumbs>
      </div>
    </div>

    <div class="comp-section">
      <h3>Modal</h3>
      <p class="comp-desc">Dialog overlays for focused interactions</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="document.getElementById('demo-modal').show()">Open Modal</snice-button>
        <snice-button variant="default" onclick="document.getElementById('form-modal').show()">Form Modal</snice-button>
      </div>
      <snice-modal id="demo-modal" label="Confirm Dialog">
        <h2 slot="header">Confirm Action</h2>
        <p style="margin:0">Are you sure you want to proceed? This action cannot be undone.</p>
        <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
          <snice-button variant="default" onclick="document.getElementById('demo-modal').close()">Cancel</snice-button>
          <snice-button variant="primary" onclick="document.getElementById('demo-modal').close()">Confirm</snice-button>
        </div>
      </snice-modal>
      <snice-modal id="form-modal" size="large" label="User Form">
        <h2 slot="header">Edit Profile</h2>
        <div style="display:grid;gap:1rem">
          <snice-input label="Name" placeholder="Enter your name"></snice-input>
          <snice-input label="Email" placeholder="Enter your email" type="email"></snice-input>
          <snice-textarea label="Bio" placeholder="Tell us about yourself..." rows="3"></snice-textarea>
        </div>
        <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
          <snice-button variant="default" onclick="document.getElementById('form-modal').close()">Cancel</snice-button>
          <snice-button variant="primary" onclick="document.getElementById('form-modal').close()">Save Changes</snice-button>
        </div>
      </snice-modal>
    </div>

    <div class="comp-section">
      <h3>Tooltip</h3>
      <p class="comp-desc">Contextual information on hover or click</p>
      <div class="comp-demo-row" style="gap:1.5rem">
        <snice-tooltip content="Tooltip on top" position="top"><snice-button variant="default">Top</snice-button></snice-tooltip>
        <snice-tooltip content="Tooltip on right" position="right"><snice-button variant="default">Right</snice-button></snice-tooltip>
        <snice-tooltip content="Tooltip on bottom" position="bottom"><snice-button variant="default">Bottom</snice-button></snice-tooltip>
        <snice-tooltip content="Tooltip on left" position="left"><snice-button variant="default">Left</snice-button></snice-tooltip>
        <snice-tooltip content="Click me to see this!" trigger="click"><snice-button variant="primary">Click Trigger</snice-button></snice-tooltip>
      </div>
    </div>

    <div class="comp-section">
      <h3>Pagination</h3>
      <p class="comp-desc">Navigation for paged content</p>
      <div class="comp-demo-large" style="display:flex;flex-direction:column;gap:1rem;align-items:flex-start">
        <snice-pagination current="1" total="10"></snice-pagination>
        <snice-pagination current="5" total="20" siblings="1"></snice-pagination>
        <snice-pagination current="3" total="5" size="small" variant="rounded"></snice-pagination>
      </div>
    </div>

    <div class="comp-section">
      <h3>Link</h3>
      <p class="comp-desc">Styled anchor elements</p>
      <div class="comp-demo-row" style="gap:1.5rem">
        <snice-link href="#">Default Link</snice-link>
        <snice-link href="#" variant="primary">Primary</snice-link>
        <snice-link href="#" variant="secondary">Secondary</snice-link>
        <snice-link href="#" underline="always">Always Underlined</snice-link>
        <snice-link href="#" external>External Link</snice-link>
      </div>
    </div>

    <div class="comp-section">
      <h3>Empty State</h3>
      <p class="comp-desc">Placeholder for empty content areas</p>
      <div class="comp-demo-large">
        <snice-empty-state
          title="No results found"
          description="Try adjusting your search or filters to find what you're looking for."
          icon="search"
        ></snice-empty-state>
      </div>
    </div>

    <div class="comp-section">
      <h3>Timer</h3>
      <p class="comp-desc">Countdown and stopwatch timers</p>
      <div class="comp-demo-row" style="gap:2rem">
        <snice-timer mode="stopwatch"></snice-timer>
        <snice-timer mode="timer" initial-time="60"></snice-timer>
        <snice-timer mode="timer" initial-time="300"></snice-timer>
      </div>
    </div>

    <div class="comp-section">
      <h3>Color Picker</h3>
      <p class="comp-desc">Interactive color selection</p>
      <div class="comp-demo-row" style="gap:1.5rem">
        <snice-color-picker value="#3b82f6"></snice-color-picker>
        <snice-color-picker value="#10b981"></snice-color-picker>
        <snice-color-picker value="#f59e0b"></snice-color-picker>
      </div>
    </div>

    <div class="comp-section">
      <h3>Date Picker</h3>
      <p class="comp-desc">Date selection with calendar</p>
      <div class="comp-demo-row" style="gap:1rem">
        <snice-date-picker label="Start Date" placeholder="Select date"></snice-date-picker>
        <snice-date-picker label="End Date" placeholder="Select date"></snice-date-picker>
      </div>
    </div>

    <div class="comp-section">
      <h3>QR Code</h3>
      <p class="comp-desc">Generate QR codes with colors, logos, and styles</p>
      <div class="comp-demo-row" style="gap:1.5rem;flex-wrap:wrap">
        <snice-qr-code value="https://snice.dev" size="120" margin="6" dot-style="rounded" fg-color="#2196f3" bg-color="#e3f2fd" include-image image-url="images/snice-logo.png" image-size="30" style="--qr-border-radius:12px"></snice-qr-code>
        <snice-qr-code value="npm install snice" size="120" margin="6" dot-style="dots" fg-color="#4caf50" bg-color="#e8f5e9" center-text="npm" center-text-size="16" text-fill-color="#1b5e20" style="--qr-border-radius:12px"></snice-qr-code>
        <snice-qr-code value="https://github.com" size="120" margin="6" center-text="GH" center-text-size="24" text-fill-color="#ffffff" text-outline-color="#6a1b9a" dot-style="rounded" fg-color="#9c27b0" bg-color="#f3e5f5" style="--qr-border-radius:12px"></snice-qr-code>
        <snice-qr-code value="WIFI:T:WPA;S:MyNetwork;P:secret123;;" size="120" margin="6" center-text="WiFi" center-text-size="18" text-fill-color="#ffffff" text-outline-color="#e65100" fg-color="#ff9800" style="--qr-border-radius:12px"></snice-qr-code>
      </div>
    </div>

    <div class="comp-section">
      <h3>Accordion</h3>
      <p class="comp-desc">Expandable content sections</p>
      <div class="comp-demo-large">
        <snice-accordion>
          <snice-accordion-item item-id="faq-1" open>
            <span slot="header">What is Snice?</span>
            <p style="margin:0;padding:0.5rem 0">A TypeScript web component library with decorators, differential rendering, and separation of concerns.</p>
          </snice-accordion-item>
          <snice-accordion-item item-id="faq-2">
            <span slot="header">How do I install it?</span>
            <p style="margin:0;padding:0.5rem 0">Run <code>npm install snice</code> to get started. Components are tree-shakeable.</p>
          </snice-accordion-item>
          <snice-accordion-item item-id="faq-3">
            <span slot="header">Is it accessible?</span>
            <p style="margin:0;padding:0.5rem 0">Yes! All components follow WCAG guidelines with keyboard navigation and ARIA attributes.</p>
          </snice-accordion-item>
        </snice-accordion>
      </div>
    </div>

    <div class="comp-section">
      <h3>Tabs</h3>
      <p class="comp-desc">Tabbed content navigation</p>
      <div class="comp-demo-large">
        <snice-tabs transition="fade">
          <snice-tab slot="nav">Overview</snice-tab>
          <snice-tab slot="nav">Features</snice-tab>
          <snice-tab slot="nav">Usage</snice-tab>
          <snice-tab-panel>
            <p style="margin:0">Snice provides 64 production-ready UI components built with TypeScript and modern web standards.</p>
          </snice-tab-panel>
          <snice-tab-panel>
            <p style="margin:0">Decorators, differential rendering, routing, controllers, form association, and more.</p>
          </snice-tab-panel>
          <snice-tab-panel>
            <p style="margin:0">Use standalone builds, or import from the full package. Works with React, Vue, and Angular.</p>
          </snice-tab-panel>
        </snice-tabs>
      </div>
    </div>

    <div class="comp-section">
      <h3>Banner</h3>
      <p class="comp-desc">Full-width notification banners</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="showDemoBanner('info')">Show Info Banner</snice-button>
        <snice-button variant="warning" onclick="showDemoBanner('warning')">Show Warning Banner</snice-button>
      </div>
    </div>

    <div class="comp-section">
      <h3>Drawer</h3>
      <p class="comp-desc">Slide-out panels from any edge</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="document.getElementById('drawer-left').show()">Left Drawer</snice-button>
        <snice-button variant="default" onclick="document.getElementById('drawer-right').show()">Right Drawer</snice-button>
        <snice-button variant="default" onclick="document.getElementById('drawer-bottom').show()">Bottom Drawer</snice-button>
      </div>
      <snice-drawer id="drawer-left" position="left" size="medium">
        <h3 style="margin:0 0 1rem">Navigation</h3>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <snice-button variant="text" style="justify-content:flex-start">Dashboard</snice-button>
          <snice-button variant="text" style="justify-content:flex-start">Projects</snice-button>
          <snice-button variant="text" style="justify-content:flex-start">Settings</snice-button>
        </div>
      </snice-drawer>
      <snice-drawer id="drawer-right" position="right" size="medium">
        <h3 style="margin:0 0 1rem">Details Panel</h3>
        <p style="color:var(--snice-color-text-secondary)">Additional information and actions can go here.</p>
      </snice-drawer>
      <snice-drawer id="drawer-bottom" position="bottom" size="small">
        <div style="text-align:center;padding:1rem">
          <h3 style="margin:0 0 0.5rem">Quick Actions</h3>
          <div style="display:flex;gap:0.5rem;justify-content:center">
            <snice-button variant="primary">Save</snice-button>
            <snice-button variant="default">Cancel</snice-button>
          </div>
        </div>
      </snice-drawer>
    </div>

    <div class="comp-section">
      <h3>Menu</h3>
      <p class="comp-desc">Dropdown menus with keyboard navigation</p>
      <div class="comp-demo-row" style="gap:1rem">
        <snice-menu>
          <snice-button slot="trigger" variant="primary">Actions Menu</snice-button>
          <snice-menu-item>Edit</snice-menu-item>
          <snice-menu-item>Duplicate</snice-menu-item>
          <snice-menu-divider></snice-menu-divider>
          <snice-menu-item variant="danger">Delete</snice-menu-item>
        </snice-menu>
        <snice-menu placement="bottom-end">
          <snice-button slot="trigger" variant="default">More Options</snice-button>
          <snice-menu-item>Download</snice-menu-item>
          <snice-menu-item>Share</snice-menu-item>
          <snice-menu-item>Archive</snice-menu-item>
        </snice-menu>
      </div>
    </div>

    <div class="comp-section">
      <h3>Toast</h3>
      <p class="comp-desc">Temporary notification messages</p>
      <div class="comp-demo-row">
        <snice-button variant="success" onclick="document.getElementById('toast-container').show('Changes saved successfully!', {type:'success'})">Success Toast</snice-button>
        <snice-button variant="danger" onclick="document.getElementById('toast-container').show('Something went wrong', {type:'error'})">Error Toast</snice-button>
        <snice-button variant="warning" onclick="document.getElementById('toast-container').show('Please review your input', {type:'warning'})">Warning Toast</snice-button>
        <snice-button variant="primary" onclick="document.getElementById('toast-container').show('New message received', {type:'info'})">Info Toast</snice-button>
      </div>
      <snice-toast-container id="toast-container" position="bottom-right"></snice-toast-container>
    </div>

    <div class="comp-section">
      <h3>Command Palette</h3>
      <p class="comp-desc">Keyboard-driven command search (Ctrl/Cmd+K)</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="document.getElementById('cmd-palette').show()">Open Command Palette</snice-button>
        <span style="color:var(--snice-color-text-tertiary);font-size:0.8rem">or press Ctrl+K</span>
      </div>
      <snice-command-palette id="cmd-palette" placeholder="Type a command..."></snice-command-palette>
    </div>

    <div class="comp-section">
      <h3>Stepper</h3>
      <p class="comp-desc">Multi-step process indicator</p>
      <div class="comp-demo-large">
        <snice-stepper id="demo-stepper" current-step="1" clickable></snice-stepper>
        <div style="margin-top:1rem;display:flex;gap:0.5rem">
          <snice-button variant="default" size="small" onclick="document.getElementById('demo-stepper').currentStep = Math.max(0, document.getElementById('demo-stepper').currentStep - 1)">Previous</snice-button>
          <snice-button variant="primary" size="small" onclick="document.getElementById('demo-stepper').currentStep = Math.min(3, document.getElementById('demo-stepper').currentStep + 1)">Next</snice-button>
        </div>
      </div>
    </div>


    <div class="comp-section">
      <h3>Chart</h3>
      <p class="comp-desc">Line, bar, pie, and area charts</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="comp-demo-large">
          <snice-chart id="line-chart" type="line" height="200"></snice-chart>
        </div>
        <div class="comp-demo-large">
          <snice-chart id="bar-chart" type="bar" height="200"></snice-chart>
        </div>
      </div>
    </div>

    <div class="comp-section">
      <h3>Sparkline</h3>
      <p class="comp-desc">Inline mini charts</p>
      <div class="comp-demo-row" style="gap:2rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.9rem">Revenue</span>
          <snice-sparkline id="spark1" type="line" color="success" width="80" height="24"></snice-sparkline>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.9rem">Users</span>
          <snice-sparkline id="spark2" type="bar" color="primary" width="80" height="24"></snice-sparkline>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="font-size:0.9rem">Errors</span>
          <snice-sparkline id="spark3" type="area" color="danger" width="80" height="24"></snice-sparkline>
        </div>
      </div>
    </div>


    <div class="comp-section">
      <h3>Timeline</h3>
      <p class="comp-desc">Chronological event display</p>
      <div class="comp-demo-large">
        <snice-timeline id="demo-timeline" position="left"></snice-timeline>
      </div>
    </div>

    <div class="comp-section">
      <h3>Image</h3>
      <p class="comp-desc">Lazy-loaded images with variants</p>
      <div class="comp-demo-row" style="gap:1rem">
        <snice-image src="assets/photos/thumb1.jpg" alt="Rounded" variant="rounded" size="medium" lazy></snice-image>
        <snice-image src="assets/photos/thumb2.jpg" alt="Circle" variant="circle" size="medium" lazy></snice-image>
        <snice-image src="assets/photos/thumb3.jpg" alt="Square" variant="square" size="medium" lazy></snice-image>
        <snice-image src="assets/photos/thumb4.jpg" alt="Another" variant="rounded" size="medium" lazy></snice-image>
      </div>
    </div>

    <div class="comp-section">
      <h3>Carousel</h3>
      <p class="comp-desc">Image and content slider</p>
      <div class="comp-demo-large">
        <snice-carousel show-controls show-indicators loop>
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);height:180px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">Slide 1</div>
          <div style="background:linear-gradient(135deg,#f093fb,#f5576c);height:180px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">Slide 2</div>
          <div style="background:linear-gradient(135deg,#4facfe,#00f2fe);height:180px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">Slide 3</div>
        </snice-carousel>
      </div>
    </div>

    <div class="comp-section">
      <h3>File Upload</h3>
      <p class="comp-desc">Drag-and-drop file selection</p>
      <div class="comp-demo-large">
        <snice-file-upload label="Upload files" helper-text="Drag files here or click to browse" accept="image/*,.pdf" multiple drag-drop show-preview max-files="5"></snice-file-upload>
      </div>
    </div>

    <div class="comp-section">
      <h3>File Gallery</h3>
      <p class="comp-desc">File management with previews and upload progress</p>
      <div class="comp-demo-large">
        <snice-file-gallery id="demo-gallery" accept="image/*" multiple view="grid" show-add-button allow-delete></snice-file-gallery>
      </div>
    </div>

    <div class="comp-section">
      <h3>Code Block</h3>
      <p class="comp-desc">Syntax-highlighted code display</p>
      <div class="comp-demo-large">
        <snice-code-block language="typescript" show-line-numbers copyable filename="example.ts" code="import { element, property, render } from 'snice';

@element('my-component')
class MyComponent extends HTMLElement {
  @property() name = 'World';

  @render()
  template() {
    return html\`<h1>Hello, \${this.name}!</h1>\`;
  }
}"></snice-code-block>
      </div>
    </div>

    <div class="comp-section">
      <h3>Terminal</h3>
      <p class="comp-desc">Interactive command-line interface</p>
      <div class="comp-demo-large">
        <snice-terminal id="demo-terminal" prompt="$ " style="height:200px"></snice-terminal>
      </div>
    </div>

    <div class="comp-section">
      <h3>Chat</h3>
      <p class="comp-desc">Real-time messaging interface</p>
      <div class="comp-demo-large">
        <snice-chat id="demo-chat" current-user="You" placeholder="Type a message..." show-avatars show-timestamps style="height:300px"></snice-chat>
      </div>
    </div>


    <div class="comp-section">
      <h3>Split Pane</h3>
      <p class="comp-desc">Resizable split layouts</p>
      <div class="comp-demo-large" style="height:200px">
        <snice-split-pane direction="horizontal" primary-size="40">
          <div slot="primary" style="padding:1rem;background:var(--snice-color-background-tertiary);height:100%">
            <strong>Left Panel</strong>
            <p style="font-size:0.8rem;color:var(--snice-color-text-secondary)">Drag the divider to resize</p>
          </div>
          <div slot="secondary" style="padding:1rem;height:100%">
            <strong>Right Panel</strong>
            <p style="font-size:0.8rem;color:var(--snice-color-text-secondary)">Content adjusts automatically</p>
          </div>
        </snice-split-pane>
      </div>
    </div>

    <div class="comp-section">
      <h3>Calendar</h3>
      <p class="comp-desc">Date picker calendar with events</p>
      <div class="comp-demo-large" style="min-height:320px">
        <snice-calendar id="demo-calendar" highlight-today></snice-calendar>
      </div>
    </div>

    <div class="comp-section">
      <h3>Draw</h3>
      <p class="comp-desc">Freehand drawing canvas</p>
      <div class="comp-demo-large">
        <snice-draw id="demo-draw" width="100%" height="200" color="#3b82f6" stroke-width="3" style="border:1px solid var(--snice-color-border);border-radius:6px"></snice-draw>
        <div style="margin-top:0.5rem;display:flex;gap:0.5rem">
          <snice-button size="small" variant="default" onclick="document.getElementById('demo-draw').clear()">Clear</snice-button>
          <snice-button size="small" variant="default" onclick="document.getElementById('demo-draw').undo()">Undo</snice-button>
          <snice-button size="small" variant="primary" onclick="document.getElementById('demo-draw').download('drawing.png')">Download</snice-button>
        </div>
      </div>
    </div>

    <div class="comp-section">
      <h3>Color Display</h3>
      <p class="comp-desc">Color swatch with label</p>
      <div class="comp-demo-row" style="gap:1.5rem">
        <snice-color-display value="#3b82f6" label="Primary" show-swatch show-label></snice-color-display>
        <snice-color-display value="#10b981" label="Success" show-swatch show-label></snice-color-display>
        <snice-color-display value="#f59e0b" label="Warning" show-swatch show-label></snice-color-display>
        <snice-color-display value="#ef4444" label="Danger" show-swatch show-label></snice-color-display>
      </div>
    </div>

    <div class="comp-section">
      <h3>Kanban</h3>
      <p class="comp-desc">Drag-and-drop kanban board</p>
      <div class="comp-demo-large" style="overflow-x:auto">
        <snice-kanban id="demo-kanban" allow-drag-drop show-card-count></snice-kanban>
      </div>
    </div>

    <div class="comp-section">
      <h3>Location</h3>
      <p class="comp-desc">Address and coordinate display</p>
      <div class="comp-demo-row" style="gap:1.5rem;flex-wrap:wrap">
        <snice-location name="Anthropic HQ" address="548 Market St" city="San Francisco" state="CA" country="USA" show-icon clickable></snice-location>
        <snice-location mode="coordinates" latitude="37.7749" longitude="-122.4194" show-icon clickable></snice-location>
      </div>
    </div>

    <div class="comp-section">
      <h3>Camera</h3>
      <p class="comp-desc">Webcam capture (requires permission)</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="document.getElementById('camera-modal').show()">Open Camera</snice-button>
      </div>
      <snice-modal id="camera-modal" size="large" label="Camera">
        <h3 slot="header">Camera Capture</h3>
        <snice-camera id="demo-camera" show-controls controls-position="bottom" auto-start="false"></snice-camera>
        <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
          <snice-button variant="default" onclick="document.getElementById('demo-camera').stop(); document.getElementById('camera-modal').close()">Close</snice-button>
        </div>
      </snice-modal>
    </div>

    <div class="comp-section">
      <h3>QR Reader</h3>
      <p class="comp-desc">QR code scanner (requires camera permission)</p>
      <div class="comp-demo-row">
        <snice-button variant="primary" onclick="document.getElementById('qr-reader-modal').show()">Open QR Scanner</snice-button>
      </div>
      <snice-modal id="qr-reader-modal" size="medium" label="QR Scanner">
        <h3 slot="header">Scan QR Code</h3>
        <snice-qr-reader id="demo-qr-reader" auto-start="false"></snice-qr-reader>
        <div slot="footer" style="display:flex;gap:0.5rem;justify-content:flex-end">
          <snice-button variant="default" onclick="document.getElementById('demo-qr-reader').stop(); document.getElementById('qr-reader-modal').close()">Close</snice-button>
        </div>
      </snice-modal>
    </div>

    <div class="comp-section">
      <h3>Audio Recorder</h3>
      <p class="comp-desc">Voice recording (requests mic permission on record)</p>
      <div class="comp-demo-large">
        <snice-audio-recorder show-controls show-visualizer show-timer show-playback></snice-audio-recorder>
      </div>
    </div>

    <div class="comp-section">
      <h3>Music Player</h3>
      <p class="comp-desc">Audio playback with playlist</p>
      <div class="comp-demo-large">
        <snice-music-player id="demo-music" show-playlist show-controls show-volume show-artwork show-track-info></snice-music-player>
      </div>
    </div>

    <div class="comp-section">
      <h3>CDN Build</h3>
      <p class="comp-desc">Use any component without the full framework</p>
      <pre><code>npx snice build-component button
<span class="c"># creates snice-button.min.js (~25kb gzipped)</span>

&lt;script src=<span class="s">"snice-button.min.js"</span>&gt;&lt;/script&gt;
&lt;snice-button variant=<span class="s">"primary"</span>&gt;Works anywhere&lt;/snice-button&gt;</code></pre>
    </div>

    <div class="comp-section">
      <h3>React Adapter</h3>
      <p class="comp-desc">First-class React 17+ support</p>
      <pre><code><span class="k">import</span> { Button, Input, Alert } <span class="k">from</span> <span class="s">'snice/react'</span>;

<span class="k">function</span> <span class="t">LoginForm</span>() {
  <span class="k">const</span> [email, setEmail] = useState(<span class="s">''</span>);

  <span class="k">return</span> (
    &lt;&gt;
      &lt;Input
        label=<span class="s">"Email"</span>
        value={email}
        onChange={(e) =&gt; setEmail(e.detail.value)}
      /&gt;
      &lt;Button variant=<span class="s">"primary"</span> onClick={handleSubmit}&gt;
        Sign In
      &lt;/Button&gt;
    &lt;/&gt;
  );
}</code></pre>
    </div>

    <h3 style="margin-top:2rem">All ${components.length} Components</h3>
    <div class="comp-list">
${components.map(c => `      <span class="comp-tag">snice-${c}</span>`).join('\n')}
    </div>
  </main>
${footer}
  <script src="components/snice-button.min.js"></script>
  <script src="components/snice-badge.min.js"></script>
  <script src="components/snice-chip.min.js"></script>
  <script src="components/snice-switch.min.js"></script>
  <script src="components/snice-checkbox.min.js"></script>
  <script src="components/snice-radio.min.js"></script>
  <script src="components/snice-input.min.js"></script>
  <script src="components/snice-select.min.js"></script>
  <script src="components/snice-textarea.min.js"></script>
  <script src="components/snice-slider.min.js"></script>
  <script src="components/snice-progress.min.js"></script>
  <script src="components/snice-spinner.min.js"></script>
  <script src="components/snice-avatar.min.js"></script>
  <script src="components/snice-alert.min.js"></script>
  <script src="components/snice-card.min.js"></script>
  <script src="components/snice-modal.min.js"></script>
  <script src="components/snice-tooltip.min.js"></script>
  <script src="components/snice-skeleton.min.js"></script>
  <script src="components/snice-divider.min.js"></script>
  <script src="components/snice-breadcrumbs.min.js"></script>
  <script src="components/snice-pagination.min.js"></script>
  <script src="components/snice-link.min.js"></script>
  <script src="components/snice-empty-state.min.js"></script>
  <script src="components/snice-timer.min.js"></script>
  <script src="components/snice-color-picker.min.js"></script>
  <script src="components/snice-date-picker.min.js"></script>
  <script src="components/snice-qr-code.min.js"></script>
  <script src="components/snice-accordion.min.js"></script>
  <script src="components/snice-tabs.min.js"></script>
  <script src="components/snice-banner.min.js"></script>
  <script src="components/snice-drawer.min.js"></script>
  <script src="components/snice-menu.min.js"></script>
  <script src="components/snice-toast.min.js"></script>
  <script src="components/snice-command-palette.min.js"></script>
  <script src="components/snice-stepper.min.js"></script>
  <script src="components/snice-chart.min.js"></script>
  <script src="components/snice-sparkline.min.js"></script>
  <script src="components/snice-timeline.min.js"></script>
  <script src="components/snice-image.min.js"></script>
  <script src="components/snice-carousel.min.js"></script>
  <script src="components/snice-file-upload.min.js"></script>
  <script src="components/snice-file-gallery.min.js"></script>
  <script src="components/snice-code-block.min.js"></script>
  <script src="components/snice-terminal.min.js"></script>
  <script src="components/snice-chat.min.js"></script>
  <script src="components/snice-split-pane.min.js"></script>
  <script src="components/snice-calendar.min.js"></script>
  <script src="components/snice-draw.min.js"></script>
  <script src="components/snice-color-display.min.js"></script>
  <script src="components/snice-kanban.min.js"></script>
  <script src="components/snice-location.min.js"></script>
  <script src="components/snice-camera.min.js"></script>
  <script src="components/snice-qr-reader.min.js"></script>
  <script src="components/snice-audio-recorder.min.js"></script>
  <script src="components/snice-music-player.min.js"></script>
  <script>
    // Banner demo - create dynamically on click
    window.showDemoBanner = (type) => {
      const existing = document.getElementById('demo-banner-' + type);
      if (existing) existing.remove();
      const banner = document.createElement('snice-banner');
      banner.id = 'demo-banner-' + type;
      banner.variant = type;
      banner.dismissible = true;
      if (type === 'info') {
        banner.message = 'New version available! Update to get the latest features.';
        banner.actionText = 'Update Now';
      } else {
        banner.message = 'Your trial expires in 3 days.';
      }
      document.body.prepend(banner);
      requestAnimationFrame(() => banner.show());
    };

    // Initialize breadcrumbs
    customElements.whenDefined('snice-breadcrumbs').then(() => {
      const bc = document.getElementById('demo-breadcrumbs');
      if (bc) bc.items = [
        { label: 'Home', href: '#' },
        { label: 'Products', href: '#' },
        { label: 'Electronics', href: '#' },
        { label: 'Laptop' }
      ];
    });

    // Initialize stepper
    customElements.whenDefined('snice-stepper').then(() => {
      const stepper = document.getElementById('demo-stepper');
      if (stepper) stepper.steps = [
        { label: 'Account', description: 'Create account' },
        { label: 'Profile', description: 'Setup profile' },
        { label: 'Settings', description: 'Configure settings' },
        { label: 'Complete', description: 'All done!' }
      ];
    });

    // Initialize charts
    customElements.whenDefined('snice-chart').then(() => {
      const lineChart = document.getElementById('line-chart');
      if (lineChart) {
        lineChart.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        lineChart.datasets = [
          { label: 'Revenue', data: [30, 45, 35, 50, 40, 60], borderColor: '#3b82f6', fill: false },
          { label: 'Expenses', data: [20, 30, 25, 35, 30, 40], borderColor: '#ef4444', fill: false }
        ];
      }
      const barChart = document.getElementById('bar-chart');
      if (barChart) {
        barChart.labels = ['Q1', 'Q2', 'Q3', 'Q4'];
        barChart.datasets = [
          { label: '2023', data: [65, 75, 70, 80], backgroundColor: '#3b82f6' },
          { label: '2024', data: [75, 85, 80, 95], backgroundColor: '#10b981' }
        ];
      }
    });

    // Initialize sparklines
    customElements.whenDefined('snice-sparkline').then(() => {
      document.getElementById('spark1').data = [10, 15, 12, 18, 20, 25, 22, 28];
      document.getElementById('spark2').data = [5, 8, 6, 10, 12, 9, 14, 11];
      document.getElementById('spark3').data = [3, 5, 2, 4, 6, 3, 5, 4];
    });

    // Initialize timeline
    customElements.whenDefined('snice-timeline').then(() => {
      const timeline = document.getElementById('demo-timeline');
      if (timeline) timeline.items = [
        { title: 'Project Started', description: 'Initial planning and setup', timestamp: 'Jan 15', variant: 'info' },
        { title: 'Development', description: 'Core features implemented', timestamp: 'Feb 20', variant: 'default' },
        { title: 'Testing', description: 'QA and bug fixes', timestamp: 'Mar 10', variant: 'warning' },
        { title: 'Launch', description: 'Released to production', timestamp: 'Apr 1', variant: 'success' }
      ];
    });

    // Initialize kanban
    customElements.whenDefined('snice-kanban').then(() => {
      const kanban = document.getElementById('demo-kanban');
      if (kanban) kanban.columns = [
        { id: 'todo', title: 'To Do', cards: [
          { id: '1', title: 'Design mockups', labels: ['Design'] },
          { id: '2', title: 'API integration', labels: ['Backend'] }
        ]},
        { id: 'progress', title: 'In Progress', cards: [
          { id: '3', title: 'User authentication', labels: ['Frontend', 'Backend'] }
        ]},
        { id: 'done', title: 'Done', cards: [
          { id: '4', title: 'Project setup', labels: ['DevOps'] }
        ]}
      ];
    });

    // Initialize command palette
    customElements.whenDefined('snice-command-palette').then(() => {
      const palette = document.getElementById('cmd-palette');
      if (palette) {
        palette.commands = [
          { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', category: 'File' },
          { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', category: 'File' },
          { id: 'save', label: 'Save', shortcut: 'Ctrl+S', category: 'File' },
          { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', category: 'Preferences' },
          { id: 'theme', label: 'Toggle Theme', category: 'Preferences' }
        ];
        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            palette.toggle();
          }
        });
      }
    });

    // Initialize terminal
    customElements.whenDefined('snice-terminal').then(() => {
      const terminal = document.getElementById('demo-terminal');
      if (terminal) {
        terminal.writeln('Welcome to Snice Terminal!', 'info');
        terminal.writeln('Type "help" for available commands.', 'info');
        terminal.addEventListener('terminal-command', (e) => {
          const { command } = e.detail;
          if (command === 'help') {
            terminal.writeln('Available commands: help, clear, echo, date');
          } else if (command === 'clear') {
            terminal.clear();
          } else if (command === 'date') {
            terminal.writeln(new Date().toLocaleString(), 'success');
          } else if (command.startsWith('echo ')) {
            terminal.writeln(command.slice(5));
          } else {
            terminal.writeln('Command not found: ' + command, 'error');
          }
        });
      }
    });

    // Initialize chat
    customElements.whenDefined('snice-chat').then(() => {
      const chat = document.getElementById('demo-chat');
      if (chat) {
        chat.messages = [
          { id: '1', type: 'text', content: 'Hey! How\\'s the project going?', author: 'Alice', timestamp: new Date(Date.now() - 300000) },
          { id: '2', type: 'text', content: 'Going great! Just finished the new components.', author: 'You', timestamp: new Date(Date.now() - 240000) },
          { id: '3', type: 'text', content: 'Awesome! Can\\'t wait to see them.', author: 'Alice', timestamp: new Date(Date.now() - 180000) }
        ];
      }
    });

    // Initialize music player
    customElements.whenDefined('snice-music-player').then(() => {
      const player = document.getElementById('demo-music');
      if (player) {
        player.tracks = [
          { id: '1', title: 'Morning Vibes', artist: 'Demo Artist', src: '' },
          { id: '2', title: 'Sunset Dreams', artist: 'Demo Artist', src: '' },
          { id: '3', title: 'Night Owl', artist: 'Demo Artist', src: '' }
        ];
      }
    });

    // Start camera when modal opens
    document.getElementById('camera-modal')?.addEventListener('snice-modal-open', () => {
      document.getElementById('demo-camera')?.start();
    });

    // Start QR reader when modal opens
    document.getElementById('qr-reader-modal')?.addEventListener('snice-modal-open', () => {
      document.getElementById('demo-qr-reader')?.start();
    });
  </script>
</body>
</html>`;

// ─── DOCS PAGE ───────────────────────────────────────────────────────────
const docsDir = join(root, 'docs');

const docsManifest = [
  { group: 'Core', docs: [
    { id: 'elements', file: 'elements.md', title: 'Elements' },
    { id: 'routing', file: 'routing.md', title: 'Routing' },
    { id: 'events', file: 'events.md', title: 'Events' },
    { id: 'controllers', file: 'controllers.md', title: 'Controllers' },
  ]},
  { group: 'Patterns', docs: [
    { id: 'observe', file: 'observe.md', title: 'Observers' },
    { id: 'request-response', file: 'request-response.md', title: 'Request / Response' },
    { id: 'fetcher', file: 'fetcher.md', title: 'Fetcher' },
    { id: 'placards', file: 'placards.md', title: 'Placards' },
  ]},
  { group: 'Components', docs: [
    { id: 'code-block', file: 'code-block.md', title: 'Code Block' },
  ]},
];

// Grammar map: code fence language → grammar file path
const grammarMap = {
  typescript: 'grammars/typescript.json',
  ts: 'grammars/typescript.json',
  javascript: 'grammars/typescript.json',
  js: 'grammars/typescript.json',
  html: 'grammars/html.json',
  css: 'grammars/css.json',
  json: 'grammars/json.json',
  bash: 'grammars/bash.json',
  sh: 'grammars/bash.json',
  shell: 'grammars/bash.json',
  python: 'grammars/python.json',
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdToHtml(markdown, docId) {
  const lines = markdown.split('\n');
  const result = [];
  const headings = []; // collected for sidebar
  let inCodeBlock = false;
  let codeLines = [];
  let codeLang = '';
  let inList = false;
  let listType = '';
  let inTable = false;
  let tableRows = [];
  let inBlockquote = false;
  let blockquoteLines = [];

  function flushList() {
    if (inList) {
      result.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      let html = '<div class="doc-table-wrap"><table>';
      tableRows.forEach((row, i) => {
        const tag = i === 0 ? 'th' : 'td';
        const wrap = i === 0 ? 'thead' : (i === 1 ? 'tbody' : '');
        if (wrap === 'thead') html += '<thead>';
        if (wrap === 'tbody') html += '</thead><tbody>';
        html += '<tr>' + row.map(cell => `<${tag}>${inlineFormat(cell.trim())}</${tag}>`).join('') + '</tr>';
      });
      html += '</tbody></table></div>';
      result.push(html);
      inTable = false;
      tableRows = [];
    }
  }

  function flushBlockquote() {
    if (inBlockquote) {
      result.push('<blockquote class="doc-blockquote">' + blockquoteLines.map(l => `<p>${inlineFormat(l)}</p>`).join('') + '</blockquote>');
      inBlockquote = false;
      blockquoteLines = [];
    }
  }

  function inlineFormat(text) {
    // Bold + italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return text;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        flushBlockquote();
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
        codeLines = [];
        continue;
      } else {
        // End code block
        inCodeBlock = false;
        const code = escapeHtml(codeLines.join('\n'));
        const lang = codeLang || 'typescript';
        const grammar = grammarMap[lang] || grammarMap['typescript'];
        result.push(`<snice-code-block language="${lang}" grammar="${grammar}">${code}</snice-code-block>`);
        continue;
      }
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Skip table of contents sections
    if (/^## Table of Contents$/i.test(line.trim())) {
      // Skip until next heading or blank line after list
      i++;
      while (i < lines.length && (lines[i].startsWith('- [') || lines[i].trim() === '')) {
        i++;
      }
      i--; // back up one since the for loop will increment
      continue;
    }

    // Table rows
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushList();
      flushBlockquote();
      const cells = line.split('|').slice(1, -1); // trim first/last empty
      // Skip separator row (---|---)
      if (cells.every(c => /^[\s:-]+$/.test(c))) {
        continue;
      }
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      flushTable();
      if (!inBlockquote) inBlockquote = true;
      blockquoteLines.push(line.slice(2));
      continue;
    } else {
      flushBlockquote();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = `${docId}-${slugify(text)}`;
      if (level <= 2) {
        headings.push({ level, text, id });
      }
      result.push(`<h${level} id="${id}">${inlineFormat(text)}</h${level}>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      flushTable();
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        result.push('<ul>');
      }
      result.push(`<li>${inlineFormat(line.trim().replace(/^[-*]\s/, ''))}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      flushTable();
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        result.push('<ol>');
      }
      result.push(`<li>${inlineFormat(line.trim().replace(/^\d+\.\s/, ''))}</li>`);
      continue;
    }

    // If we had a list and this isn't a list item, close it
    flushList();

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push('<hr>');
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    result.push(`<p>${inlineFormat(line)}</p>`);
  }

  // Flush remaining open blocks
  flushList();
  flushTable();
  flushBlockquote();

  return { html: result.join('\n'), headings };
}

// Build sidebar + content
let sidebarHtml = '';
let contentHtml = '';

for (const group of docsManifest) {
  sidebarHtml += `<div class="nav-group">${group.group}</div>\n`;
  for (const doc of group.docs) {
    const mdPath = join(docsDir, doc.file);
    let md;
    try { md = readFileSync(mdPath, 'utf-8'); } catch { console.warn(`Docs: skipping ${doc.file} (not found)`); continue; }
    const { html: docHtml, headings } = mdToHtml(md, doc.id);

    // Sidebar: doc title link
    sidebarHtml += `<a href="#${doc.id}">${doc.title}</a>\n`;
    // Sidebar: ## sub-headings
    for (const h of headings) {
      if (h.level === 2) {
        sidebarHtml += `<a href="#${h.id}" class="sub">${h.text}</a>\n`;
      }
    }

    // Content section
    contentHtml += `<section class="doc-file" id="${doc.id}">\n${docHtml}\n</section>\n`;
  }
}

const docsPageHtml = `${head('Documentation')}
  <script>fetch('grammars/typescript.json');</script>
${header('docs')}
  <nav class="docs-sidebar" id="docs-sidebar">
    ${sidebarHtml}
  </nav>
  <main class="docs-content">
    <div class="page-title">
      <h2>Documentation</h2>
      <p>Complete API reference for the Snice framework.</p>
    </div>
    ${contentHtml}
  </main>
${footer}
  <script>
    // Highlight active sidebar link on scroll
    (() => {
      const sidebar = document.getElementById('docs-sidebar');
      if (!sidebar) return;
      const links = [...sidebar.querySelectorAll('a')];
      const sections = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
      let ticking = false;
      function updateActive() {
        const scrollY = window.scrollY + 120;
        let active = null;
        for (const section of sections) {
          if (section.offsetTop <= scrollY) active = section;
        }
        links.forEach(a => a.classList.remove('active'));
        if (active) {
          const link = sidebar.querySelector('a[href="#' + active.id + '"]');
          if (link) link.classList.add('active');
        }
        ticking = false;
      }
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateActive); } });
      updateActive();
    })();
  </script>
</body>
</html>`;

// THEMES PAGE
const themeComponents = ['button','input','select','checkbox','switch','slider','alert','badge','chip','card','tabs','color-picker'];
const themeScripts = themeComponents.map(c => `  <script async src="components/snice-${c}.min.js"></script>`).join('\n');
const themesHtml = `${head('Themes')}
${header('themes')}
  <main class="wrap">
    <!-- Preset Gallery -->
    <section class="themes-section">
      <h3>Presets</h3>
      <div id="preset-grid" class="preset-grid"></div>
    </section>

    <!-- Builder + Preview two-column -->
    <section class="themes-section themes-builder-layout">
      <div class="themes-builder-controls">
        <h3>Customize</h3>
        <!-- All controls rendered dynamically by themes.js -->
        <div id="builder-controls"></div>

        <!-- Export -->
        <div class="builder-group" style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--snice-color-border, rgba(128,128,128,0.15))">
          <label class="builder-label">Export CSS</label>
          <pre class="export-block"><code id="export-code">/* Default theme — no overrides */</code></pre>
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <snice-button id="copy-css-btn" variant="primary" size="small">Copy CSS</snice-button>
            <snice-button id="download-css-btn" variant="default" size="small">Download .css</snice-button>
            <snice-button id="reset-btn" variant="default" size="small" outline>Reset to Default</snice-button>
          </div>
        </div>
      </div>
      <div class="themes-builder-preview">
        <div class="theme-preview-sticky">
          <h3 style="margin:0 0 0.5rem;font-size:0.9rem">Preview</h3>
          <div class="theme-preview-panel theme-preview-compact theme-preview-scaled">
            <div class="theme-preview-row">
              <snice-button variant="primary" size="small">Primary</snice-button>
              <snice-button variant="success" size="small">Success</snice-button>
              <snice-button variant="warning" size="small">Warning</snice-button>
              <snice-button variant="danger" size="small">Danger</snice-button>
              <snice-button variant="default" size="small" outline>Outline</snice-button>
            </div>
            <div class="theme-preview-row">
              <snice-input placeholder="Input..." size="small" style="flex:1;min-width:80px"></snice-input>
              <snice-select size="small" style="flex:1;min-width:80px">
                <snice-option value="a">Option A</snice-option>
              </snice-select>
            </div>
            <div class="theme-preview-row">
              <snice-checkbox checked></snice-checkbox>
              <snice-switch checked></snice-switch>
              <snice-radio-group value="a" size="small" style="flex:1"><snice-radio value="a">A</snice-radio><snice-radio value="b">B</snice-radio></snice-radio-group>
            </div>
            <div class="theme-preview-row">
              <snice-slider value="60" style="flex:1" form-align></snice-slider>
            </div>
            <div class="theme-preview-row">
              <snice-progress value="65" size="small" style="flex:1"></snice-progress>
            </div>
            <div class="theme-preview-row">
              <snice-badge inline content="Primary" variant="primary"></snice-badge>
              <snice-badge inline content="Success" variant="success"></snice-badge>
              <snice-badge inline content="Warning" variant="warning"></snice-badge>
              <snice-badge inline content="Error" variant="error"></snice-badge>
              <snice-chip label="Chip" variant="primary" size="small"></snice-chip>
              <snice-chip label="Done" variant="success" size="small"></snice-chip>
            </div>
            <div class="theme-preview-row">
              <snice-alert variant="info" size="small" style="flex:1">Info alert</snice-alert>
            </div>
            <div class="theme-preview-row">
              <snice-alert variant="success" size="small" style="flex:1">Success alert</snice-alert>
            </div>
            <div class="theme-preview-row">
              <snice-alert variant="warning" size="small" style="flex:1">Warning alert</snice-alert>
            </div>
            <div class="theme-preview-row">
              <snice-alert variant="danger" size="small" style="flex:1">Danger alert</snice-alert>
            </div>
            <div class="theme-preview-row">
              <snice-tabs size="small" style="flex:1">
                <snice-tab slot="nav" panel="t1" active>Tab 1</snice-tab>
                <snice-tab slot="nav" panel="t2">Tab 2</snice-tab>
                <snice-tab slot="nav" panel="t3">Tab 3</snice-tab>
                <snice-tab-panel name="t1" active><span style="font-size:0.7rem;color:var(--snice-color-text-secondary)">Tab panel content</span></snice-tab-panel>
              </snice-tabs>
            </div>
            <div class="theme-preview-row">
              <div style="flex:1;padding:0.4rem 0.6rem;border-radius:var(--snice-border-radius-lg);background:var(--snice-color-background-element);border:1px solid var(--snice-color-border)">
                <div style="font-size:0.75rem;font-weight:600;color:var(--snice-color-text)">Card</div>
                <div style="font-size:0.65rem;color:var(--snice-color-text-secondary);margin-top:0.1rem">Content with theme.</div>
              </div>
              <div style="flex:1;display:flex;flex-direction:column;gap:0.15rem">
                <div style="padding:0.25rem 0.5rem;border-radius:var(--snice-border-radius-md);background:var(--snice-color-background-secondary);font-size:0.65rem;color:var(--snice-color-text)">BG secondary</div>
                <div style="padding:0.25rem 0.5rem;border-radius:var(--snice-border-radius-md);background:var(--snice-color-background-tertiary);font-size:0.65rem;color:var(--snice-color-text-secondary)">BG tertiary</div>
                <div style="padding:0.25rem 0.5rem;border-radius:var(--snice-border-radius-md);border:1px solid var(--snice-color-border);font-size:0.65rem;color:var(--snice-color-text-tertiary)">Border</div>
              </div>
            </div>
            <div class="theme-preview-row" style="gap:0.25rem">
              <span style="font-size:0.65rem;color:var(--snice-color-text)">Text</span>
              <span style="font-size:0.65rem;color:var(--snice-color-text-secondary)">Secondary</span>
              <span style="font-size:0.65rem;color:var(--snice-color-text-tertiary)">Tertiary</span>
              <span style="font-size:0.65rem;color:var(--snice-color-text-disabled)">Disabled</span>
              <span style="font-size:0.65rem;padding:0.1rem 0.3rem;border-radius:var(--snice-border-radius-sm);background:var(--snice-color-primary);color:var(--snice-color-text-inverse)">Inverse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
${footer}
${themeScripts}
  <script type="module" src="themes.js"></script>
</body>
</html>`;

// NOTE: styles.css, index.html, and components.html are hand-maintained
// styles.css: full version lives in public/styles.css (511 lines with comp-split, code-tabs, etc.)
// index.html: has imperative/declarative tabs, hand-crafted syntax highlighting
// components.html: built from public/showcases/ fragments via build-showcases.js
writeFileSync(join(out, 'decorators.html'), decoratorsHtml);
writeFileSync(join(out, 'docs.html'), docsPageHtml);
writeFileSync(join(out, 'themes.html'), themesHtml);
console.log('Built to public/ - preview at http://localhost:52891');
