# Playwright Visual Testing

## Overview

Playwright visual tests have been created for all major components to ensure they render correctly and behave as expected in a real browser environment.

## Created Test Specs

The following component specs have been created in `tests/live/components/`:

1. **alert/alert.spec.ts** - Tests alert variants, dismissibility, icons, sizes
2. **avatar/avatar.spec.ts** - Tests image display, initials, fallback icons, shapes, sizes
3. **badge/badge.spec.ts** - Tests variants, sizes, dot/pill styles, icons, max values
4. **button/button.spec.ts** - Tests variants, sizes, disabled/loading states, icons, click behavior
5. **card/card.spec.ts** - Tests header/footer, variants, hoverable/clickable, images
6. **chip/chip.spec.ts** - Tests variants, sizes, removable, clickable, icons, aria-labels
7. **date-picker/date-picker.spec.ts** - Tests calendar, date selection, formats, keyboard navigation (already existed)
8. **input/input.spec.ts** - Tests types, variants, sizes, validation, clear/password toggle, icons
9. **login/login.spec.ts** - Tests form submission, remember me, forgot password, states

## How to Run Playwright Tests

### Prerequisites

1. Install Playwright browsers (first time only):
   ```bash
   npx playwright install chromium
   ```

2. Build the project:
   ```bash
   npm run build
   ```

### Running Tests

1. **Start the development server** in one terminal:
   ```bash
   npm run dev
   ```

   This should start Vite dev server on port 5566 (configured in `vite.config.ts`)

2. **Run Playwright tests** in another terminal:
   ```bash
   npx playwright test tests/live/
   ```

### Running Specific Component Tests

To test individual components:

```bash
# Test just alert component
npx playwright test tests/live/components/alert/

# Test multiple specific components
npx playwright test tests/live/components/alert/ tests/live/components/avatar/

# Run in headed mode to see the browser
npx playwright test tests/live/ --headed

# Run in debug mode
npx playwright test tests/live/ --debug

# Run with UI mode for interactive debugging
npx playwright test tests/live/ --ui
```

### Test Configuration

Playwright config is located at `tests/playwright.config.ts`:
- Base URL: `http://localhost:5566`
- Browser: Chromium (Desktop Chrome)
- Retries: 2 in CI, 0 locally
- Reporter: line (can be changed to 'html' for HTML reports)

## What Each Test Validates

### Visual Checks
- Components render correctly in the DOM
- Correct CSS classes are applied for variants, sizes, states
- Icons, images, and other visual elements are visible
- Slot content is displayed properly

### Interaction Checks
- Click events work correctly
- Form inputs accept and display user input
- Buttons can be clicked (when not disabled)
- Keyboard navigation works (arrow keys, Enter, Escape)
- Hover states apply correctly

### State Management
- Disabled states prevent interaction
- Loading states show appropriate spinners
- Error/invalid states apply correct styling
- Dynamic content updates (e.g., removing chips, clearing inputs)

### Accessibility
- ARIA labels are applied correctly
- Required indicators show on labels
- Disabled/readonly attributes work properly
- Keyboard navigation is functional

## Adding New Component Tests

To add tests for a new component:

1. Create a directory: `tests/live/components/[component-name]/`

2. Create spec file: `tests/live/components/[component-name]/[component-name].spec.ts`

3. Follow the pattern from existing specs:
   ```typescript
   import { test, expect } from '@playwright/test';

   const demoPath = 'http://localhost:5566/components/[component-name]/demo.html';

   test.describe('Snice [ComponentName]', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto(demoPath);
       await page.waitForLoadState('networkidle');
     });

     test('should render component', async ({ page }) => {
       const component = page.locator('snice-[component-name]').first();
       await expect(component).toBeVisible();
     });

     // Add more tests...
   });
   ```

4. Ensure a demo.html file exists at `components/[component-name]/demo.html`

## CI/CD Integration

To run Playwright tests in CI:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Build project
  run: npm run build

- name: Start dev server
  run: npm run dev &

- name: Wait for server
  run: npx wait-on http://localhost:5566

- name: Run Playwright tests
  run: npx playwright test tests/live/
```

## Troubleshooting

**Server not running:**
- Make sure `npm run dev` is running in another terminal
- Check that Vite is serving on port 5566
- Try accessing http://localhost:5566 in your browser

**Tests timing out:**
- Increase timeout in playwright.config.ts
- Check network tab in headed mode to see if resources are loading
- Ensure demo.html files have all necessary imports

**Shadow DOM elements not found:**
- Use locator() instead of querySelector()
- Playwright automatically pierces shadow DOM

**Flaky tests:**
- Add proper waits (waitForLoadState, waitForTimeout)
- Use toBeVisible() instead of toBeTruthy() for elements
- Ensure animations complete before asserting state changes
