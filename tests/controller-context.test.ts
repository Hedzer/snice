import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ContextAwareFetcher,
  Router,
  attachController,
  context,
  controller,
  detachController,
  element,
} from './test-imports';
import type { Context } from '../packages/core/src';

describe('@context on controllers', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('receives the current Router Context, updates, and cleanup on detach', async () => {
    const nativeFetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', nativeFetch);

    const middleware = vi.fn(async function (
      request: Request,
      next: () => Promise<Response>,
    ) {
      request.headers.set('authorization', 'Bearer test');
      return next();
    });
    const fetcher = new ContextAwareFetcher();
    fetcher.use('request', middleware);

    const router = Router({
      target: '#app',
      context: { accountId: 'account-1' },
      fetcher,
    });

    @router.page({ tag: 'controller-context-page', routes: ['/controller-context'] })
    class ControllerContextPage extends HTMLElement {}

    router.initialize();
    await router.navigate('/controller-context');

    const received: Context[] = [];
    let firstFetch: Promise<Response> | undefined;

    @controller('context-aware-controller')
    class ContextAwareController {
      element: HTMLElement | null = null;

      attach() {}
      detach() {}

      @context()
      receiveContext(ctx: Context) {
        received.push(ctx);
        if (!firstFetch) firstFetch = ctx.fetch('https://example.test/data');
      }
    }

    const page = document.querySelector('controller-context-page')!;
    const renderRoot = page.attachShadow({ mode: 'open' });
    const host = document.createElement('section');
    (host as any).ready = Promise.resolve();
    renderRoot.appendChild(host);

    await attachController(host, ContextAwareController);
    expect(received).toHaveLength(1);
    await firstFetch;

    const ctx = received[0];
    expect(ctx.application.accountId).toBe('account-1');
    expect(ctx.navigation.route).toBe('/controller-context');
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(nativeFetch).toHaveBeenCalledTimes(1);
    expect((nativeFetch.mock.calls[0][0] as Request).headers.get('authorization')).toBe('Bearer test');

    ctx.update();
    expect(received).toHaveLength(2);

    await detachController(host);
    ctx.update();
    expect(received).toHaveLength(2);
  });

  it('catches up descendant elements connected after navigation', async () => {
    const router = Router({
      target: '#app',
      context: { accountId: 'account-2' },
    });

    @router.page({ tag: 'late-context-page', routes: ['/late-context'] })
    class LateContextPage extends HTMLElement {}

    router.initialize();
    await router.navigate('/late-context');

    const received: Context[] = [];

    @element('late-context-child')
    class LateContextChild extends HTMLElement {
      @context()
      receiveContext(ctx: Context) {
        received.push(ctx);
      }
    }

    const page = document.querySelector('late-context-page')!;
    const renderRoot = page.attachShadow({ mode: 'open' });
    const child = document.createElement('late-context-child');
    renderRoot.append(child);

    await vi.waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].application.accountId).toBe('account-2');
    expect(received[0].navigation.route).toBe('/late-context');

    child.remove();
    received[0].update();
    expect(received).toHaveLength(1);
  });
});
