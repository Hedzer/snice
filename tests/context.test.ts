import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router, context, Context } from '../src';
import { CONTEXT_UPDATE } from '../src/symbols';

async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('@context decorator', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call decorated method with Context on navigation', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: { user: 'Alice' }
    });

    @router.page({ tag: 'test-page', routes: ['/'] })
    class TestPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/');
    await waitFor(100);

    expect(spy).toHaveBeenCalled();
    const ctx = spy.mock.calls[0][0];
    expect(ctx).toBeInstanceOf(Context);
    expect(ctx.application.user).toBe('Alice');
    expect(ctx.navigation.route).toBe('/');
  });

  it('should support debounce option', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'debounce-page', routes: ['/debounce'] })
    class DebouncePage extends HTMLElement {
      @context({ debounce: 100 })
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/debounce');

    // Should not be called immediately
    await waitFor(50);
    expect(spy).not.toHaveBeenCalled();

    // Should be called after debounce period
    await waitFor(100);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should support throttle option', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'throttle-page', routes: ['/throttle'] })
    class ThrottlePage extends HTMLElement {
      @context({ throttle: 200 })
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/throttle');
    await waitFor(50);

    // First call should happen
    expect(spy).toHaveBeenCalledTimes(1);

    // Trigger context.update() directly multiple times within throttle window
    const pageElement = document.querySelector('throttle-page') as any;
    const ctx = pageElement?.[Symbol.for('snice:context-handler')];

    if (ctx) {
      ctx[CONTEXT_UPDATE]({}, [], '/throttle', {});
      await waitFor(50);
      // Should still be 1 call (throttled)
      expect(spy).toHaveBeenCalledTimes(1);

      // After throttle period, next update should trigger
      await waitFor(200);
      ctx[CONTEXT_UPDATE]({}, [], '/throttle', {});
      await waitFor(50);
      expect(spy).toHaveBeenCalledTimes(2);
    }
  });

  it('should support once option', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({ tag: 'once-page', routes: ['/once'] })
    class OncePage extends HTMLElement {
      @context({ once: true })
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/once');
    await waitFor(100);

    expect(spy).toHaveBeenCalledTimes(1);

    // Trigger context.update() again
    const pageElement = document.querySelector('once-page') as any;
    const ctx = pageElement?.[Symbol.for('snice:context-handler')];

    if (ctx) {
      ctx[CONTEXT_UPDATE]({}, [], '/once', {});
      await waitFor(50);
      // Should still be only 1 call
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it('should signal subscribers when update() is called with no args', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: { theme: 'light' }
    });

    @router.page({ tag: 'update-page', routes: ['/update'] })
    class UpdatePage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/update');
    await waitFor(100);

    expect(spy).toHaveBeenCalledTimes(1);
    const ctx = spy.mock.calls[0][0];

    // Mutate application context and call no-arg update()
    ctx.application.theme = 'dark';
    ctx.update();
    await waitFor(50);

    expect(spy).toHaveBeenCalledTimes(2);
    const updatedCtx = spy.mock.calls[1][0];
    expect(updatedCtx.application.theme).toBe('dark');
  });

  it('should preserve navigation state when update() is called with no args', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: { user: null }
    });

    @router.page({ tag: 'preserve-page', routes: ['/preserve/:id'] })
    class PreservePage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/preserve/42');
    await waitFor(100);

    const ctx = spy.mock.calls[0][0];
    expect(ctx.navigation.params).toEqual({ id: '42' });

    // Mutate and signal
    ctx.application.user = 'Bob';
    ctx.update();
    await waitFor(50);

    // Navigation state should be unchanged
    const updatedCtx = spy.mock.calls[1][0];
    expect(updatedCtx.navigation.params).toEqual({ id: '42' });
    expect(updatedCtx.navigation.route).toBe('/preserve/42');
    expect(updatedCtx.application.user).toBe('Bob');
  });

  it('should receive placards and route params', async () => {
    const spy = vi.fn();

    const router = Router({
      target: '#app',
      context: {}
    });

    @router.page({
      tag: 'params-page',
      routes: ['/user/:id'],
      placard: {
        name: 'user',
        title: 'User Profile'
      }
    })
    class ParamsPage extends HTMLElement {
      @context()
      handleContext(ctx: Context) {
        spy(ctx);
      }
    }

    router.initialize();
    await router.navigate('/user/123');
    await waitFor(100);

    const ctx = spy.mock.calls[0][0];
    expect(ctx.navigation.params).toEqual({ id: '123' });
    expect(ctx.navigation.placards).toHaveLength(1);
    expect(ctx.navigation.placards[0].title).toBe('User Profile');
  });
});
