/**
 * Probe whether compound expressions inside `<if ${...}>` work at source level.
 *
 * Memory claims compound expressions get stripped by Rollup/Terser minifier.
 * This file tests the SOURCE path only — it does not exercise any minifier.
 * If these tests fail, the bug exists in the template engine itself, not
 * the build pipeline.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('<if> with compound expressions (source-level)', () => {
  let container: HTMLDivElement;
  let counter = 0;
  const t = (base: string) => `${base}-${++counter}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('accepts `${this.items.length > 0}` directly as the if condition', async () => {
    const tag = t('if-len-gt');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`
          <if ${this.items.length > 0}><span class="hit">have</span></if>
          <if ${this.items.length === 0}><span class="empty">none</span></if>
        `;
      }
    }

    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    expect(el.shadowRoot.querySelector('.empty')).toBeTruthy();

    el.items = [1, 2, 3];
    await new Promise((r) => queueMicrotask(r));

    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.empty')).toBeNull();
  });

  it('accepts `${this.items.length}` as a truthy condition', async () => {
    const tag = t('if-len');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`<if ${this.items.length}><span class="hit">have</span></if>`;
      }
    }

    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector('.hit')).toBeNull();

    el.items = [1];
    await new Promise((r) => queueMicrotask(r));

    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('accepts logical-AND compound `${!loading && hasItems}`', async () => {
    const tag = t('if-and');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Boolean }) loading = true;
      @property({ type: Boolean }) hasItems = false;
      @render()
      tpl() {
        return html`<if ${!this.loading && this.hasItems}><span class="hit">ok</span></if>`;
      }
    }

    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector('.hit')).toBeNull();

    el.loading = false;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeNull(); // hasItems still false

    el.hasItems = true;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('accepts ternary inside ${ } as text content', async () => {
    const tag = t('if-ternary-text');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Number }) n = 0;
      @render()
      tpl() {
        return html`<span class="label">${this.n > 0 ? 'positive' : 'zero'}</span>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.label').textContent).toBe('zero');
    el.n = 5;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.label').textContent).toBe('positive');
  });

  it('renders ${this.items.length} interpolated as text', async () => {
    const tag = t('text-len');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`<span class="n">${this.items.length}</span>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.n').textContent).toBe('0');
    el.items = [1, 2, 3, 4];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.n').textContent).toBe('4');
  });

  it('precomputed const works (memory-suggested workaround)', async () => {
    const tag = t('if-precomp');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @property({ type: Boolean }) loading = false;
      @render()
      tpl() {
        const hasItems = this.items.length > 0;
        const showEmpty = !this.loading && !hasItems;
        return html`
          <if ${hasItems}><span class="hit">have</span></if>
          <if ${showEmpty}><span class="empty">none</span></if>
        `;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.empty')).toBeTruthy();
    el.items = [1];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.empty')).toBeNull();
  });

  // ────────── pathological / less-obvious compound shapes ──────────

  it('triple-AND compound: `${a && b && c}`', async () => {
    const tag = t('if-triple-and');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Boolean }) a = true;
      @property({ type: Boolean }) b = true;
      @property({ type: Boolean }) c = true;
      @render()
      tpl() {
        return html`<if ${this.a && this.b && this.c}><span class="hit">all</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
    el.b = false;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.b = true;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('compound with method call: `${items.filter(...).length > 0}`', async () => {
    const tag = t('if-filter');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: { active: boolean }[] = [];
      @render()
      tpl() {
        return html`<if ${this.items.filter((x) => x.active).length > 0}><span class="hit">any-active</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.items = [{ active: false }, { active: false }];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.items = [{ active: false }, { active: true }];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('compound with `.some(...)` predicate', async () => {
    const tag = t('if-some');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: { id: number }[] = [];
      @render()
      tpl() {
        return html`<if ${this.items.some((x) => x.id === 5)}><span class="hit">found5</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.items = [{ id: 1 }, { id: 5 }];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('compound with optional chaining: `${user?.profile?.verified}`', async () => {
    const tag = t('if-optional-chain');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Object }) user: any = null;
      @render()
      tpl() {
        return html`<if ${this.user?.profile?.verified}><span class="hit">v</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.user = { profile: { verified: true } };
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('compound with double comparison: `${n > 0 && n < 10}`', async () => {
    const tag = t('if-range');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Number }) n = 0;
      @render()
      tpl() {
        return html`<if ${this.n > 0 && this.n < 10}><span class="hit">in-range</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.n = 5;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
    el.n = 10;
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
  });

  it('compound with strict-equality on string: `${status === "ready"}`', async () => {
    const tag = t('if-string-eq');
    @element(tag)
    class C extends HTMLElement {
      @property() status = 'idle';
      @render()
      tpl() {
        return html`<if ${this.status === 'ready'}><span class="hit">go</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.status = 'ready';
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')).toBeTruthy();
  });

  it('compound inside a list: `<if>` per item using item field', async () => {
    const tag = t('if-in-map');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: { id: number; visible: boolean }[] = [
        { id: 1, visible: true },
        { id: 2, visible: false },
        { id: 3, visible: true },
      ];
      @render()
      tpl() {
        return html`
          <ul>
            ${this.items.map(
              (it) => html`
                <li class="row">
                  <if ${it.visible}><span class="vis" data-id=${it.id}>${it.id}</span></if>
                </li>
              `,
            )}
          </ul>
        `;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    const visible = el.shadowRoot.querySelectorAll('.vis');
    expect(visible.length).toBe(2);
    expect(Array.from(visible).map((n: any) => n.dataset.id)).toEqual(['1', '3']);
  });

  it('compound that depends on a getter (not directly @property)', async () => {
    const tag = t('if-getter');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @property() filter = '';
      get visible() { return this.items.filter((n) => String(n).includes(this.filter)); }
      @render()
      tpl() {
        return html`<if ${this.visible.length > 0}><span class="hit">${this.visible.length}</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.hit')).toBeNull();
    el.items = [10, 20, 30];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')?.textContent).toBe('3');
    el.filter = '2';
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.hit')?.textContent).toBe('1');
  });

  it('two adjacent compound <if>s referencing same length', async () => {
    const tag = t('if-pair');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`
          <if ${this.items.length > 0}><span class="have">have</span></if>
          <if ${this.items.length === 0}><span class="none">none</span></if>
        `;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('.have')).toBeNull();
    expect(el.shadowRoot.querySelector('.none')).toBeTruthy();
    el.items = [1];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('.have')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.none')).toBeNull();
  });

  it('compound flipping between truthy and falsy across many transitions', async () => {
    const tag = t('if-toggle');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`<if ${this.items.length > 0}><span class="hit">${this.items.length}</span></if>`;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    const sequence = [0, 3, 0, 5, 0, 1, 7, 0];
    for (const n of sequence) {
      el.items = Array.from({ length: n }, (_, i) => i);
      await new Promise((r) => queueMicrotask(r));
      const hit = el.shadowRoot.querySelector('.hit');
      if (n > 0) {
        expect(hit, `expected .hit for n=${n}`).toBeTruthy();
        expect(hit.textContent, `expected text=${n} for n=${n}`).toBe(String(n));
      } else {
        expect(hit, `expected no .hit for n=0`).toBeNull();
      }
    }
  });

  it('nested <if>: outer compound, inner compound', async () => {
    const tag = t('if-nested');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Boolean }) loading = false;
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`
          <if ${!this.loading && this.items.length > 0}>
            <ul>
              ${this.items.map((n) => html`<li>${n}</li>`)}
              <if ${this.items.length > 3}><p class="big">big</p></if>
            </ul>
          </if>
        `;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.querySelector('ul')).toBeNull();

    el.items = [1, 2];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelector('ul')).toBeTruthy();
    expect(el.shadowRoot.querySelectorAll('li').length).toBe(2);
    expect(el.shadowRoot.querySelector('.big')).toBeNull();

    el.items = [1, 2, 3, 4];
    await new Promise((r) => queueMicrotask(r));
    expect(el.shadowRoot.querySelectorAll('li').length).toBe(4);
    expect(el.shadowRoot.querySelector('.big')).toBeTruthy();
  });
});
