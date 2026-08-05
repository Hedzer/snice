import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ContextAwareFetcher,
  getContextFetch,
  provideContext,
  Router,
} from './test-imports';

describe('context-provided fetch', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('uses the nearest explicit provider and releases it cleanly', () => {
    const root = document.createElement('div');
    const child = document.createElement('span');
    root.append(child);
    document.body.append(root);
    const fetch = vi.fn() as unknown as typeof globalThis.fetch;
    const release = provideContext(root, { name: 'test' }, { fetch });

    expect(getContextFetch(child)).toBe(fetch);
    release();
    expect(getContextFetch(child)).toBeUndefined();
  });

  it('exposes the Router ContextAwareFetcher pipeline to descendants', async () => {
    const nativeFetch = vi.fn(async (request: Request) => new Response(request.headers.get('authorization')));
    vi.stubGlobal('fetch', nativeFetch);

    const fetcher = new ContextAwareFetcher();
    fetcher.use('request', function(request, next) {
      request.headers.set('authorization', `Bearer ${this.application.token}`);
      return next();
    });

    const root = document.createElement('main');
    root.id = 'context-fetch-app';
    const child = document.createElement('span');
    root.append(child);
    document.body.append(root);

    const { initialize } = Router({
      target: '#context-fetch-app',
      context: { token: 'secret' },
      fetcher,
    });
    initialize();

    const fetch = getContextFetch(child);
    expect(fetch).toBeTypeOf('function');
    const response = await fetch!('/api/data');
    expect(await response.text()).toBe('Bearer secret');
    expect(nativeFetch).toHaveBeenCalledTimes(1);
  });
});
