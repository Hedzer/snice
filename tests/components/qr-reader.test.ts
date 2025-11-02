import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, waitFor } from './test-utils';
import '../../components/qr-reader/snice-qr-reader';
import type { SniceQRReaderElement } from '../../components/qr-reader/snice-qr-reader.types';

describe('snice-qr-reader', () => {
  let reader: SniceQRReaderElement;

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
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  afterEach(() => {
    if (reader) {
      removeComponent(reader as HTMLElement);
    }
    vi.clearAllMocks();
  });

  describe('Properties', () => {
    it('should have default property values', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      expect(reader.autoStart).toBe(false);
      expect(reader.camera).toBe('back');
      expect(reader.pickFirst).toBe(false);
      expect(reader.manualSnap).toBe(false);
      expect(reader.scanSpeed).toBe(3);
    });

    it('should set autoStart property', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader', {
        'auto-start': true
      });

      expect(reader.autoStart).toBe(true);
    });

    it('should set camera property', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader', {
        'camera': 'front'
      });

      expect(reader.camera).toBe('front');
    });

    it('should set pickFirst property', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader', {
        'pick-first': true
      });

      expect(reader.pickFirst).toBe(true);
    });
  });

  describe('Camera initialization', () => {
    it('should request camera with back facing mode', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');
      reader.camera = 'back';

      await reader.start();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    });

    it('should request camera with front facing mode', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');
      reader.camera = 'front';

      await reader.start();

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    });

    it('should auto-start camera when autoStart is true', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader', {
        'auto-start': true
      });

      // Wait for component initialization
      await waitFor(() => mockGetUserMedia.mock.calls.length > 0);

      expect(mockGetUserMedia).toHaveBeenCalled();
    });

    it('should not auto-start camera when autoStart is false', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      // Wait a bit to ensure it doesn't start
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('should emit camera-ready event when camera starts', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      const cameraReadyHandler = vi.fn();
      reader.addEventListener('snice/camera-ready', cameraReadyHandler);

      await reader.start();

      await waitFor(() => cameraReadyHandler.mock.calls.length > 0);

      expect(cameraReadyHandler).toHaveBeenCalled();
      expect(cameraReadyHandler.mock.calls[0][0].detail.reader).toBe(reader);
    });

    it('should emit qr-scan event when QR code is detected', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      const scanHandler = vi.fn();
      reader.addEventListener('snice/qr-scan', scanHandler);

      // Manually trigger scan event (simulating QR detection)
      const scanResult = { data: 'test-qr-data', timestamp: Date.now() };
      reader.dispatchEvent(new CustomEvent('snice/qr-scan', {
        detail: { reader, ...scanResult },
        bubbles: true,
        composed: true
      }));

      expect(scanHandler).toHaveBeenCalled();
      expect(scanHandler.mock.calls[0][0].detail.data).toBe('test-qr-data');
    });

    it('should emit camera-error event on errors', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      const errorHandler = vi.fn();
      reader.addEventListener('snice/camera-error', errorHandler);

      // Simulate camera access denied
      mockGetUserMedia.mockRejectedValueOnce(new Error('Camera access denied'));

      try {
        await reader.start();
      } catch (e) {
        // Expected to fail
      }

      await waitFor(() => errorHandler.mock.calls.length > 0);

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Camera control', () => {
    it('should stop camera and clean up stream', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');

      await reader.start();
      reader.stop();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
    });

    it('should switch camera mode', async () => {
      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader');
      reader.camera = 'back';

      await reader.start();

      mockGetUserMedia.mockClear();

      reader.switchCamera();

      await waitFor(() => mockGetUserMedia.mock.calls.length > 0);

      expect(reader.camera).toBe('front');
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    });
  });

  describe('Property combinations', () => {
    it('should work with autoStart=true, pickFirst=true, camera=back', async () => {
      const scanHandler = vi.fn();

      reader = await createComponent<SniceQRReaderElement>('snice-qr-reader', {
        'auto-start': true,
        'pick-first': true,
        'camera': 'back'
      });

      reader.addEventListener('snice/qr-scan', scanHandler);

      await waitFor(() => mockGetUserMedia.mock.calls.length > 0);

      expect(reader.autoStart).toBe(true);
      expect(reader.pickFirst).toBe(true);
      expect(reader.camera).toBe('back');
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    });
  });
});
