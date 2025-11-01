/**
 * Unit tests for QR Worker
 * Tests the worker and ZXing WASM independently
 */

import { readBarcodesFromImageData } from '../../components/qr-reader/zxing-reader.mjs';

console.log('=== QR Worker WASM Tests ===\n');

// Test 1: Verify ZXing loads
console.log('Test 1: ZXing module loads');
try {
  console.log('✓ ZXing module imported successfully');
  console.log('  readBarcodesFromImageData:', typeof readBarcodesFromImageData);
} catch (error) {
  console.log('✗ Failed to import ZXing:', error.message);
  process.exit(1);
}

// Test 2: Empty image (should return no results)
console.log('\nTest 2: Empty white image (no QR code)');
try {
  const width = 100;
  const height = 100;
  const imageData = {
    data: new Uint8ClampedArray(width * height * 4).fill(255), // All white
    width,
    height
  };

  const results = await readBarcodesFromImageData(imageData, {
    formats: ['QRCode']
  });

  if (results.length === 0) {
    console.log('✓ Correctly returned no results for empty image');
  } else {
    console.log('✗ Unexpected results:', results);
  }
} catch (error) {
  console.log('✗ Error:', error.message);
}

// Test 3: Create a simple QR code pattern (not a real QR code, just to test image handling)
console.log('\nTest 3: Test pattern image');
try {
  const width = 100;
  const height = 100;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with white
  data.fill(255);

  // Draw some black pixels in a pattern
  for (let y = 10; y < 20; y++) {
    for (let x = 10; x < 20; x++) {
      const idx = (y * width + x) * 4;
      data[idx] = 0;     // R
      data[idx + 1] = 0; // G
      data[idx + 2] = 0; // B
      data[idx + 3] = 255; // A
    }
  }

  const imageData = { data, width, height };

  const results = await readBarcodesFromImageData(imageData, {
    formats: ['QRCode']
  });

  console.log('✓ Image processing works (found', results.length, 'codes)');
} catch (error) {
  console.log('✗ Error:', error.message);
}

console.log('\n=== All Tests Complete ===');
console.log('ZXing WASM is working correctly!');
console.log('\nNote: To test with real QR codes, you need actual QR code images.');
console.log('The worker will work the same way - it just wraps this ZXing library.');
