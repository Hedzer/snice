import {
  Directive,
  SniceElement,
  attrs,
  bind,
  createRef,
  directive,
  element,
  events,
  html,
  noChange,
  portal,
  ref,
  repeat,
  resource,
  state,
  transition,
  use
} from '../../../dist/index.esm.js';

const probeLifecycle: string[] = [];

class DisconnectProbe extends Directive {
  render() { return noChange; }
  disconnected(context?: { reason: string }) {
    probeLifecycle.push(`disconnect:${context?.reason ?? 'missing'}`);
  }
  reconnected() {
    probeLifecycle.push('reconnect');
  }
}

const disconnectProbe = directive(DisconnectProbe);

@element('test-built-customer-declarative')
class BuiltCustomerDeclarative extends SniceElement {
  @state({ deep: true }) model = {
    visible: true,
    value: 'initial',
    active: true,
    mode: 'alpha',
    tag: 'article',
    items: [
      { id: 'a', label: 'Ada' },
      { id: 'b', label: 'Grace' }
    ],
    counts: new Map([['renders', 1]])
  };

  buttonRef = createRef<HTMLButtonElement>();
  directCalls = 0;
  namedCalls = 0;
  helperCalls = 0;
  namedOnceCalls = 0;
  helperOnceCalls = 0;
  actionConnects = 0;
  actionUpdates = 0;
  actionCleanups = 0;

  private readonly readyValue = Promise.resolve('resource-ready');
  private readonly direct = () => { this.directCalls++; };
  private readonly named = () => { this.namedCalls++; };
  private readonly helper = () => { this.helperCalls++; };
  private readonly namedOnce = {
    once: true,
    handleEvent: () => { this.namedOnceCalls++; }
  };
  private readonly helperOnce = {
    once: true,
    handleEvent: () => { this.helperOnceCalls++; }
  };
  private readonly action = (element: Element, value: unknown) => {
    this.actionConnects++;
    element.setAttribute('data-action-value', String(value));
    return {
      update: (next: unknown) => {
        this.actionUpdates++;
        element.setAttribute('data-action-value', String(next));
      },
      destroy: () => { this.actionCleanups++; }
    };
  };

  render() {
    return html`
      <if ${this.model.visible}>
        <section
          class="panel"
          class:active=${this.model.active}
          style:--renders=${this.model.counts.get('renders')}
          ${attrs({ 'data-mode': this.model.mode })}
        >
          <input class="bound" .value=${bind(this.model, 'value')}>
          <button class="direct" ${disconnectProbe()} ${ref(this.buttonRef)} ${use(this.action, this.model.mode)} @click=${this.direct}>direct</button>
          <button class="named" ...events=${{ click: this.named }}>named</button>
          <button class="helper" ${events({ click: this.helper })}>helper</button>
          <button class="named-once" ...events=${{ click: this.namedOnce }}>named once</button>
          <button class="helper-once" ${events({ click: this.helperOnce })}>helper once</button>
          <ul>${repeat(this.model.items, {
            key: item => item.id,
            render: item => html`<li data-id=${item.id}>${item.label}</li>`
          })}</ul>
          <component ${this.model.tag} class="dynamic"><span>dynamic child</span></component>
          <case ${this.model.mode}>
            <when value="alpha"><strong>alpha branch</strong></when>
            <default><strong>fallback branch</strong></default>
          </case>
          ${resource(this.readyValue, { pending: 'loading', ready: value => html`<em>${value}</em>` })}
          ${transition(html`<mark>${this.model.mode}</mark>`, {
            key: this.model.mode,
            outDuration: 0,
            inDuration: 0
          })}
        </section>
      </if>
      ${portal('#built-customer-portal', html`<aside>${this.model.value}</aside>`)}
    `;
  }
}

export async function exerciseBuiltCustomerScenario() {
  const portalTarget = document.createElement('div');
  portalTarget.id = 'built-customer-portal';
  document.body.append(portalTarget);
  const host = document.createElement('test-built-customer-declarative') as BuiltCustomerDeclarative;
  document.body.append(host);
  await host.ready;
  await Promise.resolve();
  probeLifecycle.length = 0;

  const root = host.shadowRoot!;
  const direct = root.querySelector('.direct') as HTMLButtonElement;
  const named = root.querySelector('.named') as HTMLButtonElement;
  const helper = root.querySelector('.helper') as HTMLButtonElement;
  const namedOnce = root.querySelector('.named-once') as HTMLButtonElement;
  const helperOnce = root.querySelector('.helper-once') as HTMLButtonElement;
  const input = root.querySelector('.bound') as HTMLInputElement;
  const dynamicChild = root.querySelector('.dynamic span')!;
  const itemA = root.querySelector('[data-id="a"]')!;

  namedOnce.click();
  helperOnce.click();
  namedOnce.click();
  helperOnce.click();
  const initialOnceCalls = [host.namedOnceCalls, host.helperOnceCalls];
  input.value = 'from-view';
  input.dispatchEvent(new Event('input'));
  await host.rendered;
  host.model.counts.set('renders', 2);
  host.model.items.reverse();
  host.model.tag = 'section';
  host.model.mode = 'beta';
  await host.rendered;
  await new Promise(resolve => setTimeout(resolve, 30));

  const deepAndDynamic = {
    bound: host.model.value === 'from-view',
    style: (root.querySelector('.panel') as HTMLElement).style.getPropertyValue('--renders') === '2',
    keyedIdentity: root.querySelector('[data-id="a"]') === itemA,
    dynamicIdentity: root.querySelector('.dynamic span') === dynamicChild,
    dynamicTag: root.querySelector('.dynamic')?.localName,
    fallback: root.textContent?.includes('fallback branch') === true,
    resource: root.textContent?.includes('resource-ready') === true,
    transition: root.querySelector('mark')?.textContent,
    portal: portalTarget.textContent,
    ref: host.buttonRef.value === direct,
    actionValue: direct.dataset.actionValue
  };

  host.model.visible = false;
  await host.rendered;
  direct.click();
  named.click();
  helper.click();
  input.value = 'parked-write';
  input.dispatchEvent(new Event('input'));
  const parked = {
    calls: [host.directCalls, host.namedCalls, host.helperCalls],
    bound: host.model.value,
    refCleared: host.buttonRef.value === null,
    cleanups: host.actionCleanups
  };

  host.model.visible = true;
  await host.rendered;
  const identityAfterParking = root.querySelector('.direct') === direct;
  direct.click();
  named.click();
  helper.click();
  namedOnce.click();
  helperOnce.click();
  const afterParkingCalls = [host.directCalls, host.namedCalls, host.helperCalls];
  const afterParkingOnceCalls = [host.namedOnceCalls, host.helperOnceCalls];

  host.remove();
  direct.click();
  named.click();
  helper.click();
  input.value = 'detached-write';
  input.dispatchEvent(new Event('input'));
  const detached = {
    calls: [host.directCalls, host.namedCalls, host.helperCalls],
    bound: host.model.value,
    once: [host.namedOnceCalls, host.helperOnceCalls],
    refCleared: host.buttonRef.value === null
  };

  document.body.append(host);
  await Promise.resolve();
  const identityAfterHostReconnect = host.shadowRoot!.querySelector('.direct') === direct;
  const refAfterReconnect = host.buttonRef.value === direct;
  const actionReconnects = host.actionConnects;
  const lifecycleBeforeFinalRemoval = [...probeLifecycle];
  host.remove();
  const lifecycle = [...probeLifecycle];
  portalTarget.remove();

  return {
    deepAndDynamic,
    parked,
    initialOnceCalls,
    identityAfterParking,
    afterParkingCalls,
    afterParkingOnceCalls,
    detached,
    identityAfterHostReconnect,
    refAfterReconnect,
    actionReconnects,
    lifecycleBeforeFinalRemoval,
    lifecycle
  };
}
