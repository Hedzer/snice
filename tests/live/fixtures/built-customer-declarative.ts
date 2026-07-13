import { SniceElement, element, html, repeat, state } from '../../../dist/index.esm.js';

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
