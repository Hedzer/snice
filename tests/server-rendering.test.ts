import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Directive,
  HydrationError,
  attrs,
  bind,
  createRef,
  css,
  directive,
  directiveServerResult,
  element,
  events,
  html,
  hydrate,
  hydrateElement,
  noChange,
  portal,
  props,
  ref,
  render,
  renderElementToStringAsync,
  renderElementToString,
  renderToStringAsync,
  renderToString,
  repeat,
  resource,
  svg,
  transition,
  use,
  unsafeHTML
} from './test-imports';
import type { DirectivePart } from '../src/index';

describe('DOM-independent server rendering', () => {
  it('serializes text, attribute, property, boolean, class, style, and event positions', () => {
    const output = renderToString(html`
      <button
        class="base"
        class:active=${true}
        style:color=${'red'}
        ?disabled=${true}
        .value=${'hello'}
        @click|prevent=${() => {}}
      >${'<unsafe>'}</button>
    `);

    expect(output).toContain('class="base active"');
    expect(output).toContain('style="color:red;"');
    expect(output).toContain(' disabled=""');
    expect(output).toContain(' value="hello"');
    expect(output).not.toContain('@click');
    expect(output).toContain('<!---->&lt;unsafe&gt;<!---->');
  });

  it('selects if/else-if and typed case branches', () => {
    const selected = { state: 'selected' };
    const other = { state: 'other' };
    const output = renderToString(html`
      <if ${false}>
        <p>first</p>
        <else-if ${true}><p>second</p></else-if>
        <else><p>third</p></else>
      </if>
      <case ${selected}>
        <when ${other}><p>other</p></when>
        <when ${selected}><p>identity</p></when>
        <default><p>fallback</p></default>
      </case>
    `);

    expect(output).toContain('<!--if--><p>second</p><!--/if-->');
    expect(output).toContain('<!--case--><p>identity</p><!--/case-->');
    expect(output).not.toContain('<p>first</p>');
    expect(output).not.toContain('<p>fallback</p>');
  });

  it('rejects case content that is not inside a direct branch in sync and async SSR', async () => {
    const text = html`<case ${'x'}>orphan<when value="x">valid</when></case>`;
    const element = html`<case ${'x'}><p>orphan</p><default>valid</default></case>`;
    const expression = html`<case ${'x'}><!-- ${'orphan'} --><default>valid</default></case>`;
    expect(() => renderToString(text)).toThrow(/must be nested in a <when>/);
    expect(() => renderToString(element)).toThrow(/only direct <when>/);
    expect(() => renderToString(expression)).toThrow(/must be nested in a <when>/);
    await expect(renderToStringAsync(text)).rejects.toThrow(/must be nested in a <when>/);
    await expect(renderToStringAsync(element)).rejects.toThrow(/only direct <when>/);
  });

  it('keeps meaningful trailing nodes in the preceding if branch', async () => {
    const view = (condition: boolean) => html`
      <if ${condition}>
        <strong>primary</strong>
        <else><span>fallback</span></else>
        trailing <em>content</em>
      </if>
    `;
    const sync = renderToString(view(false));
    const asyncOutput = await renderToStringAsync(view(false));
    expect(sync).toContain('<span>fallback</span>');
    expect(sync).toContain('trailing <em>content</em>');
    expect(asyncOutput).toBe(sync);

    const container = document.createElement('div');
    container.innerHTML = sync;
    document.body.append(container);
    expect(() => hydrate(view(false), container)).not.toThrow();
    expect(container.textContent).toContain('fallback');
    expect(container.textContent).toContain('trailing content');
  });

  it('serializes keyed repeats and dynamic components with runtime boundaries', () => {
    const output = renderToString(html`
      <ul>${repeat([{ id: 1, label: 'one' }, { id: 2, label: 'two' }], {
        key: item => item.id,
        render: item => html`<li>${item.label}</li>`
      })}</ul>
      <component ${'article'} class:featured=${true}><span>body</span></component>
    `);

    expect(output).toContain('<ul><!----><!----><li><!---->one<!----></li><!----><!----><li><!---->two<!----></li><!----><!----></ul>');
    expect(output).toContain('<!--component--><article class="featured"><span>body</span></article><!--/component-->');
  });

  it('matches client void-element parking and foreign-content namespaces', () => {
    const view = (tag: string) => html`<component ${tag} class="target"><span>retained</span></component>`;
    const server = renderToString(view('input'));
    expect(server).toContain('<!--component--><input class="target"><!--/component-->');
    expect(server).not.toContain('<span>');
    expect(server).not.toContain('</input>');

    const container = document.createElement('div');
    container.innerHTML = server;
    document.body.append(container);
    const input = container.querySelector('input')!;
    const instance = hydrate(view('input'), container);
    expect(container.querySelector('input')).toBe(input);
    instance.update(view('section').values);
    expect(container.querySelector('section > span')?.textContent).toBe('retained');

    const svgOutput = renderToString(html`<svg><component ${'input'}>svg child</component></svg>`);
    expect(svgOutput).toContain('<input>svg child</input>');
    const foreignOutput = renderToString(html`<svg><foreignObject><component ${'input'}>parked</component></foreignObject></svg>`);
    expect(foreignOutput).toContain('<input>');
    expect(foreignOutput).not.toContain('parked');
    expect(foreignOutput).not.toContain('</input>');
  });

  it('uses directive render contracts and built-in SSR behavior', () => {
    class Upper extends Directive {
      render(value: string) { return value.toUpperCase(); }
    }
    const upper = directive<Upper, readonly [string]>(Upper);
    const never = new Promise<string>(() => {});
    const target = document.createElement('div');

    const output = renderToString(html`
      ${upper('hello')}
      ${resource(never, { pending: html`<i>pending</i>` })}
      ${transition(html`<b>stable</b>`, { key: 'stable' })}
      ${portal(target, html`<em>elsewhere</em>`)}
    `);

    expect(output).toContain('<!---->HELLO<!---->');
    expect(output).toContain('<!----><i>pending</i><!---->');
    expect(output).toContain('<!----><!--transition--><b>stable</b><!--/transition--><!---->');
    expect(output).not.toContain('elsewhere');
  });

  it('treats noChange and unresolved async values as absent during synchronous SSR', () => {
    class Preserve extends Directive {
      render() { return noChange; }
    }
    const preserve = directive<Preserve, readonly []>(Preserve);
    const pending = Promise.resolve(true);
    const output = renderToString(html`
      <div
        data-single=${preserve()}
        data-mixed="prefix-${preserve()}"
        .title=${preserve()}
        ?hidden=${preserve()}
        class:active=${preserve()}
        style:color=${preserve()}
        ...attrs=${preserve()}
      ></div>
      <if ${pending}><p>wrong</p><else><p>pending</p></else></if>
      <component ${pending}>wrong</component>
    `, { hydratable: false });

    expect(output).not.toContain('data-single');
    expect(output).toContain('data-mixed="prefix-"');
    expect(output).not.toContain('hidden');
    expect(output).not.toContain('active');
    expect(output).not.toContain('style=');
    expect(output).toContain('<p>pending</p>');
    expect(output).not.toContain('<p>wrong</p>');
    expect(output).not.toContain('[object Promise]');
  });

  it('lets public custom directives emit SSR spreads and named boundaries', () => {
    class ServerAttributes extends Directive {
      static renderToString([label]: readonly [string]) {
        return directiveServerResult('attributes', {
          'data-label': label,
          hidden: false,
          enabled: true
        });
      }
      render() { return undefined; }
    }
    class ServerBoundary extends Directive {
      static renderToString([value]: readonly [string]) {
        return directiveServerResult('boundary', html`<strong>${value}</strong>`, 'custom');
      }
      render() { return undefined; }
    }
    const serverAttributes = directive<ServerAttributes, readonly [string]>(ServerAttributes);
    const serverBoundary = directive<ServerBoundary, readonly [string]>(ServerBoundary);

    const output = renderToString(html`
      <article ${serverAttributes('safe & sound')}>${serverBoundary('inside')}</article>
    `);

    expect(output).toContain('<article data-label="safe &amp; sound" enabled="">');
    expect(output).toContain('<!--custom--><strong><!---->inside<!----></strong><!--/custom-->');
  });

  it('does not require a document global', () => {
    const original = globalThis.document;
    try {
      Reflect.deleteProperty(globalThis, 'document');
      expect(renderToString(html`<p>${'server'}</p>`)).toBe('<p><!---->server<!----></p>');
    } finally {
      Object.defineProperty(globalThis, 'document', { value: original, configurable: true, writable: true });
    }
  });

  it('renders hydratable declarative shadow DOM hosts and validates inputs', () => {
    const output = renderElementToString('test-server-card', html`<p>${'hello'}</p>`, {
      attributes: { title: 'A & B', hidden: false, enabled: true },
      styles: css`:host { display: block; }`,
      delegatesFocus: true
    });

    expect(output).toContain('<test-server-card title="A &amp; B" enabled data-snice-hydrate>');
    expect(output).toContain('<template shadowrootmode="open" shadowrootdelegatesfocus>');
    expect(output).toContain('<style data-snice-style>:host { display: block; }</style>');
    expect(renderElementToString('test-closed-card', html`<p>closed</p>`, { shadow: 'closed' }))
      .toContain('<template shadowrootmode="closed">');
    expect(renderElementToString('test-light-card', html`<p>light</p>`, { shadow: false }))
      .toContain('<test-light-card data-snice-hydrate><p>light</p></test-light-card>');
    expect(() => renderElementToString('invalid', html``)).toThrow(/custom-element tag name/);
    expect(() => renderElementToString('test-invalid-root', html``, { renderRoot: 'other' as any })).toThrow(/renderRoot/);
    expect(() => renderElementToString('test-invalid-shadow', html``, { shadow: 'broken' as any })).toThrow(/shadow/);
    expect(() => renderElementToString('test-conflicting-root', html``, {
      renderRoot: 'light', shadow: 'closed'
    })).toThrow(/conflicting render roots/);
    expect(() => renderElementToString('test-invalid-attribute', html``, {
      attributes: { 'bad<name': 'value' }
    })).toThrow(/invalid SSR attribute name/);
    expect(() => renderToString('not a template' as any)).toThrow(/expects an html/);
  });

  it('serializes spreads, two-way bindings, raw HTML, SVG, and authored entities safely', () => {
    const model = { value: 'bound & ready' };
    const output = renderToString(html`
      <input
        title="authored &amp; ${'dynamic " < &'}"
        ${attrs({ 'data-kind': 'field & value', hidden: true, omitted: null })}
        ${props({ value: 'spread & value', checked: true, ignored: { complex: true } })}
        ${events({ click: () => {} })}
      >
      <input .value=${bind(model, 'value')}>
      <input
        ...attrs=${{ 'data-named': 'named & ready', hidden: true }}
        ...props=${{ value: 'named property & ready', checked: true }}
        ...events=${{ input: () => {} }}
      >
      ${unsafeHTML('<strong data-raw="yes">trusted</strong>')}
      ${svg`<svg viewBox="0 0 10 10"><circle cx=${5} cy=${5} r=${4}></circle></svg>`}
    `, { hydratable: false });

    expect(output).toContain('title="authored &amp; dynamic &quot; &lt; &amp;"');
    expect(output).toContain('data-kind="field &amp; value"');
    expect(output).toContain(' hidden=""');
    expect(output).not.toContain('omitted');
    expect(output).toContain('value="spread &amp; value"');
    expect(output).toContain(' checked=""');
    expect(output).not.toContain('ignored=');
    expect(output).not.toContain('click=');
    expect(output).toContain('value="bound &amp; ready"');
    expect(output).toContain('data-named="named &amp; ready"');
    expect(output).toContain('value="named property &amp; ready"');
    expect(output).toContain('<strong data-raw="yes">trusted</strong>');
    expect(output).toContain('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>');
    expect(output).not.toContain('<!---->');
  });

  it('preserves raw-text element contents without treating source text as nested tags', () => {
    const output = renderToString(html`
      <script>const comparison = left <Right && value > 0;</script>
      <style>.example::before { content: "<Badge>"; }</style>
      <textarea>literal <Widget> ${'and dynamic'}</textarea>
    `, { hydratable: false });

    expect(output).toContain('<script>const comparison = left <Right && value > 0;</script>');
    expect(output).toContain('<style>.example::before { content: "<Badge>"; }</style>');
    expect(output).toContain('<textarea>literal <Widget> and dynamic</textarea>');
  });

  it('rejects malformed SSR element positions and spread inputs', () => {
    expect(() => renderToString(html`<div ${'not-a-directive'}></div>`)).toThrow(/opening tag/);
    expect(() => renderToString(html`<div ${attrs('bad' as any)}></div>`)).toThrow(/expects an object/);
    expect(() => renderToString(html`<div ...attrs=${{ 'bad name': 'value' }}></div>`))
      .toThrow(/invalid SSR spread attribute name/);
    expect(() => renderToString(html`<div ...unknown=${{ safe: true }}></div>`))
      .toThrow(/unknown spread binding/);

    class UnsafeBoundary extends Directive {
      static renderToString() {
        return directiveServerResult('boundary', html`<p>unsafe</p>`, 'bad-->boundary');
      }
      render() { return undefined; }
    }
    const unsafeBoundary = directive<UnsafeBoundary, readonly []>(UnsafeBoundary);
    expect(() => renderToString(html`${unsafeBoundary()}`))
      .toThrow(/invalid SSR directive boundary name/);

    expect(() => renderToString(html`
      <if ${false}><p>a</p><else><p>b</p></else><else-if ${true}><p>c</p></else-if></if>
    `)).toThrow(/final branch/);
    expect(() => renderToString(html`
      <case ${'a'}><when value="a">a</when><default>b</default><default>c</default></case>
    `)).toThrow(/only one <default>/);
  });

  it('awaits promises, async iterables, directives, attributes, and control flow', async () => {
    class AsyncUpper extends Directive {
      static renderToString(values: readonly unknown[], context: { async: boolean }) {
        if (!context.async) return 'pending';
        return Promise.resolve(String(values[0]).toUpperCase());
      }
      render(value: string) { return value.toUpperCase(); }
    }
    const asyncUpper = directive<AsyncUpper, readonly [string]>(AsyncUpper);
    async function* values() {
      yield 'first';
      yield html`<b>last</b>`;
    }
    async function* attributeValues() {
      yield 'first';
      yield 'latest & value';
    }
    async function* conditions() {
      yield false;
      yield true;
    }
    async function* componentTags() {
      yield 'aside';
      yield 'nav';
    }

    const output = await renderToStringAsync(html`
      <section
        title=${Promise.resolve('A & B')}
        class:ready=${Promise.resolve(true)}
        ?hidden=${Promise.resolve(false)}
        ...attrs=${Promise.resolve({ 'data-async': 'spread & ready' })}
        ...props=${Promise.resolve({ title: 'property title' })}
        data-stream=${attributeValues()}
      >
        ${Promise.resolve(html`<i>promise</i>`)}
        ${values()}
        ${asyncUpper('async')}
        ${resource(Promise.resolve('settled'), {
          pending: html`<span>pending</span>`,
          ready: value => html`<em>${value}</em>`
        })}
        <if ${Promise.resolve(false)}><u>wrong</u><else-if ${Promise.resolve(true)}><u>right</u></else-if></if>
        <component ${Promise.resolve('article')}>dynamic</component>
        <if ${conditions()}><mark>stream condition</mark></if>
        <component ${componentTags()}>stream component</component>
      </section>
    `);

    expect(output).toContain('class="ready"');
    expect(output).toContain('data-async="spread &amp; ready"');
    expect(output).toContain('title="property title"');
    expect(output).toContain('data-stream="latest &amp; value"');
    expect(output).toContain('<i>promise</i>');
    expect(output).not.toContain('first');
    expect(output).toContain('<b>last</b>');
    expect(output).toContain('ASYNC');
    expect(output).toContain('<em><!---->settled<!----></em>');
    expect(output).not.toContain('<span>pending</span>');
    expect(output).toContain('<!--if--><u>right</u><!--/if-->');
    expect(output).toContain('<!--component--><article>dynamic</article><!--/component-->');
    expect(output).toContain('<!--if--><mark>stream condition</mark><!--/if-->');
    expect(output).toContain('<!--component--><nav>stream component</nav><!--/component-->');
    await expect(renderToStringAsync(html`<div ...attrs=${Promise.resolve({ 'bad name': true })}></div>`))
      .rejects.toThrow(/invalid SSR spread attribute name/);
  });

  it('renders asynchronous light and declarative-shadow hosts', async () => {
    const shadow = await renderElementToStringAsync(
      'test-async-host',
      html`<p>${Promise.resolve('ready')}</p>`,
      { delegatesFocus: true }
    );
    const light = await renderElementToStringAsync(
      'test-async-light',
      html`<p>${Promise.resolve('ready')}</p>`,
      { renderRoot: 'light', hydratable: false }
    );

    expect(shadow).toContain('data-snice-hydrate');
    expect(shadow).toContain('shadowrootdelegatesfocus');
    expect(shadow).toContain('<!---->ready<!---->');
    expect(light).toBe('<test-async-light><p>ready</p></test-async-light>');
  });
});

describe('hydration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('retains matching server node identity, attaches events and updates in place', () => {
    const clicked = vi.fn();
    const view = (label: string) => html`<button @click=${clicked}><span>${label}</span></button>`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view('first'));
    document.body.append(container);
    const button = container.querySelector('button')!;
    const span = button.querySelector('span')!;
    const text = span.firstChild;

    const instance = hydrate(view('first'), container);
    expect(container.querySelector('button')).toBe(button);
    expect(container.querySelector('span')).toBe(span);
    button.click();
    expect(clicked).toHaveBeenCalledOnce();

    instance.update(view('second').values);
    expect(container.querySelector('button')).toBe(button);
    expect(span.firstChild).toBe(text);
    expect(span.textContent).toBe('second');
  });

  it('retargets refs and custom directives to adopted elements', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const updates: Element[] = [];
    const instances = new Set<Capture>();
    const adoptions: ReadonlyMap<Node, Node>[] = [];
    class Capture extends Directive {
      render() { return undefined; }
      update(part: DirectivePart) {
        instances.add(this);
        if (part.element) updates.push(part.element);
        return undefined;
      }
      adopted(nodeMap: ReadonlyMap<Node, Node>) { adoptions.push(nodeMap); }
    }
    const capture = directive<Capture, readonly []>(Capture);
    const view = () => html`<button ${ref(buttonRef)} ${capture()}>kept</button>`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view());
    document.body.append(container);
    const serverButton = container.querySelector('button')!;

    hydrate(view(), container);
    expect(buttonRef.value).toBe(serverButton);
    expect(updates.at(-1)).toBe(serverButton);
    expect(instances.size).toBe(1);
    expect(adoptions).toHaveLength(1);
    expect(adoptions[0].get(updates[0])).toBe(serverButton);
  });

  it('retargets built-in element directives and reconnects them on the adopted element', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const propertyValue = { identity: true };
    const cleanup = vi.fn();
    const action = vi.fn(() => cleanup);
    const eventThis: unknown[] = [];
    const click = vi.fn(function (this: unknown) { eventThis.push(this); });
    const view = () => html`<button
      ${ref(buttonRef)}
      ${use(action)}
      ${props({ customValue: propertyValue })}
      ${events({ click })}
    >kept</button>`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view());
    document.body.append(container);
    const serverButton = container.querySelector('button') as HTMLButtonElement & { customValue?: object };

    const instance = hydrate(view(), container);
    expect(buttonRef.value).toBe(serverButton);
    expect(action).toHaveBeenLastCalledWith(serverButton, undefined);
    expect(serverButton.customValue).toBe(propertyValue);
    serverButton.click();
    expect(click).toHaveBeenCalledOnce();
    expect(eventThis).toEqual([serverButton]);

    container.remove();
    instance.disconnected();
    expect(buttonRef.value).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
    serverButton.click();
    expect(click).toHaveBeenCalledOnce();

    document.body.append(container);
    instance.reconnected();
    expect(buttonRef.value).toBe(serverButton);
    expect(action).toHaveBeenCalledTimes(2);
    serverButton.click();
    expect(click).toHaveBeenCalledTimes(2);
    expect(eventThis.at(-1)).toBe(serverButton);
  });

  it('keeps interpolated directive instances and their live part element through hydration', () => {
    const updates: Element[] = [];
    const instances = new Set<CaptureAttribute>();
    const adoptions: ReadonlyMap<Node, Node>[] = [];
    class CaptureAttribute extends Directive {
      static renderToString(values: readonly unknown[]) { return values[0]; }
      render(value: unknown) { return value; }
      update(part: DirectivePart, values: readonly unknown[]) {
        instances.add(this);
        if (part.element) updates.push(part.element);
        return values[0];
      }
      adopted(nodeMap: ReadonlyMap<Node, Node>) { adoptions.push(nodeMap); }
    }
    const capture = directive<CaptureAttribute, readonly [string]>(CaptureAttribute);
    const view = () => html`<button title="prefix ${capture('value')}">kept</button>`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view());
    document.body.append(container);
    const serverButton = container.querySelector('button')!;

    hydrate(view(), container);
    expect(serverButton.getAttribute('title')).toBe('prefix value');
    expect(updates.at(-1)).toBe(serverButton);
    expect(instances.size).toBe(1);
    expect(adoptions).toHaveLength(1);
    expect(adoptions[0].get(updates[0])).toBe(serverButton);
  });

  it('does not reconnect directives while hydrating a detached container', () => {
    const reconnected = vi.fn();
    const disconnected = vi.fn();
    class Lifecycle extends Directive {
      render() { return noChange; }
      reconnected() { reconnected(); }
      disconnected() { disconnected(); }
    }
    const lifecycle = directive<Lifecycle, readonly []>(Lifecycle);
    const view = () => html`<button ${lifecycle()}>kept</button>`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view());

    const instance = hydrate(view(), container);
    expect(reconnected).not.toHaveBeenCalled();
    document.body.append(container);
    instance.reconnected();
    expect(reconnected).toHaveBeenCalledOnce();
    container.remove();
    instance.disconnected();
    expect(disconnected).toHaveBeenCalledOnce();
  });

  it('hydrates control flow, keyed repeat, and dynamic components before later updates', () => {
    const rows = (items: readonly { id: number; label: string }[]) => html`
      <if ${true}><strong>shown</strong><else><span>hidden</span></else></if>
      <ul>${repeat(items, { key: item => item.id, render: item => html`<li>${item.label}</li>` })}</ul>
      <component ${'section'}><input value="preserved"></component>
    `;
    const initial = [{ id: 1, label: 'one' }, { id: 2, label: 'two' }];
    const container = document.createElement('div');
    container.innerHTML = renderToString(rows(initial));
    document.body.append(container);
    const first = container.querySelectorAll('li')[0];
    const second = container.querySelectorAll('li')[1];
    const input = container.querySelector('input')!;

    const instance = hydrate(rows(initial), container);
    expect(container.querySelectorAll('li')[0]).toBe(first);
    instance.update(rows([initial[1], initial[0]]).values);
    expect(container.querySelectorAll('li')[0]).toBe(second);
    expect(container.querySelectorAll('li')[1]).toBe(first);
    expect(container.querySelector('input')).toBe(input);
  });

  it('reports structural mismatches and supports an explicit replacement fallback', () => {
    const result = html`<p>${'expected'}</p>`;
    const container = document.createElement('div');
    container.innerHTML = '<section>wrong</section>';
    expect(() => hydrate(result, container)).toThrow(HydrationError);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const old = container.firstChild;
    hydrate(result, container, { onMismatch: 'replace' });
    expect(container.querySelector('p')?.textContent).toBe('expected');
    expect(container.firstChild).not.toBe(old);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('hydration mismatch'));
    warning.mockRestore();
  });

  it('does not partially reconcile earlier nodes before reporting a later mismatch', () => {
    const view = (label: string, className: string) => html`
      <p class=${className}><span>${label}</span></p><article>expected</article>
    `;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view('server', 'server'));
    container.querySelector('article')!.outerHTML = '<section>wrong</section>';
    const paragraph = container.querySelector('p')!;
    const span = container.querySelector('span')!;

    expect(() => hydrate(view('client', 'client'), container)).toThrow(HydrationError);
    expect(paragraph.className).toBe('server');
    expect(span.textContent).toBe('server');
  });

  it('automatically hydrates light-DOM server markup when the element upgrades', async () => {
    const view = (label: string) => html`<p><span>${label}</span></p>`;
    @element('test-auto-hydrate-light', { renderRoot: 'light' })
    class TestAutoHydrateLight extends HTMLElement {
      @render()
      render() { return view('server'); }
    }

    const host = document.createElement('test-auto-hydrate-light') as TestAutoHydrateLight & { ready: Promise<void> };
    host.setAttribute('data-snice-hydrate', '');
    host.innerHTML = renderToString(view('server'));
    const serverSpan = host.querySelector('span')!;
    document.body.append(host);
    await host.ready;
    expect(host.querySelector('span')).toBe(serverSpan);
    expect(host.hasAttribute('data-snice-hydrate')).toBe(false);
  });

  it('hydrates transition regions and keeps their server-rendered element identity', () => {
    const view = (label: string) => html`${transition(html`<p>${label}</p>`, {
      key: 'stable',
      outDuration: 0,
      inDuration: 0
    })}`;
    const container = document.createElement('div');
    container.innerHTML = renderToString(view('server'));
    document.body.append(container);
    const paragraph = container.querySelector('p')!;

    const instance = hydrate(view('server'), container);
    expect(container.querySelector('p')).toBe(paragraph);
    instance.update(view('client').values);
    expect(container.querySelector('p')).toBe(paragraph);
    expect(paragraph.textContent).toBe('client');
  });

  it('hydrates configured roots through hydrateElement and removes the marker', () => {
    const view = (label: string) => html`<button>${label}</button>`;
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = renderToString(view('server'));
    host.setAttribute('data-snice-hydrate', '');
    document.body.append(host);
    const button = root.querySelector('button')!;

    const instance = hydrateElement(host, view('server'));
    expect(root.querySelector('button')).toBe(button);
    expect(host.hasAttribute('data-snice-hydrate')).toBe(false);
    instance.update(view('updated').values);
    expect(button.textContent).toBe('updated');
  });
});
