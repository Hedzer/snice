import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, portal, property, render, resource } from './test-imports';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe('async template values and directives', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('resource renders pending and mapped ready states', async () => {
    const value = deferred<string>();

    @element('test-resource-ready')
    class TestResourceReady extends HTMLElement {
      @render()
      template() {
        return html`${resource(value.promise, {
          pending: html`<p class="pending">Loading</p>`,
          ready: result => html`<p class="ready">${result}</p>`
        })}`;
      }
    }

    const el = document.createElement('test-resource-ready') as TestResourceReady;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('.pending')?.textContent).toBe('Loading');

    value.resolve('Done');
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.querySelector('.ready')?.textContent).toBe('Done');
  });

  it('resource ignores stale results when its source changes', async () => {
    const first = deferred<string>();
    const second = deferred<string>();

    @element('test-resource-stale')
    class TestResourceStale extends HTMLElement {
      @property({ attribute: false }) source: Promise<string> = first.promise;

      @render()
      template() {
        return html`${resource(this.source, {
          pending: 'pending',
          ready: value => `ready:${value}`
        })}`;
      }
    }

    const el = document.createElement('test-resource-stale') as TestResourceStale;
    container.appendChild(el);
    await el.ready;
    el.source = second.promise;
    await el.rendered;

    first.resolve('old');
    await Promise.resolve();
    expect(el.shadowRoot?.textContent).toContain('pending');

    second.resolve('new');
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.textContent).toContain('ready:new');
    expect(el.shadowRoot?.textContent).not.toContain('old');
  });

  it('resource maps rejections and catches synchronous source errors', async () => {
    const rejected = deferred<string>();

    @element('test-resource-error')
    class TestResourceError extends HTMLElement {
      @property({ attribute: false }) throws = false;

      @render()
      template() {
        const source = this.throws
          ? (() => { throw new Error('sync'); })
          : rejected.promise;
        return html`${resource(source, {
          pending: 'loading',
          error: error => `error:${(error as Error).message}`
        })}`;
      }
    }

    const el = document.createElement('test-resource-error') as TestResourceError;
    container.appendChild(el);
    await el.ready;
    rejected.reject(new Error('async'));
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.textContent).toContain('error:async');

    el.throws = true;
    await el.rendered;
    expect(el.shadowRoot?.textContent).toContain('error:sync');
  });

  it('aborts source functions on disconnect and restarts on reconnect', async () => {
    const signals: AbortSignal[] = [];
    const calls = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string>(() => {});
    });

    @element('test-resource-abort')
    class TestResourceAbort extends HTMLElement {
      @render()
      template() {
        return html`${resource(calls, { pending: 'waiting' })}`;
      }
    }

    const el = document.createElement('test-resource-abort') as TestResourceAbort;
    container.appendChild(el);
    await el.ready;
    expect(calls).toHaveBeenCalledTimes(1);
    el.remove();
    expect(signals[0].aborted).toBe(true);

    container.appendChild(el);
    await Promise.resolve();
    expect(calls).toHaveBeenCalledTimes(2);
    expect(signals[1].aborted).toBe(false);
  });

  it('resource consumes AsyncIterable values and calls return on teardown', async () => {
    const first = deferred<IteratorResult<string>>();
    const second = deferred<IteratorResult<string>>();
    const close = vi.fn(async () => ({ done: true, value: undefined }));
    let read = 0;
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next: () => read++ === 0 ? first.promise : second.promise,
          return: close
        };
      }
    };

    @element('test-resource-stream')
    class TestResourceStream extends HTMLElement {
      @render()
      template() {
        return html`${resource(stream, {
          pending: 'empty',
          ready: value => `value:${value}`
        })}`;
      }
    }

    const el = document.createElement('test-resource-stream') as TestResourceStream;
    container.appendChild(el);
    await el.ready;
    first.resolve({ done: false, value: 'one' });
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.textContent).toContain('value:one');

    el.remove();
    await Promise.resolve();
    expect(close).toHaveBeenCalled();
    second.resolve({ done: true, value: undefined });
  });

  it('renders Promise and AsyncIterable values directly', async () => {
    const promised = deferred<string>();
    const emitted = deferred<IteratorResult<string>>();
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next: () => emitted.promise,
          return: async () => ({ done: true, value: undefined })
        };
      }
    };

    @element('test-direct-async-values')
    class TestDirectAsyncValues extends HTMLElement {
      @render()
      template() {
        return html`<p class="promise">${promised.promise}</p><p class="stream">${stream}</p>`;
      }
    }

    const el = document.createElement('test-direct-async-values') as TestDirectAsyncValues;
    container.appendChild(el);
    await el.ready;
    promised.resolve('promise value');
    emitted.resolve({ done: false, value: 'stream value' });
    await Promise.resolve();
    await Promise.resolve();
    expect(el.shadowRoot?.querySelector('.promise')?.textContent).toBe('promise value');
    expect(el.shadowRoot?.querySelector('.stream')?.textContent).toBe('stream value');
  });
});

describe('portal directive', () => {
  let container: HTMLDivElement;
  let firstTarget: HTMLDivElement;
  let secondTarget: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    firstTarget = document.createElement('div');
    secondTarget = document.createElement('div');
    firstTarget.id = 'portal-first';
    document.body.append(container, firstTarget, secondTarget);
  });

  afterEach(() => {
    container.remove();
    firstTarget.remove();
    secondTarget.remove();
  });

  it('renders and updates content outside the component tree', async () => {
    @element('test-portal-update')
    class TestPortalUpdate extends HTMLElement {
      @property({ attribute: false }) message = 'first';

      @render()
      template() {
        return html`<p>host</p>${portal(firstTarget, html`<button>${this.message}</button>`)}`;
      }
    }

    const el = document.createElement('test-portal-update') as TestPortalUpdate;
    container.appendChild(el);
    await el.ready;
    const button = firstTarget.querySelector('button');
    expect(button?.textContent).toBe('first');
    expect(el.shadowRoot?.querySelector('button')).toBeNull();

    el.message = 'second';
    await el.rendered;
    expect(firstTarget.querySelector('button')).toBe(button);
    expect(button?.textContent).toBe('second');
  });

  it('moves to a new target and cleans up removed targets', async () => {
    @element('test-portal-move')
    class TestPortalMove extends HTMLElement {
      @property({ attribute: false }) target: ParentNode = firstTarget;

      @render()
      template() {
        return html`${portal(this.target, html`<span>moved</span>`)}`;
      }
    }

    const el = document.createElement('test-portal-move') as TestPortalMove;
    container.appendChild(el);
    await el.ready;
    expect(firstTarget.querySelector('span')).not.toBeNull();

    el.target = secondTarget;
    await el.rendered;
    expect(firstTarget.childNodes).toHaveLength(0);
    expect(secondTarget.querySelector('span')?.textContent).toBe('moved');
  });

  it('supports selector targets and paired disconnect/reconnect cleanup', async () => {
    @element('test-portal-selector')
    class TestPortalSelector extends HTMLElement {
      @render()
      template() {
        return html`${portal('#portal-first', html`<span>selected</span>`)}`;
      }
    }

    const el = document.createElement('test-portal-selector') as TestPortalSelector;
    container.appendChild(el);
    await el.ready;
    expect(firstTarget.querySelector('span')).not.toBeNull();

    el.remove();
    expect(firstTarget.childNodes).toHaveLength(0);

    container.appendChild(el);
    await Promise.resolve();
    expect(firstTarget.querySelector('span')?.textContent).toBe('selected');
  });
});
