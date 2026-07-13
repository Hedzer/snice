import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bind, element, events, html, property, render } from './test-imports';

describe('declarative syntax exhaustive behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('composes capture, self, prevent, stop, and immediate event modifiers in DOM order', async () => {
    const order: string[] = [];
    @element('test-event-modifier-matrix')
    class TestEventModifierMatrix extends HTMLElement {
      capture() { order.push('capture'); }
      self(event: Event) { order.push(`self:${event.defaultPrevented}`); }
      child() { order.push('child'); }
      immediate() { order.push('immediate'); }
      @render() template() {
        return html`
          <div class="outer" @click|capture=${this.capture}>
            <div class="self" @click|self|prevent|stop=${this.self}><button class="child" @click=${this.child}>child</button></div>
            <button class="immediate" @click|immediate=${this.immediate}>immediate</button>
          </div>
        `;
      }
    }
    const host = document.createElement('test-event-modifier-matrix') as TestEventModifierMatrix;
    container.append(host);
    await host.ready;
    const root = host.shadowRoot!;
    const self = root.querySelector('.self') as HTMLElement;
    const child = root.querySelector('.child') as HTMLElement;
    const immediate = root.querySelector('.immediate') as HTMLElement;
    const later = vi.fn();
    immediate.addEventListener('click', later);

    child.click();
    expect(order).toEqual(['capture', 'child']);
    order.length = 0;
    self.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(order).toEqual(['capture', 'self:true']);
    order.length = 0;
    immediate.click();
    expect(order).toEqual(['capture', 'immediate']);
    expect(later).not.toHaveBeenCalled();
  });

  it('supports aliases, listener objects, null cleanup, and once semantics', async () => {
    const handleEvent = vi.fn();
    const listener = { handleEvent, capture: true, once: true };
    const alias = vi.fn();
    @element('test-event-handler-forms')
    class TestEventHandlerForms extends HTMLElement {
      @property({ attribute: false }) enabled = true;
      @render() template() {
        return html`<button
          @focus=${listener}
          @click|preventDefault=${this.enabled ? alias : null}
        >go</button>`;
      }
    }
    const host = document.createElement('test-event-handler-forms') as TestEventHandlerForms;
    container.append(host);
    await host.ready;
    const button = host.shadowRoot!.querySelector('button')!;
    button.dispatchEvent(new FocusEvent('focus'));
    button.dispatchEvent(new FocusEvent('focus'));
    expect(handleEvent).toHaveBeenCalledOnce();
    expect(handleEvent.mock.instances[0]).toBe(listener);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(alias).toHaveBeenCalledOnce();
    host.enabled = false;
    await host.rendered;
    button.click();
    expect(alias).toHaveBeenCalledOnce();
  });

  it('detaches direct and spread listeners while parked and preserves consumed once state', async () => {
    const direct = vi.fn();
    const spread = vi.fn();
    const helper = vi.fn();
    const once = vi.fn();
    const spreadOnce = { handleEvent: vi.fn(), once: true };
    const helperOnce = { handleEvent: vi.fn(), once: true };
    const model = { value: 'initial' };
    @element('test-template-event-connection-lifecycle')
    class TestTemplateEventConnectionLifecycle extends HTMLElement {
      @property({ attribute: false }) visible = true;
      @render() template() {
        return html`<if ${this.visible}>
          <button class="direct" @click=${direct}>direct</button>
          <button class="spread" ...events=${{ click: spread }}>spread</button>
          <button class="helper" ${events({ click: helper })}>helper</button>
          <button class="once" @click|once=${once}>once</button>
          <button class="spread-once" ...events=${{ click: spreadOnce }}>spread once</button>
          <button class="helper-once" ${events({ click: helperOnce })}>helper once</button>
          <input class="bound" .value=${bind(model, 'value')}>
        </if>`;
      }
    }

    const host = document.createElement('test-template-event-connection-lifecycle') as TestTemplateEventConnectionLifecycle;
    container.append(host);
    await host.ready;
    const directButton = host.shadowRoot!.querySelector('.direct') as HTMLButtonElement;
    const spreadButton = host.shadowRoot!.querySelector('.spread') as HTMLButtonElement;
    const helperButton = host.shadowRoot!.querySelector('.helper') as HTMLButtonElement;
    const onceButton = host.shadowRoot!.querySelector('.once') as HTMLButtonElement;
    const spreadOnceButton = host.shadowRoot!.querySelector('.spread-once') as HTMLButtonElement;
    const helperOnceButton = host.shadowRoot!.querySelector('.helper-once') as HTMLButtonElement;
    const boundInput = host.shadowRoot!.querySelector('.bound') as HTMLInputElement;
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
    expect(helperOnce.handleEvent).toHaveBeenCalledOnce();

    host.visible = false;
    await host.rendered;
    directButton.click();
    spreadButton.click();
    helperButton.click();
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();
    boundInput.value = 'parked';
    boundInput.dispatchEvent(new Event('input'));
    expect(direct).not.toHaveBeenCalled();
    expect(spread).not.toHaveBeenCalled();
    expect(helper).not.toHaveBeenCalled();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
    expect(helperOnce.handleEvent).toHaveBeenCalledOnce();
    expect(model.value).toBe('initial');

    host.visible = true;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('.direct')).toBe(directButton);
    directButton.click();
    spreadButton.click();
    helperButton.click();
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();
    boundInput.value = 'visible';
    boundInput.dispatchEvent(new Event('input'));
    expect(direct).toHaveBeenCalledOnce();
    expect(spread).toHaveBeenCalledOnce();
    expect(helper).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
    expect(helperOnce.handleEvent).toHaveBeenCalledOnce();
    expect(model.value).toBe('visible');
  });

  it('retains direct and spread listeners across host removal without reviving consumed once listeners', async () => {
    const direct = vi.fn();
    const spread = vi.fn();
    const helper = vi.fn();
    const once = vi.fn();
    const spreadOnce = { handleEvent: vi.fn(), once: true };
    const helperOnce = { handleEvent: vi.fn(), once: true };
    const model = { value: 'initial' };
    @element('test-template-event-host-lifecycle')
    class TestTemplateEventHostLifecycle extends HTMLElement {
      @render() template() {
        return html`
          <button class="direct" @click=${direct}>direct</button>
          <button class="spread" ...events=${{ click: spread }}>spread</button>
          <button class="helper" ${events({ click: helper })}>helper</button>
          <button class="once" @click|once=${once}>once</button>
          <button class="spread-once" ...events=${{ click: spreadOnce }}>spread once</button>
          <button class="helper-once" ${events({ click: helperOnce })}>helper once</button>
          <input class="bound" .value=${bind(model, 'value')}>
        `;
      }
    }

    const host = document.createElement('test-template-event-host-lifecycle') as TestTemplateEventHostLifecycle;
    container.append(host);
    await host.ready;
    const directButton = host.shadowRoot!.querySelector('.direct') as HTMLButtonElement;
    const spreadButton = host.shadowRoot!.querySelector('.spread') as HTMLButtonElement;
    const helperButton = host.shadowRoot!.querySelector('.helper') as HTMLButtonElement;
    const onceButton = host.shadowRoot!.querySelector('.once') as HTMLButtonElement;
    const spreadOnceButton = host.shadowRoot!.querySelector('.spread-once') as HTMLButtonElement;
    const helperOnceButton = host.shadowRoot!.querySelector('.helper-once') as HTMLButtonElement;
    const boundInput = host.shadowRoot!.querySelector('.bound') as HTMLInputElement;
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();

    host.remove();
    directButton.click();
    spreadButton.click();
    helperButton.click();
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();
    boundInput.value = 'detached';
    boundInput.dispatchEvent(new Event('input'));
    expect(direct).toHaveBeenCalledOnce();
    expect(spread).toHaveBeenCalledOnce();
    expect(helper).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
    expect(helperOnce.handleEvent).toHaveBeenCalledOnce();
    expect(model.value).toBe('detached');

    container.append(host);
    expect(host.shadowRoot!.querySelector('.direct')).toBe(directButton);
    directButton.click();
    spreadButton.click();
    helperButton.click();
    onceButton.click();
    spreadOnceButton.click();
    helperOnceButton.click();
    expect(direct).toHaveBeenCalledTimes(2);
    expect(spread).toHaveBeenCalledTimes(2);
    expect(helper).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
    expect(helperOnce.handleEvent).toHaveBeenCalledOnce();
  });

  it('keeps spread once consumption across rerenders but resets it for a replacement listener', async () => {
    const namedFirst = { handleEvent: vi.fn(), once: true };
    const namedSecond = { handleEvent: vi.fn(), once: true };
    const helperFirst = { handleEvent: vi.fn(), once: true };
    const helperSecond = { handleEvent: vi.fn(), once: true };
    @element('test-spread-once-replacement')
    class TestSpreadOnceReplacement extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @property({ attribute: false }) tick = 0;
      @render() template() {
        return html`
          <button class="named" ...events=${{
            click: this.alternate ? namedSecond : namedFirst
          }}>${this.tick}</button>
          <button class="helper" ${events({
            click: this.alternate ? helperSecond : helperFirst
          })}>${this.tick}</button>
        `;
      }
    }

    const host = document.createElement('test-spread-once-replacement') as TestSpreadOnceReplacement;
    container.append(host);
    await host.ready;
    const named = host.shadowRoot!.querySelector('.named') as HTMLButtonElement;
    const helper = host.shadowRoot!.querySelector('.helper') as HTMLButtonElement;
    named.click();
    helper.click();
    host.tick++;
    await host.rendered;
    named.click();
    helper.click();
    expect(namedFirst.handleEvent).toHaveBeenCalledOnce();
    expect(helperFirst.handleEvent).toHaveBeenCalledOnce();

    host.alternate = true;
    await host.rendered;
    named.click();
    helper.click();
    named.click();
    helper.click();
    expect(namedSecond.handleEvent).toHaveBeenCalledOnce();
    expect(helperSecond.handleEvent).toHaveBeenCalledOnce();
  });

  it('matches exact and any-modifier keyboard shortcuts', async () => {
    const exact = vi.fn();
    const any = vi.fn();
    @element('test-keyboard-shortcut-matrix')
    class TestKeyboardShortcutMatrix extends HTMLElement {
      @render() template() {
        return html`<input @keydown.ctrl+s=${exact} @keyup.~enter=${any}>`;
      }
    }
    const host = document.createElement('test-keyboard-shortcut-matrix') as TestKeyboardShortcutMatrix;
    container.append(host);
    await host.ready;
    const input = host.shadowRoot!.querySelector('input')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', altKey: true, shiftKey: true }));
    expect(exact).toHaveBeenCalledOnce();
    expect(any).toHaveBeenCalledOnce();
  });

  it('rejects unknown, empty, and contradictory event modifiers transactionally', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-invalid-event-modifier')
    class TestInvalidEventModifier extends HTMLElement {
      @render() template() { return html`<button @click|mystery=${() => {}}>bad</button>`; }
    }
    @element('test-passive-prevent-modifier')
    class TestPassivePreventModifier extends HTMLElement {
      @render() template() { return html`<button @click|passive|prevent=${() => {}}>bad</button>`; }
    }
    @element('test-passive-object-prevent-modifier')
    class TestPassiveObjectPreventModifier extends HTMLElement {
      @render() template() {
        return html`<button @click|prevent=${{ passive: true, handleEvent() {} }}>bad</button>`;
      }
    }
    @element('test-empty-event-name')
    class TestEmptyEventName extends HTMLElement {
      @render() template() { return html`<button @|once=${() => {}}>bad</button>`; }
    }
    @element('test-invalid-event-handler')
    class TestInvalidEventHandler extends HTMLElement {
      @render() template() { return html`<button @click=${'not a listener' as any}>bad</button>`; }
    }
    @element('test-duplicate-spread-event')
    class TestDuplicateSpreadEvent extends HTMLElement {
      @render() template() {
        return html`<button ...events=${{ click: () => {}, '@click': () => {} }}>bad</button>`;
      }
    }
    @element('test-invalid-spread-event')
    class TestInvalidSpreadEvent extends HTMLElement {
      @render() template() { return html`<button ...events=${{ click: 4 }}>bad</button>`; }
    }
    for (const tag of [
      'test-invalid-event-modifier',
      'test-passive-prevent-modifier',
      'test-passive-object-prevent-modifier',
      'test-empty-event-name',
      'test-invalid-event-handler',
      'test-duplicate-spread-event',
      'test-invalid-spread-event'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot?.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('unknown event modifier'))).toBe(true);
    expect(messages.some(message => message.includes('cannot combine passive and prevent'))).toBe(true);
    expect(messages.some(message => message.includes('requires an event name'))).toBe(true);
    expect(messages.some(message => message.includes('expects a function, EventListenerObject, or null'))).toBe(true);
    expect(messages.some(message => message.includes('duplicate event name'))).toBe(true);
    errors.mockRestore();
  });

  it('supports custom bind events and bidirectional value transforms', async () => {
    @element('test-custom-bind-options')
    class TestCustomBindOptions extends HTMLElement {
      @property({ attribute: false }) amount = 2;
      @render() template() {
        return html`<input .value=${bind(this, 'amount', {
          event: 'change',
          toView: value => String(value * 10),
          fromView: value => Number(value) / 10
        })}>`;
      }
    }
    const host = document.createElement('test-custom-bind-options') as TestCustomBindOptions;
    container.append(host);
    await host.ready;
    const input = host.shadowRoot!.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('20');
    input.value = '70';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(host.amount).toBe(2);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await host.rendered;
    expect(host.amount).toBe(7);
    host.amount = 3;
    await host.rendered;
    expect(input.value).toBe('30');
  });

  it('infers select/change binding and reconfigures target/key listeners without duplicates', async () => {
    const first = { choice: 'a' };
    const second = { choice: 'b' };
    @element('test-bind-reconfiguration')
    class TestBindReconfiguration extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @render() template() {
        return html`<select .value=${bind(this.alternate ? second : first, 'choice')}>
          <option value="a">A</option><option value="b">B</option>
        </select>`;
      }
    }
    const host = document.createElement('test-bind-reconfiguration') as TestBindReconfiguration;
    container.append(host);
    await host.ready;
    const select = host.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = 'b';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(first.choice).toBe('b');
    host.alternate = true;
    await host.rendered;
    select.value = 'a';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(first.choice).toBe('b');
    expect(second.choice).toBe('a');
  });

  it('removes false/null spread attributes, preserves zero, and validates spread inputs', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-attribute-spread-values')
    class TestAttributeSpreadValues extends HTMLElement {
      @property({ attribute: false }) invalid = false;
      @property({ attribute: false }) values: Record<string, unknown> = {
        hidden: false,
        title: null,
        'data-zero': 0,
        'data-empty': '',
        'data-true': true
      };
      @render() template() {
        return html`<div ...attrs=${this.invalid ? [] : this.values}></div>`;
      }
    }
    const host = document.createElement('test-attribute-spread-values') as TestAttributeSpreadValues;
    container.append(host);
    await host.ready;
    const div = host.shadowRoot!.querySelector('div')!;
    expect(div.hasAttribute('hidden')).toBe(false);
    expect(div.hasAttribute('title')).toBe(false);
    expect(div.getAttribute('data-zero')).toBe('0');
    expect(div.getAttribute('data-empty')).toBe('');
    expect(div.getAttribute('data-true')).toBe('');
    const inheritedOnly = Object.create({ 'data-zero': 'inherited' });
    inheritedOnly['data-empty'] = 'kept';
    host.values = inheritedOnly;
    await host.rendered;
    expect(div.hasAttribute('data-zero')).toBe(false);
    expect(div.getAttribute('data-empty')).toBe('kept');
    host.invalid = true;
    await host.rendered;
    expect(errors.mock.calls.some(call => String(call[1]).includes('...attrs expects an object'))).toBe(true);
    errors.mockRestore();
  });

  it('destroys native property spreads without writing undefined into departing elements', async () => {
    @element('test-native-property-spread-teardown')
    class TestNativePropertySpreadTeardown extends HTMLElement {
      @property({ attribute: false }) visible = true;

      @render() template() {
        return html`<if ${this.visible}><textarea ...props=${{ value: 'kept' }}></textarea></if>`;
      }
    }

    const host = document.createElement('test-native-property-spread-teardown') as TestNativePropertySpreadTeardown;
    container.append(host);
    await host.ready;
    expect((host.shadowRoot!.querySelector('textarea') as HTMLTextAreaElement).value).toBe('kept');

    host.visible = false;
    await expect(host.rendered).resolves.toBeUndefined();
    expect(host.shadowRoot!.querySelector('textarea')).toBeNull();
  });

  it('rejects bind outside a property part and empty class/style/property names', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-bind-placement-error')
    class TestBindPlacementError extends HTMLElement {
      value = '';
      @render() template() { return html`<input value=${bind(this, 'value')}>`; }
    }
    @element('test-empty-declarative-names')
    class TestEmptyDeclarativeNames extends HTMLElement {
      @render() template() { return html`<div class:=${true} style:=${'x'}></div>`; }
    }
    @element('test-invalid-bind-key')
    class TestInvalidBindKey extends HTMLElement {
      model = { value: '' };
      @render() template() { return html`<input .value=${bind(this.model, null as any)}>`; }
    }
    @element('test-invalid-comment-value')
    class TestInvalidCommentValue extends HTMLElement {
      @render() template() { return html`<!-- ${'bad--comment'} -->`; }
    }
    for (const tag of [
      'test-bind-placement-error',
      'test-empty-declarative-names',
      'test-invalid-bind-key',
      'test-invalid-comment-value'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot?.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('bind() must be used in a property binding'))).toBe(true);
    expect(messages.some(message => message.includes('string, number, or symbol property key'))).toBe(true);
    expect(messages.some(message => message.includes('binding requires a class name'))).toBe(true);
    expect(messages.some(message => message.includes('comment expressions cannot produce'))).toBe(true);
    errors.mockRestore();
  });
});
