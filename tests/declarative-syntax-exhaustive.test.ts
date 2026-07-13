import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, property, render } from './test-imports';

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
    const once = vi.fn();
    const spreadOnce = { handleEvent: vi.fn(), once: true };
    @element('test-template-event-connection-lifecycle')
    class TestTemplateEventConnectionLifecycle extends HTMLElement {
      @property({ attribute: false }) visible = true;
      @render() template() {
        return html`<if ${this.visible}>
          <button class="direct" @click=${direct}>direct</button>
          <button class="spread" ...events=${{ click: spread }}>spread</button>
          <button class="once" @click|once=${once}>once</button>
          <button class="spread-once" ...events=${{ click: spreadOnce }}>spread once</button>
        </if>`;
      }
    }

    const host = document.createElement('test-template-event-connection-lifecycle') as TestTemplateEventConnectionLifecycle;
    container.append(host);
    await host.ready;
    const directButton = host.shadowRoot!.querySelector('.direct') as HTMLButtonElement;
    const spreadButton = host.shadowRoot!.querySelector('.spread') as HTMLButtonElement;
    const onceButton = host.shadowRoot!.querySelector('.once') as HTMLButtonElement;
    const spreadOnceButton = host.shadowRoot!.querySelector('.spread-once') as HTMLButtonElement;
    onceButton.click();
    spreadOnceButton.click();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();

    host.visible = false;
    await host.rendered;
    directButton.click();
    spreadButton.click();
    onceButton.click();
    spreadOnceButton.click();
    expect(direct).not.toHaveBeenCalled();
    expect(spread).not.toHaveBeenCalled();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();

    host.visible = true;
    await host.rendered;
    expect(host.shadowRoot!.querySelector('.direct')).toBe(directButton);
    directButton.click();
    spreadButton.click();
    onceButton.click();
    spreadOnceButton.click();
    expect(direct).toHaveBeenCalledOnce();
    expect(spread).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
  });

  it('retains direct and spread listeners across host removal without reviving consumed once listeners', async () => {
    const direct = vi.fn();
    const spread = vi.fn();
    const once = vi.fn();
    const spreadOnce = { handleEvent: vi.fn(), once: true };
    @element('test-template-event-host-lifecycle')
    class TestTemplateEventHostLifecycle extends HTMLElement {
      @render() template() {
        return html`
          <button class="direct" @click=${direct}>direct</button>
          <button class="spread" ...events=${{ click: spread }}>spread</button>
          <button class="once" @click|once=${once}>once</button>
          <button class="spread-once" ...events=${{ click: spreadOnce }}>spread once</button>
        `;
      }
    }

    const host = document.createElement('test-template-event-host-lifecycle') as TestTemplateEventHostLifecycle;
    container.append(host);
    await host.ready;
    const directButton = host.shadowRoot!.querySelector('.direct') as HTMLButtonElement;
    const spreadButton = host.shadowRoot!.querySelector('.spread') as HTMLButtonElement;
    const onceButton = host.shadowRoot!.querySelector('.once') as HTMLButtonElement;
    const spreadOnceButton = host.shadowRoot!.querySelector('.spread-once') as HTMLButtonElement;
    onceButton.click();
    spreadOnceButton.click();

    host.remove();
    directButton.click();
    spreadButton.click();
    onceButton.click();
    spreadOnceButton.click();
    expect(direct).toHaveBeenCalledOnce();
    expect(spread).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();

    container.append(host);
    expect(host.shadowRoot!.querySelector('.direct')).toBe(directButton);
    directButton.click();
    spreadButton.click();
    onceButton.click();
    spreadOnceButton.click();
    expect(direct).toHaveBeenCalledTimes(2);
    expect(spread).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledOnce();
    expect(spreadOnce.handleEvent).toHaveBeenCalledOnce();
  });

  it('keeps spread once consumption across rerenders but resets it for a replacement listener', async () => {
    const namedFirst = { handleEvent: vi.fn(), once: true };
    const namedSecond = { handleEvent: vi.fn(), once: true };
    @element('test-spread-once-replacement')
    class TestSpreadOnceReplacement extends HTMLElement {
      @property({ attribute: false }) alternate = false;
      @property({ attribute: false }) tick = 0;
      @render() template() {
        return html`
          <button class="named" ...events=${{
            click: this.alternate ? namedSecond : namedFirst
          }}>${this.tick}</button>
        `;
      }
    }

    const host = document.createElement('test-spread-once-replacement') as TestSpreadOnceReplacement;
    container.append(host);
    await host.ready;
    const named = host.shadowRoot!.querySelector('.named') as HTMLButtonElement;
    named.click();
    host.tick++;
    await host.rendered;
    named.click();
    expect(namedFirst.handleEvent).toHaveBeenCalledOnce();

    host.alternate = true;
    await host.rendered;
    named.click();
    named.click();
    expect(namedSecond.handleEvent).toHaveBeenCalledOnce();
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

  it('rejects empty class/style names and invalid comment values', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-empty-declarative-names')
    class TestEmptyDeclarativeNames extends HTMLElement {
      @render() template() { return html`<div class:=${true} style:=${'x'}></div>`; }
    }
    @element('test-invalid-comment-value')
    class TestInvalidCommentValue extends HTMLElement {
      @render() template() { return html`<!-- ${'bad--comment'} -->`; }
    }
    for (const tag of [
      'test-empty-declarative-names',
      'test-invalid-comment-value'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot?.childElementCount).toBe(0);
    }
    const messages = errors.mock.calls.map(call => String(call[1]));
    expect(messages.some(message => message.includes('binding requires a class name'))).toBe(true);
    expect(messages.some(message => message.includes('comment expressions cannot produce'))).toBe(true);
    errors.mockRestore();
  });

  it('rejects bare opening-tag expressions with an actionable error', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-bare-opening-tag-expression')
    class TestBareOpeningTagExpression extends HTMLElement {
      @render() template() { return html`<div ${'unsupported'}>bad</div>`; }
    }
    @element('test-removed-dynamic-component-expression')
    class TestRemovedDynamicComponentExpression extends HTMLElement {
      @property({ attribute: false }) tag = 'button';
      @render() template() { return html`<component ${this.tag}>bad</component>`; }
    }

    for (const tag of [
      'test-bare-opening-tag-expression',
      'test-removed-dynamic-component-expression'
    ]) {
      const host = document.createElement(tag) as HTMLElement & { ready: Promise<void> };
      container.append(host);
      await host.ready;
      expect(host.shadowRoot?.childElementCount).toBe(0);
    }
    const openingTagErrors = errors.mock.calls.filter(call => String(call[1]).includes(
      'expressions directly in opening tags are not supported'
    ));
    expect(openingTagErrors).toHaveLength(2);
    errors.mockRestore();
  });
});
