import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, property, render } from './test-imports';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
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
