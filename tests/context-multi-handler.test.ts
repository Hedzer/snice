import { describe, it, expect, afterEach } from 'vitest';
import { element, context } from '../src/index';
import { setupContextHandler } from '../src/context';
import { Context } from '../src/types/context';
import { CONTEXT_HANDLER, CONTEXT_UPDATE } from '../src/symbols';

/**
 * Regression test for the critical `@context` WeakMap collision:
 * `CONTEXT_REGISTER` used to store one method name per element, so any class
 * with two `@context()`-decorated methods silently lost the first handler.
 * Fix: store a Set<string> of wrapped-method names and invoke all of them
 * on notify.
 */

afterEach(() => { document.body.innerHTML = ''; });

describe('@context: multiple handlers on one class all fire', () => {
  it('two @context methods both receive context updates', async () => {
    const fired: string[] = [];

    @element('ctx-multi-handler')
    class CtxMulti extends HTMLElement {
      @context() onA() { fired.push('a'); }
      @context() onB() { fired.push('b'); }
    }

    const el = document.createElement('ctx-multi-handler') as any;
    document.body.appendChild(el);
    await el.ready;

    const ctx = new Context({}, [], '/', {});
    (el as any)[CONTEXT_HANDLER] = ctx;
    setupContextHandler(el);

    // Trigger a notify through the real Context API
    (ctx as any)[CONTEXT_UPDATE]({}, [], '/', {});

    expect(fired).toContain('a');
    expect(fired).toContain('b');
  });

  it('the fix survives single-handler classes (regression guard)', async () => {
    const fired: string[] = [];

    @element('ctx-single-handler')
    class CtxSingle extends HTMLElement {
      @context() onOnly() { fired.push('only'); }
    }

    const el = document.createElement('ctx-single-handler') as any;
    document.body.appendChild(el);
    await el.ready;

    const ctx = new Context({}, [], '/', {});
    (el as any)[CONTEXT_HANDLER] = ctx;
    setupContextHandler(el);
    (ctx as any)[CONTEXT_UPDATE]({}, [], '/', {});

    expect(fired).toEqual(['only']);
  });
});
