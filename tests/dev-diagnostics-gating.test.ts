import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { rollup } from 'rollup';
import terser from '@rollup/plugin-terser';
import {
  element,
  property,
  watch,
  render,
  styles,
  on,
  observe,
  dispatch,
  html,
  css,
  waitForElementDefined,
  setStrictRenderErrors,
} from '../packages/core/src/index';

const originalNodeEnv = process.env.NODE_ENV;

function restoreDevGlobals() {
  delete (globalThis as any).__SNICE_DEV__;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
}

async function bundleDistWithReplace(
  entryCode: string,
  replaceTransform?: (code: string) => string
): Promise<string> {
  const distEntry = resolve(process.cwd(), 'dist/index.esm.js');
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs03-'));
  try {
    const entryFile = join(dir, 'entry.js');
    writeFileSync(entryFile, entryCode.replaceAll('__SNICE_DIST__', JSON.stringify(distEntry)));
    const plugins: any[] = [];
    if (replaceTransform) {
      plugins.push({
        name: 'inline-define',
        transform(code: string) {
          return { code: replaceTransform(code), map: null };
        }
      });
    }
    plugins.push(terser());
    const bundle = await rollup({ input: entryFile, plugins });
    try {
      const { output } = await bundle.generate({ format: 'es' });
      return output[0].code;
    } finally {
      await bundle.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('BS-03: Production __DEV__ diagnostic gating & DCE', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    restoreDevGlobals();
    setStrictRenderErrors(false);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('AC-1: preserves build-time foldable __SNICE_DEV__ and guarded process.env.NODE_ENV in built dist/_core/', () => {
    const coreDir = resolve(process.cwd(), 'dist/_core');
    const files = readdirSync(coreDir).filter(f => f.endsWith('.js'));
    let combined = '';
    for (const file of files) {
      const content = readFileSync(join(coreDir, file), 'utf8');
      combined += content;
      // Never reference bare `process.env` without a `typeof process` guard on the same line
      for (const line of content.split('\n')) {
        if (line.includes('process.env') && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*')) {
          expect(line, `unguarded process.env in ${file}`).toContain('typeof process');
        }
      }
    }
    expect(combined).toContain('typeof __SNICE_DEV__');
    expect(combined).toContain('process.env.NODE_ENV');
  });

  it('AC-2: Rollup + Terser DCE eliminates all gated dev warnings when __SNICE_DEV__ = false or NODE_ENV = production', async () => {
    const sampleApp = `
      import {
        element, property, watch, render, styles, on, observe, dispatch,
        respond, controller, html, css, waitForElementDefined
      } from __SNICE_DIST__;
      export {
        element, property, watch, render, styles, on, observe, dispatch,
        respond, controller, html, css, waitForElementDefined
      };
    `;

    const [unstripped, prodByFlag, prodByNodeEnv] = await Promise.all([
      bundleDistWithReplace(sampleApp),
      bundleDistWithReplace(sampleApp, code =>
        code.replace(/\b__SNICE_DEV__\b/g, 'false')
      ),
      bundleDistWithReplace(sampleApp, code =>
        code
          .replace(/typeof\s+process\s*===\s*['"]undefined['"]/g, 'false')
          .replace(/!process\.env\b/g, 'false')
          .replace(/process\.env\.NODE_ENV/g, '"production"')
      ),
    ]);

    const devOnlyStrings = [
      'matches no @property',
      'is not a valid modifier',
      'Render method must return',
      'Render method with differential: false must return a string',
      'Static styles must be',
      'Styles method must return',
      'is taking longer than',
      'attach aborted (element detached before ready)',
      'Near "',
      'takes a single expression',
      'a list mixes keyed and unkeyed items',
      'cannot use both scope and daemon — listener skipped',
      'Unknown observer type',
      'scope did not resolve',
    ];

    for (const marker of devOnlyStrings) {
      expect(unstripped, `baseline should contain "${marker}"`).toContain(marker);
      expect(prodByFlag, `__SNICE_DEV__=false should eliminate "${marker}"`).not.toContain(marker);
      expect(prodByNodeEnv, `NODE_ENV=production should eliminate "${marker}"`).not.toContain(marker);
    }

    // Measurable raw and gzip byte reduction
    expect(Buffer.byteLength(prodByFlag, 'utf8')).toBeLessThan(Buffer.byteLength(unstripped, 'utf8') - 2000);
    expect(gzipSync(prodByFlag).length).toBeLessThan(gzipSync(unstripped).length - 500);
    expect(Buffer.byteLength(prodByNodeEnv, 'utf8')).toBeLessThan(Buffer.byteLength(unstripped, 'utf8') - 2000);
  }, 30000);

  it('AC-3: default dev mode & browser-like env (process === undefined) emit warnings without ReferenceError', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Simulate browser without process or __SNICE_DEV__
    vi.stubGlobal('process', undefined);
    delete (globalThis as any).__SNICE_DEV__;

    @element('bs03-dev-warn-el')
    class DevWarnEl extends HTMLElement {
      @property() actual = 1;

      @watch('typoProp')
      onTypo() {}

      @on('click.once')
      onClickOnce() {}

      static styles = 'not-css' as any;

      @render()
      renderContent() {
        return html`<button @click.prevent=${() => {}} .title="x${'y'}">${[
          html`<span key=${'a'}>A</span>`,
          html`<span>B</span>`,
        ]}</button>`;
      }
    }
    void DevWarnEl;

    const el = document.createElement('bs03-dev-warn-el') as any;
    document.body.appendChild(el);
    await el.ready;

    const warnings = warnSpy.mock.calls.map(c => String(c[0]));
    expect(warnings.some(w => w.includes('matches no @property'))).toBe(true);
    expect(warnings.some(w => w.includes('is not a valid modifier'))).toBe(true);
    expect(warnings.some(w => w.includes('Static styles must be'))).toBe(true);
    expect(warnings.some(w => w.includes('takes a single expression'))).toBe(true);
    expect(warnings.some(w => w.includes('mixes keyed and unkeyed'))).toBe(true);

    // Malformed opening tag includes Near "..." in dev mode
    @element('bs03-dev-bad-tmpl')
    class DevBadTmpl extends HTMLElement {
      @render()
      renderContent() {
        return html`<div ${'bad'}>oops</div>`;
      }
    }
    void DevBadTmpl;
    setStrictRenderErrors(true);
    const bad = document.createElement('bs03-dev-bad-tmpl') as any;
    let errMsg = '';
    try {
      bad.renderContent();
    } catch (e: any) {
      errMsg = e?.message ?? String(e);
    }
    expect(errMsg).toContain('Near "');
  });

  it('AC-4/AC-5/AC-7: production mode (__SNICE_DEV__ = false and NODE_ENV = production) suppresses warnings, skips ready timer, and preserves runtime errors', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First verify __SNICE_DEV__ = false suppresses all warnings across element.ts, parts.ts, render.ts, on.ts
    (globalThis as any).__SNICE_DEV__ = false;

    @element('bs03-prod-el-1')
    class ProdEl1 extends HTMLElement {
      @property() actual = 1;
      @watch('missingProp') onMissing() {}
      @on('click.once') onBadMod() {}
      @on('x', { scope: '.does-not-exist' }) onBadScope() {}
      @observe('unknown-obs') onBadObs() {}
      @dispatch('ev', { scope: '.does-not-exist' }) sendEv() { return 1; }
      static styles = 'invalid' as any;

      @styles()
      badStyles() {
        return 'not-css-result' as any;
      }

      @render()
      renderContent() {
        return html`<button @click.stop=${() => {}} .title="a${'b'}">${[
          html`<i key=${'1'}>1</i>`,
          html`<i>2</i>`,
        ]}</button>`;
      }
    }
    void ProdEl1;

    const el1 = document.createElement('bs03-prod-el-1') as any;
    document.body.appendChild(el1);
    await el1.ready;
    el1.sendEv();

    @element('bs03-prod-non-html')
    class ProdNonHtml extends HTMLElement {
      @render()
      renderContent() {
        return 123 as any;
      }
    }
    void ProdNonHtml;
    const nonHtml = document.createElement('bs03-prod-non-html') as any;
    document.body.appendChild(nonHtml);
    await nonHtml.ready;

    @element('bs03-prod-non-str')
    class ProdNonStr extends HTMLElement {
      @render({ differential: false })
      renderContent() {
        return 123 as any;
      }
    }
    void ProdNonStr;
    const nonStr = document.createElement('bs03-prod-non-str') as any;
    document.body.appendChild(nonStr);
    await nonStr.ready;

    expect(warnSpy).not.toHaveBeenCalled();

    // AC-4: Malformed opening tag STILL throws, without Near "..."
    @element('bs03-prod-bad-open')
    class ProdBadOpen extends HTMLElement {
      @render()
      renderContent() {
        return html`<div ${'x'}>bad</div>`;
      }
    }
    void ProdBadOpen;
    setStrictRenderErrors(true);
    const badOpen = document.createElement('bs03-prod-bad-open') as any;
    let openErr: Error | null = null;
    try {
      badOpen.renderContent();
    } catch (e: any) {
      openErr = e;
    }
    expect(openErr).toBeInstanceOf(Error);
    expect(openErr!.message).toContain('expressions directly in opening tags are not supported');
    expect(openErr!.message).not.toContain('Near "');

    // AC-4: Unknown spread STILL throws via Template constructor without contextualizeTemplatePreparationError Near "..."
    @element('bs03-prod-bad-spread')
    class ProdBadSpread extends HTMLElement {
      @render()
      renderContent() {
        return html`<div ...bogus=${{ a: 1 }}></div>`;
      }
    }
    void ProdBadSpread;
    const badSpread = document.createElement('bs03-prod-bad-spread') as any;
    let spreadErr: Error | null = null;
    try {
      badSpread.renderContent();
    } catch (e: any) {
      spreadErr = e;
    }
    expect(spreadErr).toBeInstanceOf(Error);
    expect(spreadErr!.message).toContain('unknown spread binding');
    expect(spreadErr!.message).not.toContain('Near "');

    // AC-4: Duplicate keys STILL throw in production mode
    @element('bs03-prod-dup-keys')
    class ProdDupKeys extends HTMLElement {
      @render()
      renderContent() {
        return html`<ul>${[
          html`<li key=${'dup'}>A</li>`,
          html`<li key=${'dup'}>B</li>`,
        ]}</ul>`;
      }
    }
    void ProdDupKeys;
    const dupEl = document.createElement('bs03-prod-dup-keys') as any;
    let dupErr: Error | null = null;
    try {
      dupEl.renderContent();
    } catch (e: any) {
      dupErr = e;
    }
    expect(dupErr).toBeInstanceOf(Error);
    expect(dupErr!.message).toContain('duplicate keys');

    // AC-5: waitForElementDefined schedules NO warning setTimeout in production mode
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const waitPromise = waitForElementDefined('bs03-late-defined-el', 10);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    customElements.define('bs03-late-defined-el', class extends HTMLElement {});
    await waitPromise;
    expect(warnSpy).not.toHaveBeenCalled();

    // Also test NODE_ENV === 'production' runtime suppression (with __SNICE_DEV__ undefined)
    delete (globalThis as any).__SNICE_DEV__;
    process.env.NODE_ENV = 'production';
    @element('bs03-node-env-prod')
    class NodeEnvProd extends HTMLElement {
      @watch('nope') onNope() {}
      @render() renderContent() { return 42 as any; }
    }
    void NodeEnvProd;
    const neEl = document.createElement('bs03-node-env-prod') as any;
    document.body.appendChild(neEl);
    await neEl.ready;
    expect(warnSpy).not.toHaveBeenCalled();

    // Also exercise __SNICE_DEV__ = true branch for coverage
    process.env.NODE_ENV = 'development';
    (globalThis as any).__SNICE_DEV__ = true;
    @element('bs03-explicit-dev-true')
    class ExplicitDevTrue extends HTMLElement {
      @render() renderContent() { return 99 as any; }
    }
    void ExplicitDevTrue;
    const devTrueEl = document.createElement('bs03-explicit-dev-true') as any;
    document.body.appendChild(devTrueEl);
    await devTrueEl.ready;
    expect(warnSpy).toHaveBeenCalledWith('Render method must return html`` template result');

    void errorSpy;
  });
});
