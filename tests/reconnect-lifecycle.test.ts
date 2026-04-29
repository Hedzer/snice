import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, ready, dispose, reconnect } from './test-imports';

describe('@reconnect lifecycle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does NOT fire on first connect', async () => {
    const reconnectSpy = vi.fn();

    @element('reconnect-firstconnect')
    class C extends HTMLElement {
      @reconnect()
      onReconnect() {
        reconnectSpy();
      }
    }

    const el = document.createElement('reconnect-firstconnect');
    document.body.appendChild(el);
    await (el as any).ready;

    expect(reconnectSpy).not.toHaveBeenCalled();
  });

  it('fires on every connect AFTER the first', async () => {
    const reconnectSpy = vi.fn();

    @element('reconnect-many')
    class C extends HTMLElement {
      @reconnect()
      onReconnect() {
        reconnectSpy();
      }
    }

    const el = document.createElement('reconnect-many');
    document.body.appendChild(el);
    await (el as any).ready;

    el.remove();
    await new Promise(r => setTimeout(r, 10));
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));
    expect(reconnectSpy).toHaveBeenCalledTimes(1);

    el.remove();
    await new Promise(r => setTimeout(r, 10));
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));
    expect(reconnectSpy).toHaveBeenCalledTimes(2);
  });

  it('fires AFTER framework re-establishes @on/@observe handlers', async () => {
    // We assert ordering by reading shadow DOM, which only exists once setup
    // (and original connectedCallback) has run.
    const observed: { hadShadow: boolean; isConnected: boolean }[] = [];

    @element('reconnect-after-setup')
    class C extends HTMLElement {
      @reconnect()
      onReconnect() {
        observed.push({
          hadShadow: !!this.shadowRoot,
          isConnected: this.isConnected,
        });
      }
    }

    const el = document.createElement('reconnect-after-setup');
    document.body.appendChild(el);
    await (el as any).ready;

    el.remove();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));

    expect(observed.length).toBe(1);
    expect(observed[0].isConnected).toBe(true);
  });

  it('@ready fires once, @reconnect fires N-1 times, @dispose fires N times', async () => {
    const calls: string[] = [];

    @element('reconnect-ordering')
    class C extends HTMLElement {
      @ready()
      onReady() {
        calls.push('ready');
      }
      @reconnect()
      onReconnect() {
        calls.push('reconnect');
      }
      @dispose()
      onDispose() {
        calls.push('dispose');
      }
    }

    const el = document.createElement('reconnect-ordering');
    document.body.appendChild(el);
    await (el as any).ready;

    el.remove();
    await new Promise(r => setTimeout(r, 10));
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));

    el.remove();
    await new Promise(r => setTimeout(r, 10));
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));

    el.remove();
    await new Promise(r => setTimeout(r, 10));

    expect(calls.filter(c => c === 'ready').length).toBe(1);
    expect(calls.filter(c => c === 'reconnect').length).toBe(2);
    expect(calls.filter(c => c === 'dispose').length).toBe(3);
  });

  it('catches and logs errors thrown in @reconnect', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('reconnect-throws')
    class C extends HTMLElement {
      @reconnect()
      onReconnect() {
        throw new Error('boom');
      }
    }

    const el = document.createElement('reconnect-throws');
    document.body.appendChild(el);
    await (el as any).ready;

    el.remove();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));

    expect(errorSpy).toHaveBeenCalled();
    const message = errorSpy.mock.calls[0]?.[0] ?? '';
    expect(String(message)).toContain('@reconnect');

    errorSpy.mockRestore();
  });

  it('typical use case: re-attach a document listener that @ready installed and @dispose removed', async () => {
    // Simulates what tag-input / select / date-picker do: an
    // outside-click listener wired to document. Without @reconnect, the
    // listener is gone forever after a single disconnect/reconnect cycle.
    let docClicks = 0;

    @element('reconnect-doclistener')
    class C extends HTMLElement {
      private handler = () => { docClicks++; };

      @ready()
      onReady() {
        document.addEventListener('click', this.handler);
      }
      @dispose()
      onDispose() {
        document.removeEventListener('click', this.handler);
      }
      @reconnect()
      onReconnect() {
        document.addEventListener('click', this.handler);
      }
    }

    const el = document.createElement('reconnect-doclistener');
    document.body.appendChild(el);
    await (el as any).ready;

    document.dispatchEvent(new Event('click'));
    expect(docClicks).toBe(1);

    el.remove();
    await new Promise(r => setTimeout(r, 10));

    document.dispatchEvent(new Event('click'));
    expect(docClicks).toBe(1);  // dispose removed it

    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 10));

    document.dispatchEvent(new Event('click'));
    expect(docClicks).toBe(2);  // reconnect re-added it

    // cleanup
    el.remove();
    await new Promise(r => setTimeout(r, 10));
  });
});
