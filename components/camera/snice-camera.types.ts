export type CameraFacingMode = 'user' | 'environment';

export type CameraResolution = 'qvga' | 'vga' | 'hd' | 'full-hd' | '4k';

export interface CameraConstraints {
  audio?: boolean;
  video?: {
    width?: { ideal?: number; min?: number; max?: number };
    height?: { ideal?: number; min?: number; max?: number };
    facingMode?: CameraFacingMode;
    frameRate?: { ideal?: number; min?: number; max?: number };
  };
}

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
  resolution: CameraResolution;
  mirror: boolean;
  showControls: boolean;
  captureFormat: 'image/png' | 'image/jpeg' | 'image/webp';
  captureQuality: number;

  start(): Promise<void>;
  stop(): void;
  capture(): Promise<CapturedImage>;
  switchCamera(): Promise<void>;
  isActive(): boolean;
  getStream(): MediaStream | null;
  getDevices(): Promise<MediaDeviceInfo[]>;
  selectDevice(deviceId: string): Promise<void>;
}
