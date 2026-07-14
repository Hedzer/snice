export interface Point {
  x: number;
  y: number;
}

export interface PaintStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}

export type PaintControl = 'colors' | 'size' | 'eraser' | 'undo' | 'redo' | 'clear';

export interface SnicePaintElement extends HTMLElement {
  colors: string[];
  color: string;
  strokeWidth: number;
  minStrokeWidth: number;
  maxStrokeWidth: number;
  controls: string;
  backgroundColor: string;
  colorSelects: number;
  disabled: boolean;

  undo(): void;
  redo(): void;
  clear(): void;
  toDataURL(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): string;
  toBlob(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): Promise<Blob>;
  download(filename?: string): void;
  getStrokes(): PaintStroke[];
  setStrokes(strokes: PaintStroke[]): void;
}

export interface SnicePaintEventMap {
  'paint-start': CustomEvent<{ point: Point }>;
  'paint-end': CustomEvent<{ stroke: PaintStroke }>;
  'paint-clear': CustomEvent<void>;
  'paint-undo': CustomEvent<void>;
  'paint-redo': CustomEvent<void>;
  'color-select': CustomEvent<{ color: string; index: number }>;
}
