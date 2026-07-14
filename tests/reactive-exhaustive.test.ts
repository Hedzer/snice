import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SniceElement, css, element, html, property, state, watch } from './test-imports';

describe('deep reactivity and authoring exhaustive behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('preserves Map and Set native methods and observes nested collection values', async () => {
    @element('test-reactive-collection-methods')
    class TestReactiveCollectionMethods extends SniceElement {
      @state({ deep: true }) data = {
        map: new Map<string, { count: number }>([['a', { count: 1 }]]),
        set: new Set([{ selected: false }])
      };
      render() {
        const setValue = [...this.data.set][0];
        return html`<p>${this.data.map.has('a')}|${this.data.map.get('a')!.count}|${this.data.set.has(setValue)}|${setValue.selected}</p>`;
      }
    }
    const host = document.createElement('test-reactive-collection-methods') as TestReactiveCollectionMethods;
    container.append(host);
    await host.ready;
    expect(host.shadowRoot!.textContent).toContain('true|1|true|false');
    host.data.map.get('a')!.count = 2;
    [...host.data.set][0].selected = true;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('true|2|true|true');
    expect(host.data.map.has('missing')).toBe(false);
    expect(host.data.map.get).toBe(host.data.map.get);
    expect(host.data.map.set).toBe(host.data.map.set);
    expect(host.data.set.add).toBe(host.data.set.add);
    expect(host.data.map.constructor).toBe(Map);
    expect(host.data.set.constructor).toBe(Set);
  });

  it('preserves every Map and Set iteration form, callback receiver, and native fallback', async () => {
    const mapKey = { id: 1 };
    const setValue = { id: 2 };
    @element('test-reactive-collection-iteration-surface')
    class TestReactiveCollectionIterationSurface extends SniceElement {
      @state({ deep: true }) data = {
        map: new Map([[mapKey, { count: 1 }]]),
        set: new Set([setValue])
      };
      render() { return html`<p>${this.data.map.size}|${this.data.set.size}</p>`; }
    }
    const host = document.createElement('test-reactive-collection-iteration-surface') as TestReactiveCollectionIterationSurface;
    container.append(host);
    await host.ready;
    const proxyKey = [...host.data.map.keys()][0];
    const proxyValue = [...host.data.set.values()][0];
    const receiver = {};
    const mapCalls: unknown[][] = [];
    const setCalls: unknown[][] = [];

    host.data.map.forEach(function (this: unknown, value, key, map) {
      mapCalls.push([this, value, key, map]);
    }, receiver);
    host.data.set.forEach(function (this: unknown, value, key, set) {
      setCalls.push([this, value, key, set]);
    }, receiver);

    expect([...host.data.map.values()][0]).toBe(host.data.map.get(mapKey));
    expect([...host.data.map.entries()]).toEqual([[proxyKey, host.data.map.get(mapKey)]]);
    expect([...host.data.map]).toEqual([[proxyKey, host.data.map.get(mapKey)]]);
    expect([...host.data.set.keys()]).toEqual([proxyValue]);
    expect([...host.data.set.entries()]).toEqual([[proxyValue, proxyValue]]);
    expect([...host.data.set]).toEqual([proxyValue]);
    expect(mapCalls).toEqual([[receiver, host.data.map.get(mapKey), proxyKey, host.data.map]]);
    expect(setCalls).toEqual([[receiver, proxyValue, proxyValue, host.data.set]]);
    expect(host.data.map.toString()).toBe('[object Map]');
    expect(host.data.set.toString()).toBe('[object Set]');
  });

  it('honors locked collection properties and failed reflective mutations without false notifications', async () => {
    const watcher = vi.fn();
    const lockedMap = new Map<string, number>();
    const lockedSet = new Set<string>();
    const lockedValue = { raw: true };
    Object.defineProperty(lockedMap, 'locked', {
      configurable: false,
      writable: false,
      value: lockedValue
    });
    Object.defineProperty(lockedSet, 'absent', {
      configurable: false,
      get: undefined
    });
    const frozen = Object.freeze({ value: 1 });

    @element('test-reactive-reflective-failures')
    class TestReactiveReflectiveFailures extends SniceElement {
      @state({ deep: true }) data: any = { lockedMap, lockedSet, frozen };
      @watch('data') changed() { watcher(); }
      render() { return html`<p>${this.data.frozen.value}</p>`; }
    }
    const host = document.createElement('test-reactive-reflective-failures') as TestReactiveReflectiveFailures;
    container.append(host);
    await host.ready;
    watcher.mockClear();

    expect(host.data.lockedMap.locked).toBe(lockedValue);
    expect(host.data.lockedSet.absent).toBeUndefined();
    expect(Reflect.set(host.data.frozen, 'value', 2)).toBe(false);
    expect(Reflect.deleteProperty(host.data.frozen, 'value')).toBe(false);
    expect(Reflect.defineProperty(host.data.frozen, 'extra', { value: true })).toBe(false);
    expect(watcher).not.toHaveBeenCalled();
  });

  it('observes null-prototype records and unwraps assigned proxies back to raw identity', async () => {
    const child = { value: 1 };
    const record = Object.create(null) as { child?: { value: number } };
    record.child = child;
    @element('test-reactive-null-prototype')
    class TestReactiveNullPrototype extends SniceElement {
      @state({ deep: true }) data = { first: { child }, second: record };
      render() { return html`<p>${this.data.second.child?.value}</p>`; }
    }
    const host = document.createElement('test-reactive-null-prototype') as TestReactiveNullPrototype;
    container.append(host);
    await host.ready;
    host.data.second.child = host.data.first.child;
    host.data.second.child.value = 3;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('3');
    expect(record.child).toBe(child);
  });

  it('notifies exactly once for an ordinary nested assignment and ignores no-op collection writes', async () => {
    const watcher = vi.fn();
    @element('test-reactive-mutation-count')
    class TestReactiveMutationCount extends SniceElement {
      @state({ deep: true }) model = { value: 1, map: new Map([['x', 1]]), set: new Set(['x']) };
      @watch('model') changed() { watcher(); }
      render() { return html`<p>${this.model.value}</p>`; }
    }
    const host = document.createElement('test-reactive-mutation-count') as TestReactiveMutationCount;
    container.append(host);
    await host.ready;
    watcher.mockClear();
    host.model.value = 2;
    expect(watcher).toHaveBeenCalledTimes(1);
    host.model.map.set('x', 1);
    host.model.set.add('x');
    expect(watcher).toHaveBeenCalledTimes(1);
    host.model.map.set('x', 2);
    host.model.set.add('y');
    expect(watcher).toHaveBeenCalledTimes(3);
  });

  it('supports cyclic graphs and returns stable proxies for repeated reads', async () => {
    const graph: { value: number; self?: any } = { value: 1 };
    graph.self = graph;
    @element('test-reactive-cyclic-graph')
    class TestReactiveCyclicGraph extends SniceElement {
      @state({ deep: true }) graph = graph;
      render() { return html`<p>${this.graph.self.value}</p>`; }
    }
    const host = document.createElement('test-reactive-cyclic-graph') as TestReactiveCyclicGraph;
    container.append(host);
    await host.ready;
    expect(host.graph.self).toBe(host.graph);
    expect(host.graph.self).toBe(host.graph.self);
    host.graph.self.value = 3;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('3');
  });

  it('does not proxy class instances, Dates, or objects with private fields', async () => {
    class Counter {
      #value = 1;
      increment() { return ++this.#value; }
      get value() { return this.#value; }
    }
    const counter = new Counter();
    const date = new Date('2026-01-01T00:00:00Z');
    @element('test-reactive-class-exclusion')
    class TestReactiveClassExclusion extends SniceElement {
      @state({ deep: true }) model = { counter, date };
      render() { return html`<p>${this.model.counter.value}|${this.model.date.getUTCFullYear()}</p>`; }
    }
    const host = document.createElement('test-reactive-class-exclusion') as TestReactiveClassExclusion;
    container.append(host);
    await host.ready;
    expect(host.model.counter).toBe(counter);
    expect(host.model.date).toBe(date);
    expect(host.model.counter.increment()).toBe(2);
    expect(host.model.date.getUTCFullYear()).toBe(2026);
  });

  it('respects native Proxy invariants for locked object properties', async () => {
    const nested = { value: 1 };
    const model = {} as { nested: { value: number }; absent?: unknown };
    Object.defineProperty(model, 'nested', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: nested
    });
    Object.defineProperty(model, 'absent', {
      configurable: false,
      enumerable: true,
      get: undefined
    });

    @element('test-reactive-proxy-invariants')
    class TestReactiveProxyInvariants extends SniceElement {
      @state({ deep: true }) model = model;
      render() { return html`<p>${this.model.nested.value}</p>`; }
    }

    const host = document.createElement('test-reactive-proxy-invariants') as TestReactiveProxyInvariants;
    container.append(host);
    await host.ready;
    expect(() => host.model.nested).not.toThrow();
    expect(host.model.nested).toBe(nested);
    expect(host.model.absent).toBeUndefined();
  });

  it('stops observing a proxied graph after the property is replaced', async () => {
    @element('test-reactive-stale-graph')
    class TestReactiveStaleGraph extends SniceElement {
      renders = 0;
      @state({ deep: true }) model = { value: 1 };
      render() { this.renders++; return html`<p>${this.model.value}</p>`; }
    }
    const host = document.createElement('test-reactive-stale-graph') as TestReactiveStaleGraph;
    container.append(host);
    await host.ready;
    const old = host.model;
    host.model = { value: 2 };
    await host.rendered;
    const renders = host.renders;
    old.value = 9;
    await Promise.resolve();
    expect(host.renders).toBe(renders);
    expect(host.shadowRoot!.textContent).toContain('2');
  });

  it('observes defineProperty, deletion, array length, and clear operations', async () => {
    const watcher = vi.fn();
    @element('test-reactive-operation-matrix')
    class TestReactiveOperationMatrix extends SniceElement {
      @state({ deep: true }) model: any = { list: [1, 2], object: {}, map: new Map([['a', 1]]), set: new Set(['a']) };
      @watch('model') changed() { watcher(); }
      render() {
        return html`<p>${this.model.list.length}|${this.model.object.extra ?? '-'}|${this.model.object.computed ?? '-'}|${this.model.map.size}|${this.model.set.size}</p>`;
      }
    }
    const host = document.createElement('test-reactive-operation-matrix') as TestReactiveOperationMatrix;
    container.append(host);
    await host.ready;
    watcher.mockClear();
    Object.defineProperty(host.model.object, 'extra', { value: 'yes', configurable: true, enumerable: true });
    expect(watcher).toHaveBeenCalledTimes(1);
    const getter = () => 'derived';
    Reflect.defineProperty(host.model.object, 'computed', {
      configurable: true,
      enumerable: true,
      get: getter
    });
    expect(watcher).toHaveBeenCalledTimes(2);
    Reflect.defineProperty(host.model.object, 'computed', {
      configurable: true,
      enumerable: false,
      get: getter
    });
    expect(watcher).toHaveBeenCalledTimes(3);
    delete host.model.object.toString;
    expect(watcher).toHaveBeenCalledTimes(3);
    Reflect.defineProperty(host.model.object, 'computed', {
      configurable: true,
      enumerable: false,
      get: getter
    });
    expect(watcher).toHaveBeenCalledTimes(3);
    host.model.list.length = 1;
    host.model.map.clear();
    host.model.set.clear();
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('1|yes|derived|0|0');
    delete host.model.object.extra;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toContain('1|-|derived|0|0');
  });

  it('reflects deep public properties without replacing their JavaScript identity', async () => {
    @element('test-deep-public-property')
    class TestDeepPublicProperty extends SniceElement {
      @property({ type: Object, deep: true }) settings = { theme: { dark: false } };
      render() { return html`<p>${this.settings.theme.dark}</p>`; }
    }
    const host = document.createElement('test-deep-public-property') as TestDeepPublicProperty;
    container.append(host);
    await host.ready;
    const settings = host.settings;
    host.settings.theme.dark = true;
    await host.rendered;
    expect(host.settings).toBe(settings);
    expect(host.getAttribute('settings')).toBe('{"theme":{"dark":true}}');
    expect(host.shadowRoot!.textContent).toContain('true');
  });

  it('composes inherited static stylesheet arrays in parent-to-child order exactly once', async () => {
    @element('test-static-style-parent')
    class TestStaticStyleParent extends SniceElement {
      static styles = [css`:host { color: red; }`, css`p { display: block; }`];
      render() { return html`<p>parent</p>`; }
    }
    @element('test-static-style-child')
    class TestStaticStyleChild extends TestStaticStyleParent {
      static styles = css`:host { color: blue; }`;
      render() { return html`<p>child</p>`; }
    }
    const host = document.createElement('test-static-style-child') as TestStaticStyleChild;
    container.append(host);
    await host.ready;
    const styles = [...host.shadowRoot!.querySelectorAll('style')].map(style => style.textContent);
    expect(styles).toEqual([
      ':host { color: red; }',
      'p { display: block; }',
      ':host { color: blue; }'
    ]);
    host.remove();
    container.append(host);
    expect(host.shadowRoot!.querySelectorAll('style')).toHaveLength(3);
  });
});
