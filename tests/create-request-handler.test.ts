import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, request, render, html } from './test-imports';
import { createRequestHandler } from '../src/create-request-handler';

function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

describe('createRequestHandler', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should handle a basic request and return the response', async () => {
    const elName = uniqueName('crh-basic');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchData() {
        const response = await (yield { id: 42 });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    // Attach handler on the element itself (events dispatch there)
    const cleanup = createRequestHandler(el, {
      [channel]: async (payload: any) => {
        return { name: 'Alice', id: payload.id };
      },
    });

    const result = await el.fetchData();
    expect(result).toEqual({ name: 'Alice', id: 42 });

    cleanup();
  });

  it('should handle an ancestor-scoped handler (events bubble)', async () => {
    const elName = uniqueName('crh-ancestor');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *getData() {
        const response = await (yield { type: 'greeting' });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    // Handler on ancestor container — events bubble up
    const cleanup = createRequestHandler(container, {
      [channel]: (payload: any) => ({ message: `hello ${payload.type}` }),
    });

    const result = await el.getData();
    expect(result).toEqual({ message: 'hello greeting' });

    cleanup();
  });

  it('should handle a document-level handler', async () => {
    const elName = uniqueName('crh-document');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *getData() {
        const response = await (yield 'ping');
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(document, {
      [channel]: () => 'pong',
    });

    const result = await el.getData();
    expect(result).toBe('pong');

    cleanup();
  });

  it('should handle multiple routes on one target', async () => {
    const elName = uniqueName('crh-multi');
    const channelA = uniqueName('channel-a');
    const channelB = uniqueName('channel-b');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channelA)
      async *getUsers() {
        const response = await (yield {});
        return response;
      }

      @request(channelB)
      async *getSettings() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channelA]: () => [{ name: 'Alice' }, { name: 'Bob' }],
      [channelB]: () => ({ theme: 'dark' }),
    });

    const users = await el.getUsers();
    expect(users).toEqual([{ name: 'Alice' }, { name: 'Bob' }]);

    const settings = await el.getSettings();
    expect(settings).toEqual({ theme: 'dark' });

    cleanup();
  });

  it('should support async handlers', async () => {
    const elName = uniqueName('crh-async');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel, { timeout: 5000 })
      async *fetchData() {
        const response = await (yield { delay: true });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channel]: async (payload: any) => {
        // Simulate async work
        await new Promise((r) => setTimeout(r, 10));
        return { delayed: payload.delay };
      },
    });

    const result = await el.fetchData();
    expect(result).toEqual({ delayed: true });

    cleanup();
  });

  it('should propagate handler errors back to the requester', async () => {
    const elName = uniqueName('crh-error');
    const channel = uniqueName('channel');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel, { timeout: 2000 })
      async *fetchData() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channel]: () => {
        throw new Error('DB connection failed');
      },
    });

    await expect(el.fetchData()).rejects.toThrow();

    cleanup();
    consoleSpy.mockRestore();
  });

  it('should clean up all listeners when cleanup is called', async () => {
    const elName = uniqueName('crh-cleanup');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel, { discoveryTimeout: 50 })
      async *fetchData() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const handler = vi.fn(() => 'ok');
    const cleanup = createRequestHandler(el, { [channel]: handler });

    // Should work
    await el.fetchData();
    expect(handler).toHaveBeenCalledTimes(1);

    // Cleanup
    cleanup();

    // Should now timeout (no handler)
    await expect(el.fetchData()).rejects.toThrow(/no handler found/);
  });

  it('should handle null/undefined return values', async () => {
    const elName = uniqueName('crh-null');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchData() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channel]: () => null,
    });

    const result = await el.fetchData();
    expect(result).toBeNull();

    cleanup();
  });

  it('should handle returning undefined', async () => {
    const elName = uniqueName('crh-undef');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchData() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channel]: () => undefined,
    });

    const result = await el.fetchData();
    expect(result).toBeUndefined();

    cleanup();
  });

  it('should not interfere with other handlers when passive mode is used', async () => {
    const elName = uniqueName('crh-passive');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchData() {
        const response = await (yield { x: 1 });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const spy = vi.fn();

    // Primary handler on element (non-passive, first listener wins)
    const cleanup1 = createRequestHandler(el, {
      [channel]: (payload: any) => ({ from: 'handler1', ...payload }),
    });

    // Passive observer on container (won't stop propagation, but also
    // won't get called since handler1 already stopImmediatePropagation)
    const cleanup2 = createRequestHandler(
      container,
      { [channel]: spy },
      { passive: true },
    );

    const result = await el.fetchData();
    expect(result).toEqual({ from: 'handler1', x: 1 });

    cleanup1();
    cleanup2();
  });

  it('should support being called multiple times (idempotent cleanup)', () => {
    const cleanup = createRequestHandler(container, {
      test: () => 'ok',
    });

    // Should not throw when called multiple times
    cleanup();
    cleanup();
    cleanup();
  });

  it('should handle complex payloads', async () => {
    const elName = uniqueName('crh-complex');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchData() {
        const response = await (yield {
          filters: { status: 'active', role: 'admin' },
          pagination: { page: 1, limit: 25 },
          sort: [{ field: 'name', order: 'asc' }],
        });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channel]: (payload: any) => ({
        items: [{ id: 1, name: 'Admin User' }],
        total: 1,
        page: payload.pagination.page,
      }),
    });

    const result = await el.fetchData();
    expect(result).toEqual({
      items: [{ id: 1, name: 'Admin User' }],
      total: 1,
      page: 1,
    });

    cleanup();
  });

  it('should handle sequential requests on the same channel', async () => {
    const elName = uniqueName('crh-seq');
    const channel = uniqueName('channel');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channel)
      async *fetchItem(id: number) {
        const response = await (yield { id });
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    let callCount = 0;
    const cleanup = createRequestHandler(el, {
      [channel]: (payload: any) => {
        callCount++;
        return { name: `Item ${payload.id}`, call: callCount };
      },
    });

    const r1 = await el.fetchItem(1);
    const r2 = await el.fetchItem(2);
    const r3 = await el.fetchItem(3);

    expect(r1).toEqual({ name: 'Item 1', call: 1 });
    expect(r2).toEqual({ name: 'Item 2', call: 2 });
    expect(r3).toEqual({ name: 'Item 3', call: 3 });
    expect(callCount).toBe(3);

    cleanup();
  });

  it('should handle concurrent requests on different channels', async () => {
    const elName = uniqueName('crh-concurrent');
    const channelA = uniqueName('channel-a');
    const channelB = uniqueName('channel-b');

    @element(elName)
    class Requester extends HTMLElement {
      @request(channelA)
      async *getA() {
        const response = await (yield {});
        return response;
      }

      @request(channelB)
      async *getB() {
        const response = await (yield {});
        return response;
      }

      @render()
      renderContent() {
        return html`<div>test</div>`;
      }
    }

    const el = document.createElement(elName) as any;
    container.appendChild(el);
    await el.ready;

    const cleanup = createRequestHandler(el, {
      [channelA]: async () => {
        await new Promise((r) => setTimeout(r, 20));
        return 'a-result';
      },
      [channelB]: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'b-result';
      },
    });

    const [a, b] = await Promise.all([el.getA(), el.getB()]);
    expect(a).toBe('a-result');
    expect(b).toBe('b-result');

    cleanup();
  });
});
