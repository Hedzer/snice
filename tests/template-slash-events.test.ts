import { describe, it, expect, vi } from 'vitest';
import { element, render, html } from '../src/index';

describe('Template syntax: event names with slashes', () => {
  it('should handle event names containing / character', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    @element('test-slash-emitter')
    class TestSlashEmitter extends HTMLElement {
      @render()
      render() {
        return html`<div>Test</div>`;
      }

      emitEvents() {
        this.dispatchEvent(new CustomEvent('@snice/event-one', {
          detail: { data: 'test1' },
          bubbles: true
        }));

        this.dispatchEvent(new CustomEvent('@snice/event-two', {
          detail: { data: 'test2' },
          bubbles: true
        }));

        this.dispatchEvent(new CustomEvent('@my/custom/event', {
          detail: { data: 'test3' },
          bubbles: true
        }));
      }
    }

    @element('test-slash-container')
    class TestSlashContainer extends HTMLElement {
      handleEvent1(e: CustomEvent) {
        handler1(e.detail);
      }

      handleEvent2(e: CustomEvent) {
        handler2(e.detail);
      }

      handleEvent3(e: CustomEvent) {
        handler3(e.detail);
      }

      @render()
      render() {
        return html`
          <test-slash-emitter
            @@snice/event-one=${(e: CustomEvent) => this.handleEvent1(e)}
            @@snice/event-two=${(e: CustomEvent) => this.handleEvent2(e)}
            @@my/custom/event=${(e: CustomEvent) => this.handleEvent3(e)}
          ></test-slash-emitter>
        `;
      }
    }

    const container = document.createElement('test-slash-container');
    document.body.appendChild(container);

    await (container as any).ready;

    const emitter = container.shadowRoot?.querySelector('test-slash-emitter') as any;
    expect(emitter).toBeTruthy();

    // Trigger the events
    emitter.emitEvents();

    // Verify handlers were called
    expect(handler1).toHaveBeenCalledWith({ data: 'test1' });
    expect(handler2).toHaveBeenCalledWith({ data: 'test2' });
    expect(handler3).toHaveBeenCalledWith({ data: 'test3' });

    container.remove();
  });

  it('should handle properties with . syntax alongside / events', async () => {
    const eventHandler = vi.fn();

    @element('test-mixed-receiver')
    class TestMixedReceiver extends HTMLElement {
      testProp: string = '';

      @render()
      render() {
        return html`<div>${this.testProp}</div>`;
      }
    }

    @element('test-mixed-container')
    class TestMixedContainer extends HTMLElement {
      handleEvent(e: CustomEvent) {
        eventHandler(e.detail);
      }

      @render()
      render() {
        return html`
          <test-mixed-receiver
            .testProp=${'property-value'}
            @@some/event=${(e: CustomEvent) => this.handleEvent(e)}
          ></test-mixed-receiver>
        `;
      }
    }

    const container = document.createElement('test-mixed-container');
    document.body.appendChild(container);

    await (container as any).ready;

    const receiver = container.shadowRoot?.querySelector('test-mixed-receiver') as any;

    // Verify property was set
    expect(receiver.testProp).toBe('property-value');

    // Trigger event
    receiver.dispatchEvent(new CustomEvent('@some/event', {
      detail: { value: 'event-data' },
      bubbles: true
    }));

    // Verify event handler was called
    expect(eventHandler).toHaveBeenCalledWith({ value: 'event-data' });

    container.remove();
  });
});
