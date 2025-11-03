import { describe, it, expect, beforeEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * Test boolean attributes with event handlers - exact scan-page scenario
 */
describe('Boolean Attributes with Event Handlers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should preserve boolean attributes when element has event handlers', async () => {
    @element('test-qr-mock')
    class TestQRMock extends HTMLElement {
      @property({ type: Boolean, attribute: 'auto-start' })
      autoStart: boolean = false;

      @property({ type: Boolean, attribute: 'tap-start' })
      tapStart: boolean = false;

      @property({ type: Boolean, attribute: 'pick-first' })
      pickFirst: boolean = false;

      @property({ type: String })
      camera: string = 'back';
    }

    @element('test-scan-mock')
    class TestScanMock extends HTMLElement {
      handleScan(e: CustomEvent) {}
      handleError(e: CustomEvent) {}
      handleReady() {}

      @render()
      view() {
        return html`
          <test-qr-mock
            auto-start
            tap-start
            pick-first
            camera="back"
            @@snice/qr-scan=${(e: CustomEvent) => this.handleScan(e)}
            @@snice/qr-error=${(e: CustomEvent) => this.handleError(e)}
            @@snice/camera-ready=${() => this.handleReady()}
          ></test-qr-mock>
        `;
      }
    }

    const page = document.createElement('test-scan-mock') as TestScanMock;
    document.body.appendChild(page);
    await page.ready;

    const qr = page.shadowRoot!.querySelector('test-qr-mock') as TestQRMock;

    console.log('QR element HTML:', qr.outerHTML);
    console.log('Has auto-start:', qr.hasAttribute('auto-start'));
    console.log('Has tap-start:', qr.hasAttribute('tap-start'));
    console.log('Has pick-first:', qr.hasAttribute('pick-first'));
    console.log('Camera attr:', qr.getAttribute('camera'));

    expect(qr.hasAttribute('auto-start')).toBe(true);
    expect(qr.hasAttribute('tap-start')).toBe(true);
    expect(qr.hasAttribute('pick-first')).toBe(true);
    expect(qr.getAttribute('camera')).toBe('back');
  });
});
