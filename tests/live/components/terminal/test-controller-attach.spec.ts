import { test, expect } from '@playwright/test';

test('check if controller attaches', async ({ page, browser }) => {
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.error('ERROR:', err.message));

  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(2000);

  // Check if controller loaded
  const controllerLoaded = await page.evaluate(() => {
    const registry = (window as any).__SNICE_CONTROLLER_REGISTRY__;
    console.log('Controller registry:', registry);
    return !!registry && !!registry['demo-terminal-controller'];
  });

  console.log('Controller loaded:', controllerLoaded);

  // Check if terminal has controller attribute
  const hasController = await page.evaluate(() => {
    const term = document.getElementById('terminal-1');
    console.log('Terminal element:', term);
    console.log('Has controller attr:', term?.hasAttribute('controller'));
    console.log('Controller value:', term?.getAttribute('controller'));
    return term?.hasAttribute('controller');
  });

  console.log('Terminal has controller attribute:', hasController);

  // Wait a bit more
  await page.waitForTimeout(1000);

  console.log('\n=== Test completed ===');
});
