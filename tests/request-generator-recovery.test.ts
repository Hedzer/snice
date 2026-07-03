import { describe, it, expect, afterEach } from 'vitest';
import { element, request } from './test-imports';

// A @request generator can catch a discovery/response failure and return a
// fallback. The wrapper drives that recovery with generator.throw(error) but
// must return whatever the generator returns from its catch — not undefined.
describe('@request generator error recovery', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('returns the generator fallback when discovery times out (no responder)', async () => {
    const elName = `req-recover-${Math.random().toString(36).slice(2, 8)}`;

    @element(elName)
    class Caller extends HTMLElement {
      @request('never-answered', { discoveryTimeout: 20 })
      async *load(): any {
        try {
          return await (yield { q: 'x' });
        } catch {
          return { fallback: true };
        }
      }
    }

    const el = document.createElement(elName) as any;
    document.body.appendChild(el);
    await el.ready;

    // No responder is registered → discovery times out → the generator's catch
    // returns the fallback, which the caller must receive.
    const result = await el.load();
    expect(result).toEqual({ fallback: true });
  });
});
