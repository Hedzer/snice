import { describe, it, expect, afterEach, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {
  parseDuration,
  html,
  css,
  element,
  property,
  render,
  styles,
  ready,
  dispose,
  reconnect,
  on,
  observe,
  dispatch,
  respond,
  request,
  debounce,
  daemon,
  provideContext,
  SniceElement,
  controller,
  attachController,
  detachController,
  useNativeElementControllers,
  lockBodyScroll,
  unlockBodyScroll,
  getBodyScrollLockCount,
  getSymbol
} from '../packages/core/src/index';
import { cleanupNativeElementControllers } from '../packages/core/src/controller';

const SCROLL_LOCK_HOOK = Symbol.for('snice:body-scroll-lock');

// Capture global state immediately after module evaluation (before any test runs)
const initialGlobals = {
  snice: (globalThis as any).snice,
  sniceNativeControllersInitialized: (globalThis as any).sniceNativeControllersInitialized,
  sniceNativeControllerObserver: (globalThis as any).sniceNativeControllerObserver,
  scrollLockHook: (globalThis as any)[SCROLL_LOCK_HOOK]
};

describe('BS-01: Core side-effect elimination, tree-shaking & css() caching', () => {
  afterEach(() => {
    cleanupNativeElementControllers();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    const scrollLock = (globalThis as any)[SCROLL_LOCK_HOOK];
    if (scrollLock?.clear) scrollLock.clear();
    vi.restoreAllMocks();
  });

  it('AC-1: declares explicit sideEffects array in package.json without core ESM modules', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(Array.isArray(pkg.sideEffects)).toBe(true);
    expect(pkg.sideEffects).toContain('./dist/testing-dom.esm.js');
    expect(pkg.sideEffects).toContain('./dist/testing-dom.cjs');
    expect(pkg.sideEffects).toContain('./dist/components/**/*.js');
    expect(pkg.sideEffects).toContain('./dist/components/**/*.css');
    expect(pkg.sideEffects).toContain('./packages/core/src/testing-dom.ts');
    expect(pkg.sideEffects).toContain('./packages/components/**/*.ts');
    expect(pkg.sideEffects).toContain('./packages/components/**/*.css');
    expect(pkg.sideEffects).not.toContain('./dist/index.esm.js');
    expect(pkg.sideEffects).not.toContain('./dist/symbols.esm.js');
    expect(pkg.sideEffects).not.toContain('./dist/transitions.esm.js');
    // Preserve exports ordering contract
    expect(Object.keys(pkg.exports['.'])).toEqual(['types', 'import', 'require']);
  });

  it('AC-2: bare import of core utilities and symbols does not mutate globalThis or start a MutationObserver', () => {
    expect(parseDuration('250ms').milliseconds()).toBe(250);
    expect(getSymbol('tree-shake-check')).toBe(Symbol.for('snice:tree-shake-check'));
    expect(initialGlobals.snice).toBeUndefined();
    expect(initialGlobals.sniceNativeControllersInitialized).toBeUndefined();
    expect(initialGlobals.sniceNativeControllerObserver).toBeUndefined();
    expect(initialGlobals.scrollLockHook).toBeUndefined();
  });

  it('AC-4: Rollup drops unused controller, SniceElement, RouteResult, and scroll-lock when only parseDuration is imported from dist/index.esm.js', async () => {
    const distEntry = resolve(process.cwd(), 'dist/index.esm.js');
    const dir = mkdtempSync(join(tmpdir(), 'snice-tree-shake-'));
    try {
      const entryFile = join(dir, 'entry.js');
      writeFileSync(
        entryFile,
        `import { parseDuration } from ${JSON.stringify(distEntry)};\nconsole.log(parseDuration('150ms'));\n`
      );
      const bundle = await rollup({ input: entryFile });
      try {
        const { output } = await bundle.generate({ format: 'es' });
        const code = output[0].code;
        expect(code).toContain('parseDuration');
        expect(code).not.toContain('MutationObserver');
        expect(code).not.toContain('sniceNativeControllersInitialized');
        expect(code).not.toContain('SniceElement');
        expect(code).not.toContain('RouteResult');
        expect(code).not.toContain('lockBodyScroll');
        expect(code).not.toContain('controllerRegistry');
      } finally {
        await bundle.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('AC-1/AC-4: preserves child-component side-effect imports in dist/components/** and when bundled by Rollup with node-resolve', async () => {
    const root = process.cwd();
    const treeJs = readFileSync(join(root, 'dist/components/tree/snice-tree.js'), 'utf8');
    const layoutJs = readFileSync(join(root, 'dist/components/layout/snice-layout.js'), 'utf8');
    const tableJs = readFileSync(join(root, 'dist/components/table/snice-table.js'), 'utf8');

    expect(treeJs).toMatch(/import\s+['"]\.\/snice-tree-item\.js['"]/);
    expect(layoutJs).toMatch(/import\s+['"]\.\.\/nav\/snice-nav\.js['"]/);
    expect(tableJs).toMatch(/import\s+['"]\.\/snice-column\.js['"]/);
    expect(tableJs).toMatch(/import\s+['"]\.\/snice-row\.js['"]/);

    const dir = mkdtempSync(join(tmpdir(), 'snice-component-side-effects-'));
    try {
      const entryFile = join(dir, 'entry.js');
      const treeDist = resolve(root, 'dist/components/tree/snice-tree.js');
      writeFileSync(entryFile, `import ${JSON.stringify(treeDist)};\n`);

      const bundle = await rollup({
        input: entryFile,
        external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
        plugins: [nodeResolve()],
      });
      try {
        const { output } = await bundle.generate({ format: 'es' });
        const code = output[0].code;
        expect(code).toContain('snice-tree');
        expect(code).toContain('snice-tree-item');
      } finally {
        await bundle.close();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('AC-3: useNativeElementControllers() reports missing-controller error even before any @controller is defined', async () => {
    const prevSnice = (globalThis as any).snice;
    delete (globalThis as any).snice;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const div = document.createElement('div');
      div.setAttribute('controller', 'non-existent-controller');
      document.body.appendChild(div);

      useNativeElementControllers();
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(errorSpy).toHaveBeenCalled();
      const allErrors = errorSpy.mock.calls.flat().map(arg => (arg instanceof Error ? arg.message : String(arg)));
      expect(allErrors.some(msg => msg.includes('Controller "non-existent-controller" not found in registry'))).toBe(true);
      expect(allErrors.some(msg => msg.includes('Snice global registry not initialized'))).toBe(false);
    } finally {
      cleanupNativeElementControllers();
      if (prevSnice !== undefined) {
        (globalThis as any).snice = prevSnice;
      }
    }
  });

  it('AC-3: @controller lazily activates native element observation after registration for existing and newly added DOM', async () => {
    const attachSpy = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Place element in DOM BEFORE @controller runs and without calling useNativeElementControllers()
    const existingDiv = document.createElement('div');
    existingDiv.setAttribute('controller', 'lazy-native-ctrl');
    document.body.appendChild(existingDiv);

    expect((globalThis as any).sniceNativeControllersInitialized).toBeUndefined();

    @controller('lazy-native-ctrl')
    class LazyNativeController {
      element: HTMLElement | null = null;
      attach = attachSpy;
      async detach() {}
    }
    void LazyNativeController;

    expect((globalThis as any).sniceNativeControllersInitialized).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(attachSpy).toHaveBeenCalledWith(existingDiv);
    expect(errorSpy).not.toHaveBeenCalled();

    // Newly added element after lazy activation also attaches automatically
    const addedSpan = document.createElement('span');
    addedSpan.setAttribute('controller', 'lazy-native-ctrl');
    document.body.appendChild(addedSpan);

    await new Promise(resolve => setTimeout(resolve, 20));
    expect(attachSpy).toHaveBeenCalledWith(addedSpan);
    expect(attachSpy).toHaveBeenCalledTimes(2);
  });

  it('AC-5: preserves SniceElement.propertyAttributeNaming and SNICE_ELEMENT_BASE inheritance without affecting plain HTMLElement', async () => {
    expect(SniceElement.propertyAttributeNaming).toBe('kebab');

    @element('ts-snice-base-el')
    class BaseSniceEl extends SniceElement {
      @property() userName = 'world';
      render() {
        return html`<span class="msg">Hello ${this.userName}</span>`;
      }
    }

    class IntermediateSniceEl extends SniceElement {}

    @element('ts-snice-grandchild-el')
    class GrandchildSniceEl extends IntermediateSniceEl {
      render() {
        return html`<em class="gc">Grandchild</em>`;
      }
    }

    const plainRenderSpy = vi.fn(() => html`<p>should not auto-run</p>`);
    @element('ts-plain-html-el')
    class PlainHtmlEl extends HTMLElement {
      render() {
        return plainRenderSpy();
      }
    }

    const baseEl = document.createElement('ts-snice-base-el') as BaseSniceEl;
    baseEl.setAttribute('user-name', 'snice');
    document.body.appendChild(baseEl);
    await baseEl.ready;
    expect(baseEl.userName).toBe('snice');
    expect(baseEl.shadowRoot?.querySelector('.msg')?.textContent).toBe('Hello snice');

    const gcEl = document.createElement('ts-snice-grandchild-el') as GrandchildSniceEl;
    document.body.appendChild(gcEl);
    await gcEl.ready;
    expect(gcEl.shadowRoot?.querySelector('.gc')?.textContent).toBe('Grandchild');

    const plainEl = document.createElement('ts-plain-html-el') as PlainHtmlEl;
    document.body.appendChild(plainEl);
    await (plainEl as any).ready;
    expect(Object.prototype.hasOwnProperty.call(PlainHtmlEl.prototype, 'render')).toBe(true);
    expect(plainRenderSpy).not.toHaveBeenCalled();
  });

  it('AC-5: dist/index.d.ts SniceElement uses unique symbol so subclasses with symbol members compile cleanly', () => {
    const root = process.cwd();
    const dts = readFileSync(join(root, 'dist/snice-element.d.ts'), 'utf8');
    const symbolsDts = readFileSync(join(root, 'dist/symbols.d.ts'), 'utf8');
    expect(symbolsDts).toContain('SNICE_ELEMENT_BASE: unique symbol');
    expect(dts).not.toContain('[x: symbol]');

    const consumer = mkdtempSync(join(tmpdir(), 'snice-element-dts-'));
    try {
      mkdirSync(join(consumer, 'node_modules'), { recursive: true });
      symlinkSync(root, join(consumer, 'node_modules', 'snice'), 'junction');
      writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
      writeFileSync(join(consumer, 'index.ts'), `
        import { SniceElement } from 'snice';
        const customSym = Symbol('custom');
        export class SymbolSubElement extends SniceElement {
          [customSym] = 42;
          *[Symbol.iterator](): Generator<number> {
            yield this[customSym];
          }
          get [Symbol.toStringTag](): string {
            return 'SymbolSubElement';
          }
        }
      `);
      writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        files: ['index.ts'],
      }));

      execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', join(consumer, 'tsconfig.json')], {
        cwd: consumer,
        stdio: 'pipe',
      });
    } finally {
      rmSync(consumer, { recursive: true, force: true });
    }
  });

  it('AC-6: caches identical interpolated css`${importedCss}` calls and runs replaceSync only once', () => {
    const importedCss = ':host { display: block; color: rgb(37 99 235); }';
    const makeStyles = (text: string) => css`${text}`;

    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'adoptedStyleSheets');
    const hadOwn = desc !== undefined;
    try {
      if (!('adoptedStyleSheets' in Document.prototype)) {
        Object.defineProperty(Document.prototype, 'adoptedStyleSheets', {
          value: [],
          configurable: true,
          writable: true,
        });
      }

      const replaceSyncSpy = vi.spyOn(CSSStyleSheet.prototype, 'replaceSync');

      const first = makeStyles(importedCss);
      expect(first.styleSheet).toBeInstanceOf(CSSStyleSheet);
      for (let i = 0; i < 99; i++) {
        const next = makeStyles(importedCss);
        expect(next).toBe(first);
        expect(next.styleSheet).toBe(first.styleSheet);
      }

      expect(replaceSyncSpy).toHaveBeenCalledTimes(1);

      // Static values.length === 0 fast path remains cached
      const makeStatic = () => css`:host { display: inline-block; }`;
      const s1 = makeStatic();
      const s2 = makeStatic();
      expect(s2).toBe(s1);
      expect(s1.styleSheet).toBeInstanceOf(CSSStyleSheet);
      expect(s2.styleSheet).toBe(s1.styleSheet);
    } finally {
      if (!hadOwn) {
        delete (Document.prototype as any).adoptedStyleSheets;
      } else if (desc.configurable) {
        Object.defineProperty(Document.prototype, 'adoptedStyleSheets', desc);
      }
    }
  });

  it('AC-7: returns accurate cssText for varying interpolations with bounded O(1) per-callsite cache and nested CSSResult support', () => {
    const dynamicStyle = (color: string) => css`:host { color: ${color}; }`;

    const red1 = dynamicStyle('red');
    const red1Repeat = dynamicStyle('red');
    expect(red1.cssText).toBe(':host { color: red; }');
    expect(red1Repeat).toBe(red1);

    const blue1 = dynamicStyle('blue');
    expect(blue1.cssText).toBe(':host { color: blue; }');
    expect(blue1).not.toBe(red1);

    // Bounded 1-slot per-callsite cache: 'blue' evicted 'red', so returning to 'red'
    // creates a fresh CSSResult instead of retaining an unbounded history map.
    const red2 = dynamicStyle('red');
    expect(red2.cssText).toBe(':host { color: red; }');
    expect(red2).not.toBe(red1);

    // Nested CSSResult flattening still works and caches identical compositions
    const base = css`:host { display: block; }`;
    const composed = (accent: string) => css`${base} .a { color: ${accent}; }`;
    const c1 = composed('green');
    const c2 = composed('green');
    expect(c1.cssText).toBe(':host { display: block; } .a { color: green; }');
    expect(c2).toBe(c1);
  });

  it('AC-6/AC-7: css() caching works cleanly when Document.prototype.adoptedStyleSheets is absent', () => {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'adoptedStyleSheets');
    const hadOwn = desc !== undefined;
    try {
      // Simulate an environment without adoptedStyleSheets
      if (hadOwn && desc.configurable) {
        delete (Document.prototype as any).adoptedStyleSheets;
      }
      expect('adoptedStyleSheets' in Document.prototype).toBe(false);
      const noSheetCss = (s: string) => css`${s}`;
      const r1 = noSheetCss(':host { padding: 1rem; }');
      const r2 = noSheetCss(':host { padding: 1rem; }');
      expect(r1.cssText).toBe(':host { padding: 1rem; }');
      expect(r1.styleSheet).toBeUndefined();
      expect(r2).toBe(r1);
    } finally {
      if (hadOwn && desc.configurable) {
        Object.defineProperty(Document.prototype, 'adoptedStyleSheets', desc);
      }
    }
  });

  it('AC-8: lazily installs scroll-lock test hook on first lockBodyScroll() and refcounts/clears cleanly', () => {
    delete (globalThis as any)[SCROLL_LOCK_HOOK];
    expect((globalThis as any)[SCROLL_LOCK_HOOK]).toBeUndefined();
    expect(getBodyScrollLockCount()).toBe(0);

    lockBodyScroll();
    expect((globalThis as any)[SCROLL_LOCK_HOOK]).toBeDefined();
    expect(typeof (globalThis as any)[SCROLL_LOCK_HOOK].clear).toBe('function');
    expect(getBodyScrollLockCount()).toBe(1);

    lockBodyScroll();
    expect(getBodyScrollLockCount()).toBe(2);

    unlockBodyScroll();
    expect(getBodyScrollLockCount()).toBe(1);

    (globalThis as any)[SCROLL_LOCK_HOOK].clear();
    expect(getBodyScrollLockCount()).toBe(0);
  });
});

async function bundleFromDist(entryCode: string, minify = false): Promise<{ code: string; modules: string[] }> {
  const distEntry = resolve(process.cwd(), 'dist/index.esm.js');
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs02-'));
  try {
    const entryFile = join(dir, 'entry.js');
    writeFileSync(entryFile, entryCode.replaceAll('__SNICE_DIST__', JSON.stringify(distEntry)));
    const bundle = await rollup({
      input: entryFile,
      plugins: minify ? [terser()] : [],
    });
    try {
      const { output } = await bundle.generate({ format: 'es' });
      return {
        code: output[0].code,
        modules: Object.keys(output[0].modules).map(m => m.replace(/\\/g, '/')),
      };
    } finally {
      await bundle.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('BS-02: Acyclic lifecycle-hook inversion & core ESM tree-shaking', () => {
  afterEach(() => {
    cleanupNativeElementControllers();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('AC-1: emits modular ESM chunks under dist/_core/ with no dist/node_modules and no bare npm specifiers', () => {
    const root = process.cwd();
    const distDir = join(root, 'dist');
    const coreDir = join(distDir, '_core');
    expect(existsSync(join(distDir, 'index.esm.js'))).toBe(true);
    expect(existsSync(coreDir)).toBe(true);
    expect(existsSync(join(distDir, 'node_modules'))).toBe(false);

    const entrySource = readFileSync(join(distDir, 'index.esm.js'), 'utf8');
    expect(entrySource).toContain('./_core/element.js');
    expect(entrySource).toContain('./_core/router.js');

    const coreFiles = readdirSync(coreDir).filter(f => f.endsWith('.js'));
    expect(coreFiles).toContain('element.js');
    expect(coreFiles).toContain('controller.js');
    expect(coreFiles).toContain('router.js');
    expect(coreFiles).toContain('lifecycle-hooks.js');

    // Verify no bare npm specifiers (e.g. 'pica-route') in index.esm.js or _core/*.js
    const allFiles = [join(distDir, 'index.esm.js'), ...coreFiles.map(f => join(coreDir, f))];
    for (const filePath of allFiles) {
      const code = readFileSync(filePath, 'utf8');
      const specifiers = [...code.matchAll(/^(?:import|export)\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/gm)].map(m => m[1]);
      for (const spec of specifiers) {
        expect(spec.startsWith('./') || spec.startsWith('../'), `bare specifier "${spec}" in ${filePath}`).toBe(true);
      }
    }

    // Every .map under dist/_core/ has non-null sourcesContent
    const coreMaps = readdirSync(coreDir).filter(f => f.endsWith('.map'));
    expect(coreMaps.length).toBeGreaterThan(10);
    for (const mapFile of coreMaps) {
      const map = JSON.parse(readFileSync(join(coreDir, mapFile), 'utf8'));
      expect(map.sourcesContent).toHaveLength(map.sources.length);
      expect(map.sourcesContent.every((s: string | null) => s !== null), `null sourcesContent in ${mapFile}`).toBe(true);
    }
  });

  it('AC-2: minimal element bundle drops unused subsystems, shrinks vs full runtime, and runs reactively', async () => {
    const minimalEntry = `
      import { element, property, render, html, css } from __SNICE_DIST__;
      class MinimalCounter extends HTMLElement {
        constructor() {
          super();
          this._count = 0;
        }
        renderContent() {
          return html\`<button class="inc">\${this._count}</button>\`;
        }
        getStyles() {
          return css\`:host { display: block; }\`;
        }
      }
      const desc = render()(MinimalCounter.prototype.renderContent, { kind: 'method', name: 'renderContent', addInitializer() {} });
      if (desc) MinimalCounter.prototype.renderContent = desc;
      element('bs02-min-counter')(MinimalCounter, { kind: 'class', name: 'MinimalCounter', metadata: {} });
      export { MinimalCounter, property, html, css };
    `;

    const { code, modules } = await bundleFromDist(minimalEntry, false);
    const hasCoreModule = (name: string) => modules.some(m => m.endsWith(`/dist/_core/${name}.js`));

    // Excluded subsystem modules (verified at Rollup module-graph level AND code level)
    for (const excluded of ['controller', 'observe', 'request-response', 'on', 'context', 'events', 'method-decorators', 'router', 'daemon']) {
      expect(hasCoreModule(excluded), `expected _core/${excluded}.js to be tree-shaken`).toBe(false);
    }
    expect(code).not.toContain('new MutationObserver');
    expect(code).not.toContain('ControllerScope');
    expect(code).not.toContain('IntersectionObserver');
    expect(code).not.toContain('ResizeObserver');
    expect(code).not.toContain('@request/');
    expect(code).not.toContain('NON_BUBBLING_EVENTS');
    expect(code).not.toContain('NAVIGATION_CONTEXT_INSTANCE');
    expect(code).not.toContain('DISPATCH_GENERATION');
    expect(code).not.toContain('DEBOUNCE_TIMERS');
    expect(code).not.toContain('THROTTLE_TIMERS');
    expect(code).not.toContain('RouteResult');
    expect(code).not.toContain('bindDaemon');

    // Measurable raw & gzip size reduction vs full core bundle
    const { code: minCode } = await bundleFromDist(minimalEntry, true);
    const { code: fullCode } = await bundleFromDist(`export * from __SNICE_DIST__;`, true);
    const minRaw = Buffer.byteLength(minCode, 'utf8');
    const fullRaw = Buffer.byteLength(fullCode, 'utf8');
    const minGz = gzipSync(minCode).length;
    const fullGz = gzipSync(fullCode).length;

    expect(minRaw).toBeLessThan(fullRaw * 0.72);
    expect(minGz).toBeLessThan(fullGz * 0.75);

    // Execute bundled minimal element in happy-dom to confirm reactive rendering works
    const { code: runnableCode } = await bundleFromDist(`
      import { element, render, html, css } from __SNICE_DIST__;
      class RunCounter extends HTMLElement {
        constructor() {
          super();
          this.count = 3;
        }
        renderContent() {
          return html\`<span class="val">\${this.count}</span>\`;
        }
      }
      const inits = [];
      render()(RunCounter.prototype.renderContent, {
        kind: 'method',
        name: 'renderContent',
        addInitializer(fn) { inits.push(fn); }
      });
      const Orig = RunCounter;
      class WrappedCounter extends Orig {
        constructor() {
          super();
          for (const fn of inits) fn.call(this);
        }
      }
      element('bs02-exec-counter')(WrappedCounter, { kind: 'class', name: 'WrappedCounter', metadata: {} });
      globalThis.__bs02Css = css\`:host { display: block; }\`.cssText;
    `, false);
    const dataUrl = `data:text/javascript;base64,${Buffer.from(runnableCode).toString('base64')}`;
    await import(/* @vite-ignore */ dataUrl);

    const el = document.createElement('bs02-exec-counter') as any;
    document.body.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('.val')?.textContent).toBe('3');
    expect((globalThis as any).__bs02Css).toBe(':host { display: block; }');
    delete (globalThis as any).__bs02Css;
  }, 30000);

  it('AC-3: selective feature bundle includes @on and @observe while excluding controller, router, daemon, request-response, and context', async () => {
    const { code, modules } = await bundleFromDist(`
      import { element, property, render, html, on, observe } from __SNICE_DIST__;
      export { element, property, render, html, on, observe };
    `, false);
    const hasCoreModule = (name: string) => modules.some(m => m.endsWith(`/dist/_core/${name}.js`));

    expect(hasCoreModule('on')).toBe(true);
    expect(hasCoreModule('observe')).toBe(true);
    for (const excluded of ['controller', 'router', 'daemon', 'request-response', 'context']) {
      expect(hasCoreModule(excluded), `expected _core/${excluded}.js to be tree-shaken`).toBe(false);
    }
    expect(code).toContain('NON_BUBBLING_EVENTS');
    expect(code).toContain('IntersectionObserver');
    expect(code).not.toContain('ControllerScope');
    expect(code).not.toContain('RouteResult');
    expect(code).not.toContain('bindDaemon');
    expect(code).not.toContain('@request/');
    expect(code).not.toContain('NAVIGATION_CONTEXT_INSTANCE');
  });

  it('AC-4/AC-5: preserves exact lifecycle ordering, synchronous @dispatch cancellation on disconnect/detach, late string controller deferral, and daemon lifecycle', async () => {
    const events: string[] = [];

    @element('bs02-lifecycle-el')
    class LifecycleEl extends HTMLElement {
      @property() label = 'init';

      @styles()
      getStyles() {
        events.push('styles');
        return css`:host { display: block; }`;
      }

      @on('click', '.btn')
      handleClick() {
        events.push('on:click');
      }

      @observe('mutation:childList')
      handleMutation() {
        events.push('observe:mutation');
      }

      @dispatch('delayed-ping', { debounce: 30 })
      firePing() {
        return { ok: true };
      }

      @debounce(90)
      debouncedWork() {
        events.push('debounce:fired');
      }

      @render()
      renderContent() {
        events.push('render');
        return html`<button class="btn">${this.label}</button>`;
      }

      @ready()
      onReady() {
        events.push('ready');
      }

      @reconnect()
      onReconnect() {
        events.push('reconnect');
      }

      @dispose()
      async onDispose() {
        events.push('dispose:start');
        await new Promise(r => setTimeout(r, 45));
        events.push('dispose:end');
      }
    }
    void LifecycleEl;

    const el = document.createElement('bs02-lifecycle-el') as any;
    let pingCount = 0;
    el.addEventListener('delayed-ping', () => { pingCount++; });

    document.body.appendChild(el);
    await el.ready;

    expect(events.slice(0, 3)).toEqual(['styles', 'render', 'ready']);

    // Click delegation works
    el.shadowRoot.querySelector('.btn').click();
    expect(events).toContain('on:click');

    // Schedule debounced @dispatch and @debounce, then disconnect BEFORE timers fire.
    // Synchronous clearDispatchTimers must prevent the event from firing even during async @dispose.
    el.firePing();
    el.debouncedWork();
    el.remove();
    await new Promise(r => setTimeout(r, 110));

    expect(pingCount).toBe(0);
    expect(events).not.toContain('debounce:fired');
    expect(events).toContain('dispose:start');
    expect(events).toContain('dispose:end');

    // Reconnect re-establishes @on and fires @reconnect
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));
    expect(events).toContain('reconnect');
    const clicksBefore = events.filter(e => e === 'on:click').length;
    el.shadowRoot.querySelector('.btn').click();
    expect(events.filter(e => e === 'on:click').length).toBe(clicksBefore + 1);

    // Late-loaded string controller deferral
    const lateEl = document.createElement('bs02-lifecycle-el') as any;
    lateEl.controller = 'bs02-late-ctrl';
    document.body.appendChild(lateEl);
    await lateEl.ready;

    const attachedHosts: HTMLElement[] = [];
    @controller('bs02-late-ctrl')
    class LateCtrl {
      element: HTMLElement | null = null;
      attach(host: HTMLElement) { attachedHosts.push(host); }
      detach() {}
    }
    void LateCtrl;

    await new Promise(r => setTimeout(r, 30));
    expect(attachedHosts).toContain(lateEl);

    // Daemon bind/release with @on, @respond, and @dispatch
    const daemonHits: string[] = [];
    @daemon
    class SampleDaemon {
      @on('ping')
      onPing() { daemonHits.push('on:ping'); }

      @respond('echo')
      onEcho(val: string) { return `echo:${val}`; }

      @dispatch('delayed-daemon', { debounce: 25 })
      sendDelayed() { return 'late'; }
    }

    @element('bs02-daemon-client')
    class DaemonClient extends HTMLElement {
      @request('echo', { daemon: 'sample' })
      async *ask(msg: string): any {
        return yield msg;
      }
    }
    void DaemonClient;

    const host = document.createElement('div');
    document.body.appendChild(host);
    const d = new SampleDaemon();
    const release = provideContext(host, { daemons: { sample: d } });

    const client = document.createElement('bs02-daemon-client') as any;
    host.appendChild(client);
    await client.ready;
    expect(await client.ask('hi')).toBe('echo:hi');
    release();
  });

  it('AC-6: missing controller bridge handles null no-op, pending string deferral + microtask error, and undecorated class console.error without throwing', async () => {
    const { code: isolatedBundle } = await bundleFromDist(`
      import { element, render, html } from __SNICE_DIST__;
      class IsolatedEl extends HTMLElement {
        renderContent() { return html\`<p class="ok">alive</p>\`; }
      }
      const inits = [];
      render()(IsolatedEl.prototype.renderContent, {
        kind: 'method',
        name: 'renderContent',
        addInitializer(fn) { inits.push(fn); }
      });
      class WrappedIsolated extends IsolatedEl {
        constructor() {
          super();
          for (const fn of inits) fn.call(this);
        }
      }
      element('bs02-isolated-no-ctrl')(WrappedIsolated, { kind: 'class', name: 'WrappedIsolated', metadata: {} });
    `, false);

    const storeKey = Symbol.for('snice:lifecycle-hooks');
    const savedStore = (globalThis as any)[storeKey];
    delete (globalThis as any)[storeKey];

    try {
      const dataUrl = `data:text/javascript;base64,${Buffer.from(isolatedBundle).toString('base64')}`;
      await import(/* @vite-ignore */ dataUrl);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const el = document.createElement('bs02-isolated-no-ctrl') as any;
      document.body.appendChild(el);
      await el.ready;
      expect(el.shadowRoot?.querySelector('.ok')?.textContent).toBe('alive');

      // (a) null / '' is a silent no-op and cancels queued pending string entry
      el.controller = null;
      el.controller = '';
      expect(errorSpy).not.toHaveBeenCalled();

      el.controller = 'bs02-cancelled-ctrl';
      el.controller = null;
      await new Promise(r => setTimeout(r, 10));
      expect(errorSpy).not.toHaveBeenCalled();

      // (b) string queues in pendingControllerAttachments and logs missing-controller error on microtask
      el.controller = 'bs02-never-registered';
      await new Promise(r => setTimeout(r, 10));
      const errMsgs = errorSpy.mock.calls.flat().map(v => (v instanceof Error ? v.message : String(v)));
      expect(errMsgs.some(m => m.includes('Controller "bs02-never-registered" not found in registry'))).toBe(true);
      el.controller = null;
      errorSpy.mockClear();

      // (c) class reference logs via console.error without throwing synchronously
      class PlainClass {}
      expect(() => { el.controller = PlainClass; }).not.toThrow();
      const classErrs = errorSpy.mock.calls.flat().map(v => (v instanceof Error ? v.message : String(v)));
      expect(classErrs.some(m => m.includes('must be decorated with @controller'))).toBe(true);

      // Unrelated elements continue rendering cleanly
      const el2 = document.createElement('bs02-isolated-no-ctrl') as any;
      document.body.appendChild(el2);
      await el2.ready;
      expect(el2.shadowRoot?.querySelector('.ok')?.textContent).toBe('alive');
    } finally {
      if (savedStore !== undefined) (globalThis as any)[storeKey] = savedStore;
      else delete (globalThis as any)[storeKey];
    }
  });
});
