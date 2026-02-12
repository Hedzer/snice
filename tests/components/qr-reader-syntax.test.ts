import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, render, html } from '../../src/index';
import '../../components/qr-reader/snice-qr-reader';

describe('snice-qr-reader template syntax', () => {
  let container: HTMLElement;
  let TestComponent: any;

  // Mock navigator.mediaDevices.getUserMedia
  const mockGetUserMedia = vi.fn();
  const mockVideoTrack = { stop: vi.fn() };
  const mockStream = {
    getTracks: () => [mockVideoTrack],
  };

  beforeEach(() => {
    // Setup getUserMedia mock
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    mockGetUserMedia.mockResolvedValue(mockStream);

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.clearAllMocks();
  });

  it('should work with .property=${value} and @event=${handler} syntax', async () => {
    const scanHandler = vi.fn();
    const errorHandler = vi.fn();
    const cameraReadyHandler = vi.fn();

    @element('test-qr-container')
    class TestQRContainer extends HTMLElement {
      handleScan(e: CustomEvent) {
        scanHandler(e.detail);
      }

      handleError(e: CustomEvent) {
        errorHandler(e.detail);
      }

      handleCameraReady() {
        cameraReadyHandler();
      }

      @render()
      render() {
        return html/*html*/`
          <snice-qr-reader
            .autoStart=${true}
            .pickFirst=${true}
            .camera=${'back'}
            @qr-scan=${(e: CustomEvent) => this.handleScan(e)}
            @qr-error=${(e: CustomEvent) => this.handleError(e)}
            @camera-ready=${() => this.handleCameraReady()}
          ></snice-qr-reader>
        `;
      }
    }

    TestComponent = TestQRContainer;

    // Create the test component
    const testEl = document.createElement('test-qr-container');
    container.appendChild(testEl);

    await (testEl as any).ready;

    // Get the qr-reader element
    const qrReader = testEl.shadowRoot?.querySelector('snice-qr-reader') as any;

    expect(qrReader).toBeTruthy();

    // Verify properties were set
    expect(qrReader.autoStart).toBe(true);
    expect(qrReader.pickFirst).toBe(true);
    expect(qrReader.camera).toBe('back');

    // Listen for camera-ready before starting
    const cameraReadyPromise = new Promise<void>((resolve) => {
      qrReader.addEventListener('camera-ready', () => resolve(), { once: true });
    });

    await qrReader.start();

    // Verify camera was requested with correct settings
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Trigger video loadeddata to fire camera-ready
    const video = qrReader.shadowRoot?.querySelector('video');
    if (video) {
      video.dispatchEvent(new Event('loadeddata'));
    }

    await cameraReadyPromise;

    // Verify camera-ready handler was called via template binding
    expect(cameraReadyHandler).toHaveBeenCalled();

    // Simulate a QR scan
    const scanEvent = new CustomEvent('qr-scan', {
      detail: { reader: qrReader, data: 'test-data', timestamp: Date.now() },
      bubbles: true,
      composed: true
    });
    qrReader.dispatchEvent(scanEvent);

    expect(scanHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        data: 'test-data'
      })
    );

    // Simulate an error
    const errorEvent = new CustomEvent('qr-error', {
      detail: { reader: qrReader, error: new Error('Test error') },
      bubbles: true,
      composed: true
    });
    qrReader.dispatchEvent(errorEvent);

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error)
      })
    );
  });

  it('should work with different property combinations', async () => {
    @element('test-qr-front-camera')
    class TestQRFrontCamera extends HTMLElement {
      @render()
      render() {
        return html/*html*/`
          <snice-qr-reader
            .autoStart=${false}
            .pickFirst=${false}
            .camera=${'front'}
          ></snice-qr-reader>
        `;
      }
    }

    const testEl = document.createElement('test-qr-front-camera');
    container.appendChild(testEl);

    await (testEl as any).ready;

    const qrReader = testEl.shadowRoot?.querySelector('snice-qr-reader') as any;

    expect(qrReader.autoStart).toBe(false);
    expect(qrReader.pickFirst).toBe(false);
    expect(qrReader.camera).toBe('front');

    // Camera should NOT auto-start
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockGetUserMedia).not.toHaveBeenCalled();

    // Manually start it
    await qrReader.start();

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
  });
});
