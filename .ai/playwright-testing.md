# Playwright Testing Guide

## ⚠️ CRITICAL: .debug/ is ONLY for temporary debugging

**Real tests belong in `tests/` directories, NOT in `.debug/`**

- `.debug/` = Temporary debugging files (delete after use)
- `tests/components/` = Permanent component unit tests
- `tests/live/` = Permanent Playwright e2e tests

## Core Rules

### 🚫 Never Do:
- Create testing files in root directory
- Use screenshots (`--screenshot`, `page.screenshot()`)
- Run in headed mode (`--headed`)
- Keep test files in `.debug/` permanently
- Put real/permanent tests in `.debug/`

### ✅ Always Do:
- Put temporary debug test files in `.debug/` folder ONLY
- Run headless only
- Use console logs and text content for debugging
- DELETE debug test files after debugging
- Put real tests in proper `tests/` directories

## Testing Pattern

### 1. Create Debug Test File
```bash
# Always create in .debug folder
mkdir -p .debug
```

### 2. Basic Test Structure
```javascript
// .debug/test-component.spec.js
import { test, expect } from '@playwright/test';

test('component functionality', async ({ page }) => {
  // Navigate to component demo
  await page.goto('http://localhost:5566/components/component-name/demo.html');

  // Wait for component to load
  await page.waitForLoadState('networkidle');

  // Test interactions - NO SCREENSHOTS
  const button = page.locator('button');
  await button.click();

  // Check results via text content, not visuals
  const result = await page.locator('.result').textContent();
  console.log('Result:', result);

  // Check element states
  const isVisible = await page.locator('.component').isVisible();
  console.log('Component visible:', isVisible);
});
```

### 3. Running Tests
```bash
# Always headless, no screenshots
npx playwright test .debug/test-file.spec.js --project=chromium
```

### 4. Debugging Techniques

#### Console Logs
```javascript
// Log page console messages
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Log page errors
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
```

#### Element State Checking
```javascript
// Check if element exists and is visible
const element = page.locator('.drawer');
console.log('Element count:', await element.count());
console.log('Element visible:', await element.isVisible());
console.log('Element text:', await element.textContent());

// Check attributes
console.log('Element class:', await element.getAttribute('class'));
console.log('Element open:', await element.getAttribute('open'));
```

#### CSS Properties
```javascript
// Check computed styles
const styles = await page.evaluate(() => {
  const el = document.querySelector('.drawer');
  return window.getComputedStyle(el);
});
console.log('Display:', styles.display);
console.log('Visibility:', styles.visibility);
```

#### JavaScript Evaluation
```javascript
// Run code in browser context
const result = await page.evaluate(() => {
  const drawer = document.querySelector('snice-drawer');
  return {
    open: drawer.open,
    position: drawer.position,
    size: drawer.size
  };
});
console.log('Drawer state:', result);
```

## Common Debugging Scenarios

### Component Not Loading
```javascript
// Check if custom element is defined
const isDefinedBefore = await page.evaluate(() =>
  customElements.get('snice-drawer') !== undefined
);
console.log('Custom element defined before:', isDefinedBefore);

// Wait for custom element
await page.waitForFunction(() =>
  customElements.get('snice-drawer') !== undefined
);

const isDefinedAfter = await page.evaluate(() =>
  customElements.get('snice-drawer') !== undefined
);
console.log('Custom element defined after:', isDefinedAfter);
```

### Event Not Firing
```javascript
// Listen for custom events
await page.evaluate(() => {
  document.addEventListener('drawer-open', (e) => {
    console.log('Drawer opened:', e.detail);
  });
  document.addEventListener('drawer-close', (e) => {
    console.log('Drawer closed:', e.detail);
  });
});
```

### Property Changes
```javascript
// Check property changes
const before = await page.locator('snice-drawer').getAttribute('open');
console.log('Open before click:', before);

await page.click('button');
await page.waitForTimeout(100);

const after = await page.locator('snice-drawer').getAttribute('open');
console.log('Open after click:', after);
```

## File Management

### Temporary Test Files
```bash
# Create temp test
echo "test content" > .debug/temp-test.spec.js

# Run test
npx playwright test .debug/temp-test.spec.js

# Clean up
rm .debug/temp-test.spec.js
```

### Persistent Debug Files
- Only keep debug files that are reusable
- Name them descriptively: `debug-drawer-opening.spec.js`
- Add comments explaining what they test

## Example: Debugging Drawer Issue

```javascript
// .debug/debug-drawer-opening.spec.js
import { test } from '@playwright/test';

test('debug drawer opening issue', async ({ page }) => {
  // Listen for console logs and errors
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  // Navigate to demo
  await page.goto('http://localhost:5566/components/drawer/demo.html');
  await page.waitForLoadState('networkidle');

  // Check if custom element is defined
  const isCustomElementDefined = await page.evaluate(() =>
    customElements.get('snice-drawer') !== undefined
  );
  console.log('snice-drawer custom element defined:', isCustomElementDefined);

  // Check drawer initial state
  const drawerState = await page.evaluate(() => {
    const drawer = document.querySelector('#drawer-left');
    return {
      exists: !!drawer,
      open: drawer?.open,
      hasOpenAttr: drawer?.hasAttribute('open'),
      visible: drawer?.style.visibility || 'not set'
    };
  });
  console.log('Initial drawer state:', drawerState);

  // Try to click the button
  const button = page.locator('text=Open Left Drawer');
  const buttonExists = await button.count() > 0;
  console.log('Button exists:', buttonExists);

  if (buttonExists) {
    await button.click();

    // Check state after click
    const afterClickState = await page.evaluate(() => {
      const drawer = document.querySelector('#drawer-left');
      return {
        open: drawer?.open,
        hasOpenAttr: drawer?.hasAttribute('open'),
        classList: Array.from(drawer?.classList || []),
        visibility: getComputedStyle(drawer).visibility
      };
    });
    console.log('State after click:', afterClickState);
  }
});
```

Remember: Always use `.debug/` folder, never create files in root, always headless, no screenshots.