import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Directive,
  createRef,
  directive,
  element,
  events,
  html,
  noChange,
  property,
  ref,
  render,
  repeat,
  use
} from './test-imports';
import type { DirectiveDisconnectContext, DirectivePart, PartInfo, PartType } from '../src/index';

describe('directive protocol exhaustive behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('provides accurate PartInfo and works in every declarative part type', async () => {
    const infos: PartInfo[] = [];
    const handler = vi.fn();
    class Inspect extends Directive {
      constructor(info: PartInfo) {
        super(info);
        infos.push(info);
      }
      render(value: unknown) {
        return this.partInfo.type === 'element' ? noChange : value;
      }
    }
    const inspect = directive<Inspect, readonly [unknown]>(Inspect);

    @element('test-directive-all-parts')
    class TestDirectiveAllParts extends HTMLElement {
      @render()
      template() {
        return html`<button
          ${inspect(null)}
          title=${inspect('title')}
          .custom=${inspect(4)}
          ?disabled=${inspect(false)}
          @click=${inspect(handler)}
          class:active=${inspect(true)}
          style:color=${inspect('red')}
          ...attrs=${inspect({ 'data-spread': 'yes' })}
        >${inspect('node')}</button>`;
      }
    }

    const host = document.createElement('test-directive-all-parts') as TestDirectiveAllParts;
    container.append(host);
    await host.ready;
    const button = host.shadowRoot!.querySelector('button') as HTMLButtonElement & { custom: number };
    expect(button.title).toBe('title');
    expect(button.custom).toBe(4);
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('active')).toBe(true);
    expect(button.style.color).toBe('red');
    expect(button.dataset.spread).toBe('yes');
    expect(button.textContent).toBe('node');
    button.click();
    expect(handler).toHaveBeenCalledOnce();

    const types = infos.map(info => info.type);
    const expected: PartType[] = ['element', 'attribute', 'property', 'boolean-attribute', 'event', 'class', 'style', 'spread', 'node'];
    expect(new Set(types)).toEqual(new Set(expected));
    const attributeInfo = infos.find(info => info.type === 'attribute');
    expect(attributeInfo?.name).toBe('title');
    expect(attributeInfo?.element).toBe(button);
  });

  it('retains one instance per expression and disposes it when its directive class changes', async () => {
    const constructed: string[] = [];
    const disconnected: string[] = [];
    class First extends Directive {
      readonly id = `first-${constructed.length}`;
      constructor(info: PartInfo) { super(info); constructed.push(this.id); }
      render(value: unknown) { return `${this.id}:${value}`; }
      disconnected() { disconnected.push(this.id); }
    }
    class Second extends Directive {
      readonly id = `second-${constructed.length}`;
      constructor(info: PartInfo) { super(info); constructed.push(this.id); }
      render(value: unknown) { return `${this.id}:${value}`; }
      disconnected() { disconnected.push(this.id); }
    }
    const first = directive<First, readonly [unknown]>(First);
    const second = directive<Second, readonly [unknown]>(Second);

    @element('test-directive-instance-retention')
    class TestDirectiveInstanceRetention extends HTMLElement {
      @property({ attribute: false }) value = 1;
      @property({ attribute: false }) alternate = false;
      @render() template() { return html`<p>${this.alternate ? second(this.value) : first(this.value)}</p>`; }
    }

    const host = document.createElement('test-directive-instance-retention') as TestDirectiveInstanceRetention;
    container.append(host);
    await host.ready;
    const initial = host.shadowRoot!.textContent;
    host.value = 2;
    await host.rendered;
    expect(host.shadowRoot!.textContent).toBe(initial!.replace(':1', ':2'));
    expect(constructed).toHaveLength(1);

    host.alternate = true;
    await host.rendered;
    expect(constructed).toHaveLength(2);
    expect(disconnected).toContain('first-0');
  });

  it('reports host, branch, and disposal disconnect reasons without duplicate callbacks', async () => {
    const reasons: Array<DirectiveDisconnectContext['reason']> = [];
    class InspectDisconnect extends Directive {
      render() { return 'active'; }
      disconnected(context?: DirectiveDisconnectContext) {
        if (context) reasons.push(context.reason);
      }
    }
    const inspectDisconnect = directive<InspectDisconnect, readonly []>(InspectDisconnect);

    @element('test-directive-disconnect-reasons')
    class TestDirectiveDisconnectReasons extends HTMLElement {
      @property({ attribute: false }) visible = true;
      @property({ attribute: false }) enabled = true;
      @render() template() {
        return html`<if ${this.visible}><span>${this.enabled ? inspectDisconnect() : 'plain'}</span></if>`;
      }
    }

    const host = document.createElement('test-directive-disconnect-reasons') as TestDirectiveDisconnectReasons;
    container.append(host);
    await host.ready;
    host.remove();
    container.append(host);
    host.visible = false;
    await host.rendered;
    host.visible = true;
    await host.rendered;
    host.enabled = false;
    await host.rendered;
    expect(reasons).toEqual(['host', 'branch', 'dispose']);
  });

  it('commits a replacement even when the departing directive cleanup throws', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    class Departing extends Directive {
      render() { return 'departing'; }
      disconnected() { throw new Error('departing cleanup failed'); }
    }
    class Arriving extends Directive {
      render() { return 'arriving'; }
    }
    const departing = directive<Departing, readonly []>(Departing);
    const arriving = directive<Arriving, readonly []>(Arriving);

    @element('test-directive-throwing-replacement')
    class TestDirectiveThrowingReplacement extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @render() template() { return html`<p>${this.alternate ? arriving() : departing()}</p>`; }
    }

    const host = document.createElement('test-directive-throwing-replacement') as TestDirectiveThrowingReplacement;
    container.append(host);
    await host.ready;
    host.alternate = true;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('p')?.textContent).toBe('arriving');
    expect(errors.mock.calls.some(call => String(call[1]).includes('departing cleanup failed'))).toBe(true);
    errors.mockRestore();
  });

  it('maintains independent state and async setValue channels in multi-interpolation attributes', async () => {
    let nextId = 0;
    class Stateful extends Directive {
      readonly id = nextId++;
      render(value: unknown) { return `${this.id}:${value}`; }
    }
    class Deferred extends Directive {
      update(part: DirectivePart, [promise]: readonly [Promise<string>]) {
        promise.then(value => part.setValue(value));
        return 'pending';
      }
      render() { return 'pending'; }
    }
    const stateful = directive<Stateful, readonly [unknown]>(Stateful);
    const deferred = directive<Deferred, readonly [Promise<string>]>(Deferred);
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    const first = new Promise<string>(resolve => { resolveFirst = resolve; });
    const second = new Promise<string>(resolve => { resolveSecond = resolve; });

    @element('test-multi-attribute-directives')
    class TestMultiAttributeDirectives extends HTMLElement {
      @property({ attribute: false }) left = 'L';
      @property({ attribute: false }) right = 'R';
      @render() template() {
        return html`<p title="${stateful(this.left)}|${stateful(this.right)}" data-async="${deferred(first)}|${deferred(second)}"></p>`;
      }
    }

    const host = document.createElement('test-multi-attribute-directives') as TestMultiAttributeDirectives;
    container.append(host);
    await host.ready;
    const paragraph = host.shadowRoot!.querySelector('p')!;
    expect(paragraph.title).toBe('0:L|1:R');
    host.left = 'LL';
    host.right = 'RR';
    await host.rendered;
    expect(paragraph.title).toBe('0:LL|1:RR');

    resolveSecond('second');
    await Promise.resolve();
    expect(paragraph.getAttribute('data-async')).toBe('pending|second');
    resolveFirst('first');
    await Promise.resolve();
    expect(paragraph.getAttribute('data-async')).toBe('first|second');
  });

  it('ignores async setValue publications after a directive slot changes owner', async () => {
    const nodePublishers: Array<(value: string) => void> = [];
    const attributePublishers: Array<(value: string) => void> = [];
    class DeferredNode extends Directive {
      render() { return 'node-pending'; }
      update(part: DirectivePart) {
        nodePublishers.push(value => part.setValue(value));
        return 'node-pending';
      }
    }
    class DeferredAttribute extends Directive {
      render() { return 'attribute-pending'; }
      update(part: DirectivePart) {
        attributePublishers.push(value => part.setValue(value));
        return 'attribute-pending';
      }
    }
    class Final extends Directive {
      render(value: string) { return value; }
    }
    const deferredNode = directive<DeferredNode, readonly []>(DeferredNode);
    const deferredAttribute = directive<DeferredAttribute, readonly []>(DeferredAttribute);
    const final = directive<Final, readonly [string]>(Final);

    @element('test-stale-directive-publication')
    class TestStaleDirectivePublication extends HTMLElement {
      @property({ attribute: false }) settled = false;
      @render() template() {
        return html`<p title="prefix ${this.settled ? final('attribute-final') : deferredAttribute()}">${
          this.settled ? final('node-final') : deferredNode()
        }</p>`;
      }
    }

    const host = document.createElement('test-stale-directive-publication') as TestStaleDirectivePublication;
    container.append(host);
    await host.ready;
    const paragraph = host.shadowRoot!.querySelector('p')!;
    host.settled = true;
    await host.rendered;
    expect(paragraph.textContent).toBe('node-final');
    expect(paragraph.title).toBe('prefix attribute-final');

    nodePublishers[0]('stale-node');
    attributePublishers[0]('stale-attribute');
    expect(paragraph.textContent).toBe('node-final');
    expect(paragraph.title).toBe('prefix attribute-final');
  });

  it('pairs disconnect/reconnect callbacks and permits async node commits after reconnect', async () => {
    const lifecycle: string[] = [];
    let publish!: (value: string) => void;
    class Subscription extends Directive {
      update(part: DirectivePart) {
        publish = value => part.setValue(value);
        return 'initial';
      }
      render() { return 'initial'; }
      disconnected() { lifecycle.push('disconnect'); }
      reconnected() { lifecycle.push('reconnect'); }
    }
    const subscription = directive<Subscription, readonly []>(Subscription);

    @element('test-directive-reconnect-publish')
    class TestDirectiveReconnectPublish extends HTMLElement {
      @render() template() { return html`<p>${subscription()}</p>`; }
    }

    const host = document.createElement('test-directive-reconnect-publish') as TestDirectiveReconnectPublish;
    container.append(host);
    await host.ready;
    expect(lifecycle).toEqual(['reconnect']);
    host.remove();
    expect(lifecycle).toEqual(['reconnect', 'disconnect']);
    container.append(host);
    expect(lifecycle).toEqual(['reconnect', 'disconnect', 'reconnect']);
    publish('after');
    expect(host.shadowRoot!.textContent).toContain('after');
  });

  it('disposes directives rendered directly as removed list items', async () => {
    const disconnected: number[] = [];
    class Item extends Directive {
      private id = -1;
      render(id: number) { this.id = id; return String(id); }
      disconnected() { disconnected.push(this.id); }
    }
    const item = directive<Item, readonly [number]>(Item);

    @element('test-directive-list-removal')
    class TestDirectiveListRemoval extends HTMLElement {
      @property({ attribute: false }) ids = [1, 2, 3];
      @render() template() {
        return html`${repeat(this.ids, { key: id => id, render: id => item(id) })}`;
      }
    }

    const host = document.createElement('test-directive-list-removal') as TestDirectiveListRemoval;
    container.append(host);
    await host.ready;
    host.ids = [3, 1];
    await host.rendered;
    expect(disconnected).toEqual([2]);
    expect(host.shadowRoot!.textContent).toContain('31');
  });

  it('cleans up successful template switches and preserves the last good tree on failure', async () => {
    const cleanup = vi.fn();
    const action = vi.fn(() => cleanup);
    const rejectConnection = vi.fn(() => { throw new Error('connection failed'); });
    class Invalid extends Directive {
      render() { return 'invalid element result'; }
    }
    const invalid = directive<Invalid, readonly []>(Invalid);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-transactional-template-switch')
    class TestTransactionalTemplateSwitch extends HTMLElement {
      @property({ attribute: false }) mode = 0;
      @render() template() {
        if (this.mode === 0) return html`<p ${use(action)}>first</p>`;
        if (this.mode === 1) return html`<section ${use(action)}>second</section>`;
        if (this.mode === 2) return html`<article ${invalid()}>broken</article>`;
        return html`<aside ${use(rejectConnection)}>rejected</aside>`;
      }
    }

    const host = document.createElement('test-transactional-template-switch') as TestTransactionalTemplateSwitch;
    container.append(host);
    await host.ready;
    host.mode = 1;
    await host.rendered;
    expect(cleanup).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledTimes(2);
    const section = host.shadowRoot!.querySelector('section');
    host.mode = 2;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('section')).toBe(section);
    expect(host.shadowRoot!.querySelector('article')).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
    host.mode = 3;
    await host.rendered;
    expect(rejectConnection).toHaveBeenCalledOnce();
    expect(host.shadowRoot!.querySelector('section')).toBe(section);
    expect(host.shadowRoot!.querySelector('aside')).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(errors.mock.calls.some(call => String(call[1]).includes('element directive must return'))).toBe(true);
    expect(errors.mock.calls.some(call => String(call[1]).includes('connection failed'))).toBe(true);
    errors.mockRestore();
  });

  it('prepares nested template switches transactionally', async () => {
    const cleanup = vi.fn();
    const action = vi.fn(() => cleanup);
    const rejectConnection = vi.fn(() => { throw new Error('nested connection failed'); });
    class Invalid extends Directive {
      render() { return 'invalid element result'; }
    }
    const invalid = directive<Invalid, readonly []>(Invalid);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-transactional-nested-template-switch')
    class TestTransactionalNestedTemplateSwitch extends HTMLElement {
      @property({ attribute: false }) mode = 0;
      @render() template() {
        const content = this.mode === 0
          ? html`<p ${use(action)}>first</p>`
          : this.mode === 1
            ? html`<section ${use(action)}>second</section>`
            : this.mode === 2
              ? html`<article ${invalid()}>broken</article>`
              : html`<aside ${use(rejectConnection)}>rejected</aside>`;
        return html`<main>${content}</main>`;
      }
    }

    const host = document.createElement('test-transactional-nested-template-switch') as TestTransactionalNestedTemplateSwitch;
    container.append(host);
    await host.ready;
    host.mode = 1;
    await host.rendered;
    expect(cleanup).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledTimes(2);
    const section = host.shadowRoot!.querySelector('section');

    host.mode = 2;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('section')).toBe(section);
    expect(host.shadowRoot!.querySelector('article')).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
    host.mode = 3;
    await host.rendered;
    expect(rejectConnection).toHaveBeenCalledOnce();
    expect(host.shadowRoot!.querySelector('section')).toBe(section);
    expect(host.shadowRoot!.querySelector('aside')).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(errors.mock.calls.some(call => String(call[1]).includes('element directive must return'))).toBe(true);
    expect(errors.mock.calls.some(call => String(call[1]).includes('nested connection failed'))).toBe(true);
    errors.mockRestore();
  });

  it('retargets callback refs and clears the old target exactly once', async () => {
    const first = vi.fn();
    const second = vi.fn();
    @element('test-callback-ref-switch')
    class TestCallbackRefSwitch extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @render() template() { return html`<button ${ref(this.alternate ? second : first)}>go</button>`; }
    }
    const host = document.createElement('test-callback-ref-switch') as TestCallbackRefSwitch;
    container.append(host);
    await host.ready;
    const button = host.shadowRoot!.querySelector('button')!;
    expect(first).toHaveBeenLastCalledWith(button);
    host.alternate = true;
    await host.rendered;
    expect(first).toHaveBeenLastCalledWith(null);
    expect(second).toHaveBeenLastCalledWith(button);
    host.remove();
    expect(second).toHaveBeenLastCalledWith(null);
  });

  it('reconnects a once-only tree rendered manually before connection', async () => {
    const cleanup = vi.fn();
    const action = vi.fn(() => cleanup);
    @element('test-once-manual-before-connect')
    class TestOnceManualBeforeConnect extends HTMLElement {
      @render({ once: true }) template() { return html`<div ${use(action)}>ready</div>`; }
    }

    const host = document.createElement('test-once-manual-before-connect') as TestOnceManualBeforeConnect;
    host.template();
    expect(action).not.toHaveBeenCalled();
    container.append(host);
    await host.ready;
    expect(action).toHaveBeenCalledOnce();
    host.remove();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('supports function cleanups, action replacement, and reconnect for use()', async () => {
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const first = vi.fn(() => firstCleanup);
    const second = vi.fn(() => secondCleanup);
    @element('test-use-function-cleanup')
    class TestUseFunctionCleanup extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @property({ attribute: false }) value = 1;
      @render() template() { return html`<div ${use(this.alternate ? second : first, this.value)}></div>`; }
    }
    const host = document.createElement('test-use-function-cleanup') as TestUseFunctionCleanup;
    container.append(host);
    await host.ready;
    host.value = 2;
    await host.rendered;
    expect(firstCleanup).toHaveBeenCalledOnce();
    expect(first).toHaveBeenCalledTimes(2);
    host.alternate = true;
    await host.rendered;
    expect(firstCleanup).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledOnce();
    host.remove();
    expect(secondCleanup).toHaveBeenCalledOnce();
    container.append(host);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('continues directive teardown when an earlier disconnected hook throws', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    class Throwing extends Directive {
      render() { return noChange; }
      disconnected() { first(); throw new Error('disconnect failed'); }
    }
    class Following extends Directive {
      render() { return noChange; }
      disconnected() { second(); }
    }
    const throwing = directive<Throwing, readonly []>(Throwing);
    const following = directive<Following, readonly []>(Following);

    @element('test-directive-teardown-error-isolation')
    class TestDirectiveTeardownErrorIsolation extends HTMLElement {
      @render() template() { return html`<div ${throwing()}></div><span ${following()}></span>`; }
    }

    const host = document.createElement('test-directive-teardown-error-isolation') as TestDirectiveTeardownErrorIsolation;
    container.append(host);
    await host.ready;
    host.remove();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(errors.mock.calls.some(call => String(call[1]).includes('disconnect failed'))).toBe(true);
    errors.mockRestore();
  });

  it('continues through nested node and list teardown failures', async () => {
    const outerDisconnected = vi.fn();
    const nestedDisconnected = vi.fn();
    const listDisconnected: number[] = [];
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    class Nested extends Directive {
      render() { return noChange; }
      disconnected() { nestedDisconnected(); }
    }
    const nested = directive<Nested, readonly []>(Nested);
    class Outer extends Directive {
      render() { return html`<span ${nested()}>nested</span>`; }
      disconnected() {
        outerDisconnected();
        throw new Error('outer disconnect failed');
      }
    }
    const outer = directive<Outer, readonly []>(Outer);
    class ListItem extends Directive {
      private id = 0;
      render(id: number) { this.id = id; return String(id); }
      disconnected() {
        listDisconnected.push(this.id);
        if (this.id === 1) throw new Error('list cleanup failed');
      }
    }
    const listItem = directive<ListItem, readonly [number]>(ListItem);

    @element('test-nested-teardown-isolation')
    class TestNestedTeardownIsolation extends HTMLElement {
      @render() template() {
        return html`${outer()}`;
      }
    }
    @element('test-list-teardown-isolation')
    class TestListTeardownIsolation extends HTMLElement {
      @property({ attribute: false }) visible = true;
      @render() template() {
        return html`<div>${this.visible
          ? repeat([1, 2], { key: id => id, render: id => listItem(id) })
          : null}</div>`;
      }
    }

    const host = document.createElement('test-nested-teardown-isolation') as TestNestedTeardownIsolation;
    container.append(host);
    await host.ready;
    host.remove();
    expect(outerDisconnected).toHaveBeenCalledOnce();
    expect(nestedDisconnected).toHaveBeenCalledOnce();

    const listHost = document.createElement('test-list-teardown-isolation') as TestListTeardownIsolation;
    container.append(listHost);
    await listHost.ready;
    listHost.visible = false;
    await listHost.rendered;
    expect(listDisconnected).toEqual([1, 2]);
    expect(listHost.shadowRoot!.querySelector('div')?.textContent).toBe('');
    expect(errors.mock.calls.some(call => String(call[1]).includes('outer disconnect failed'))).toBe(true);
    expect(errors.mock.calls.some(call => String(call[1]).includes('list cleanup failed'))).toBe(true);
    errors.mockRestore();
  });

  it('resets use() state before a throwing cleanup and can reconnect cleanly', async () => {
    const cleanup = vi.fn(() => { throw new Error('action cleanup failed'); });
    const action = vi.fn(() => cleanup);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-use-throwing-cleanup')
    class TestUseThrowingCleanup extends HTMLElement {
      @property({ attribute: false }) value = 1;
      @render() template() { return html`<div ${use(action, this.value)}>content</div>`; }
    }

    const host = document.createElement('test-use-throwing-cleanup') as TestUseThrowingCleanup;
    container.append(host);
    await host.ready;
    expect(action).toHaveBeenCalledOnce();

    host.value = 2;
    await host.rendered;
    expect(cleanup).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledTimes(2);
    expect(errors.mock.calls.some(call => String(call[1]).includes('action cleanup failed'))).toBe(true);

    host.remove();
    expect(cleanup).toHaveBeenCalledTimes(2);

    container.append(host);
    expect(action).toHaveBeenCalledTimes(3);
    host.remove();
    expect(cleanup).toHaveBeenCalledTimes(3);
    errors.mockRestore();
  });

  it('reports directive placement, argument, and element-result mistakes without partial DOM', async () => {
    class InvalidElementResult extends Directive {
      render() { return 'not allowed'; }
    }
    const invalid = directive<InvalidElementResult, readonly []>(InvalidElementResult);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-directive-placement-errors')
    class TestDirectivePlacementErrors extends HTMLElement {
      @render() template() { return html`<div ${invalid()}>bad</div>`; }
    }
    const host = document.createElement('test-directive-placement-errors') as TestDirectivePlacementErrors;
    container.append(host);
    await host.ready;
    expect(host.shadowRoot!.childElementCount).toBe(0);
    expect(errors).toHaveBeenCalledWith('Error rendering element:', expect.objectContaining({ message: expect.stringContaining('element directive must return') }));

    const objectRef = createRef();
    @element('test-ref-placement-error')
    class TestRefPlacementError extends HTMLElement {
      @render() template() { return html`<p title=${ref(objectRef)}>bad</p>`; }
    }
    const badRef = document.createElement('test-ref-placement-error') as TestRefPlacementError;
    container.append(badRef);
    await badRef.ready;
    expect(errors.mock.calls.some(call => String(call[1]).includes('ref() must be used'))).toBe(true);

    @element('test-events-directive-validation')
    class TestEventsDirectiveValidation extends HTMLElement {
      @render() template() { return html`<button ${events({ click: 4 })}>bad</button>`; }
    }
    const badEvents = document.createElement('test-events-directive-validation') as TestEventsDirectiveValidation;
    container.append(badEvents);
    await badEvents.ready;
    expect(badEvents.shadowRoot!.childElementCount).toBe(0);
    expect(errors.mock.calls.some(call => String(call[1]).includes('events spread event "click" expects'))).toBe(true);
    errors.mockRestore();
  });
});
