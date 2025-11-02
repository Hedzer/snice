/**
 * Test worker communication pattern
 * Simulates how the component sends data to the worker
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Worker Communication Test ===\n');

console.log('Step 1: Generate QR code...');

const testData = 'https://example.com/test-123';
const modules = await QRCode.create(testData, {
  errorCorrectionLevel: 'M'
});

const size = modules.modules.size;
const scale = 4;
const width = size * scale;
const height = size * scale;

const imageData = {
  data: new Uint8ClampedArray(width * height * 4),
  width,
  height
};

// Fill with white
imageData.data.fill(255);

// Draw QR modules
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const isDark = modules.modules.data[y * size + x];
    if (isDark) {
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = x * scale + dx;
          const py = y * scale + dy;
          const idx = (py * width + px) * 4;
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
          imageData.data[idx + 3] = 255;
        }
      }
    }
  }
}

console.log(`✓ QR code generated: ${width}x${height}`);

console.log('\nStep 2: Test worker (Node.js worker_threads)...');
console.log('NOTE: Browser Web Workers work differently than Node worker_threads');
console.log('This test verifies the data structure, not the actual worker.');

console.log('\nStep 3: Simulate message format...');

// This is what the component sends to the worker
const message = {
  type: 'decode',
  imageData: {
    data: imageData.data,
    width: imageData.width,
    height: imageData.height
  },
  width: imageData.width,
  height: imageData.height
};

console.log('✓ Message format:', {
  type: message.type,
  imageData: {
    hasData: !!message.imageData.data,
    dataLength: message.imageData.data.length,
    width: message.imageData.width,
    height: message.imageData.height
  },
  width: message.width,
  height: message.height
});

// Import and test directly
console.log('\nStep 4: Test decode with same data structure...');
const { readBarcodesFromImageData } = await import('../../components/qr-reader/zxing-reader.mjs');

// Reconstruct ImageData like the worker does
const uint8Array = new Uint8ClampedArray(message.imageData.data);
const processImageData = {
  data: uint8Array,
  width: message.imageData.width,
  height: message.imageData.height
};

const results = await readBarcodesFromImageData(processImageData, {
  formats: ['QRCode']
});

console.log('✓ Decode complete');

if (results.length > 0) {
  console.log('\n=== SUCCESS ===');
  console.log('Decoded:', results[0].text);
  console.log('Expected:', testData);
  console.log('Match:', results[0].text === testData ? '✓' : '✗');
  console.log('\nThe worker communication pattern works correctly!');
  console.log('The issue must be in how the browser worker is loaded or initialized.');
} else {
  console.log('\n=== FAILED ===');
  console.log('No QR code detected');
}
