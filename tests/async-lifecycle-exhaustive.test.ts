import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, nothing, property, render, repeat } from './test-imports';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flushAsyncWork(turns = 4) {
  for (let index = 0; index < turns; index++) await Promise.resolve();
}

function controlledStream<T>() {
  const pending: Array<ReturnType<typeof deferred<IteratorResult<T>>>> = [];
  let opened = 0;
  let returned = 0;
  const iterable: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      opened++;
      return {
        next() {
          const result = deferred<IteratorResult<T>>();
          pending.push(result);
          return result.promise;
        },
        return() {
          returned++;
          return Promise.resolve({ done: true, value: undefined });
        }
      };
    }
  };
  return {
    iterable,
    get opened() { return opened; },
    get returned() { return returned; },
    emit(value: T) {
      const next = pending.shift();
      if (!next) throw new Error('stream has no pending next() call');
      next.resolve({ done: false, value });
    },
    finish() {
      const next = pending.shift();
      if (!next) throw new Error('stream has no pending next() call');
      next.resolve({ done: true, value: undefined });
    }
  };
}

describe('direct async template values', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('ignores stale Promise results after the expression source changes', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    @element('test-direct-promise-stale')
    class TestDirectPromiseStale extends HTMLElement {
      @property({ attribute: false }) source: Promise<string> = first.promise;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-promise-stale') as TestDirectPromiseStale;
    container.append(host);
    await host.ready;
    host.source = second.promise;
    await host.rendered;
    first.resolve('stale');
    await Promise.resolve();
    expect(host.shadowRoot!.textContent).not.toContain('stale');
    second.resolve('current');
    await Promise.resolve();
    expect(host.shadowRoot!.textContent).toContain('current');
  });

  it('keeps a settled Promise result stable across unrelated renders', async () => {
    const source = Promise.resolve('stable');
    @element('test-direct-promise-stable-rerender')
    class TestDirectPromiseStableRerender extends HTMLElement {
      @property({ attribute: false }) revision = 0;
      @render() template() { return html`<p>${source}</p><span>${this.revision}</span>`; }
    }
    const host = document.createElement('test-direct-promise-stable-rerender') as TestDirectPromiseStableRerender;
    container.append(host);
    await host.ready;
    await Promise.resolve();
    const text = [...host.shadowRoot!.querySelector('p')!.childNodes]
      .find(node => node.nodeType === Node.TEXT_NODE);
    expect(text?.textContent).toBe('stable');
    host.revision++;
    await host.rendered;
    const after = [...host.shadowRoot!.querySelector('p')!.childNodes]
      .find(node => node.nodeType === Node.TEXT_NODE);
    expect(after).toBe(text);
    expect(text?.textContent).toBe('stable');
  });

  it('suppresses stale Promise rejection and reports the current rejection once', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-direct-promise-rejection-version')
    class TestDirectPromiseRejectionVersion extends HTMLElement {
      @property({ attribute: false }) source: unknown = first.promise;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-promise-rejection-version') as TestDirectPromiseRejectionVersion;
    container.append(host);
    await host.ready;
    host.source = second.promise;
    await host.rendered;

    first.reject(new Error('stale rejection'));
    await flushAsyncWork();
    expect(errors).not.toHaveBeenCalled();

    second.reject(new Error('current rejection'));
    await flushAsyncWork();
    expect(errors).toHaveBeenCalledTimes(1);
    expect(String(errors.mock.calls[0][0])).toContain('promise template value failed');
    expect(String(errors.mock.calls[0][1])).toContain('current rejection');
    errors.mockRestore();
  });

  it('cancels a pending Promise when replaced by a synchronous value', async () => {
    const pending = deferred<string>();
    @element('test-direct-promise-to-sync')
    class TestDirectPromiseToSync extends HTMLElement {
      @property({ attribute: false }) source: unknown = pending.promise;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-promise-to-sync') as TestDirectPromiseToSync;
    container.append(host);
    await host.ready;
    host.source = 'synchronous';
    await host.rendered;
    pending.resolve('late');
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('p')!.textContent).toBe('synchronous');
  });

  it('resumes an already-settled Promise after disconnect without committing while detached', async () => {
    const pending = deferred<string>();
    @element('test-direct-promise-reconnect')
    class TestDirectPromiseReconnect extends HTMLElement {
      @property({ attribute: false }) source: unknown = pending.promise;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-promise-reconnect') as TestDirectPromiseReconnect;
    container.append(host);
    await host.ready;
    host.remove();
    pending.resolve('while detached');
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('p')!.textContent).toBe('');

    container.append(host);
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('p')!.textContent).toBe('while detached');
  });

  it('commits every async iterable value type and does not restart after completion', async () => {
    const stream = controlledStream<unknown>();
    @element('test-direct-stream-value-matrix')
    class TestDirectStreamValueMatrix extends HTMLElement {
      @property({ attribute: false }) revision = 0;
      @render() template() {
        return html`<main>${stream.iterable}</main><aside>${this.revision}</aside>`;
      }
    }
    const host = document.createElement('test-direct-stream-value-matrix') as TestDirectStreamValueMatrix;
    container.append(host);
    await host.ready;
    expect(stream.opened).toBe(1);

    stream.emit(html`<strong>template</strong>`);
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('strong')?.textContent).toBe('template');
    stream.emit(repeat([2, 1], {
      key: value => value,
      render: value => html`<i data-id=${value}>${value}</i>`
    }));
    await flushAsyncWork();
    expect([...host.shadowRoot!.querySelectorAll('i')].map(node => node.textContent)).toEqual(['2', '1']);
    stream.emit(nothing);
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('main')!.textContent).toBe('');
    stream.finish();
    await flushAsyncWork();

    host.revision++;
    await host.rendered;
    expect(stream.opened).toBe(1);
  });

  it('cancels a replaced async iterable and ignores its late next result', async () => {
    const first = controlledStream<string>();
    const second = controlledStream<string>();
    @element('test-direct-stream-replacement')
    class TestDirectStreamReplacement extends HTMLElement {
      @property({ attribute: false }) source: AsyncIterable<string> = first.iterable;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-stream-replacement') as TestDirectStreamReplacement;
    container.append(host);
    await host.ready;
    host.source = second.iterable;
    await host.rendered;
    expect(first.returned).toBe(1);
    expect(second.opened).toBe(1);

    first.emit('stale stream value');
    second.emit('current stream value');
    await flushAsyncWork();
    expect(host.shadowRoot!.querySelector('p')!.textContent).toBe('current stream value');
    host.remove();
    expect(second.returned).toBe(1);
  });

  it('reports iterator construction and next failures and recovers on replacement', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const constructionFailure: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        throw new Error('construction failed');
      }
    };
    const nextFailure: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next: () => Promise.reject(new Error('next failed'))
        };
      }
    };
    @element('test-direct-stream-failure-recovery')
    class TestDirectStreamFailureRecovery extends HTMLElement {
      @property({ attribute: false }) source: unknown = constructionFailure;
      @render() template() { return html`<p>${this.source}</p>`; }
    }
    const host = document.createElement('test-direct-stream-failure-recovery') as TestDirectStreamFailureRecovery;
    container.append(host);
    await host.ready;
    await flushAsyncWork();
    host.source = nextFailure;
    await host.rendered;
    await flushAsyncWork();
    host.source = Promise.resolve('recovered');
    await host.rendered;
    await flushAsyncWork();

    expect(errors).toHaveBeenCalledTimes(2);
    expect(errors.mock.calls.map(call => String(call[1]))).toEqual([
      expect.stringContaining('construction failed'),
      expect.stringContaining('next failed')
    ]);
    expect(host.shadowRoot!.querySelector('p')!.textContent).toBe('recovered');
    errors.mockRestore();
  });

  it('swallows an asynchronously rejected iterator cancellation and starts fresh on reconnect', async () => {
    const opened = vi.fn();
    const closed = vi.fn();
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        opened();
        return {
          next: () => new Promise<IteratorResult<string>>(() => {}),
          return() {
            closed();
            return Promise.reject(new Error('async cancellation failed'));
          }
        };
      }
    };
    @element('test-direct-stream-rejected-return')
    class TestDirectStreamRejectedReturn extends HTMLElement {
      @render() template() { return html`<p>${stream}</p>`; }
    }
    const host = document.createElement('test-direct-stream-rejected-return') as TestDirectStreamRejectedReturn;
    container.append(host);
    await host.ready;
    host.remove();
    await flushAsyncWork();
    expect(closed).toHaveBeenCalledOnce();
    container.append(host);
    await flushAsyncWork();
    expect(opened).toHaveBeenCalledTimes(2);
  });

  it('restarts an async iterable whose cancellation hook throws', async () => {
    const opened = vi.fn();
    const closed = vi.fn();
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        opened();
        return {
          next: () => new Promise<IteratorResult<string>>(() => {}),
          return() {
            closed();
            throw new Error('iterator refused cancellation');
          }
        };
      }
    };

    @element('test-direct-stream-throwing-return')
    class TestDirectStreamThrowingReturn extends HTMLElement {
      @render() template() { return html`<p>${stream}</p>`; }
    }

    const host = document.createElement('test-direct-stream-throwing-return') as TestDirectStreamThrowingReturn;
    container.append(host);
    await host.ready;
    expect(opened).toHaveBeenCalledOnce();
    host.remove();
    expect(closed).toHaveBeenCalledOnce();
    container.append(host);
    await Promise.resolve();
    expect(opened).toHaveBeenCalledTimes(2);
    host.remove();
    expect(closed).toHaveBeenCalledTimes(2);
  });
});
