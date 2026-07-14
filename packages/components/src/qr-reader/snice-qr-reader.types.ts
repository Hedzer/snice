export type CameraMode = 'front' | 'back';

export interface QRScanResult {
  data: string;
  timestamp: number;
}

export interface SniceQRReaderElement extends HTMLElement {
  autoStart: boolean;
  camera: CameraMode;
  pickFirst: boolean;
  manualSnap: boolean;
  scanSpeed: number;

  start(): Promise<void>;
  stop(): void;
  snap(): Promise<string | null>;
  scanImage(file: File): Promise<string>;
  switchCamera(): void;
}
