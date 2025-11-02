import { describe, it, expect, vi } from 'vitest';
import { element, render, html } from '../src/index';

describe('Template event syntax with @ and / in event names', () => {
  it('should handle event names that start with @ and contain /', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = vi.fn();

    @element('test-event-emitter')
    class TestEventEmitter extends HTMLElement {
      @render()
      render() {
        return html/*html*/`<div>Test</div>`;
      }

      emitEvents() {
        // Note: @ is template syntax, not part of the event name
        this.dispatchEvent(new CustomEvent('snice/qr-scan', {
          detail: { data: 'test' },
          bubbles: true
        }));

        this.dispatchEvent(new CustomEvent('snice/qr-error', {
          detail: { error: 'test error' },
          bubbles: true
        }));

        this.dispatchEvent(new CustomEvent('snice/camera-ready', {
          detail: {},
          bubbles: true
        }));
      }
    }

    @element('test-event-container')
    class TestEventContainer extends HTMLElement {
      handleScan(e: CustomEvent) {
        handler1(e.detail);
      }

      handleError(e: CustomEvent) {
        handler2(e.detail);
      }

      handleCameraReady() {
        handler3();
      }

      @render()
      render() {
        return html/*html*/`
          <test-event-emitter
            @snice/qr-scan=${(e: CustomEvent) => this.handleScan(e)}
            @snice/qr-error=${(e: CustomEvent) => this.handleError(e)}
            @snice/camera-ready=${() => this.handleCameraReady()}
          ></test-event-emitter>
        `;
      }
    }

    const container = document.createElement('test-event-container');
    document.body.appendChild(container);

    await (container as any).ready;

    const emitter = container.shadowRoot?.querySelector('test-event-emitter') as any;
    expect(emitter).toBeTruthy();

    // Trigger the events
    emitter.emitEvents();

    // Verify handlers were called
    expect(handler1).toHaveBeenCalledWith({ data: 'test' });
    expect(handler2).toHaveBeenCalledWith({ error: 'test error' });
    expect(handler3).toHaveBeenCalled();

    container.remove();
  });

  it('should handle properties with . syntax', async () => {
    @element('test-prop-receiver')
    class TestPropReceiver extends HTMLElement {
      autoStart: boolean = false;
      pickFirst: boolean = false;
      camera: string = 'back';

      @render()
      render() {
        return html/*html*/`<div>${this.camera}</div>`;
      }
    }

    @element('test-prop-container')
    class TestPropContainer extends HTMLElement {
      @render()
      render() {
        return html/*html*/`
          <test-prop-receiver
            .autoStart=${true}
            .pickFirst=${true}
            .camera=${'front'}
          ></test-prop-receiver>
        `;
      }
    }

    const container = document.createElement('test-prop-container');
    document.body.appendChild(container);

    await (container as any).ready;

    const receiver = container.shadowRoot?.querySelector('test-prop-receiver') as any;

    expect(receiver.autoStart).toBe(true);
    expect(receiver.pickFirst).toBe(true);
    expect(receiver.camera).toBe('front');

    container.remove();
  });

  it('should handle both . properties and @ events with slashes together', async () => {
    const scanHandler = vi.fn();

    @element('test-combined-emitter')
    class TestCombinedEmitter extends HTMLElement {
      autoStart: boolean = false;
      camera: string = 'back';

      @render()
      render() {
        return html/*html*/`<button>Emit</button>`;
      }

      triggerScan() {
        // Note: @ is template syntax, not part of the event name
        this.dispatchEvent(new CustomEvent('snice/qr-scan', {
          detail: { data: `scanned with ${this.camera}` },
          bubbles: true
        }));
      }
    }

    @element('test-combined-container')
    class TestCombinedContainer extends HTMLElement {
      handleScan(e: CustomEvent) {
        scanHandler(e.detail);
      }

      @render()
      render() {
        return html/*html*/`
          <test-combined-emitter
            .autoStart=${true}
            .camera=${'front'}
            @snice/qr-scan=${(e: CustomEvent) => this.handleScan(e)}
          ></test-combined-emitter>
        `;
      }
    }

    const container = document.createElement('test-combined-container');
    document.body.appendChild(container);

    await (container as any).ready;

    const emitter = container.shadowRoot?.querySelector('test-combined-emitter') as any;

    // Verify properties were set
    expect(emitter.autoStart).toBe(true);
    expect(emitter.camera).toBe('front');

    // Trigger event
    emitter.triggerScan();

    // Verify event handler was called with correct data
    expect(scanHandler).toHaveBeenCalledWith({ data: 'scanned with front' });

    container.remove();
  });
});
