import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the QrCode component
 */
export interface QrCodeProps extends SniceBaseProps {
  value?: any;
  size?: any;
  errorCorrectionLevel?: any;
  renderMode?: any;
  dotStyle?: any;
  margin?: any;
  fgColor?: any;
  bgColor?: any;
  includeImage?: any;
  imageUrl?: any;
  imageSize?: any;
  centerText?: any;
  centerTextSize?: any;
  textFillColor?: any;
  textOutlineColor?: any;

}

/**
 * QrCode - React adapter for snice-qr-code
 *
 * This is an auto-generated React wrapper for the Snice qr-code component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/qr-code';
 * import { QrCode } from 'snice/react';
 *
 * function MyComponent() {
 *   return <QrCode />;
 * }
 * ```
 */
export const QrCode = createReactAdapter<QrCodeProps>({
  tagName: 'snice-qr-code',
  properties: ["value","size","errorCorrectionLevel","renderMode","dotStyle","margin","fgColor","bgColor","includeImage","imageUrl","imageSize","centerText","centerTextSize","textFillColor","textOutlineColor"],
  events: {},
  formAssociated: false
});
