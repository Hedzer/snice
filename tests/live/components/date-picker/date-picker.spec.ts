import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const demoPath = 'http://localhost:5173/components/date-picker/demo.html';

test.describe('Snice Date Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render date picker components', async ({ page }) => {
    // Check if date picker elements are present
    const datePickers = await page.locator('snice-date-picker').count();
    expect(datePickers).toBeGreaterThan(0);

    // Check basic structure
    const firstPicker = page.locator('snice-date-picker').first();
    await expect(firstPicker).toBeVisible();
    
    // Check if shadow DOM content exists
    const input = firstPicker.locator('.input').first();
    await expect(input).toBeVisible();
    
    const calendarToggle = firstPicker.locator('.calendar-toggle').first();
    await expect(calendarToggle).toBeVisible();
  });

  test('should show calendar when clicking toggle button', async ({ page }) => {
    const firstPicker = page.locator('snice-date-picker').first();
    const calendarToggle = firstPicker.locator('.calendar-toggle');
    const calendar = firstPicker.locator('.calendar');
    
    // Calendar should be hidden initially
    await expect(calendar).not.toBeVisible();
    
    // Click toggle to open calendar
    await calendarToggle.click();
    
    // Calendar should now be visible
    await expect(calendar).toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    const firstPicker = page.locator('snice-date-picker').first();
    const calendarToggle = firstPicker.locator('.calendar-toggle');
    
    // Open calendar
    await calendarToggle.click();
    
    const prevButton = firstPicker.locator('[data-nav="prev-month"]');
    const nextButton = firstPicker.locator('[data-nav="next-month"]');
    const monthButton = firstPicker.locator('.month-button');
    
    // Get initial month text
    const initialMonth = await monthButton.textContent();
    
    // Click next month
    await nextButton.click();
    const nextMonth = await monthButton.textContent();
    expect(nextMonth).not.toBe(initialMonth);
    
    // Click previous month (should go back)
    await prevButton.click();
    const backToInitial = await monthButton.textContent();
    expect(backToInitial).toBe(initialMonth);
  });

  test('should select date when clicking day', async ({ page }) => {
    const firstPicker = page.locator('snice-date-picker').first();
    const input = firstPicker.locator('.input');
    const calendarToggle = firstPicker.locator('.calendar-toggle');
    
    // Open calendar
    await calendarToggle.click();
    
    // Find an enabled day button (not disabled, not empty)
    const dayButton = firstPicker.locator('.day:not(.day--disabled):not(.day--empty)').first();
    const dayText = await dayButton.textContent();
    
    // Click the day
    await dayButton.click();
    
    // Calendar should close
    await expect(firstPicker.locator('.calendar')).not.toBeVisible();
    
    // Input should have a value
    const inputValue = await input.inputValue();
    expect(inputValue).toBeTruthy();
    expect(inputValue).toContain(dayText?.trim());
  });

  test('should clear date when clicking clear button', async ({ page }) => {
    const clearablePicker = page.locator('snice-date-picker[clearable]').first();
    const input = clearablePicker.locator('.input');
    const calendarToggle = clearablePicker.locator('.calendar-toggle');
    
    // First select a date
    await calendarToggle.click();
    const dayButton = clearablePicker.locator('.day:not(.day--disabled):not(.day--empty)').first();
    await dayButton.click();
    
    // Verify date is selected
    const inputValue = await input.inputValue();
    expect(inputValue).toBeTruthy();
    
    // Clear button should be visible
    const clearButton = clearablePicker.locator('.clear-button');
    await expect(clearButton).toBeVisible();
    
    // Click clear
    await clearButton.click();
    
    // Input should be empty
    const clearedValue = await input.inputValue();
    expect(clearedValue).toBe('');
  });

  test('should respect disabled state', async ({ page }) => {
    const disabledPicker = page.locator('snice-date-picker[disabled]').first();
    const input = disabledPicker.locator('.input');
    const calendarToggle = disabledPicker.locator('.calendar-toggle');
    
    // Input should be disabled
    await expect(input).toBeDisabled();
    
    // Calendar toggle should be disabled
    await expect(calendarToggle).toBeDisabled();
    
    // Clicking shouldn't open calendar
    await calendarToggle.click();
    await expect(disabledPicker.locator('.calendar')).not.toBeVisible();
  });

  test('should show correct format placeholders', async ({ page }) => {
    // Test different format pickers
    const formatPickers = await page.locator('snice-date-picker[format]').all();
    
    for (const picker of formatPickers) {
      const format = await picker.getAttribute('format');
      const input = picker.locator('.input');
      const placeholder = await input.getAttribute('placeholder');
      
      switch (format) {
        case 'mm/dd/yyyy':
          expect(placeholder).toBe('MM/DD/YYYY');
          break;
        case 'dd/mm/yyyy':
          expect(placeholder).toBe('DD/MM/YYYY');
          break;
        case 'yyyy-mm-dd':
          expect(placeholder).toBe('YYYY-MM-DD');
          break;
      }
    }
  });

  test('should show labels correctly', async ({ page }) => {
    const labeledPickers = await page.locator('snice-date-picker[label]').all();
    
    for (const picker of labeledPickers) {
      const labelText = await picker.getAttribute('label');
      const label = picker.locator('.label');
      
      if (labelText) {
        await expect(label).toBeVisible();
        await expect(label).toContainText(labelText);
      }
    }
  });

  test('should show required indicator', async ({ page }) => {
    const requiredPicker = page.locator('snice-date-picker[required]').first();
    const label = requiredPicker.locator('.label');
    
    await expect(label).toHaveClass(/label--required/);
  });

  test('should show error state', async ({ page }) => {
    const invalidPicker = page.locator('snice-date-picker[invalid]').first();
    const input = invalidPicker.locator('.input');
    const errorText = invalidPicker.locator('.error-text');
    
    await expect(input).toHaveClass(/input--invalid/);
    await expect(errorText).toBeVisible();
  });

  test('should handle different sizes', async ({ page }) => {
    const smallPicker = page.locator('snice-date-picker[size="small"]').first();
    const mediumPicker = page.locator('snice-date-picker[size="medium"]').first();
    const largePicker = page.locator('snice-date-picker[size="large"]').first();
    
    const smallInput = smallPicker.locator('.input');
    const mediumInput = mediumPicker.locator('.input');
    const largeInput = largePicker.locator('.input');
    
    await expect(smallInput).toHaveClass(/input--small/);
    await expect(mediumInput).toHaveClass(/input--medium/);
    await expect(largeInput).toHaveClass(/input--large/);
  });

  test('should handle different variants', async ({ page }) => {
    const outlinedPicker = page.locator('snice-date-picker[variant="outlined"]').first();
    const filledPicker = page.locator('snice-date-picker[variant="filled"]').first();
    const underlinedPicker = page.locator('snice-date-picker[variant="underlined"]').first();
    
    const outlinedInput = outlinedPicker.locator('.input');
    const filledInput = filledPicker.locator('.input');
    const underlinedInput = underlinedPicker.locator('.input');
    
    await expect(outlinedInput).toHaveClass(/input--outlined/);
    await expect(filledInput).toHaveClass(/input--filled/);
    await expect(underlinedInput).toHaveClass(/input--underlined/);
  });

  test('should close calendar when clicking outside', async ({ page }) => {
    const firstPicker = page.locator('snice-date-picker').first();
    const calendarToggle = firstPicker.locator('.calendar-toggle');
    const calendar = firstPicker.locator('.calendar');
    
    // Open calendar
    await calendarToggle.click();
    await expect(calendar).toBeVisible();
    
    // Click outside the component
    await page.locator('body').click();
    
    // Calendar should close
    await expect(calendar).not.toBeVisible();
  });

  test('should navigate with keyboard', async ({ page }) => {
    const firstPicker = page.locator('snice-date-picker').first();
    const input = firstPicker.locator('.input');
    const calendar = firstPicker.locator('.calendar');
    
    // Focus input and press Enter to open calendar
    await input.focus();
    await page.keyboard.press('Enter');
    
    await expect(calendar).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    await expect(calendar).not.toBeVisible();
  });
});