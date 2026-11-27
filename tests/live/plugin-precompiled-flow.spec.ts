import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function startStaticServer(rootDir: string): Promise<{ server: Server; url: string }> {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const cleanUrl = (req.url || '/').split('?')[0];
      const rel = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
      const fullPath = join(rootDir, rel);
      if (!existsSync(fullPath)) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', MIME[extname(fullPath)] || 'application/octet-stream');
      res.end(readFileSync(fullPath));
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolvePromise({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function makeProject(dir: string, files: Record<string, string>) {
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'precompiled-e2e', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
}

test.describe('Exhaustive precompileTemplates: true Real-User Flow (Chromium, Firefox, WebKit)', () => {
  let tempRoot: string;
  let server: Server;
  let url: string;
  let minimalJsCode: string;
  let minimalRawBytes: number;
  let minimalGzipBytes: number;
  let minimalBrotliBytes: number;

  test.beforeAll(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'snice-precompiled-live-'));

    // 1. Exhaustive interactive app with precompileTemplates: true
    const dirFull = join(tempRoot, 'full');
    makeProject(dirFull, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Precompiled Flow</title></head>
  <body>
    <div id="daemon-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/main.ts': `
        import {
          element, property, state, watch, query, on, dispatch, ready, dispose,
          render, styles, controller, daemon, request, respond, provideContext,
          html, css, repeat, type Response
        } from 'snice';

        (window as any).__events = [];
        (window as any).__watchLog = [];
        (window as any).__lifecycle = { ready: 0, childReady: 0, childDisposed: 0, ctrlAttached: 0 };

        @daemon
        class CounterDaemon {
          private secret = 'daemon-ok-42';

          @respond('get-secret')
          getSecret() {
            return this.secret;
          }
        }

        @controller('badge-ctrl')
        class BadgeController {
          element: HTMLElement | null = null;
          attach(el: HTMLElement) {
            this.element = el;
            (window as any).__lifecycle.ctrlAttached++;
            el.setAttribute('data-ctrl-attached', 'yes');
          }
          detach() {}
        }

        @element('lifecycle-child')
        class LifecycleChild extends HTMLElement {
          @property() label = '';
          @ready()
          onReady() {
            (window as any).__lifecycle.childReady++;
          }
          @dispose()
          onDispose() {
            (window as any).__lifecycle.childDisposed++;
          }
          @render()
          renderContent() {
            return html\`<span class="child-label">\${this.label}</span>\`;
          }
        }

        @element('prop-receiver')
        class PropReceiver extends HTMLElement {
          @property({ type: Object, attribute: false }) payload: any = null;
          @render()
          renderContent() {
            return html\`<span class="payload">\${this.payload ? this.payload.tag : 'none'}</span>\`;
          }
        }

        async function* makeTicker(): AsyncIterable<string> {
          yield 'tick-1';
          await new Promise((r) => setTimeout(r, 25));
          yield 'tick-2';
        }

        @element('precompiled-showcase')
        class PrecompiledShowcase extends HTMLElement {
          @property({ type: Number }) step = 1;
          @state() active = false;
          @state() mode: 'alpha' | 'beta' | 'gamma' = 'alpha';
          @state() showChild = true;
          @state() items = [
            { id: 'a', label: 'Alpha' },
            { id: 'b', label: 'Beta' },
            { id: 'c', label: 'Gamma' },
          ];
          @state() radius = 12;
          @state() spreadClicks = 0;
          @state() daemonResult = 'pending';

          private promiseVal = new Promise<string>((r) => setTimeout(() => r('promise-resolved'), 20));
          private streamVal = makeTicker();

          @query('#query-target')
          queryTarget?: HTMLElement;

          @watch('step')
          onStepChange(oldVal: number, newVal: number) {
            (window as any).__watchLog.push({ oldVal, newVal });
          }

          @request<string>('get-secret', { daemon: 'store' })
          async *askDaemon(): Response<string> {
            return yield {};
          }

          @ready()
          async init() {
            (window as any).__lifecycle.ready++;
            if (this.queryTarget) {
              this.queryTarget.setAttribute('data-queried', 'true');
            }
            const res = await this.askDaemon();
            this.daemonResult = String(res);
          }

          @on('click', '#delegated-btn')
          handleDelegated() {
            this.step++;
            this.active = !this.active;
            this.emitAction();
          }

          @dispatch('showcase-action', { bubbles: true, composed: true })
          emitAction() {
            return { step: this.step };
          }

          reverseItems() {
            this.items = [...this.items].reverse();
          }

          cycleMode() {
            this.mode = this.mode === 'alpha' ? 'beta' : this.mode === 'beta' ? 'gamma' : 'alpha';
          }

          toggleChild() {
            this.showChild = !this.showChild;
          }

          growCircle() {
            this.radius = 22;
          }

          @styles()
          componentStyles() {
            return css\`
              :host { display: block; }
              .box.active { border: 2px solid rgb(34, 197, 94); }
            \`;
          }

          @render()
          renderContent() {
            const spreadProps = { payload: { tag: 'spread-ok-' + this.step } };
            const spreadAttrs = { 'data-extra': 'attr-' + this.step };
            const spreadEvents = { click: () => { this.spreadClicks++; } };

            return html\`
              <div id="query-target" class="box" class:active=\${this.active} style:color=\${this.active ? 'rgb(22, 163, 74)' : 'rgb(37, 99, 235)'}>
                <span id="step-val">\${this.step}</span>
                <span id="daemon-val">\${this.daemonResult}</span>
                <span id="promise-val">\${this.promiseVal}</span>
                <span id="stream-val">\${this.streamVal}</span>
                <span id="spread-clicks">\${this.spreadClicks}</span>

                <button id="delegated-btn" type="button">Step</button>
                <button id="reverse-btn" type="button" @click=\${() => this.reverseItems()}>Reverse</button>
                <button id="mode-btn" type="button" @click=\${() => this.cycleMode()}>Mode</button>
                <button id="toggle-child-btn" type="button" @click=\${() => this.toggleChild()}>Child</button>
                <button id="grow-svg-btn" type="button" @click=\${() => this.growCircle()}>SVG</button>
                <button id="spread-btn" type="button" ...attrs=\${spreadAttrs} ...events=\${spreadEvents}>Spread</button>

                <prop-receiver id="prop-recv" ...props=\${spreadProps}></prop-receiver>
                <div id="ctrl-host" controller=\${BadgeController}>Ctrl</div>

                <div id="if-branch">
                  <if \${this.step === 1}>
                    <span class="branch">one</span>
                    <else-if \${this.step === 2}>
                      <span class="branch">two</span>
                    </else-if>
                    <else>
                      <span class="branch">many</span>
                    </else>
                  </if>
                </div>

                <div id="case-branch">
                  <case \${this.mode}>
                    <when value="alpha"><span class="mode-out">A</span></when>
                    <when value="beta"><span class="mode-out">B</span></when>
                    <default><span class="mode-out">DEFAULT</span></default>
                  </case>
                </div>

                <ul id="repeat-list">
                  \${repeat(this.items, { key: (it) => it.id, render: (it) => html\`<li data-key=\${it.id}>\${it.label}</li>\` })}
                </ul>

                <div id="child-slot">
                  <if \${this.showChild}>
                    <lifecycle-child label="alive"></lifecycle-child>
                  </if>
                </div>

                <svg id="inline-svg" width="60" height="60" viewBox="0 0 60 60">
                  <circle id="svg-dot" cx="30" cy="30" r=\${this.radius} fill="currentColor"></circle>
                </svg>
              </div>
            \`;
          }
        }

        const root = document.getElementById('daemon-root')!;
        const store = new CounterDaemon();
        provideContext(root, { daemons: { store } });
        const el = document.createElement('precompiled-showcase');
        el.id = 'showcase';
        el.addEventListener('showcase-action', (e: any) => (window as any).__events.push(e.detail));
        root.appendChild(el);
      `,
    });

    // 2. Lean minimal precompiled app for TreeWalker exclusion & size ceilings
    const dirMinimal = join(tempRoot, 'minimal');
    makeProject(dirMinimal, {
      'index.html': `<!doctype html><html><body><lean-hi></lean-hi><script type="module" src="/src/main.ts"></script></body></html>`,
      'src/main.ts': `
        import { element, property, render, html } from 'snice';
        @element('lean-hi')
        export class LeanHi extends HTMLElement {
          @property() name = 'World';
          @render() template() {
            return html\`<p>Hello \${this.name}</p>\`;
          }
        }
      `,
    });

    await Promise.all([
      viteBuild({
        root: dirFull,
        logLevel: 'silent',
        plugins: [sniceVite({ precompileTemplates: true })],
      }),
      viteBuild({
        root: dirMinimal,
        logLevel: 'silent',
        plugins: [sniceVite({ caching: false, precompileTemplates: true })],
      }),
    ]);

    const minAssetsDir = join(dirMinimal, 'dist/assets');
    const jsFiles = readdirSync(minAssetsDir).filter((f) => f.endsWith('.js'));
    const bufs = jsFiles.map((f) => readFileSync(join(minAssetsDir, f)));
    const combined = Buffer.concat(bufs);
    minimalJsCode = combined.toString('utf8');
    minimalRawBytes = combined.length;
    minimalGzipBytes = gzipSync(combined).length;
    minimalBrotliBytes = brotliCompressSync(combined).length;

    const started = await startStaticServer(join(dirFull, 'dist'));
    server = started.server;
    url = started.url;
  });

  test.afterAll(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  test('lean minimal precompiled bundle excludes createTreeWalker/prepareTemplate and stays under strict raw/gz/br ceilings', () => {
    expect(minimalJsCode).not.toContain('createTreeWalker');
    expect(minimalJsCode).not.toContain('prepareTemplate');
    expect(minimalRawBytes).toBeLessThan(52_000);
    expect(minimalGzipBytes).toBeLessThan(15_000);
    expect(minimalBrotliBytes).toBeLessThan(13_500);
  });

  test('all Snice decorators, conditionals, keyed repeat identity, spreads, SVG, async bindings, controllers, and daemons work interactively', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });

    await page.goto(url);
    await page.evaluate(async () => {
      await customElements.whenDefined('precompiled-showcase');
      await (document.querySelector('#showcase') as any).ready;
    });

    // Wait for daemon, promise, and async iterable stream to settle
    await expect.poll(async () => {
      return page.evaluate(() => {
        const sr = document.querySelector('#showcase')!.shadowRoot!;
        return {
          daemon: sr.querySelector('#daemon-val')?.textContent,
          promise: sr.querySelector('#promise-val')?.textContent,
          stream: sr.querySelector('#stream-val')?.textContent,
        };
      });
    }).toEqual({
      daemon: 'daemon-ok-42',
      promise: 'promise-resolved',
      stream: 'tick-2',
    });

    // Initial assertions: @query, @ready, @controller, <if>, <case>, ...props, ...attrs
    const initial = await page.evaluate(() => {
      const sr = document.querySelector('#showcase')!.shadowRoot!;
      const box = sr.querySelector('#query-target') as HTMLElement;
      const spreadBtn = sr.querySelector('#spread-btn') as HTMLElement;
      const propRecv = sr.querySelector('#prop-recv') as HTMLElement;
      const ctrlHost = sr.querySelector('#ctrl-host') as HTMLElement;
      return {
        queried: box.getAttribute('data-queried'),
        color: getComputedStyle(box).color,
        hasActive: box.classList.contains('active'),
        branch: sr.querySelector('#if-branch .branch')?.textContent,
        modeOut: sr.querySelector('#case-branch .mode-out')?.textContent,
        spreadAttr: spreadBtn.getAttribute('data-extra'),
        propPayload: propRecv.shadowRoot?.querySelector('.payload')?.textContent,
        ctrlAttached: ctrlHost.getAttribute('data-ctrl-attached'),
        lifecycle: (window as any).__lifecycle,
      };
    });
    expect(initial.queried).toBe('true');
    expect(initial.color).toBe('rgb(37, 99, 235)');
    expect(initial.hasActive).toBe(false);
    expect(initial.branch).toBe('one');
    expect(initial.modeOut).toBe('A');
    expect(initial.spreadAttr).toBe('attr-1');
    expect(initial.propPayload).toBe('spread-ok-1');
    expect(initial.ctrlAttached).toBe('yes');
    expect(initial.lifecycle.ready).toBe(1);
    expect(initial.lifecycle.childReady).toBe(1);
    expect(initial.lifecycle.ctrlAttached).toBe(1);

    // Click delegated @on button -> triggers @watch, @dispatch, class:active, style:color, <else-if>
    await page.locator('precompiled-showcase #delegated-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#step-val')?.textContent)).toBe('2');

    const afterStep2 = await page.evaluate(() => {
      const sr = document.querySelector('#showcase')!.shadowRoot!;
      const box = sr.querySelector('#query-target') as HTMLElement;
      return {
        hasActive: box.classList.contains('active'),
        color: getComputedStyle(box).color,
        branch: sr.querySelector('#if-branch .branch')?.textContent,
        events: (window as any).__events,
        watchLog: (window as any).__watchLog,
      };
    });
    expect(afterStep2.hasActive).toBe(true);
    expect(afterStep2.color).toBe('rgb(22, 163, 74)');
    expect(afterStep2.branch).toBe('two');
    expect(afterStep2.events).toEqual([{ step: 2 }]);
    expect(afterStep2.watchLog).toEqual([
      { oldVal: undefined, newVal: 1 },
      { oldVal: 1, newVal: 2 },
    ]);

    // Step 3 -> hits <else>
    await page.locator('precompiled-showcase #delegated-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#if-branch .branch')?.textContent)).toBe('many');

    // <case>/<when>/<default>
    await page.locator('precompiled-showcase #mode-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#case-branch .mode-out')?.textContent)).toBe('B');
    await page.locator('precompiled-showcase #mode-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#case-branch .mode-out')?.textContent)).toBe('DEFAULT');

    // ...events spread click
    await page.locator('precompiled-showcase #spread-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#spread-clicks')?.textContent)).toBe('1');

    // repeat() keyed identity preservation across reordering
    const identityPreserved = await page.evaluate(async () => {
      const el = document.querySelector('#showcase') as any;
      const sr = el.shadowRoot!;
      const beforeNodes = Array.from(sr.querySelectorAll('#repeat-list li')) as HTMLLIElement[];
      const mapBefore = new Map(beforeNodes.map((n) => [n.getAttribute('data-key'), n]));
      (sr.querySelector('#reverse-btn') as HTMLButtonElement).click();
      await el.rendered;
      const afterNodes = Array.from(sr.querySelectorAll('#repeat-list li')) as HTMLLIElement[];
      const keysAfter = afterNodes.map((n) => n.getAttribute('data-key'));
      const sameIdentity = afterNodes.every((n) => mapBefore.get(n.getAttribute('data-key')) === n);
      return { keysAfter, sameIdentity };
    });
    expect(identityPreserved).toEqual({ keysAfter: ['c', 'b', 'a'], sameIdentity: true });

    // Inline <svg> reactive attribute update
    await page.locator('precompiled-showcase #grow-svg-btn').click();
    await expect.poll(async () => page.evaluate(() => document.querySelector('#showcase')!.shadowRoot!.querySelector('#svg-dot')?.getAttribute('r'))).toBe('22');

    // @dispose fires when child unmounts via <if>
    await page.locator('precompiled-showcase #toggle-child-btn').click();
    await expect.poll(async () => page.evaluate(() => (window as any).__lifecycle.childDisposed)).toBe(1);

    expect(errors).toEqual([]);
  });
});
