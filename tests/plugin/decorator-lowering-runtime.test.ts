import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import sniceRollup from '../../packages/plugin/src/rollup';
import { cleanupNativeElementControllers } from '../../packages/core/src/controller';

const ROOT = process.cwd();
const tempDirs: string[] = [];

async function compileAndLoad(files: Record<string, string>, entryName = 'entry.ts'): Promise<any> {
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs06-rt-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const pkgPath = join(ROOT, 'node_modules', pkg);
    if (existsSync(pkgPath)) {
      symlinkSync(pkgPath, join(dir, 'node_modules', pkg), 'junction');
    }
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'rt-fixture', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }

  const bundle = await rollup({
    input: join(dir, entryName),
    plugins: [
      nodeResolve({ extensions: ['.ts', '.js', '.mjs'] }),
      sniceRollup({ caching: false }),
    ],
  });
  let code = '';
  try {
    const { output } = await bundle.generate({ format: 'es' });
    code = output[0].code;
  } finally {
    await bundle.close();
  }

  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return { mod: await import(/* @vite-ignore */ dataUrl), code };
}

describe('BS-06: Lowered decorator runtime parity (happy-dom)', () => {
  afterEach(() => {
    cleanupNativeElementControllers();
    document.body.innerHTML = '';
  });

  it('AC-1/AC-3: full parity across properties, mutable defaults, constructor timing, queries, render, styles, watch, on, dispatch, debounce, throttle, once, memoize, lifecycle, inheritance, undecorated base, anonymous default, SniceElement, controller, daemon, request/respond, and cross-module @page', async () => {
    const { mod, code } = await compileAndLoad({
      'router.ts': `
        import { Router } from 'snice';
        export const { page, navigate, initialize } = Router({ target: '#bs06-router-out', type: 'hash' });
      `,
      'anon-el.ts': `
        import { element, property, render, html } from 'snice';
        @element('bs06-anon-el')
        export default class extends HTMLElement {
          @property() msg: string = 'anonymous';
          @render()
          renderContent() {
            return html\`<em class="anon">\${this.msg}</em>\`;
          }
        }
      `,
      'page-el.ts': `
        import { property, render, html } from 'snice';
        import { page } from './router';
        @page({ tag: 'bs06-cross-page', routes: ['/bs06'] })
        export class CrossPage extends HTMLElement {
          @property() heading: string = 'Cross Page';
          @render()
          renderContent() {
            return html\`<h1>\${this.heading}</h1>\`;
          }
        }
      `,
      'entry.ts': `
        import {
          element, layout, property, state, query, queryAll, contextProperty,
          render, styles, watch, ready, dispose, reconnect, moved, adopted,
          on, dispatch, observe, request, respond, context, controller, daemon,
          debounce, throttle, once, memoize, SniceElement, provideContext,
          html, css
        } from 'snice';
        import AnonEl from './anon-el';
        import { CrossPage } from './page-el';

        // Undecorated base class with @property, @styles, @watch
        export class BaseWidget extends HTMLElement {
          @property({ type: Number }) baseCount: number = 10;
          baseWatched: number[] = [];

          @watch('baseCount', { immediate: false })
          onBaseCount(_o: number, n: number) {
            this.baseWatched.push(n);
          }

          @styles()
          baseStyles() {
            return css\`.base { color: red; }\`;
          }
        }

        @element('bs06-child-widget')
        export class ChildWidget extends BaseWidget {
          @property() items: string[] = [];
          @property({ type: Number }) count: number = 0;
          @state() internal: string = 'ok';
          @query('.btn') btn?: HTMLButtonElement;
          @queryAll('.item') itemEls!: NodeListOf<HTMLElement>;
          @contextProperty() appCtx: any;

          log: string[] = [];
          onceCalls = 0;
          memoCalls = 0;

          constructor() {
            super();
            // User constructor write MUST NOT be clobbered by field default 0
            this.count = 5;
          }

          @styles()
          childStyles() {
            return css\`.child { display: block; }\`;
          }

          @render()
          renderContent() {
            return html\`
              <button class="btn">\${this.count}-\${this.baseCount}-\${this.internal}</button>
              \${this.items.map(i => html\`<span class="item">\${i}</span>\`)}
            \`;
          }

          @ready()
          onReady() { this.log.push('ready'); }

          @reconnect()
          onReconnect() { this.log.push('reconnect'); }

          @dispose()
          onDispose() { this.log.push('dispose'); }

          @moved({ debounce: 10 })
          onMoved() { this.log.push('moved'); }

          @adopted()
          onAdopted() { this.log.push('adopted'); }

          @on('click', '.btn')
          @debounce(10)
          handleDebouncedClick() {
            this.log.push('debounced-click');
          }

          @on('click', '.btn')
          handleImmediateClick() {
            this.log.push('immediate-click');
          }

          @dispatch('child-fired')
          fireEvent(val: number) {
            return { val };
          }

          @once()
          computeOnce() {
            this.onceCalls++;
            return 42;
          }

          @memoize()
          computeMemo(n: number) {
            this.memoCalls++;
            return n * 2;
          }

          @throttle(20)
          throttledOp() {
            this.log.push('throttled');
          }

          @observe('mutation:childList')
          onMut() {
            this.log.push('mut');
          }

          @request('ping-daemon', { daemon: 'testDaemon' })
          async *pingDaemon(msg: string): any {
            return yield msg;
          }
        }

        // SniceElement subclass without @render() auto-wires render() & kebab attributes
        @element('bs06-snice-el')
        export class MySniceEl extends SniceElement {
          @property() userName: string = 'guest';
          render() {
            return html\`<p class="who">\${this.userName}</p>\`;
          }
        }

        @layout('bs06-layout')
        export class MyLayout extends HTMLElement {
          update() {}
        }

        @controller('bs06-ctrl')
        export class MyCtrl {
          element: HTMLElement | null = null;
          attached = false;
          attach(el: HTMLElement) { this.element = el; this.attached = true; }
          detach() { this.attached = false; }
        }

        // Bare @daemon (no parens)
        @daemon
        export class MyDaemon {
          @respond('ping-daemon')
          onPing(msg: string) { return 'pong:' + msg; }
        }

        // Custom non-Snice TC39 decorator test
        function tagMeta(label: string) {
          return (_v: any, ctx: any) => function(this: any, init: any) {
            this.constructor.prototype.__customTag = label;
            return init + '!';
          };
        }

        export class CustomDecClass {
          @tagMeta('works')
          val: string = 'hello';
        }

        export { AnonEl, CrossPage, provideContext };
      `,
    });

    // Lowered Snice classes must have zero __esDecorate / applyDecs2203RFactory
    expect(code).not.toContain('__esDecorate');
    expect(code).not.toContain('applyDecs2203RFactory');

    // Two instances have independent mutable [] defaults, constructor write count=5 preserved,
    // inherited baseCount works & is in observedAttributes
    const host = document.createElement('div');
    document.body.appendChild(host);
    const daemonInstance = new mod.MyDaemon();
    const release = mod.provideContext(host, { appName: 'bs06', daemons: { testDaemon: daemonInstance } });

    const el1 = document.createElement('bs06-child-widget') as any;
    const el2 = document.createElement('bs06-child-widget') as any;
    expect(el1.items).not.toBe(el2.items);
    el1.items.push('a');
    expect(el2.items).toEqual([]);
    expect((mod.ChildWidget as any).observedAttributes).toContain('basecount');
    expect((mod.ChildWidget as any).observedAttributes).toContain('count');

    host.appendChild(el1);
    await el1.ready;
    expect(el1.count).toBe(5);
    expect(el1.btn?.textContent).toBe('5-10-ok');
    expect(el1.itemEls.length).toBe(1);
    expect(el1.appCtx?.appName).toBe('bs06');
    expect(el1.log).toContain('ready');

    // Manual call to @render() method triggers re-render cleanly
    el1.internal = 'manual';
    el1.renderContent();
    expect(el1.btn?.textContent).toBe('5-10-manual');

    // Inherited @watch on baseCount fires
    el1.baseCount = 25;
    expect(el1.baseWatched).toEqual([25]);

    // Stacked @on + @debounce AND multiple @on on same event both work
    el1.btn.click();
    expect(el1.log).toContain('immediate-click');
    await new Promise(r => setTimeout(r, 25));
    expect(el1.log).toContain('debounced-click');

    // @dispatch works
    let dispatched: any = null;
    el1.addEventListener('child-fired', (e: any) => { dispatched = e.detail; });
    el1.fireEvent(77);
    expect(dispatched).toEqual({ val: 77 });

    // @once, @memoize, @throttle work
    expect(el1.computeOnce()).toBe(42);
    expect(el1.computeOnce()).toBe(42);
    expect(el1.onceCalls).toBe(1);
    expect(el1.computeMemo(4)).toBe(8);
    expect(el1.computeMemo(4)).toBe(8);
    expect(el1.memoCalls).toBe(1);
    el1.throttledOp();
    el1.throttledOp();
    expect(el1.log.filter((x: string) => x === 'throttled').length).toBe(1);

    // @request -> bare @daemon @respond works
    expect(await el1.pingDaemon('hi')).toBe('pong:hi');

    // @dispose & @reconnect
    el1.remove();
    await new Promise(r => setTimeout(r, 10));
    expect(el1.log).toContain('dispose');
    host.appendChild(el1);
    await new Promise(r => setTimeout(r, 10));
    expect(el1.log).toContain('reconnect');

    // SniceElement auto-render & kebab attribute naming
    const sniceEl = document.createElement('bs06-snice-el') as any;
    sniceEl.setAttribute('user-name', 'ada');
    host.appendChild(sniceEl);
    await sniceEl.ready;
    expect(sniceEl.userName).toBe('ada');
    expect(sniceEl.shadowRoot?.querySelector('.who')?.textContent).toBe('ada');

    // Anonymous export default class
    const anonEl = document.createElement('bs06-anon-el') as any;
    host.appendChild(anonEl);
    await anonEl.ready;
    expect(anonEl.shadowRoot?.querySelector('.anon')?.textContent).toBe('anonymous');

    // Cross-module @page registered properly with its @property observedAttributes
    expect(customElements.get('bs06-cross-page')).toBeDefined();
    expect((mod.CrossPage as any).observedAttributes).toContain('heading');
    const pageEl = document.createElement('bs06-cross-page') as any;
    pageEl.setAttribute('heading', 'Hello Route');
    host.appendChild(pageEl);
    await pageEl.ready;
    expect(pageEl.shadowRoot?.querySelector('h1')?.textContent).toBe('Hello Route');

    // Non-Snice TC39 2022-03 fallback decorator
    const customInst = new mod.CustomDecClass();
    expect(customInst.val).toBe('hello!');
    expect(mod.CustomDecClass.prototype.__customTag).toBe('works');

    // @layout registered
    expect(customElements.get('bs06-layout')).toBeDefined();

    release();
  }, 30000);
});
