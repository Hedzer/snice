import { describe, it, expect, afterEach } from 'vitest';
import { element, context, render, html, property } from '../src/index';
import { setupContextHandler } from '../src/context';
import { Context } from '../src/types/context';
import { CONTEXT_HANDLER, CONTEXT_UPDATE } from '../src/symbols';

afterEach(() => { document.body.innerHTML = ''; });

describe('@context: field form', () => {
  it('writes the decorated field with the current Context on push', async () => {
    @element('ctx-field-write')
    class CtxFieldWrite extends HTMLElement {
      @context() ctx!: Context;
    }

    const el = document.createElement('ctx-field-write') as any;
    document.body.appendChild(el);
    await el.ready;

    const ctx = new Context({ user: 'alice' }, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    setupContextHandler(el);

    expect(el.ctx).toBe(ctx);
    expect(el.ctx.application.user).toBe('alice');
  });

  it('field gets re-written on subsequent context updates', async () => {
    @element('ctx-field-update')
    class CtxFieldUpdate extends HTMLElement {
      @context() ctx!: Context;
    }

    const el = document.createElement('ctx-field-update') as any;
    document.body.appendChild(el);
    await el.ready;

    const ctx = new Context({ count: 0 }, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    setupContextHandler(el);
    expect(el.ctx.application.count).toBe(0);

    (ctx as any)[CONTEXT_UPDATE]({ count: 1 }, [], '/a', {});
    expect(el.ctx.application.count).toBe(1);
  });

  it('field and method handlers can coexist on the same class', async () => {
    let methodHits = 0;
    @element('ctx-mixed')
    class CtxMixed extends HTMLElement {
      @context() ctx!: Context;
      @context() onCtx() { methodHits++; }
    }

    const el = document.createElement('ctx-mixed') as any;
    document.body.appendChild(el);
    await el.ready;

    const ctx = new Context({}, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    setupContextHandler(el);

    expect(el.ctx).toBe(ctx);
    expect(methodHits).toBeGreaterThanOrEqual(1);
  });
});

describe('@context: register-time synchronous emit', () => {
  it('first render reads the populated context (no flicker)', async () => {
    const seenAtFirstRender: any[] = [];

    @element('ctx-cold-render')
    class CtxColdRender extends HTMLElement {
      @context() ctx!: Context;

      @render()
      template() {
        seenAtFirstRender.push(this.ctx?.application?.theme ?? null);
        return html`<div>${this.ctx?.application?.theme ?? 'no-ctx'}</div>`;
      }
    }

    const el = document.createElement('ctx-cold-render') as any;
    // Pre-populate the CONTEXT_HANDLER BEFORE connect so setupContextHandler
    // runs the sync emit during the connect phase.
    el[CONTEXT_HANDLER] = new Context({ theme: 'dark' }, [], '/', {});
    document.body.appendChild(el);
    await el.ready;

    // Force a flush by waiting a microtask boundary
    await Promise.resolve();

    // The very first render saw the populated theme — not undefined.
    expect(seenAtFirstRender[0]).toBe('dark');
  });

  it('handler fires on register even when the next push never comes', async () => {
    let calls = 0;
    @element('ctx-register-emit')
    class CtxRegisterEmit extends HTMLElement {
      @context() onCtx(_ctx: Context) { calls++; }
    }

    const el = document.createElement('ctx-register-emit') as any;
    document.body.appendChild(el);
    await el.ready;

    el[CONTEXT_HANDLER] = new Context({}, [], '/', {});
    setupContextHandler(el);

    expect(calls).toBe(1);
  });
});

describe('@context: field form re-reads on context update', () => {
  it('field reflects new application state after CONTEXT_UPDATE (mutation in place)', async () => {
    @element('ctx-prop-field')
    class CtxPropField extends HTMLElement {
      @context() ctx!: Context;
    }

    const el = document.createElement('ctx-prop-field') as any;
    const ctx = new Context({ tick: 0 }, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    document.body.appendChild(el);
    await el.ready;

    expect(el.ctx).toBe(ctx);
    expect(el.ctx.application.tick).toBe(0);

    (ctx as any)[CONTEXT_UPDATE]({ tick: 1 }, [], '/', {});
    expect(el.ctx).toBe(ctx); // same instance — Context mutates in place
    expect(el.ctx.application.tick).toBe(1);
  });
});
