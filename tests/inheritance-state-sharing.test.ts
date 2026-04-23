import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './components/test-utils';

let counter = 0;
function tag(base: string) {
  return `test-${base}-${++counter}-${Date.now()}`;
}

// Proof-of-bug tests: when parent is instantiated first, decorator initializers
// walk the prototype chain and mutate the PARENT's state, corrupting both
// parent and child. hasOwnProperty checks must guard each constructor[SYMBOL]
// initialization.

const CONTEXT_HANDLERS = Symbol.for('snice:context-handlers');

describe('inheritance state pollution', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => { els.forEach(el => { try { removeComponent(el); } catch {} }); els = []; });

  it('@on: parent handlers not polluted by child', async () => {
    const { element, on, render, styles, html, css } = await import('snice');
    const pt = tag('iso-p'), ct = tag('iso-c');
    const childCalls: string[] = [];

    @element(pt) class P extends HTMLElement {
      @on('click') pClick() {}
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @on('mouseenter') cHover() { childCalls.push('c'); }
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt)); // instantiate parent first
    track(await createComponent(ct)); // child pollutes parent's array (pre-fix)
    const p2 = track(await createComponent(pt));
    await (p2 as any).ready;

    p2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    (p2.shadowRoot as any)?.dispatchEvent?.(new MouseEvent('mouseenter'));
    await new Promise(r => setTimeout(r, 20));
    expect(childCalls).toEqual([]);
  });

  it('@observe: parent observers not polluted by child', async () => {
    const { element, observe, render, styles, html, css } = await import('snice');
    const pt = tag('ob-p'), ct = tag('ob-c');
    const calls: string[] = [];

    @element(pt) class P extends HTMLElement {
      // Media query that always matches so callback fires on setup
      @observe('media:(min-width: 0px)') pObs() { calls.push('p'); }
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @observe('media:(min-width: 0px)') cObs() { calls.push('c'); }
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));
    calls.length = 0;
    track(await createComponent(pt));
    await new Promise(r => setTimeout(r, 20));
    // Fresh parent: only parent observer should have fired
    expect(calls.filter(c => c === 'c')).toEqual([]);
    expect(calls.filter(c => c === 'p').length).toBeGreaterThan(0);
  });

  it('@watch: parent watchers not polluted by child', async () => {
    const { element, property, watch, render, styles, html, css } = await import('snice');
    const pt = tag('w-p'), ct = tag('w-c');
    const calls: string[] = [];

    @element(pt) class P extends HTMLElement {
      @property() val = '';
      @watch('val') pWatch() { calls.push('p'); }
      @render() r() { return html`<div>${this.val}</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      // Child watches the SAME property — pollution would cause this
      // watcher to fire on fresh parent instances too.
      @watch('val') cWatch() { calls.push('c'); }
      @render() r() { return html`<div>${this.val}</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));

    const p2 = track(await createComponent(pt));
    await (p2 as any).ready;
    calls.length = 0;
    (p2 as any).val = 'changed';
    await new Promise(r => setTimeout(r, 20));
    expect(calls).toContain('p');
    expect(calls).not.toContain('c');
  });

  it('@respond: parent responders not polluted by child', async () => {
    const { element, respond, render, styles, html, css } = await import('snice');
    const pt = tag('rp-p'), ct = tag('rp-c');

    @element(pt) class P extends HTMLElement {
      @respond('p-channel') pRespond() { return 'parent'; }
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @respond('c-channel') cRespond() { return 'child'; }
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));

    // Create fresh parent and spy on its own addEventListener calls
    const p2 = track(document.createElement(pt));
    const requestListeners: string[] = [];
    const origAdd = p2.addEventListener.bind(p2);
    (p2 as any).addEventListener = (type: string, ...rest: any[]) => {
      if (typeof type === 'string' && type.startsWith('@request/')) {
        requestListeners.push(type);
      }
      return origAdd(type, ...(rest as [any]));
    };
    document.body.appendChild(p2);
    await (p2 as any).ready;
    await new Promise(r => setTimeout(r, 10));

    expect(requestListeners).toContain('@request/p-channel');
    expect(requestListeners).not.toContain('@request/c-channel');
  });

  it('@ready: parent ready handlers not polluted by child', async () => {
    const { element, ready, render, styles, html, css } = await import('snice');
    const pt = tag('rd-p'), ct = tag('rd-c');
    const calls: string[] = [];

    @element(pt) class P extends HTMLElement {
      @ready() pReady() { calls.push('p'); }
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @ready() cReady() { calls.push('c'); }
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));
    calls.length = 0;
    const p2 = track(await createComponent(pt));
    await (p2 as any).ready;
    await new Promise(r => setTimeout(r, 20));
    expect(calls).toContain('p');
    expect(calls).not.toContain('c');
  });

  it('@dispose: parent dispose handlers not polluted by child', async () => {
    const { element, dispose, render, styles, html, css } = await import('snice');
    const pt = tag('dp-p'), ct = tag('dp-c');
    const calls: string[] = [];

    @element(pt) class P extends HTMLElement {
      @dispose() pDisp() { calls.push('p'); }
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @dispose() cDisp() { calls.push('c'); }
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));
    const p2 = await createComponent(pt);
    await (p2 as any).ready;
    calls.length = 0;
    p2.remove();
    await new Promise(r => setTimeout(r, 20));
    expect(calls).toContain('p');
    expect(calls).not.toContain('c');
  });

  it('@context: parent handlers not polluted by child', async () => {
    const { element, context, render, styles, html, css } = await import('snice');
    const pt = tag('cx-p'), ct = tag('cx-c');

    @element(pt) class P extends HTMLElement {
      @context() pCtx() {}
      @render() r() { return html`<div>p</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }
    @element(ct) class C extends P {
      @context() cCtx() {}
      @render() r() { return html`<div>c</div>`; }
      @styles() s() { return css`:host{display:block}`; }
    }

    track(await createComponent(pt));
    track(await createComponent(ct));
    const p2 = track(await createComponent(pt));
    await (p2 as any).ready;

    const ownHandlers = Object.prototype.hasOwnProperty.call(
      p2.constructor,
      CONTEXT_HANDLERS
    ) ? (p2.constructor as any)[CONTEXT_HANDLERS] : [];
    const methodNames = ownHandlers.map((h: any) => h.methodName);
    expect(methodNames).toContain('pCtx');
    expect(methodNames).not.toContain('cCtx');
  });
});
