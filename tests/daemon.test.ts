import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attachController,
  controller,
  daemon,
  dispatch,
  element,
  getContext,
  getController,
  on,
  provideContext,
  request,
  respond,
  Router,
} from './test-imports';
import type { Response } from './test-imports';

function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const roots: HTMLElement[] = [];
const releases: Array<() => void> = [];

function root(): HTMLElement {
  const value = document.createElement('div');
  document.body.appendChild(value);
  roots.push(value);
  return value;
}

function provide(target: EventTarget, context: any): () => void {
  const release = provideContext(target, context);
  releases.push(release);
  return release;
}

afterEach(() => {
  for (const value of roots.splice(0).reverse()) value.remove();
  for (const release of releases.splice(0).reverse()) release();
});

describe('@daemon and app context communication', () => {
  it('never constructs or registers a daemon implicitly', () => {
    let constructions = 0;

    @daemon
    class ExplicitDaemon {
      constructor() {
        constructions += 1;
      }
    }

    expect(constructions).toBe(0);
    const first = new ExplicitDaemon();
    const second = new ExplicitDaemon();
    expect(constructions).toBe(2);
    expect(first).not.toBe(second);

    expect(() => provide(root(), { daemons: { invalid: {} } })).toThrow(/@daemon/);
  });

  it('provides the nearest explicit context across shadow boundaries', () => {
    const outer = root();
    const inner = document.createElement('section');
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const child = document.createElement('span');
    shadow.appendChild(child);
    inner.appendChild(host);
    outer.appendChild(inner);

    const releaseOuter = provide(outer, { marker: 'outer' });
    const releaseInner = provide(inner, { marker: 'inner' });

    expect(getContext<any>(child)?.marker).toBe('inner');
    releaseInner();
    expect(getContext<any>(child)?.marker).toBe('outer');
    releaseOuter();
    expect(getContext(child)).toBeUndefined();
  });

  it('supports request/respond and dispatch/on in both directions', async () => {
    const tag = uniqueName('daemon-consumer');

    @daemon
    class SessionDaemon {
      state = 'initial';

      @on('set-session')
      setSession(event: CustomEvent<string>) {
        this.state = event.detail;
        this.changed();
      }

      @dispatch('session-changed')
      changed() {
        return this.state;
      }

      @respond('get-session')
      getSession(payload: { suffix: string }) {
        return `${this.state}:${payload.suffix}`;
      }

      @request<string>('confirm-session')
      async *confirmSession(): Response<string> {
        return yield { state: this.state };
      }
    }

    @element(tag)
    class DaemonConsumer extends HTMLElement {
      changes: string[] = [];

      @dispatch('set-session', { daemon: 'session' })
      setSession(value: string) {
        return value;
      }

      @on('session-changed', { daemon: 'session' })
      sessionChanged(event: CustomEvent<string>) {
        this.changes.push(event.detail);
      }

      @request<string>('get-session', { daemon: 'session' })
      async *getSession(suffix: string): Response<string> {
        return yield { suffix };
      }

      @respond('confirm-session', { daemon: 'session' })
      confirmSession(payload: { state: string }) {
        return `confirmed:${payload.state}`;
      }
    }

    const session = new SessionDaemon();
    const appRoot = root();
    provide(appRoot, { daemons: { session } });

    const consumer = document.createElement(tag) as DaemonConsumer;
    appRoot.appendChild(consumer);
    await (consumer as any).ready;

    consumer.setSession('active');
    expect(session.state).toBe('active');
    expect(consumer.changes).toEqual(['active']);
    await expect(consumer.getSession('ok')).resolves.toBe('active:ok');
    await expect(session.confirmSession()).resolves.toBe('confirmed:active');
  });

  it('routes controllers through their host app context', async () => {
    const tag = uniqueName('daemon-controller-host');
    const controllerName = uniqueName('daemon-controller');

    @daemon
    class CounterDaemon {
      value = 0;

      @on('counter-set')
      set(event: CustomEvent<number>) {
        this.value = event.detail;
        this.changed();
      }

      @dispatch('counter-changed')
      changed() {
        return this.value;
      }

      @respond('counter-get')
      get() {
        return this.value;
      }
    }

    @controller(controllerName)
    class CounterController {
      element: HTMLElement | null = null;
      changes: number[] = [];

      attach(element: HTMLElement) {
        this.element = element;
      }

      detach() {
        this.element = null;
      }

      @dispatch('counter-set', { daemon: 'counter' })
      set(value: number) {
        return value;
      }

      @on('counter-changed', { daemon: 'counter' })
      changed(event: CustomEvent<number>) {
        this.changes.push(event.detail);
      }

      @request<number>('counter-get', { daemon: 'counter' })
      async *get(): Response<number> {
        return yield {};
      }

      @dispatch('controller-local')
      local() {
        return 'local';
      }
    }

    @element(tag)
    class ControllerHost extends HTMLElement {}

    const counter = new CounterDaemon();
    const appRoot = root();
    provide(appRoot, { daemons: { counter } });

    const host = document.createElement(tag) as ControllerHost;
    appRoot.appendChild(host);
    await (host as any).ready;
    await attachController(host, CounterController as any);

    const instance = getController(host) as CounterController;
    const local = vi.fn();
    host.addEventListener('controller-local', local);

    instance.set(7);
    expect(counter.value).toBe(7);
    expect(instance.changes).toEqual([7]);
    await expect(instance.get()).resolves.toBe(7);

    instance.local();
    expect(local).toHaveBeenCalledOnce();
  });

  it('keeps separate instances isolated in separate app contexts', async () => {
    const tag = uniqueName('scoped-daemon-consumer');

    @daemon
    class NamedDaemon {
      constructor(readonly name: string) {}

      @respond('identity')
      identity() {
        return this.name;
      }
    }

    @element(tag)
    class ScopedConsumer extends HTMLElement {
      @request<string>('identity', { daemon: 'service' })
      async *identity(): Response<string> {
        return yield {};
      }
    }

    const leftRoot = root();
    const rightRoot = root();
    const left = new NamedDaemon('left');
    const right = new NamedDaemon('right');
    provide(leftRoot, { daemons: { service: left } });
    provide(rightRoot, { daemons: { service: right } });

    const leftConsumer = document.createElement(tag) as ScopedConsumer;
    const rightConsumer = document.createElement(tag) as ScopedConsumer;
    leftRoot.appendChild(leftConsumer);
    rightRoot.appendChild(rightConsumer);
    await Promise.all([(leftConsumer as any).ready, (rightConsumer as any).ready]);

    await expect(leftConsumer.identity()).resolves.toBe('left');
    await expect(rightConsumer.identity()).resolves.toBe('right');
    expect(left).not.toBe(right);
  });

  it('re-resolves listeners and requests when a consumer moves between context roots', async () => {
    const tag = uniqueName('moving-daemon-consumer');

    @daemon
    class NamedDaemon {
      constructor(readonly name: string) {}

      @respond('moving-identity')
      identity() {
        return this.name;
      }

      @dispatch('moving-changed')
      changed() {
        return this.name;
      }
    }

    @element(tag)
    class MovingConsumer extends HTMLElement {
      changes: string[] = [];

      @request<string>('moving-identity', { daemon: 'service' })
      async *identity(): Response<string> {
        return yield {};
      }

      @on('moving-changed', { daemon: 'service' })
      changed(event: CustomEvent<string>) {
        this.changes.push(event.detail);
      }
    }

    const leftRoot = root();
    const rightRoot = root();
    const left = new NamedDaemon('left');
    const right = new NamedDaemon('right');
    provide(leftRoot, { daemons: { service: left } });
    provide(rightRoot, { daemons: { service: right } });

    const consumer = document.createElement(tag) as MovingConsumer;
    leftRoot.appendChild(consumer);
    await (consumer as any).ready;
    await expect(consumer.identity()).resolves.toBe('left');
    left.changed();
    expect(consumer.changes).toEqual(['left']);

    consumer.remove();
    rightRoot.appendChild(consumer);
    await Promise.resolve();
    await expect(consumer.identity()).resolves.toBe('right');
    left.changed();
    right.changed();
    expect(consumer.changes).toEqual(['left', 'right']);
  });

  it('keeps a shared instance active until its final context is released', async () => {
    const tag = uniqueName('shared-daemon-consumer');

    @daemon
    class SharedDaemon {
      @respond('shared-value')
      value() {
        return 'shared';
      }
    }

    @element(tag)
    class SharedConsumer extends HTMLElement {
      @request<string>('shared-value', { daemon: 'service' })
      async *value(): Response<string> {
        return yield {};
      }
    }

    const service = new SharedDaemon();
    const leftRoot = root();
    const rightRoot = root();
    const releaseLeft = provide(leftRoot, { daemons: { service } });
    provide(rightRoot, { daemons: { service } });

    const rightConsumer = document.createElement(tag) as SharedConsumer;
    rightRoot.appendChild(rightConsumer);
    await (rightConsumer as any).ready;

    releaseLeft();
    await expect(rightConsumer.value()).resolves.toBe('shared');
  });

  it('uses the same context provider through Router for ordinary descendants', async () => {
    const pageTag = uniqueName('daemon-page');
    const consumerTag = uniqueName('daemon-page-consumer');
    const rootId = uniqueName('daemon-router-root');

    @daemon
    class RouterDaemon {
      @respond('router-daemon-value')
      value() {
        return 'from-router-context';
      }
    }

    @element(consumerTag)
    class RouterConsumer extends HTMLElement {
      @request<string>('router-daemon-value', { daemon: 'router-service' })
      async *value(): Response<string> {
        return yield {};
      }
    }

    const service = new RouterDaemon();
    const appRoot = root();
    appRoot.id = rootId;
    const router = Router({
      target: `#${rootId}`,
      type: 'hash',
      context: { daemons: { 'router-service': service } },
    });

    @router.page({ tag: pageTag, routes: ['/daemon-context'] })
    class DaemonPage extends HTMLElement {}

    await router.navigate('/daemon-context');
    const page = appRoot.querySelector(pageTag)!;
    const consumer = document.createElement(consumerTag) as RouterConsumer;
    page.appendChild(consumer);
    await (consumer as any).ready;

    await expect(consumer.value()).resolves.toBe('from-router-context');
    const releaseNested = provide(page, { marker: 'nested-page-context' });
    expect(getContext<any>(page)?.marker).toBe('nested-page-context');
    releaseNested();
    expect(getContext<any>(page)?.daemons?.['router-service']).toBe(service);
    expect(DaemonPage).toBeDefined();
  });

  it('fails clearly when no context provides the named daemon', async () => {
    const tag = uniqueName('missing-daemon-consumer');

    @element(tag)
    class MissingConsumer extends HTMLElement {
      @request('missing-request', { daemon: 'missing' })
      async *load(): Response<unknown> {
        return yield {};
      }
    }

    const consumer = document.createElement(tag) as MissingConsumer;
    root().appendChild(consumer);
    await (consumer as any).ready;

    await expect(consumer.load()).rejects.toThrow(/missing.*no app context/i);
  });

  it('makes released daemon communication inert immediately', async () => {
    const tag = uniqueName('released-daemon-consumer');

    @daemon
    class ReleasableDaemon {
      @dispatch('released-change')
      changed() {
        return 'changed';
      }
    }

    @element(tag)
    class ReleasedConsumer extends HTMLElement {
      calls = 0;

      @on('released-change', { daemon: 'service' })
      changed() {
        this.calls += 1;
      }
    }

    const service = new ReleasableDaemon();
    const appRoot = root();
    const release = provide(appRoot, { daemons: { service } });
    const consumer = document.createElement(tag) as ReleasedConsumer;
    appRoot.appendChild(consumer);
    await (consumer as any).ready;

    service.changed();
    expect(consumer.calls).toBe(1);

    release();
    service.changed();
    expect(consumer.calls).toBe(1);
    expect(getContext(consumer)).toBeUndefined();

    provide(appRoot, { daemons: { service } });
    consumer.remove();
    appRoot.appendChild(consumer);
    await Promise.resolve();
    service.changed();
    expect(consumer.calls).toBe(2);
  });

  it('rejects DOM selector delegation on a daemon target', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @daemon
    class InvalidDelegationDaemon {
      @on('invalid-daemon-event', '.child')
      invalid() {}
    }

    provide(root(), { daemons: { invalid: new InvalidDelegationDaemon() } });

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/cannot delegate.*daemon target/i));
    warn.mockRestore();
  });
});
