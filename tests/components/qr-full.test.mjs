/**
 * Full integration test: Generate QR code and decode it
 * Uses qrcode library to generate, ZXing to decode
 */

import QRCode from 'qrcode';
import { readBarcodesFromImageData } from '../../components/qr-reader/zxing-reader.mjs';

console.log('=== Full QR Code Test: Generate + Decode ===\n');

const testData = 'https://example.com/test-123';

console.log('Test data:', testData);
console.log('\nStep 1: Generate QR code...');

try {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(testData, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 1
  });

  console.log('✓ QR code generated');

  // Convert data URL to image data
  // In Node.js we need to parse the data URL manually
  const base64Data = qrDataUrl.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  // For this test, let's generate QR as a matrix and convert to ImageData
  console.log('\nStep 2: Generate QR code matrix...');

  const modules = await QRCode.create(testData, {
    errorCorrectionLevel: 'M'
  });

  const size = modules.modules.size;
  const scale = 4; // Scale up for better detection
  const width = size * scale;
  const height = size * scale;

  console.log(`✓ QR matrix: ${size}x${size}, scaled to ${width}x${height}`);

  // Create ImageData
  const imageData = {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height
  };

  // Fill with white background
  imageData.data.fill(255);

  // Draw QR modules
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isDark = modules.modules.data[y * size + x];
      if (isDark) {
        // Draw scaled module
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const px = x * scale + dx;
            const py = y * scale + dy;
            const idx = (py * width + px) * 4;
            imageData.data[idx] = 0;     // R
            imageData.data[idx + 1] = 0; // G
            imageData.data[idx + 2] = 0; // B
            imageData.data[idx + 3] = 255; // A
          }
        }
      }
    }
  }

  console.log('✓ ImageData created');

  console.log('\nStep 3: Decode QR code with ZXing...');

  const results = await readBarcodesFromImageData(imageData, {
    formats: ['QRCode']
  });

  console.log(`✓ Decode complete, found ${results.length} code(s)`);

  if (results.length > 0) {
    console.log('\n=== SUCCESS ===');
    console.log('Decoded text:', results[0].text);
    console.log('Expected text:', testData);
    console.log('Match:', results[0].text === testData ? '✓' : '✗');
  } else {
    console.log('\n=== FAILED ===');
    console.log('No QR code detected');
  }

} catch (error) {
  console.log('\n=== ERROR ===');
  console.log(error.message);
  console.error(error);
  process.exit(1);
}
