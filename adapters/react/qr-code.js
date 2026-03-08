import { createReactAdapter } from './wrapper';
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
export const QrCode = createReactAdapter({
    tagName: 'snice-qr-code',
    properties: ["value", "size", "errorCorrectionLevel", "renderMode", "dotStyle", "margin", "fgColor", "bgColor", "includeImage", "imageUrl", "imageSize", "centerText", "centerTextSize", "textFillColor", "textOutlineColor"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=qr-code.js.map