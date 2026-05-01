import { describe, it, expect, afterEach } from 'vitest';
import { element, controller, context } from '../src/index';
import { attachController, detachController } from '../src/controller';
import { Context } from '../src/types/context';
import { CONTEXT_HANDLER, CONTEXT_UPDATE } from '../src/symbols';

afterEach(() => { document.body.innerHTML = ''; });

describe('@context inside controllers', () => {
  it('controller field form receives Context at attach time (sync emit)', async () => {
    @controller('ctx-ctrl-field')
    class CtxCtrlField {
      element: any = null;
      @context() ctx!: Context;
      async attach() {}
      async detach() {}
    }

    @element('ctx-ctrl-field-host')
    class Host extends HTMLElement {}

    const el = document.createElement('ctx-ctrl-field-host') as any;
    const ctx = new Context({ user: 'alice' }, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    document.body.appendChild(el);
    await el.ready;

    await attachController(el, 'ctx-ctrl-field');
    const ctrl = (el as any)[Object.getOwnPropertySymbols(el).find(s => s.toString().includes('controller-key'))!];
    expect(ctrl).toBeDefined();
    expect(ctrl.ctx).toBe(ctx);
    expect(ctrl.ctx.application.user).toBe('alice');
  });

  it('controller method form is invoked at attach time', async () => {
    let calls: Context[] = [];
    @controller('ctx-ctrl-method')
    class CtxCtrlMethod {
      element: any = null;
      @context() onCtx(c: Context) { calls.push(c); }
      async attach() {}
      async detach() {}
    }
    @element('ctx-ctrl-method-host')
    class Host extends HTMLElement {}

    const el = document.createElement('ctx-ctrl-method-host') as any;
    const ctx = new Context({}, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    document.body.appendChild(el);
    await el.ready;

    await attachController(el, 'ctx-ctrl-method');
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe(ctx);
  });

  it('controller field updates on Context push (CONTEXT_UPDATE)', async () => {
    @controller('ctx-ctrl-update')
    class CtxCtrlUpdate {
      element: any = null;
      @context() ctx!: Context;
      async attach() {}
      async detach() {}
    }
    @element('ctx-ctrl-update-host')
    class Host extends HTMLElement {}

    const el = document.createElement('ctx-ctrl-update-host') as any;
    const ctx = new Context({ tick: 0 }, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    document.body.appendChild(el);
    await el.ready;
    await attachController(el, 'ctx-ctrl-update');

    (ctx as any)[CONTEXT_UPDATE]({ tick: 1 }, [], '/', {});
    const ctrl = (el as any)[Object.getOwnPropertySymbols(el).find(s => s.toString().includes('controller-key'))!];
    expect(ctrl.ctx.application.tick).toBe(1);
  });

  it('detach unregisters controller — no further pushes reach it', async () => {
    let calls = 0;
    @controller('ctx-ctrl-detach')
    class CtxCtrlDetach {
      element: any = null;
      @context() onCtx(_c: Context) { calls++; }
      async attach() {}
      async detach() {}
    }
    @element('ctx-ctrl-detach-host')
    class Host extends HTMLElement {}

    const el = document.createElement('ctx-ctrl-detach-host') as any;
    const ctx = new Context({}, [], '/', {});
    el[CONTEXT_HANDLER] = ctx;
    document.body.appendChild(el);
    await el.ready;
    await attachController(el, 'ctx-ctrl-detach');
    expect(calls).toBe(1); // sync emit at attach

    await detachController(el);
    (ctx as any)[CONTEXT_UPDATE]({}, [], '/', {});
    expect(calls).toBe(1); // no further calls
  });
});
