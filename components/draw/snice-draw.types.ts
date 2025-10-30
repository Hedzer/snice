export type DrawTool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'text';

export type DrawMode = 'draw' | 'erase';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawStroke {
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  points: Point[];
  timestamp: number;
}

export interface DrawOptions {
  lazy?: boolean;
  lazyRadius?: number;
  smoothing?: number;
}

export interface SniceDrawElement extends HTMLElement {
  width: number;
  height: number;
  tool: DrawTool;
  color: string;
  strokeWidth: number;
  backgroundColor: string;
  lazy: boolean;
  lazyRadius: number;
  friction: number;
  smoothing: number;
  autoPolygon: boolean;
  polygonCurvePoints: number;
  autoCircle: boolean;
  circlePoints: number;
  disabled: boolean;

  clear(): void;
  undo(): void;
  redo(): void;
  toDataURL(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): string;
  toBlob(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): Promise<Blob>;
  download(filename?: string): void;
  loadImage(url: string): Promise<void>;
  getStrokes(): DrawStroke[];
  setStrokes(strokes: DrawStroke[]): void;
}
