/**
 * QR Code Decoder Web Worker
 * Offloads QR decoding to background thread for 60 FPS performance
 * Uses SharedArrayBuffer for zero-copy transfers when available
 */

import { readBarcodesFromImageData } from './zxing-reader.mjs';

console.log('[QR Worker] Starting...');

interface DecodeMessage {
  type: 'decode';
  buffer?: SharedArrayBuffer;
  imageData?: ImageData;
  width: number;
  height: number;
}

interface DecodeResponse {
  type: 'result';
  text: string | null;
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent<DecodeMessage>) => {
  console.log('[QR Worker] Received message:', event.data.type);
  const { type, buffer, imageData, width, height } = event.data;

  if (type === 'decode') {
    try {
      let processImageData: ImageData;

      // Use SharedArrayBuffer if available (zero-copy)
      if (buffer) {
        console.log('[QR Worker] Using SharedArrayBuffer');
        const uint8Array = new Uint8ClampedArray(buffer);
        processImageData = new ImageData(uint8Array, width, height);
      } else if (imageData) {
        // If imageData is a plain object with data/width/height, reconstruct ImageData
        if (imageData.data && imageData.width && imageData.height) {
          console.log('[QR Worker] Reconstructing ImageData from plain object');
          const uint8Array = new Uint8ClampedArray(imageData.data);
          processImageData = new ImageData(uint8Array, imageData.width, imageData.height);
        } else {
          // Otherwise assume it's already an ImageData object
          console.log('[QR Worker] Using ImageData directly');
          processImageData = imageData as ImageData;
        }
      } else {
        console.error('[QR Worker] No image data provided');
        self.postMessage({ type: 'result', text: null });
        return;
      }

      console.log('[QR Worker] Starting decode...');
      // Decode QR code directly - no preprocessing
      const results = await readBarcodesFromImageData(processImageData, {
        formats: ['QRCode']
      });

      console.log('[QR Worker] Decode complete, found:', results.length);

      const response: DecodeResponse = {
        type: 'result',
        text: results.length > 0 ? results[0].text : null
      };

      self.postMessage(response);
    } catch (error) {
      console.error('[QR Worker] Decode error:', error);
      const response: DecodeResponse = {
        type: 'result',
        text: null
      };
      self.postMessage(response);
    }
  }
};
