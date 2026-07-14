export type CameraFacingMode = 'user' | 'environment';

export type ControlsPosition =
  | 'auto'
  | 'bottom'
  | 'right'
  | 'left'
  | 'top'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

export interface CapturedImage {
  dataURL: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
}

export interface SniceCameraElement extends HTMLElement {
  autoStart: boolean;
  facingMode: CameraFacingMode;
  mirror: boolean;
  controlsPosition: ControlsPosition;
  showControls: boolean;
  width: number;
  height: number;
  aspectRatio: string;

  start(): Promise<void>;
  stop(): void;
  capture(): Promise<CapturedImage>;
  switchCamera(): Promise<void>;
  isActive(): boolean;
  getStream(): MediaStream | null;
  enterFullscreen(): void;
  exitFullscreen(): void;
  toggleFullscreen(): void;
}
