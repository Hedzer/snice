export type CameraAnnotateMode = 'camera' | 'annotate';

export interface Annotation {
  id: string;
  strokeId: string;
  label: string;
  color: string;
  visible: boolean;
  timestamp: number;
}

export interface AnnotationData {
  annotations: Annotation[];
  strokes: AnnotationStroke[];
  imageWidth: number;
  imageHeight: number;
}

export interface AnnotationStroke {
  id: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
}

export interface SniceCameraAnnotateElement extends HTMLElement {
  mode: CameraAnnotateMode;
  autoRotateColors: boolean;
  showLabelsPanel: boolean;

  capture(): Promise<void>;
  exportImage(options?: { includeLabels?: boolean }): string;
  exportAnnotations(): AnnotationData;
  importAnnotations(data: AnnotationData): void;
  clearAnnotations(): void;
}

export interface SniceCameraAnnotateEventMap {
  '@snice/capture': CustomEvent<{ dataURL: string; width: number; height: number }>;
  '@snice/annotate': CustomEvent<{ annotation: Annotation }>;
  '@snice/annotation-change': CustomEvent<{ annotations: Annotation[] }>;
}
