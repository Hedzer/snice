import { test } from '@playwright/test';

test('check what events fire', async ({ page }) => {
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.goto('http://localhost:5566/components/draw/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Add event listeners to see what's happening
  await page.evaluate(() => {
    const draw = document.querySelector('snice-draw');
    const canvas = draw?.shadowRoot?.querySelector('canvas');

    if (canvas) {
      ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'].forEach(eventName => {
        canvas.addEventListener(eventName, (e) => {
          console.log(`EVENT: ${eventName} at (${(e as any).clientX}, ${(e as any).clientY})`);
        });
      });
    }

    // Log draw component methods being called
    if (draw) {
      const original = (draw as any).handlePointerDown;
      if (original) {
        (draw as any).handlePointerDown = function(...args: any[]) {
          console.log('handlePointerDown CALLED');
          return original.apply(this, args);
        };
      }
    }
  });

  const canvas = await page.evaluate(() => {
    const draw = document.querySelector('snice-draw');
    const canvas = draw?.shadowRoot?.querySelector('canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  console.log('Canvas:', canvas);

  if (!canvas) return;

  const x = canvas.x + 100;
  const y = canvas.y + 100;

  console.log(`\nTrying mouse events at (${x}, ${y})`);

  await page.mouse.move(x, y);
  await page.waitForTimeout(100);

  await page.mouse.down();
  await page.waitForTimeout(100);

  await page.mouse.move(x + 100, y + 100);
  await page.waitForTimeout(100);

  await page.mouse.up();
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const draw = document.querySelector('snice-draw') as any;
    return {
      strokes: draw?.strokes?.length || 0,
      ctx: !!draw?.ctx,
      canvas: !!draw?.canvas,
      tool: draw?.tool
    };
  });

  console.log('\nResult:', result);
});
