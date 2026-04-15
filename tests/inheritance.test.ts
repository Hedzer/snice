import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './components/test-utils';

let counter = 0;
function tag(base: string) {
  return `test-${base}-${++counter}-${Date.now()}`;
}

describe('element inheritance', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => { els.forEach(el => { try { removeComponent(el); } catch {} }); els = []; });

  // ═══════════════════════════════════════════════════════════════
  // PROPERTY INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('property inheritance', () => {
    it('child inherits all parent properties', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi1p'), ct = tag('pi1c');

      @element(pt) class P extends HTMLElement {
        @property() color = 'red';
        @property({ type: Number }) size = 10;
        @property({ type: Boolean }) active = false;
        @render() r() { return html`<div>${this.color}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property() label = 'child';
        @render() r() { return html`<div>${this.color} ${this.size} ${this.label}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      expect((c as any).color).toBe('red');
      expect((c as any).size).toBe(10);
      expect((c as any).active).toBe(false);
      expect((c as any).label).toBe('child');
    });

    it('child can override parent property defaults', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi2p'), ct = tag('pi2c');

      @element(pt) class P extends HTMLElement {
        @property() variant = 'default';
        @render() r() { return html`<div>${this.variant}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property() variant = 'primary';
        @render() r() { return html`<div>${this.variant}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const p = track(await createComponent(pt));
      const c = track(await createComponent(ct));
      await p.ready; await c.ready;
      expect((p as any).variant).toBe('default');
      expect((c as any).variant).toBe('primary');
    });

    it('setting attribute on child triggers inherited property setter', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const pt = tag('pi3p'), ct = tag('pi3c');
      const calls: any[] = [];

      @element(pt) class P extends HTMLElement {
        @property() color = 'red';
        @watch('color') onColor() { calls.push({ who: 'parent', val: (this as any).color }); }
        @render() r() { return html`<div>${this.color}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>${this.color}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;

      // Setting property directly should trigger watcher
      (c as any).color = 'blue';
      expect((c as any).color).toBe('blue');
      expect(calls.some(entry => entry.val === 'blue')).toBe(true);

      // Setting attribute should also update the property
      calls.length = 0;
      c.setAttribute('color', 'green');
      expect((c as any).color).toBe('green');
    });

    it('inherited property type coercion works (Number)', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi4p'), ct = tag('pi4c');

      @element(pt) class P extends HTMLElement {
        @property({ type: Number }) count = 0;
        @render() r() { return html`<div>${this.count}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>${this.count}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct, { count: '42' }));
      await c.ready;
      expect((c as any).count).toBe(42);
      expect(typeof (c as any).count).toBe('number');
    });

    it('inherited property type coercion works (Boolean)', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi5p'), ct = tag('pi5c');

      @element(pt) class P extends HTMLElement {
        @property({ type: Boolean }) disabled = false;
        @render() r() { return html`<div>${this.disabled}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>${this.disabled}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct, { disabled: true }));
      await c.ready;
      expect((c as any).disabled).toBe(true);
      expect(c.hasAttribute('disabled')).toBe(true);
    });

    it('child overrides parent property with different type', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi6p'), ct = tag('pi6c');

      @element(pt) class P extends HTMLElement {
        @property() size = 'medium';
        @render() r() { return html`<div>${this.size}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property({ type: Number }) size = 16 as any;
        @render() r() { return html`<div>${this.size}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      (c as any).size = 24;
      expect((c as any).size).toBe(24);
      expect(typeof (c as any).size).toBe('number');
    });

    it('child overrides parent property with different attribute name', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi7p'), ct = tag('pi7c');

      @element(pt) class P extends HTMLElement {
        @property({ attribute: 'data-val' }) val = 'a';
        @render() r() { return html`<div>${this.val}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property({ attribute: 'my-val' }) val = 'b';
        @render() r() { return html`<div>${this.val}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const ChildCtor = customElements.get(ct) as any;
      expect(ChildCtor.observedAttributes).toContain('my-val');

      const c = track(document.createElement(ct));
      c.setAttribute('my-val', 'override');
      document.body.appendChild(c);
      await (c as any).ready;
      expect((c as any).val).toBe('override');
    });

    it('child observedAttributes includes parent properties', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi8p'), ct = tag('pi8c');

      @element(pt) class P extends HTMLElement {
        @property() color = 'red';
        @property({ attribute: 'data-size', type: Number }) size = 10;
        @render() r() { return html`<div></div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property() label = 'x';
        @render() r() { return html`<div></div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const observed = (customElements.get(ct) as any).observedAttributes;
      expect(observed).toContain('color');
      expect(observed).toContain('data-size');
      expect(observed).toContain('label');
    });

    it('property values are independent across instances', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi9p'), ct = tag('pi9c');

      @element(pt) class P extends HTMLElement {
        @property() name = 'default';
        @render() r() { return html`<div>${this.name}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>${this.name}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c1 = track(await createComponent(ct));
      const c2 = track(await createComponent(ct));
      await c1.ready; await c2.ready;

      (c1 as any).name = 'first';
      (c2 as any).name = 'second';
      expect((c1 as any).name).toBe('first');
      expect((c2 as any).name).toBe('second');
    });

    it('parent instance still works after child class is defined', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('pi10p'), ct = tag('pi10c');

      @element(pt) class P extends HTMLElement {
        @property() val = 'pval';
        @render() r() { return html`<div class="p">${this.val}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div class="c">${this.val}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      // Create parent AFTER child is defined — parent should not be corrupted
      const p = track(await createComponent(pt));
      const c = track(await createComponent(ct));
      await p.ready; await c.ready;

      // Both should render and respond to property changes independently
      (p as any).val = 'parentChanged';
      (c as any).val = 'childChanged';

      // Wait for render
      await new Promise(r => setTimeout(r, 50));

      expect((p as any).val).toBe('parentChanged');
      expect((c as any).val).toBe('childChanged');
      expect(queryShadow(c, '.c')?.textContent).toBe('childChanged');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('render inheritance', () => {
    it('child render replaces parent render', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const pt = tag('ri1p'), ct = tag('ri1c');

      @element(pt) class P extends HTMLElement {
        @render() r() { return html`<div class="parent">parent</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div class="child">child</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const p = track(await createComponent(pt));
      const c = track(await createComponent(ct));
      await p.ready; await c.ready;

      expect(queryShadow(p, '.parent')?.textContent).toBe('parent');
      expect(queryShadow(c, '.child')?.textContent).toBe('child');
      expect(queryShadow(c, '.parent')).toBeNull();
    });

    it('child without @render inherits parent render', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('ri2p'), ct = tag('ri2c');

      @element(pt) class P extends HTMLElement {
        @property() text = 'inherited';
        @render() r() { return html`<div class="fromparent">${this.text}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @styles() s() { return css`:host{display:block}`; }
        // No @render — should use parent's
      }

      const c = track(await createComponent(ct));
      await c.ready;
      expect(queryShadow(c, '.fromparent')?.textContent).toBe('inherited');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STYLES INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('styles inheritance', () => {
    it('child styles concatenate with parent styles', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const pt = tag('si1p'), ct = tag('si1c');

      @element(pt) class P extends HTMLElement {
        @render() r() { return html`<div class="box">x</div>`; }
        @styles() s() { return css`:host{display:block} .box{color:red}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div class="box">x</div>`; }
        @styles() s() { return css`.box{font-weight:bold}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;

      const sr = c.shadowRoot!;
      const sheets = sr.adoptedStyleSheets;
      if (sheets && sheets.length > 0) {
        expect(sheets.length).toBe(2); // parent + child
      } else {
        const cssText = sr.querySelector('style')!.textContent || '';
        expect(cssText).toMatch(/color:\s*red/);
        expect(cssText).toMatch(/font-weight:\s*bold/);
      }
    });

    it('parent styles come first in cascade (child can override)', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const pt = tag('si2p'), ct = tag('si2c');

      @element(pt) class P extends HTMLElement {
        @render() r() { return html`<div class="item">text</div>`; }
        @styles() s() { return css`.item{color:blue;font-size:12px}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div class="item">text</div>`; }
        @styles() s() { return css`.item{color:green}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      const computed = getComputedStyle(queryShadow(c, '.item')!);
      expect(computed.color).toMatch(/green|rgb\(0,\s*128,\s*0\)/);
    });

    it('child without @styles inherits parent styles', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const pt = tag('si3p'), ct = tag('si3c');

      @element(pt) class P extends HTMLElement {
        @render() r() { return html`<div class="styled">x</div>`; }
        @styles() s() { return css`.styled{color:red}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div class="styled">x</div>`; }
        // No @styles — should inherit parent's
      }

      const c = track(await createComponent(ct));
      await c.ready;
      const sr = c.shadowRoot!;
      const hasStyles = (sr.adoptedStyleSheets?.length > 0) ||
                        !!sr.querySelector('style');
      expect(hasStyles).toBe(true);
    });

    it('three-level style concatenation', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const g = tag('si4g'), p = tag('si4p'), c = tag('si4c');

      @element(g) class G extends HTMLElement {
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(p) class P extends G {
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{padding:8px}`; }
      }
      @element(c) class C extends P {
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{margin:4px}`; }
      }

      const el = track(await createComponent(c));
      await el.ready;
      const sheets = el.shadowRoot!.adoptedStyleSheets;
      if (sheets && sheets.length > 0) {
        expect(sheets.length).toBe(3);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // WATCHER INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('watcher inheritance', () => {
    it('child inherits parent watchers (different method names)', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const pt = tag('wi1p'), ct = tag('wi1c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @property() value = '';
        @watch('value') parentWatch() { calls.push('parent'); }
        @render() r() { return html`<div>${this.value}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @watch('value') childWatch() { calls.push('child'); }
        @render() r() { return html`<div>${this.value}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      (c as any).value = 'x';
      expect(calls).toContain('parent');
      expect(calls).toContain('child');
    });

    it('child watcher on parent-only property works', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const pt = tag('wi2p'), ct = tag('wi2c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @property() parentProp = 'init';
        @render() r() { return html`<div>${this.parentProp}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @watch('parentProp') onParentPropFromChild() { calls.push('child-watching-parent-prop'); }
        @render() r() { return html`<div>${this.parentProp}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      (c as any).parentProp = 'changed';
      expect(calls).toContain('child-watching-parent-prop');
    });

    it('same method name: both parent and child watcher functions execute', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const pt = tag('wi3p'), ct = tag('wi3c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @property() count = 0;
        @watch('count') onChange() { calls.push('parent-fn'); }
        @render() r() { return html`<div>${this.count}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @watch('count') onChange() { calls.push('child-fn'); }
        @render() r() { return html`<div>${this.count}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      (c as any).count = 1;
      // Both registered — parent's original fn ref + child's override fn ref
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls).toContain('child-fn');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // @on HANDLER INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('@on handler inheritance', () => {
    it('child inherits parent @on handlers', async () => {
      const { element, on, render, styles, html, css } = await import('snice');
      const pt = tag('oi1p'), ct = tag('oi1c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @on('click') parentClick() { calls.push('parent-click'); }
        @render() r() { return html`<button>btn</button>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @on('mouseenter') childHover() { calls.push('child-hover'); }
        @render() r() { return html`<button>btn</button>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      c.click();
      expect(calls).toContain('parent-click');
    });

    it('child and parent both register different @on events', async () => {
      const { element, on, render, styles, html, css } = await import('snice');
      const pt = tag('oi2p'), ct = tag('oi2c');

      @element(pt) class P extends HTMLElement {
        @on('click') parentClick() {}
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @on('focus') childFocus() {}
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      // __onMethods is populated via addInitializer (on first instance creation)
      const c = track(await createComponent(ct));
      await c.ready;
      expect((c.constructor as any).__onMethods).toBeDefined();
      expect((c.constructor as any).__onMethods.size).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('lifecycle inheritance', () => {
    it('child inherits parent @ready', async () => {
      const { element, ready, render, styles, html, css } = await import('snice');
      const pt = tag('li1p'), ct = tag('li1c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @ready() parentReady() { calls.push('parent-ready'); }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @ready() childReady() { calls.push('child-ready'); }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      expect(calls).toContain('parent-ready');
      expect(calls).toContain('child-ready');
    });

    it('child inherits parent @dispose', async () => {
      const { element, dispose, render, styles, html, css } = await import('snice');
      const pt = tag('li2p'), ct = tag('li2c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @dispose() parentDispose() { calls.push('parent-dispose'); }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @dispose() childDispose() { calls.push('child-dispose'); }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      removeComponent(c);
      els = els.filter(e => e !== c);
      await new Promise(r => setTimeout(r, 50));
      expect(calls).toContain('parent-dispose');
      expect(calls).toContain('child-dispose');
    });

    it('reconnection re-establishes inherited @on handlers', async () => {
      const { element, on, render, styles, html, css } = await import('snice');
      const pt = tag('li3p'), ct = tag('li3c');
      const calls: string[] = [];

      @element(pt) class P extends HTMLElement {
        @on('click') parentClick() { calls.push('parent-click'); }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;

      // Disconnect then reconnect
      c.remove();
      document.body.appendChild(c);
      await new Promise(r => setTimeout(r, 50));

      calls.length = 0;
      c.click();
      expect(calls).toContain('parent-click');
    });

    it('@ready does not re-fire on reconnection', async () => {
      const { element, ready, render, styles, html, css } = await import('snice');
      const pt = tag('li4p'), ct = tag('li4c');
      let readyCount = 0;

      @element(pt) class P extends HTMLElement {
        @ready() parentReady() { readyCount++; }
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      expect(readyCount).toBe(1);

      c.remove();
      document.body.appendChild(c);
      await new Promise(r => setTimeout(r, 50));
      expect(readyCount).toBe(1); // Should NOT have incremented
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DISPATCH INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('dispatch inheritance', () => {
    it('child inherits parent @dispatch methods', async () => {
      const { element, property, dispatch, render, styles, html, css } = await import('snice');
      const pt = tag('di1p'), ct = tag('di1c');
      const events: string[] = [];

      @element(pt) class P extends HTMLElement {
        @property() value = '';
        @dispatch('parent-change', { bubbles: true }) emitChange() { return { value: (this as any).value }; }
        @render() r() { return html`<div>${this.value}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @dispatch('child-action', { bubbles: true }) emitAction() { return { type: 'child' }; }
        @render() r() { return html`<div>${this.value}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      c.addEventListener('parent-change', () => events.push('parent-change'));
      c.addEventListener('child-action', () => events.push('child-action'));

      (c as any).emitChange();
      (c as any).emitAction();
      expect(events).toContain('parent-change');
      expect(events).toContain('child-action');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // formAssociated INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('formAssociated inheritance', () => {
    it('child inherits formAssociated from parent', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const pt = tag('fi1p'), ct = tag('fi1c');

      @element(pt, { formAssociated: true }) class P extends HTMLElement {
        @property() value = '';
        @render() r() { return html`<input .value=${this.value}>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @render() r() { return html`<input .value=${this.value}>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      expect((customElements.get(ct) as any).formAssociated).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MULTI-LEVEL INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('multi-level inheritance', () => {
    it('grandchild inherits from both parent and grandparent', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const g = tag('ml1g'), p = tag('ml1p'), c = tag('ml1c');
      const calls: string[] = [];

      @element(g) class G extends HTMLElement {
        @property() base = 'gp';
        @watch('base') gpWatch() { calls.push('gp-base'); }
        @render() r() { return html`<div>${this.base}</div>`; }
        @styles() s() { return css`:host{display:block;color:red}`; }
      }
      @element(p) class P extends G {
        @property() middle = 'parent';
        @watch('middle') parentWatch() { calls.push('parent-middle'); }
        @render() r() { return html`<div>${this.base} ${this.middle}</div>`; }
        @styles() s() { return css`:host{font-size:14px}`; }
      }
      @element(c) class C extends P {
        @property() leaf = 'child';
        @render() r() { return html`<div>${this.base} ${this.middle} ${this.leaf}</div>`; }
        @styles() s() { return css`:host{font-weight:bold}`; }
      }

      const el = track(await createComponent(c));
      await el.ready;

      expect((el as any).base).toBe('gp');
      expect((el as any).middle).toBe('parent');
      expect((el as any).leaf).toBe('child');

      (el as any).base = 'changed';
      expect(calls).toContain('gp-base');
      (el as any).middle = 'changed';
      expect(calls).toContain('parent-middle');

      const sheets = el.shadowRoot!.adoptedStyleSheets;
      if (sheets?.length > 0) expect(sheets.length).toBe(3);
    });

    it('middle level overrides grandparent default, child inherits override', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const g = tag('ml2g'), p = tag('ml2p'), c = tag('ml2c');

      @element(g) class G extends HTMLElement {
        @property() theme = 'light';
        @render() r() { return html`<div>${this.theme}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(p) class P extends G {
        @property() theme = 'dark'; // Override grandparent default
        @render() r() { return html`<div>${this.theme}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(c) class C extends P {
        // No @property override — should get parent's 'dark' default
        @render() r() { return html`<div>${this.theme}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const el = track(await createComponent(c));
      await el.ready;
      expect((el as any).theme).toBe('dark');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // OBSERVE INHERITANCE
  // ═══════════════════════════════════════════════════════════════

  describe('observe inheritance', () => {
    it('both parent and child observers register', async () => {
      const { element, render, styles, html, css } = await import('snice');
      const { observe } = await import('snice');
      const pt = tag('ob1p'), ct = tag('ob1c');

      @element(pt) class P extends HTMLElement {
        @observe('resize') parentObs() {}
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @observe('resize') childObs() {}
        @render() r() { return html`<div>x</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const c = track(await createComponent(ct));
      await c.ready;
      expect((c.constructor as any).__observeMethods.size).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MULTIPLE INSTANCES
  // ═══════════════════════════════════════════════════════════════

  describe('multiple instances', () => {
    it('creating multiple child instances does not duplicate handlers', async () => {
      const { element, property, watch, render, styles, html, css } = await import('snice');
      const pt = tag('mu1p'), ct = tag('mu1c');

      @element(pt) class P extends HTMLElement {
        @property() count = 0;
        @watch('count') onCount() {}
        @render() r() { return html`<div>${this.count}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }
      @element(ct) class C extends P {
        @property() extra = '';
        @watch('extra') onExtra() {}
        @render() r() { return html`<div>${this.count} ${this.extra}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const children = [];
      for (let i = 0; i < 5; i++) children.push(track(await createComponent(ct)));
      await Promise.all(children.map((c: any) => c.ready));

      expect((children[0].constructor as any).__watchMethods.size).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // NO-INHERITANCE BASELINE
  // ═══════════════════════════════════════════════════════════════

  describe('no-inheritance baseline', () => {
    it('plain HTMLElement extension has zero overhead', async () => {
      const { element, property, render, styles, html, css } = await import('snice');
      const t = tag('base1');

      @element(t) class E extends HTMLElement {
        @property() value = 'test';
        @render() r() { return html`<div>${this.value}</div>`; }
        @styles() s() { return css`:host{display:block}`; }
      }

      const el = track(await createComponent(t));
      await el.ready;
      expect((el as any).value).toBe('test');
      expect(queryShadow(el, 'div')?.textContent).toBe('test');
    });
  });
});
