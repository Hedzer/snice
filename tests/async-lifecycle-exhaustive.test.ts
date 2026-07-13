import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Directive, directive, element, html, noChange, portal, property, render, resource } from './test-imports';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe('async resource and portal exhaustive behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('remaps a settled resource when render options change without restarting its source', async () => {
    const source = vi.fn(() => Promise.resolve(3));
    @element('test-resource-remap-options')
    class TestResourceRemapOptions extends HTMLElement {
      @property({ attribute: false }) multiplier = 2;
      @render() template() {
        return html`${resource(source, { ready: value => value * this.multiplier })}`;
      }
    }
    const host = document.createElement('test-resource-remap-options') as TestResourceRemapOptions;
    container.append(host);
    await host.ready;
    await Promise.resolve();
    expect(host.shadowRoot!.textContent).toContain('6');
    expect(source).toHaveBeenCalledOnce();
    host.multiplier = 4;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('12');
    expect(source).toHaveBeenCalledOnce();
  });

  it('routes ready-renderer failures through the resource error renderer', async () => {
    @element('test-resource-ready-error')
    class TestResourceReadyError extends HTMLElement {
      @render() template() {
        return html`${resource(Promise.resolve('value'), {
          ready: () => { throw new Error('mapping failed'); },
          error: error => html`<strong>${(error as Error).message}</strong>`
        })}`;
      }
    }
    const host = document.createElement('test-resource-ready-error') as TestResourceReadyError;
    container.append(host);
    await host.ready;
    await Promise.resolve();
    expect(host.shadowRoot!.querySelector('strong')?.textContent).toBe('mapping failed');
  });

  it('handles synchronous values from source functions and leaves empty streams pending', async () => {
    async function* empty() {}
    @element('test-resource-sync-empty')
    class TestResourceSyncEmpty extends HTMLElement {
      @render() template() {
        return html`
          <span class="sync">${resource(() => 4, { ready: value => value + 1 })}</span>
          <span class="empty">${resource(empty(), { pending: 'waiting' })}</span>
        `;
      }
    }
    const host = document.createElement('test-resource-sync-empty') as TestResourceSyncEmpty;
    container.append(host);
    await host.ready;
    await Promise.resolve();
    expect(host.shadowRoot!.querySelector('.sync')?.textContent).toBe('5');
    expect(host.shadowRoot!.querySelector('.empty')?.textContent).toBe('waiting');
  });

  it('rejects invalid sources and non-node placement without mounting partial trees', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-resource-invalid-source')
    class TestResourceInvalidSource extends HTMLElement {
      @render() template() { return html`<p>${resource(3 as any)}</p>`; }
    }
    @element('test-resource-invalid-placement')
    class TestResourceInvalidPlacement extends HTMLElement {
      @render() template() { return html`<p title=${resource(Promise.resolve('x'))}>bad</p>`; }
    }
    for (const tag of ['test-resource-invalid-source', 'test-resource-invalid-placement']) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot!.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('expects a Promise'))).toBe(true);
    expect(messages.some(message => message.includes('node expression'))).toBe(true);
    errors.mockRestore();
  });

  it('ignores stale direct Promise results after the expression source changes', async () => {
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

  it('keeps a settled direct Promise result stable across unrelated renders', async () => {
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

  it('can restart a direct async iterable whose cancellation hook throws', async () => {
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

  it('can restart a resource iterable whose cancellation hook throws', async () => {
    const opened = vi.fn();
    const closed = vi.fn();
    const stream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        opened();
        return {
          next: () => new Promise<IteratorResult<string>>(() => {}),
          return() {
            closed();
            throw new Error('resource iterator refused cancellation');
          }
        };
      }
    };

    @element('test-resource-stream-throwing-return')
    class TestResourceStreamThrowingReturn extends HTMLElement {
      @render() template() { return html`${resource(stream, { pending: 'waiting' })}`; }
    }

    const host = document.createElement('test-resource-stream-throwing-return') as TestResourceStreamThrowingReturn;
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

  it('moves a portal returned by a stable target function while preserving content identity', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    let target: ParentNode = first;
    const getTarget = () => target;
    @element('test-portal-stable-target-function')
    class TestPortalStableTargetFunction extends HTMLElement {
      @property({ attribute: false }) revision = 0;
      @render() template() { return html`${portal(getTarget, html`<input value=${this.revision}>`)}`; }
    }
    const host = document.createElement('test-portal-stable-target-function') as TestPortalStableTargetFunction;
    container.append(host);
    await host.ready;
    const input = first.querySelector('input') as HTMLInputElement;
    input.value = 'user state';
    target = second;
    host.revision++;
    await host.rendered;
    expect(second.querySelector('input')).toBe(input);
    expect(input.value).toBe('user state');
    expect(first.querySelector('input')).toBeNull();
    first.remove();
    second.remove();
  });

  it('binds portal event handlers to the owning component outside its render root', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    @element('test-portal-event-owner')
    class TestPortalEventOwner extends HTMLElement {
      calls = 0;
      handlerThis: unknown;
      handle() { this.calls++; this.handlerThis = this; }
      @render() template() { return html`${portal(target, html`<section><button @click=${this.handle}>go</button></section>`)}`; }
    }
    const host = document.createElement('test-portal-event-owner') as TestPortalEventOwner;
    container.append(host);
    await host.ready;
    (target.querySelector('button') as HTMLButtonElement).click();
    expect(host.calls).toBe(1);
    expect(host.handlerThis).toBe(host);
    target.remove();
  });

  it('isolates multiple portal ranges in one target and removes only the disconnected owner', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const define = (tag: string, label: string) => {
      @element(tag)
      class PortalOwner extends HTMLElement {
        @render() template() { return html`${portal(target, html`<span>${label}</span>`)}`; }
      }
      return PortalOwner;
    };
    define('test-portal-owner-one', 'one');
    define('test-portal-owner-two', 'two');
    const one = document.createElement('test-portal-owner-one') as HTMLElement & { ready: Promise<void> };
    const two = document.createElement('test-portal-owner-two') as HTMLElement & { ready: Promise<void> };
    container.append(one, two);
    await Promise.all([one.ready, two.ready]);
    expect(target.textContent).toContain('one');
    expect(target.textContent).toContain('two');
    one.remove();
    expect(target.textContent).not.toContain('one');
    expect(target.textContent).toContain('two');
    target.remove();
  });

  it('reports missing and invalid portal targets without destroying an existing portal', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-portal-invalid-target')
    class TestPortalInvalidTarget extends HTMLElement {
      @property({ attribute: false }) invalid = false;
      @render() template() { return html`${portal(this.invalid ? '#missing-portal-target' : target, html`<span>kept</span>`)}`; }
    }
    const host = document.createElement('test-portal-invalid-target') as TestPortalInvalidTarget;
    container.append(host);
    await host.ready;
    const span = target.querySelector('span');
    host.invalid = true;
    await host.rendered;
    expect(target.querySelector('span')).toBe(span);
    expect(errors.mock.calls.some(call => String(call[1]).includes('was not found'))).toBe(true);
    errors.mockRestore();
    target.remove();
  });

  it('removes and can recreate a portal even when nested directive cleanup throws', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const disconnected = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    class ThrowingCleanup extends Directive {
      render() { return noChange; }
      disconnected() {
        disconnected();
        throw new Error('portal cleanup failed');
      }
    }
    const throwingCleanup = directive<ThrowingCleanup, readonly []>(ThrowingCleanup);

    @element('test-portal-throwing-cleanup')
    class TestPortalThrowingCleanup extends HTMLElement {
      @render() template() {
        return html`${portal(target, html`<button ${throwingCleanup()}>ported</button>`)}`;
      }
    }

    const host = document.createElement('test-portal-throwing-cleanup') as TestPortalThrowingCleanup;
    container.append(host);
    await host.ready;
    expect(target.querySelector('button')?.textContent).toBe('ported');

    host.remove();
    expect(disconnected).toHaveBeenCalledOnce();
    expect(target.childNodes).toHaveLength(0);
    expect(errors.mock.calls.some(call => String(call[1]).includes('portal cleanup failed'))).toBe(true);

    container.append(host);
    expect(target.querySelector('button')?.textContent).toBe('ported');
    host.remove();
    expect(disconnected).toHaveBeenCalledTimes(2);
    expect(target.childNodes).toHaveLength(0);
    target.remove();
    errors.mockRestore();
  });
});
