import { test } from '@playwright/test';

test('debug date picker rendering', async ({ page }) => {
  await page.goto('http://localhost:5566/components/date-picker/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/datepicker-debug.png', fullPage: true });

  // Check first date picker
  const firstPicker = page.locator('snice-date-picker').first();

  // Get the full HTML
  const html = await firstPicker.evaluate((el) => el.shadowRoot?.innerHTML || 'NO SHADOW ROOT');
  console.log('=== FIRST DATE PICKER SHADOW DOM HTML ===');
  console.log(html.substring(0, 2000));

  // Check if calendar is visible
  const calendarVisible = await firstPicker.evaluate((el) => {
    const calendar = el.shadowRoot?.querySelector('.calendar-container');
    return calendar ? window.getComputedStyle(calendar).display : 'not found';
  });
  console.log('Calendar display:', calendarVisible);

  // Open the calendar
  await firstPicker.click();
  await page.waitForTimeout(500);

  // Get calendar HTML after opening
  const calendarHTML = await firstPicker.evaluate((el) => {
    const calendar = el.shadowRoot?.querySelector('.calendar-container');
    return calendar?.innerHTML.substring(0, 2000) || 'NO CALENDAR';
  });
  console.log('=== CALENDAR HTML AFTER OPENING ===');
  console.log(calendarHTML);

  // Check weekdays
  const weekdays = await firstPicker.evaluate((el) => {
    const weekdayEls = el.shadowRoot?.querySelectorAll('.weekday');
    return Array.from(weekdayEls || []).map((w: any) => w.textContent);
  });
  console.log('Weekdays:', weekdays);

  // Check day buttons
  const dayButtons = await firstPicker.evaluate((el) => {
    const buttons = el.shadowRoot?.querySelectorAll('.day');
    return Array.from(buttons || []).slice(0, 10).map((b: any) => ({
      text: b.textContent,
      classes: b.className,
      html: b.outerHTML
    }));
  });
  console.log('First 10 day buttons:', JSON.stringify(dayButtons, null, 2));
});
