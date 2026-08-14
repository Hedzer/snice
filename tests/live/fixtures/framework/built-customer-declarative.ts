import { SniceElement, element, html, repeat, state, svg } from '/dist/index.esm.js';

@element('test-built-customer-declarative')
class BuiltCustomerDeclarative extends SniceElement {
  @state({ deep: true }) model = {
    visible: true,
    value: 'initial',
    active: true,
    mode: 'alpha',
    items: [
      { id: 'a', label: 'Ada' },
      { id: 'b', label: 'Grace' }
    ],
    counts: new Map([['renders', 1]])
  };

  directCalls = 0;
  namedCalls = 0;
  namedOnceCalls = 0;

  private readonly readyValue = Promise.resolve('async-ready');
  private readonly direct = () => { this.directCalls++; };
  private readonly named = () => { this.namedCalls++; };
  private readonly updateValue = (event: Event) => {
    this.model.value = (event.currentTarget as HTMLInputElement).value;
  };
  private readonly namedOnce = {
    once: true,
    handleEvent: () => { this.namedOnceCalls++; }
  };
  render() {
    return html`
      <if ${this.model.visible}>
        <section
          class="panel"
          class:active=${this.model.active}
          style:--renders=${this.model.counts.get('renders')}
          ...attrs=${{ 'data-mode': this.model.mode }}
        >
          <input class="bound" .value=${this.model.value} @input=${this.updateValue}>
          <button class="direct" @click=${this.direct}>direct</button>
          <button class="named" ...events=${{ click: this.named }}>named</button>
          <button class="named-once" ...events=${{ click: this.namedOnce }}>named once</button>
          <ul>${repeat(this.model.items, {
            key: item => item.id,
            render: item => html`<li data-id=${item.id}>${item.label}</li>`
          })}</ul>
          <case ${this.model.mode}>
            <when value="alpha"><strong>alpha branch</strong></when>
            <default><strong>fallback branch</strong></default>
          </case>
          <em>${this.readyValue}</em>
          <mark>${this.model.mode}</mark>
        </section>
      </if>
    `;
  }
}

export async function exerciseBuiltCustomerScenario() {
  const host = document.createElement('test-built-customer-declarative') as BuiltCustomerDeclarative;
  document.body.append(host);
  await host.ready;
  await Promise.resolve();
  const root = host.shadowRoot!;
  const direct = root.querySelector('.direct') as HTMLButtonElement;
  const named = root.querySelector('.named') as HTMLButtonElement;
  const namedOnce = root.querySelector('.named-once') as HTMLButtonElement;
  const input = root.querySelector('.bound') as HTMLInputElement;
  const itemA = root.querySelector('[data-id="a"]')!;

  namedOnce.click();
  namedOnce.click();
  const initialOnceCalls = host.namedOnceCalls;
  input.value = 'from-view';
  input.dispatchEvent(new Event('input'));
  await host.rendered;
  host.model.counts.set('renders', 2);
  host.model.items.reverse();
  host.model.mode = 'beta';
  await host.rendered;
  await new Promise(resolve => setTimeout(resolve, 30));

  const rendering = {
    bound: host.model.value === 'from-view',
    style: (root.querySelector('.panel') as HTMLElement).style.getPropertyValue('--renders') === '2',
    keyedIdentity: root.querySelector('[data-id="a"]') === itemA,
    fallback: root.textContent?.includes('fallback branch') === true,
    asyncValue: root.textContent?.includes('async-ready') === true,
    currentView: root.querySelector('mark')?.textContent
  };

  host.model.visible = false;
  await host.rendered;
  direct.click();
  named.click();
  input.value = 'parked-write';
  input.dispatchEvent(new Event('input'));
  const parked = {
    calls: [host.directCalls, host.namedCalls],
    bound: host.model.value
  };

  host.model.visible = true;
  await host.rendered;
  const identityAfterParking = root.querySelector('.direct') === direct;
  direct.click();
  named.click();
  namedOnce.click();
  const afterParkingCalls = [host.directCalls, host.namedCalls];
  const afterParkingOnceCalls = host.namedOnceCalls;

  host.remove();
  direct.click();
  named.click();
  input.value = 'detached-write';
  input.dispatchEvent(new Event('input'));
  const detached = {
    calls: [host.directCalls, host.namedCalls],
    bound: host.model.value,
    once: host.namedOnceCalls
  };

  document.body.append(host);
  await Promise.resolve();
  const identityAfterHostReconnect = host.shadowRoot!.querySelector('.direct') === direct;
  host.remove();

  return {
    rendering,
    parked,
    initialOnceCalls,
    identityAfterParking,
    afterParkingCalls,
    afterParkingOnceCalls,
    detached,
    identityAfterHostReconnect
  };
}

type ContextItem = { id: number; label: string };

@element('test-built-repeat-contexts')
class BuiltRepeatContexts extends SniceElement {
  @state() items: ContextItem[] = [
    { id: 1, label: 'one' },
    { id: 2, label: 'two' }
  ];

  render() {
    return html`
      <table><tbody>${repeat(this.items, {
        key: item => item.id,
        render: item => html`<tr data-id=${item.id}><td>${item.label}</td></tr>`
      })}</tbody></table>
      <select>${repeat(this.items, {
        key: item => item.id,
        render: item => html`<option value=${item.id}>${item.label}</option>`
      })}</select>
      <svg viewBox="0 0 10 10">${repeat(this.items, {
        key: item => item.id,
        render: (item, index) => svg`<circle data-id=${item.id} cx=${index + 1} cy="2" r="1"></circle>`
      })}</svg>
    `;
  }
}

export async function exerciseBuiltRepeatContextsScenario() {
  const host = document.createElement('test-built-repeat-contexts') as BuiltRepeatContexts;
  document.body.append(host);
  await host.ready;
  const root = host.shadowRoot!;
  const row = root.querySelector('tr[data-id="1"]');
  const option = root.querySelector('option[value="1"]');
  const circle = root.querySelector('circle[data-id="1"]');

  host.items = [
    { id: 2, label: 'two updated' },
    { id: 1, label: 'one updated' },
    { id: 3, label: 'three' }
  ];
  await host.rendered;

  const result = {
    parents: [row?.parentElement?.tagName, option?.parentElement?.tagName],
    svgNamespace: circle?.namespaceURI,
    identities: [
      root.querySelector('tr[data-id="1"]') === row,
      root.querySelector('option[value="1"]') === option,
      root.querySelector('circle[data-id="1"]') === circle
    ],
    rows: [...root.querySelectorAll('tbody tr')].map(node => node.textContent),
    options: [...root.querySelectorAll('select option')].map(node => node.textContent),
    circlePositions: [...root.querySelectorAll('svg circle')].map(node => node.getAttribute('cx'))
  };
  host.remove();
  return result;
}

function browserDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}

function browserStream<T>() {
  const pending: Array<ReturnType<typeof browserDeferred<IteratorResult<T>>>> = [];
  let opened = 0;
  let returned = 0;
  const iterable: AsyncIterable<T> = {
    [Symbol.asyncIterator]() {
      opened++;
      return {
        next() {
          const next = browserDeferred<IteratorResult<T>>();
          pending.push(next);
          return next.promise;
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
    emit(value: T) { pending.shift()!.resolve({ done: false, value }); },
    finish() { pending.shift()!.resolve({ done: true, value: undefined }); }
  };
}

const initialAsyncValue = browserDeferred<string>();

@element('test-built-async-lifecycle')
class BuiltAsyncLifecycle extends SniceElement {
  @state() source: unknown = initialAsyncValue.promise;
  @state() revision = 0;

  render() {
    return html`<main>${this.source}</main><aside>${this.revision}</aside>`;
  }
}

export async function exerciseBuiltAsyncLifecycleScenario() {
  const host = document.createElement('test-built-async-lifecycle') as BuiltAsyncLifecycle;
  document.body.append(host);
  await host.ready;
  const root = host.shadowRoot!;
  const current = browserDeferred<string>();
  host.source = current.promise;
  await host.rendered;
  initialAsyncValue.resolve('stale');
  await Promise.resolve();
  const staleIgnored = !root.textContent?.includes('stale');
  current.resolve('current');
  await Promise.resolve();
  const currentRendered = root.querySelector('main')?.textContent === 'current';

  const completed = browserStream<unknown>();
  host.source = completed.iterable;
  await host.rendered;
  completed.emit(html`<strong>streamed</strong>`);
  await Promise.resolve();
  completed.finish();
  await Promise.resolve();
  host.revision++;
  await host.rendered;
  host.remove();
  document.body.append(host);
  await Promise.resolve();
  const streamedTemplate = root.querySelector('strong')?.textContent === 'streamed';
  const completedOpenCount = completed.opened;

  const pending = browserStream<string>();
  host.source = pending.iterable;
  await host.rendered;
  host.remove();
  const cancellation = pending.returned;
  document.body.append(host);
  await Promise.resolve();
  const restarted = pending.opened;
  host.remove();

  return {
    staleIgnored,
    currentRendered,
    streamedTemplate,
    completedOpenCount,
    cancellation,
    restarted
  };
}
