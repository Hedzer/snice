import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow } from './test-utils';
import '../../components/camera-annotate/snice-camera-annotate';
import type { SniceCameraAnnotateElement, AnnotationData } from '../../components/camera-annotate/snice-camera-annotate.types';

// Mock getUserMedia since no camera in test env
const mockStream = {
  getTracks: () => [{ stop: vi.fn() }]
};
vi.stubGlobal('navigator', {
  ...navigator,
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue(mockStream),
    enumerateDevices: vi.fn().mockResolvedValue([])
  }
});

describe('snice-camera-annotate', () => {
  let el: SniceCameraAnnotateElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render element', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-CAMERA-ANNOTATE');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      expect(el.mode).toBe('camera');
      expect(el.autoRotateColors).toBe(true);
      expect(el.showLabelsPanel).toBe(true);
    });

    it('should start in camera mode', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      expect(el.mode).toBe('camera');
      const video = queryShadow(el as HTMLElement, 'video');
      expect(video).toBeTruthy();
    });

    it('should render sidebar', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      const sidebar = queryShadow(el as HTMLElement, '.ca-sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('should render color palette', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      const swatches = el.shadowRoot?.querySelectorAll('.ca-color-swatch');
      expect(swatches?.length).toBe(12);
    });
  });

  describe('properties', () => {
    it('should hide sidebar when show-labels-panel is false', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate', {
        'show-labels-panel': 'false'
      });
      const sidebar = queryShadow(el as HTMLElement, '.ca-sidebar');
      expect(sidebar?.classList.contains('hidden')).toBe(true);
    });

    it('should accept auto-rotate-colors attribute', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate', {
        'auto-rotate-colors': 'false'
      });
      expect(el.autoRotateColors).toBe(false);
    });
  });

  describe('annotation data API', () => {
    it('should export empty annotations initially', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      const data = el.exportAnnotations();
      expect(data.annotations).toEqual([]);
      expect(data.strokes).toEqual([]);
    });

    it('should import annotations', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');

      const mockData: AnnotationData = {
        annotations: [{
          id: 'ann-1',
          strokeId: 'stroke-1',
          label: 'Test Label',
          color: '#ff0000',
          visible: true,
          timestamp: Date.now()
        }],
        strokes: [{
          id: 'stroke-1',
          color: '#ff0000',
          width: 3,
          points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
          timestamp: Date.now()
        }],
        imageWidth: 640,
        imageHeight: 480
      };

      el.importAnnotations(mockData);
      const exported = el.exportAnnotations();
      expect(exported.annotations.length).toBe(1);
      expect(exported.annotations[0].label).toBe('Test Label');
      expect(exported.strokes.length).toBe(1);
    });

    it('should clear annotations', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');

      const mockData: AnnotationData = {
        annotations: [{
          id: 'ann-1',
          strokeId: 'stroke-1',
          label: 'Test',
          color: '#ff0000',
          visible: true,
          timestamp: Date.now()
        }],
        strokes: [{
          id: 'stroke-1',
          color: '#ff0000',
          width: 3,
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          timestamp: Date.now()
        }],
        imageWidth: 640,
        imageHeight: 480
      };

      el.importAnnotations(mockData);
      expect(el.exportAnnotations().annotations.length).toBe(1);

      el.clearAnnotations();
      expect(el.exportAnnotations().annotations.length).toBe(0);
      expect(el.exportAnnotations().strokes.length).toBe(0);
    });

    it('should produce independent copies on export', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');

      const mockData: AnnotationData = {
        annotations: [{
          id: 'ann-1',
          strokeId: 'stroke-1',
          label: 'Original',
          color: '#ff0000',
          visible: true,
          timestamp: Date.now()
        }],
        strokes: [{
          id: 'stroke-1',
          color: '#ff0000',
          width: 3,
          points: [{ x: 0, y: 0 }],
          timestamp: Date.now()
        }],
        imageWidth: 640,
        imageHeight: 480
      };

      el.importAnnotations(mockData);
      const exported1 = el.exportAnnotations();
      const exported2 = el.exportAnnotations();

      // Should be separate objects
      exported1.annotations[0].label = 'Modified';
      expect(exported2.annotations[0].label).toBe('Original');
    });
  });

  describe('toolbar', () => {
    it('should render capture button in camera mode', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      const primaryBtn = queryShadow(el as HTMLElement, '.ca-btn.primary');
      expect(primaryBtn).toBeTruthy();
    });

    it('should show empty state in annotations list', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');
      const emptyState = queryShadow(el as HTMLElement, '.ca-empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should fire annotation-change on clearAnnotations', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');

      const handler = vi.fn();
      el.addEventListener('@snice/annotation-change', handler);

      el.clearAnnotations();

      // Allow event to fire
      await new Promise(r => setTimeout(r, 10));
      expect(handler).toHaveBeenCalled();
    });

    it('should fire annotation-change on importAnnotations', async () => {
      el = await createComponent<SniceCameraAnnotateElement>('snice-camera-annotate');

      const handler = vi.fn();
      el.addEventListener('@snice/annotation-change', handler);

      el.importAnnotations({
        annotations: [],
        strokes: [],
        imageWidth: 640,
        imageHeight: 480
      });

      await new Promise(r => setTimeout(r, 10));
      expect(handler).toHaveBeenCalled();
    });
  });
});
