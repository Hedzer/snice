export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRCodeRenderMode = 'canvas' | 'svg';

export interface QRCodeOptions {
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  margin?: number;
  scale?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface SniceQRCodeElement extends HTMLElement {
  value: string;
  size: number;
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  renderMode: QRCodeRenderMode;
  margin: number;
  fgColor: string;
  bgColor: string;
  includeImage: boolean;
  imageUrl: string;
  imageSize: number;

  toDataURL(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): Promise<string>;
  toBlob(type?: 'image/png' | 'image/jpeg' | 'image/webp', quality?: number): Promise<Blob>;
  download(filename?: string): void;
}
