/**
 * ZXing-based QR Code Decoder
 *
 * This file uses ZXing-C++ via zxing-wasm
 *
 * Licenses:
 * - zxing-wasm: MIT License (see ZXING-LICENSE file)
 * - ZXing-C++: Apache 2.0 License (see ZXING-LICENSE file)
 *
 * zxing-wasm: Copyright (c) 2023 Ze-Zheng Wu
 * ZXing-C++: https://github.com/zxing-cpp/zxing-cpp
 */

// @ts-ignore - No type definitions for compiled WASM module
import { readBarcodesFromImageData } from './zxing-reader.mjs';

export interface QRResult {
  text: string;
  data: Uint8Array;
}

export class QRCodeDecoder {
  async decode(canvas: HTMLCanvasElement): Promise<QRResult> {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Get raw image data - no preprocessing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const results = await readBarcodesFromImageData(imageData, {
        formats: ['QRCode']
      });

      if (results.length === 0) {
        throw new Error('No QR code found');
      }

      const result = results[0];
      const encoder = new TextEncoder();
      const data = encoder.encode(result.text);

      return {
        text: result.text,
        data
      };
    } catch (error) {
      throw new Error('No QR code found');
    }
  }

  destroy(): void {
    // No cleanup needed for ZXing
  }
}
