import { test } from '@playwright/test';

test('ACTUALLY DRAW ON THE CANVAS', async ({ page }) => {
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('http://localhost:5566/components/draw/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Get canvas position
  const canvas = await page.evaluate(() => {
    const draw = document.querySelector('snice-draw');
    const canvas = draw?.shadowRoot?.querySelector('canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    };
  });

  console.log('Canvas rect:', canvas);

  if (!canvas) {
    console.log('NO CANVAS FOUND');
    return;
  }

  // Check before drawing
  const before = await page.evaluate(() => {
    const draw = document.querySelector('snice-draw');
    const canvas = draw?.shadowRoot?.querySelector('canvas');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    const imageData = ctx?.getImageData(100, 100, 1, 1);
    return {
      pixel: imageData ? [imageData.data[0], imageData.data[1], imageData.data[2]] : null
    };
  });

  console.log('Before drawing:', before);

  // DRAW A LINE
  const startX = canvas.x + 100;
  const startY = canvas.y + 100;
  const endX = canvas.x + 300;
  const endY = canvas.y + 300;

  console.log(`Drawing from (${startX}, ${startY}) to (${endX}, ${endY})`);

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  // Draw diagonal line slowly
  for (let i = 0; i <= 20; i++) {
    const x = startX + (endX - startX) * (i / 20);
    const y = startY + (endY - startY) * (i / 20);
    await page.mouse.move(x, y);
    await page.waitForTimeout(10);
  }

  await page.mouse.up();
  await page.waitForTimeout(500);

  // Check after drawing
  const after = await page.evaluate(() => {
    const draw = document.querySelector('snice-draw');
    const canvas = draw?.shadowRoot?.querySelector('canvas');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');

    // Check multiple points along the line
    const points = [];
    for (let i = 100; i <= 300; i += 20) {
      const imageData = ctx?.getImageData(i, i, 1, 1);
      if (imageData) {
        points.push({
          x: i,
          y: i,
          color: [imageData.data[0], imageData.data[1], imageData.data[2]],
          isWhite: imageData.data[0] === 255 && imageData.data[1] === 255 && imageData.data[2] === 255
        });
      }
    }

    return {
      points,
      hasNonWhite: points.some(p => !p.isWhite),
      strokes: (draw as any).strokes?.length || 0
    };
  });

  console.log('After drawing:', JSON.stringify(after, null, 2));
  console.log(`\nDRAWING ${after.hasNonWhite ? 'WORKED! ✓' : 'FAILED! ✗'}`);
  console.log(`Strokes recorded: ${after.strokes}`);
});
