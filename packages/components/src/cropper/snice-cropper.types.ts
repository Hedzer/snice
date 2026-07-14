export type CropperOutputType = 'png' | 'jpeg' | 'webp';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SniceCropperElement extends HTMLElement {
  src: string;
  aspectRatio: number;
  minWidth: number;
  minHeight: number;
  outputType: CropperOutputType;
  crop(): Promise<Blob | null>;
  rotate(degrees: number): void;
  reset(): void;
  zoom(level: number): void;
}

export interface SniceCropperEventMap {
  'crop-change': CustomEvent<{ rect: CropRect }>;
  'crop-complete': CustomEvent<{ blob: Blob | null }>;
}
