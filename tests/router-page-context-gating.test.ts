import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, context, Context } from '../packages/core/src';
import { getSymbol } from '../packages/core/src/symbols';

const CONTEXT_HANDLER = getSymbol('context-handler');

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * SNICE-132 — the @page connectedCallback must not assign the application
 * Router context to an element the Router did not create. A bare
 * document.createElement('my-page') in a unit test must stay inert so the
 * test's own injected context wins.
 */
describe('Router page context gating', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should not assign the Router context to a bare-mounted page element', async () => {
    const router = Router({
      target: '#app',
      context: { user: 'Alice' }
    });

    const handler = vi.fn();

    @router.page({ tag: 'bare-mount-page', routes: ['/bare'] })
    class BareMountPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();

    // Bare mount: no Router target, no navigation to /bare.
    const bare = document.createElement('bare-mount-page') as any;
    document.body.appendChild(bare);
    await waitFor(50);

    expect(bare[CONTEXT_HANDLER]).toBeUndefined();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should still assign the Router context to a Router-created page', async () => {
    const router = Router({
      target: '#app',
      context: { user: 'Alice' }
    });

    const handler = vi.fn();

    @router.page({ tag: 'routed-mount-page', routes: ['/routed'] })
    class RoutedMountPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        handler(ctx);
      }
    }

    router.initialize();
    await router.navigate('/routed');
    await waitFor(100);

    const el = document.querySelector('routed-mount-page') as any;
    expect(el).toBeTruthy();
    expect(el[CONTEXT_HANDLER]).toBeInstanceOf(Context);
    expect(handler).toHaveBeenCalled();
  });
});
