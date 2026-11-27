import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import sniceRollup from '../../packages/plugin/src/rollup';
import * as sniceCore from '../../packages/core/src/index';
import { _getQuasiScanCount, TemplateInstance } from '../../packages/core/src/parts';
import { cleanupNativeElementControllers } from '../../packages/core/src/controller';

const ROOT = process.cwd();
const tempDirs: string[] = [];

async function buildAndImport(source: string, opts: { minifyTemplates: boolean; precompileTemplates: boolean }) {
  const dir = mkdtempSync(join(tmpdir(), 'snice-bs07-rt-'));
  tempDirs.push(dir);
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const pkgPath = join(ROOT, 'node_modules', pkg);
    if (existsSync(pkgPath)) symlinkSync(pkgPath, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'rt', type: 'module' }));
  const entry = join(dir, 'entry.ts');
  writeFileSync(entry, source);

  const bundle = await rollup({
    input: entry,
    // Externalize snice so the runtime shares the exact same parts.ts _getQuasiScanCount instance!
    external: ['snice'],
    plugins: [
      nodeResolve({ extensions: ['.ts', '.js'] }),
      sniceRollup({
        caching: false,
        minifyTemplates: opts.minifyTemplates,
        precompileTemplates: opts.precompileTemplates,
      }),
    ],
  });
  let code = '';
  try {
    const { output } = await bundle.generate({ format: 'es' });
    code = output[0].code;
  } finally {
    await bundle.close();
  }

  // Bind `'snice'` imports to the live in-process sniceCore module so V8 coverage
  // and `_getQuasiScanCount()` observe the exact runtime execution.
  (globalThis as any).__bs07Snice = sniceCore;
  const rewritten = code
    .replace(
      /import\s*\{([^}]+)\}\s*from\s*['"]snice['"];?/g,
      (_, specifiers: string) => {
        const destructured = specifiers.replace(/\bas\b/g, ':');
        return `const {${destructured}} = globalThis.__bs07Snice;`;
      }
    )
    .replace(
      /export\s*\{([^}]+)\}\s*from\s*['"]snice['"];?/g,
      (_, specifiers: string) => {
        const names = specifiers.split(',').map(s => s.trim()).filter(Boolean);
        return names.map(n => `export const ${n} = globalThis.__bs07Snice.${n};`).join('\n');
      }
    );
  const dataUrl = `data:text/javascript;base64,${Buffer.from(rewritten).toString('base64')}`;
  const mod = await import(/* @vite-ignore */ dataUrl);
  return { mod, code };
}

function makeFullSyntaxSource(tagPrefix: string): string {
  return `
    import {
      element, property, render, controller, html, svg, live, repeat, setStrictRenderErrors
    } from 'snice';

    @controller('${tagPrefix}-ctrl')
    export class TestCtrl {
      element: HTMLElement | null = null;
      attached = 0;
      attach(el: HTMLElement) { this.element = el; this.attached++; }
      detach() {}
    }

    @element('${tagPrefix}-el')
    export class FullSyntaxEl extends HTMLElement {
      @property() name = 'World';
      @property({ type: Number }) step = 1;
      @property({ type: Boolean }) disabled = false;
      @property() color = 'blue';
      @property() items: Array<{ id: string; label: string }> = [
        { id: '1', label: 'One' },
        { id: '2', label: 'Two' },
      ];
      @property() note = 'dyn-note';
      @property() inputVal = 'hello';
      @property() inputType = 'text';
      @property() codeSnippet = 'const x = 1;';

      clicks = 0;
      customClicks = 0;
      keyHits: string[] = [];

      onBtnClick() { this.clicks++; }
      onCustom() { this.customClicks++; }
      onKeyEnter() { this.keyHits.push('enter'); }
      onKeyCtrlS() { this.keyHits.push('ctrl+s'); }

      @render()
      renderContent() {
        const extraProps = { title: 'spread-title' };
        const extraAttrs = { 'data-spread': 'yes' };
        const extraEvents = { dblclick: () => { this.clicks += 10; } };
        return html\`
          <div class="root" ...props=\${extraProps} ...attrs=\${extraAttrs} ...events=\${extraEvents}>
            <!-- static comment should disappear when minified -->
            <!-- \${this.note} -->
            <p class="inline-space"><span>Hello</span> <span>\${this.name}</span></p>
            <pre class="pre">  \${this.codeSnippet}\n    line 2</pre>
            <textarea class="ta">  keep  </textarea>
            <div class="ctrl-host" controller=\${TestCtrl} />
            <input
              class="inp"
              type=\${this.inputType}
              ?disabled=\${this.disabled}
              .value=\${live(this.inputVal)}
              @keydown.~enter=\${this.onKeyEnter}
              @keydown:ctrl+s=\${this.onKeyCtrlS}
            />
            <button
              class="btn"
              class:active=\${!this.disabled}
              style:color=\${this.color}
              @click=\${this.onBtnClick}
              @@custom=\${this.onCustom}
            >Go</button>
            <if \${this.step === 1}>
              <span class="branch">one</span>
              <else-if \${this.step === 2}>
                <span class="branch">two</span>
              </else-if>
              <else>
                <span class="branch">other</span>
              </else>
            </if>
            <case \${this.step}>
              <when \${1}><em class="case-val">C1</em></when>
              <when \${2}><em class="case-val">C2</em></when>
              <default><em class="case-val">CD</em></default>
            </case>
            <ul class="list">
              \${repeat(this.items, { key: (it) => it.id, render: (it) => html\`<li key=\${it.id}>\${it.label}</li>\` })}
            </ul>
            <svg class="icon" viewBox="0 0 20 20">
              \${svg\`<circle cx="10" cy="10" r="8"></circle>\`}
            </svg>
          </div>
        \`;
      }
    }

    @element('${tagPrefix}-invalid')
    export class InvalidTmplEl extends HTMLElement {
      @render()
      renderContent() {
        return html\`<div \${'bad'}>oops</div>\`;
      }
    }

    export function makeUncompiled(val: string) {
      // Dynamic call prevents static tag pre-compilation -> verifies runtime fallback
      const fn = html;
      return fn\`<span class="uncompiled">\${val}</span>\`;
    }

    export { setStrictRenderErrors };
  `;
}

describe('BS-07: Template minification & pre-compilation runtime parity (happy-dom)', () => {
  afterEach(() => {
    cleanupNativeElementControllers();
    document.body.innerHTML = '';
    while (tempDirs.length > 0) {
      rmSync(tempDirs.pop()!, { recursive: true, force: true });
    }
  });

  it('AC-2/AC-3/AC-4/AC-5: minifyTemplates and precompileTemplates match unminified DOM, preserve DOM node identity across re-renders, skip runtime quasi scanner in precompiled mode, and keep invalid-template errors', async () => {
    // 1. Minified mode
    await buildAndImport(makeFullSyntaxSource('bs07-min'), {
      minifyTemplates: true,
      precompileTemplates: false,
    });

    const minEl = document.createElement('bs07-min-el') as any;
    document.body.appendChild(minEl);
    await minEl.ready;

    const minRoot = minEl.shadowRoot!;
    expect(minRoot.querySelector('.inline-space')!.textContent).toBe('Hello World');
    expect(minRoot.querySelector('.pre')!.textContent).toBe('  const x = 1;\n    line 2');
    expect(minRoot.querySelector('.ta')!.textContent).toBe('  keep  ');
    expect(minRoot.querySelector('.root')!.getAttribute('data-spread')).toBe('yes');
    expect((minRoot.querySelector('.root') as HTMLElement).title).toBe('spread-title');
    expect(minRoot.querySelector('.branch')!.textContent).toBe('one');
    expect(minRoot.querySelector('.case-val')!.textContent).toBe('C1');
    expect(minRoot.querySelector('.btn')!.classList.contains('active')).toBe(true);
    expect((minRoot.querySelector('.btn') as HTMLElement).style.color).toBe('blue');
    expect(minRoot.querySelectorAll('.list li').length).toBe(2);
    expect(minRoot.querySelector('svg circle')?.namespaceURI).toBe('http://www.w3.org/2000/svg');

    // Verify dynamic comment preserved
    const hasDynComment = Array.from(minRoot.querySelector('.root')!.childNodes).some(
      n => n.nodeType === 8 && n.textContent?.includes('dyn-note')
    );
    expect(hasDynComment).toBe(true);

    // Verify ControllerPart bound cleanly on `<div controller=${TestCtrl} />`
    await new Promise(r => setTimeout(r, 15));
    expect(minRoot.querySelector('.ctrl-host')!.getAttribute('controller')).toBe('bs07-min-ctrl');

    // Differential DOM-node reuse across re-render
    const btnBefore = minRoot.querySelector('.btn');
    minEl.name = 'Snice';
    minEl.step = 2;
    await minEl.rendered;
    expect(minRoot.querySelector('.btn')).toBe(btnBefore);
    expect(minRoot.querySelector('.inline-space')!.textContent).toBe('Hello Snice');
    expect(minRoot.querySelector('.branch')!.textContent).toBe('two');
    expect(minRoot.querySelector('.case-val')!.textContent).toBe('C2');

    // 2. Pre-compiled mode: verify scanner bypass + DOM node reuse + fallback for uncompiled & invalid
    const { mod: preMod, code: preCode } = await buildAndImport(makeFullSyntaxSource('bs07-pre'), {
      minifyTemplates: true,
      precompileTemplates: true,
    });
    expect(preCode).toContain('__sniceTemplate');

    const scansBeforePre = _getQuasiScanCount();
    const preEl = document.createElement('bs07-pre-el') as any;
    document.body.appendChild(preEl);
    await preEl.ready;
    const scansAfterPre = _getQuasiScanCount();
    // Pre-compiled templates MUST completely bypass scanTemplateQuasis!
    expect(scansAfterPre).toBe(scansBeforePre);

    const preRoot = preEl.shadowRoot!;
    expect(preRoot.querySelector('.inline-space')!.textContent).toBe('Hello World');
    expect(preRoot.querySelector('.pre')!.textContent).toBe('  const x = 1;\n    line 2');
    expect(preRoot.querySelector('.branch')!.textContent).toBe('one');
    expect(preRoot.querySelector('.case-val')!.textContent).toBe('C1');
    expect(preRoot.querySelector('svg circle')?.namespaceURI).toBe('http://www.w3.org/2000/svg');

    // Events, keyboard filters, @@custom, spread events work identically
    (preRoot.querySelector('.btn') as HTMLElement).click();
    expect(preEl.clicks).toBe(1);
    preRoot.querySelector('.root')!.dispatchEvent(new MouseEvent('dblclick'));
    expect(preEl.clicks).toBe(11);
    preRoot.querySelector('.btn')!.dispatchEvent(new CustomEvent('@custom'));
    expect(preEl.customClicks).toBe(1);
    preRoot.querySelector('.inp')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    preRoot.querySelector('.inp')!.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    expect(preEl.keyHits).toEqual(['enter', 'ctrl+s']);

    // Differential DOM node identity preserved across re-render (nodeBefore === nodeAfter)
    const preBtnBefore = preRoot.querySelector('.btn');
    preEl.name = 'Precompiled';
    preEl.step = 3;
    await preEl.rendered;
    expect(preRoot.querySelector('.btn')).toBe(preBtnBefore);
    expect(preRoot.querySelector('.inline-space')!.textContent).toBe('Hello Precompiled');
    expect(preRoot.querySelector('.branch')!.textContent).toBe('other');
    expect(preRoot.querySelector('.case-val')!.textContent).toBe('CD');
    expect(_getQuasiScanCount()).toBe(scansBeforePre);

    // Invalid opening-tag template fell back to runtime html`` and still throws exact error
    preMod.setStrictRenderErrors(true);
    const invEl = document.createElement('bs07-pre-invalid') as any;
    let errMsg = '';
    try {
      new TemplateInstance(invEl.renderContent()).renderFragment();
    } catch (e: any) {
      errMsg = e?.message ?? String(e);
    }
    expect(errMsg).toContain('expressions directly in opening tags are not supported');
    preMod.setStrictRenderErrors(false);

    // Disconnect, reconnect, and remove precompiled element to verify full lifecycle parity
    document.body.removeChild(preEl);
    document.body.appendChild(preEl);
    (preRoot.querySelector('.btn') as HTMLElement).click();
    expect(preEl.clicks).toBe(12);

    // Direct CompiledTemplateInstance.render() + marker collision avoidance (`data-s` present in user HTML)
    const { mod: colMod } = await buildAndImport(`
      import { html } from 'snice';
      export function makeCollision(v: string) {
        return html\`<div data-s="user-attr"><span>\${v}</span></div>\`;
      }
    `, { minifyTemplates: true, precompileTemplates: true });
    const colRes = colMod.makeCollision('safe');
    expect(colRes.compiled?.m).toBe('data-s0');
    const colInst = colRes._create(colRes, { tag: 'x-col' }, customElements);
    expect(colInst.getRenderHostIdentity()).toEqual({ tag: 'x-col' });
    const colFrag = colInst.render(colRes.values);
    expect(colFrag.querySelector('div')?.getAttribute('data-s')).toBe('user-attr');
    expect(colFrag.querySelector('span')?.textContent).toBe('safe');
    colInst.disconnected();
    colInst.reconnected();
    colInst.clear();

    // Uncompiled dynamic template in the same app still falls back to scanTemplateQuasis seamlessly
    const scansBeforeDynamic = _getQuasiScanCount();
    const dynRes = preMod.makeUncompiled('dyn');
    const inst = new TemplateInstance(dynRes);
    const frag = inst.renderFragment();
    inst.update(dynRes.values);
    expect(frag.querySelector('.uncompiled')?.textContent).toBe('dyn');
    expect(_getQuasiScanCount()).toBe(scansBeforeDynamic + 1);
  }, 30000);
});
