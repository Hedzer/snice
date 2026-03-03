import { test, expect } from '@playwright/test';

const themesUrl = 'http://localhost:5566/themes.html';

test.describe('Theme Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each test starts clean
    await page.goto(themesUrl);
    await page.evaluate(() => {
      localStorage.removeItem('snice-theme-preset');
      localStorage.removeItem('snice-theme-preset-name');
      localStorage.removeItem('snice-theme-custom');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('page loads with preset grid and builder', async ({ page }) => {
    // Preset grid renders cards
    const presetCards = page.locator('.preset-card');
    const count = await presetCards.count();
    expect(count).toBeGreaterThanOrEqual(7);

    // Builder controls container exists
    const builder = page.locator('#builder-controls');
    await expect(builder).toBeVisible();

    // Export section exists
    const exportCode = page.locator('#export-code');
    await expect(exportCode).toBeVisible();
    const exportText = await exportCode.textContent();
    expect(exportText).toContain('Default theme');
  });

  test('default preset is active on fresh load', async ({ page }) => {
    const activeCard = page.locator('.preset-card.active');
    await expect(activeCard).toHaveCount(1);
    const presetName = await activeCard.getAttribute('data-preset');
    expect(presetName).toBe('default');
  });

  test('clicking a preset applies it', async ({ page }) => {
    // Click the ocean preset
    const oceanCard = page.locator('.preset-card[data-preset="ocean"]');
    await oceanCard.click();

    // Ocean should now be active
    await expect(oceanCard).toHaveClass(/active/);

    // Default should no longer be active
    const defaultCard = page.locator('.preset-card[data-preset="default"]');
    await expect(defaultCard).not.toHaveClass(/active/);

    // localStorage should store the preset name
    const storedName = await page.evaluate(() => localStorage.getItem('snice-theme-preset-name'));
    expect(storedName).toBe('ocean');

    // A <style id="snice-theme-preset"> should exist in the DOM
    const hasPresetStyle = await page.evaluate(() => !!document.getElementById('snice-theme-preset'));
    expect(hasPresetStyle).toBe(true);

    // Export output should mention the preset
    const exportText = await page.locator('#export-code').textContent();
    expect(exportText).toContain('ocean');
  });

  test('switching presets updates active card', async ({ page }) => {
    await page.locator('.preset-card[data-preset="forest"]').click();
    await expect(page.locator('.preset-card[data-preset="forest"]')).toHaveClass(/active/);

    await page.locator('.preset-card[data-preset="sunset"]').click();
    await expect(page.locator('.preset-card[data-preset="sunset"]')).toHaveClass(/active/);
    await expect(page.locator('.preset-card[data-preset="forest"]')).not.toHaveClass(/active/);
  });

  test('preset persists across page reload', async ({ page }) => {
    await page.locator('.preset-card[data-preset="violet"]').click();
    await page.reload();
    await page.waitForLoadState('networkidle');

    const activePreset = await page.locator('.preset-card.active').getAttribute('data-preset');
    expect(activePreset).toBe('violet');

    // Preset style should be injected on load
    const hasPresetStyle = await page.evaluate(() => !!document.getElementById('snice-theme-preset'));
    expect(hasPresetStyle).toBe(true);
  });

  test('reset button clears everything', async ({ page }) => {
    // Apply a preset first
    await page.locator('.preset-card[data-preset="ocean"]').click();

    // Click reset
    await page.locator('#reset-btn').click();

    // Should be back to default
    const activePreset = await page.locator('.preset-card.active').getAttribute('data-preset');
    expect(activePreset).toBe('default');

    // Preset style should be removed
    const hasPresetStyle = await page.evaluate(() => !!document.getElementById('snice-theme-preset'));
    expect(hasPresetStyle).toBe(false);

    // Custom style should be removed
    const hasCustomStyle = await page.evaluate(() => !!document.getElementById('snice-theme-custom'));
    expect(hasCustomStyle).toBe(false);

    // localStorage should be cleared
    const storedPreset = await page.evaluate(() => localStorage.getItem('snice-theme-preset'));
    expect(storedPreset).toBeNull();

    // Export should say default
    const exportText = await page.locator('#export-code').textContent();
    expect(exportText).toContain('Default theme');
  });

  test('builder renders control groups', async ({ page }) => {
    const groups = page.locator('.builder-group');
    const count = await groups.count();
    // Should have at least the main groups: semantic colors, surface, text, border, typography, spacing, radius, shadows, transitions, focus
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('collapsible sections toggle', async ({ page }) => {
    // Gray primitives should start collapsed
    const grayHeader = page.locator('.builder-section-header:has-text("Gray")');
    await expect(grayHeader).toHaveClass(/collapsed/);

    // Its body should be hidden
    const grayBody = grayHeader.locator('~ .builder-section-body');
    await expect(grayBody).toBeHidden();

    // Click to expand
    await grayHeader.click();
    await expect(grayHeader).not.toHaveClass(/collapsed/);
    await expect(grayBody).toBeVisible();

    // Click to collapse again
    await grayHeader.click();
    await expect(grayHeader).toHaveClass(/collapsed/);
    await expect(grayBody).toBeHidden();
  });

  test('semantic colors section has color pickers', async ({ page }) => {
    // Semantic Colors section should have color pickers
    const semanticHeader = page.locator('.builder-section-header:has-text("Semantic Colors")');
    const semanticBody = semanticHeader.locator('~ .builder-section-body');
    const pickers = semanticBody.locator('snice-color-picker');
    const count = await pickers.count();
    // Should have primary, primary-hover, success, success-hover, warning, warning-hover, danger, danger-hover, neutral
    expect(count).toBe(9);
  });

  test('border radius quick presets work', async ({ page }) => {
    // Find the radius section
    const radiusHeader = page.locator('.builder-section-header:has-text("Border Radius")');
    const radiusBody = radiusHeader.locator('~ .builder-section-body');

    // Click "Pill" preset
    const pillBtn = radiusBody.locator('.builder-btn:has-text("Pill")');
    await pillBtn.click();

    // Should inject custom style
    const hasCustom = await page.evaluate(() => !!document.getElementById('snice-theme-custom'));
    expect(hasCustom).toBe(true);

    // Computed border-radius-xl should be 9999px (pill)
    const xlRadius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-border-radius-xl').trim()
    );
    expect(xlRadius).toBe('9999px');
  });

  test('shadow intensity presets work', async ({ page }) => {
    const shadowHeader = page.locator('.builder-section-header:has-text("Shadows")');
    const shadowBody = shadowHeader.locator('~ .builder-section-body');

    // Click "None"
    const noneBtn = shadowBody.locator('.builder-btn:has-text("None")');
    await noneBtn.click();

    const shadowMd = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-shadow-md').trim()
    );
    expect(shadowMd).toBe('none');

    // Now click "Dramatic"
    const dramaticBtn = shadowBody.locator('.builder-btn:has-text("Dramatic")');
    await dramaticBtn.click();

    const shadowMd2 = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-shadow-md').trim()
    );
    expect(shadowMd2).not.toBe('none');
    expect(shadowMd2.length).toBeGreaterThan(5);
  });

  test('theme dot shows for non-default preset', async ({ page }) => {
    // Default should have dot hidden
    const dot = page.locator('#theme-dot');
    await expect(dot).toBeHidden();

    // Apply preset
    await page.locator('.preset-card[data-preset="rose"]').click();

    // Dot should be visible
    await expect(dot).toBeVisible();
  });

  test('theme dot shows for custom overrides', async ({ page }) => {
    const dot = page.locator('#theme-dot');
    await expect(dot).toBeHidden();

    // Apply a radius preset to create custom overrides
    const radiusHeader = page.locator('.builder-section-header:has-text("Border Radius")');
    const radiusBody = radiusHeader.locator('~ .builder-section-body');
    await radiusBody.locator('.builder-btn:has-text("Round")').click();

    await expect(dot).toBeVisible();
  });

  test('export CSS updates when preset changes', async ({ page }) => {
    const exportCode = page.locator('#export-code');

    // Default shows no overrides
    let text = await exportCode.textContent();
    expect(text).toContain('Default theme');

    // Apply ocean preset
    await page.locator('.preset-card[data-preset="ocean"]').click();
    text = await exportCode.textContent();
    expect(text).toContain(':root');
    expect(text).toContain('ocean');
    expect(text).toContain('--snice-color');
  });

  test('export CSS includes custom overrides', async ({ page }) => {
    // Apply a shadow preset
    const shadowHeader = page.locator('.builder-section-header:has-text("Shadows")');
    const shadowBody = shadowHeader.locator('~ .builder-section-body');
    await shadowBody.locator('.builder-btn:has-text("None")').click();

    const text = await page.locator('#export-code').textContent();
    expect(text).toContain('--snice-shadow');
    expect(text).toContain('none');
  });

  test('preview panel contains themed components', async ({ page }) => {
    const preview = page.locator('.theme-preview-panel');
    await expect(preview).toBeVisible();

    // Should contain buttons
    expect(await preview.locator('snice-button').count()).toBeGreaterThan(0);
    // Should contain input
    expect(await preview.locator('snice-input').count()).toBeGreaterThan(0);
    // Should contain checkbox and switch
    expect(await preview.locator('snice-checkbox').count()).toBeGreaterThan(0);
    expect(await preview.locator('snice-switch').count()).toBeGreaterThan(0);
    // Should contain slider
    expect(await preview.locator('snice-slider').count()).toBeGreaterThan(0);
    // Should contain alerts
    expect(await preview.locator('snice-alert').count()).toBeGreaterThan(0);
    // Should contain badges and chips
    expect(await preview.locator('snice-badge').count()).toBeGreaterThan(0);
    expect(await preview.locator('snice-chip').count()).toBeGreaterThan(0);
    // Should contain tabs
    expect(await preview.locator('snice-tabs').count()).toBeGreaterThan(0);
  });

  test('light/dark toggle re-renders builder controls', async ({ page }) => {
    // Apply a preset so there's something to see
    await page.locator('.preset-card[data-preset="ocean"]').click();

    // Toggle to light mode
    await page.locator('.theme-btn').click();

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // Should be either light or dark (toggled from initial)
    expect(['light', 'dark']).toContain(theme);

    // Builder should still have controls
    const groups = page.locator('.builder-group');
    expect(await groups.count()).toBeGreaterThanOrEqual(10);
  });

  test('all presets can be applied without errors', async ({ page }) => {
    // Listen for page errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const presetNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.preset-card')).map(
        el => el.getAttribute('data-preset')
      );
    });

    for (const name of presetNames) {
      await page.locator(`.preset-card[data-preset="${name}"]`).click();
      // Verify it became active
      const activePreset = await page.locator('.preset-card.active').getAttribute('data-preset');
      expect(activePreset).toBe(name);
    }

    expect(errors).toEqual([]);
  });

  test('custom overrides cleared when switching presets', async ({ page }) => {
    // Apply a custom override via radius preset
    const radiusHeader = page.locator('.builder-section-header:has-text("Border Radius")');
    const radiusBody = radiusHeader.locator('~ .builder-section-body');
    await radiusBody.locator('.builder-btn:has-text("Pill")').click();

    // Custom style should exist
    let hasCustom = await page.evaluate(() => !!document.getElementById('snice-theme-custom'));
    expect(hasCustom).toBe(true);

    // Switch to a different preset — custom overrides get cleared
    await page.locator('.preset-card[data-preset="forest"]').click();
    hasCustom = await page.evaluate(() => !!document.getElementById('snice-theme-custom'));
    expect(hasCustom).toBe(false);
  });

  test('typography section has text inputs and sliders', async ({ page }) => {
    const typoHeader = page.locator('.builder-section-header:has-text("Typography")');
    const typoBody = typoHeader.locator('~ .builder-section-body');

    // Should have text inputs for font family
    const textInputs = typoBody.locator('snice-input');
    expect(await textInputs.count()).toBeGreaterThanOrEqual(2);

    // Should have sliders for font sizes
    const sliders = typoBody.locator('snice-slider');
    expect(await sliders.count()).toBeGreaterThanOrEqual(8);
  });

  test('spacing section has sliders', async ({ page }) => {
    const spacingHeader = page.locator('.builder-section-header:has-text("Spacing")');
    const spacingBody = spacingHeader.locator('~ .builder-section-body');

    const sliders = spacingBody.locator('snice-slider');
    expect(await sliders.count()).toBe(9);
  });

  test('transitions section has sliders', async ({ page }) => {
    const transHeader = page.locator('.builder-section-header:has-text("Transitions")');
    const transBody = transHeader.locator('~ .builder-section-body');

    const sliders = transBody.locator('snice-slider');
    expect(await sliders.count()).toBe(3);
  });

  test('copy CSS button exists and is clickable', async ({ page }) => {
    const copyBtn = page.locator('#copy-css-btn');
    await expect(copyBtn).toBeVisible();

    // Click it (clipboard API may not work in headless, but it shouldn't error)
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Grant clipboard permission
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await copyBtn.click();

    // Button text should temporarily change to "Copied!"
    await expect(copyBtn).toContainText('Copied!');

    // After timeout it should revert
    await page.waitForTimeout(2000);
    await expect(copyBtn).toContainText('Copy CSS');

    expect(errors).toEqual([]);
  });
});

// ── CSS output & computed style validation ──
test.describe('Theme Editor — CSS applies to components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(themesUrl);
    await page.evaluate(() => {
      localStorage.removeItem('snice-theme-preset');
      localStorage.removeItem('snice-theme-preset-name');
      localStorage.removeItem('snice-theme-custom');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Wait for custom elements to be defined
    await page.waitForFunction(() => customElements.get('snice-button') !== undefined);
  });

  /** Read the computed background-color of the first primary button's inner <button> */
  async function getPrimaryButtonBg(page: any) {
    return page.evaluate(() => {
      const host = document.querySelector('.theme-preview-panel snice-button[variant="primary"]');
      if (!host?.shadowRoot) return null;
      const inner = host.shadowRoot.querySelector('button, .button');
      if (!inner) return null;
      return getComputedStyle(inner).backgroundColor;
    });
  }

  /** Parse "rgb(r, g, b)" to [r, g, b] */
  function parseRgb(rgb: string): [number, number, number] | null {
    const m = rgb.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }

  test('default preset: primary button is blue (~#2563eb)', async ({ page }) => {
    const bg = await getPrimaryButtonBg(page);
    expect(bg).not.toBeNull();
    const [r, g, b] = parseRgb(bg)!;
    // Default blue primary: rgb(37, 99, 235) — blue channel dominant
    expect(b).toBeGreaterThan(180);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  test('ocean preset: primary button shifts to teal', async ({ page }) => {
    // Capture default first
    const defaultBg = await getPrimaryButtonBg(page);
    const [dr, dg, db] = parseRgb(defaultBg)!;

    // Apply ocean
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(100); // let reflow happen

    const oceanBg = await getPrimaryButtonBg(page);
    expect(oceanBg).not.toBeNull();
    const [or, og, ob] = parseRgb(oceanBg)!;

    // Ocean primary is teal (~hsl(192 91% 36%) ≈ rgb(8,145,178))
    // Green channel should be much higher than default, blue stays moderate
    expect(og).toBeGreaterThan(dg + 20); // green increased significantly
    // Teal means green > red
    expect(og).toBeGreaterThan(or);
    // And it should be clearly different from the default blue
    expect(Math.abs(ob - db) + Math.abs(og - dg) + Math.abs(or - dr)).toBeGreaterThan(50);
  });

  test('sunset preset: primary button shifts to orange', async ({ page }) => {
    await page.locator('.preset-card[data-preset="sunset"]').click();
    await page.waitForTimeout(100);

    const bg = await getPrimaryButtonBg(page);
    expect(bg).not.toBeNull();
    const [r, g, b] = parseRgb(bg)!;

    // Sunset primary is orange (~hsl(21 90% 48%) ≈ rgb(233,88,12))
    // Red channel dominant, blue very low
    expect(r).toBeGreaterThan(180);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
    expect(b).toBeLessThan(80);
  });

  test('forest preset: primary button shifts to green', async ({ page }) => {
    await page.locator('.preset-card[data-preset="forest"]').click();
    await page.waitForTimeout(100);

    const bg = await getPrimaryButtonBg(page);
    expect(bg).not.toBeNull();
    const [r, g, b] = parseRgb(bg)!;

    // Forest primary: green-based hues via green primitives mapped to blue slots
    // hsl(142 72% 29%) ≈ rgb(21,127,52) — green dominant
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  test('violet preset: primary button shifts to purple', async ({ page }) => {
    await page.locator('.preset-card[data-preset="violet"]').click();
    await page.waitForTimeout(100);

    const bg = await getPrimaryButtonBg(page);
    expect(bg).not.toBeNull();
    const [r, g, b] = parseRgb(bg)!;

    // Violet primary: purple-ish hue — red and blue higher than green
    expect(r).toBeGreaterThan(g);
    expect(b).toBeGreaterThan(g);
  });

  test('rose preset: primary button shifts to pink/rose', async ({ page }) => {
    await page.locator('.preset-card[data-preset="rose"]').click();
    await page.waitForTimeout(100);

    const bg = await getPrimaryButtonBg(page);
    expect(bg).not.toBeNull();
    const [r, g, b] = parseRgb(bg)!;

    // Rose primary: pink hue — red dominant
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(100);
  });

  test('preset affects computed --snice-color-primary on :root', async ({ page }) => {
    // Default primary
    const defaultPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );
    expect(defaultPrimary).toBeTruthy();

    // Apply ocean
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(100);

    const oceanPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );
    expect(oceanPrimary).toBeTruthy();
    // The values should differ
    expect(oceanPrimary).not.toBe(defaultPrimary);
  });

  test('preset changes cascade to text, border, and background vars', async ({ page }) => {
    // Record default values
    const getVars = () => page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        text: cs.getPropertyValue('--snice-color-text').trim(),
        border: cs.getPropertyValue('--snice-color-border').trim(),
        bgSecondary: cs.getPropertyValue('--snice-color-background-secondary').trim(),
      };
    });
    const defaults = await getVars();

    // Apply ocean — it changes gray primitives so text/border/bg cascade
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(100);
    const ocean = await getVars();

    // At least one variable should differ (gray primitives changed)
    const changed = defaults.text !== ocean.text
      || defaults.border !== ocean.border
      || defaults.bgSecondary !== ocean.bgSecondary;
    expect(changed).toBe(true);
  });

  test('reset brings computed primary CSS variable back to default', async ({ page }) => {
    const getPrimary = () => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );
    const defaultPrimary = await getPrimary();

    // Apply ocean, verify it changed
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(100);
    const oceanPrimary = await getPrimary();
    expect(oceanPrimary).not.toBe(defaultPrimary);

    // Reset, verify it matches original
    await page.locator('#reset-btn').click();
    await page.waitForTimeout(100);
    const resetPrimary = await getPrimary();
    expect(resetPrimary).toBe(defaultPrimary);
  });

  test('border radius preset visually affects preview input', async ({ page }) => {
    // Wait for input custom element
    await page.waitForFunction(() => customElements.get('snice-input') !== undefined);

    // Query the actual <input> element inside shadow DOM (not the wrapper)
    const getInputRadius = () => page.evaluate(() => {
      const host = document.querySelector('.theme-preview-panel snice-input') as any;
      if (!host?.shadowRoot) return '';
      const inner = host.shadowRoot.querySelector('input.input');
      if (!inner) return '';
      return getComputedStyle(inner).borderRadius;
    });

    const defaultRadius = await getInputRadius();
    expect(defaultRadius).toBeTruthy();

    // Apply "Pill" radius preset
    const radiusHeader = page.locator('.builder-section-header:has-text("Border Radius")');
    const radiusBody = radiusHeader.locator('~ .builder-section-body');
    await radiusBody.locator('.builder-btn:has-text("Pill")').click();
    await page.waitForTimeout(100);

    const pillRadius = await getInputRadius();
    // Pill should have much larger radius than default (4px → 16px)
    expect(pillRadius).not.toBe(defaultRadius);
    const pillNum = parseFloat(pillRadius);
    const defaultNum = parseFloat(defaultRadius);
    expect(pillNum).toBeGreaterThan(defaultNum);
  });

  test('exported CSS contains valid variable declarations for applied preset', async ({ page }) => {
    await page.locator('.preset-card[data-preset="ocean"]').click();

    const exportText = await page.locator('#export-code').textContent() ?? '';

    // Should contain :root block
    expect(exportText).toContain(':root');

    // Should contain ocean's blue primitive overrides
    expect(exportText).toContain('--snice-color-blue-600');

    // Should contain gray overrides (ocean changes grays too)
    expect(exportText).toContain('--snice-color-gray-');

    // Values should be valid HSL triples (not empty or "undefined")
    expect(exportText).not.toContain('undefined');
    expect(exportText).not.toContain(': ;');

    // Each variable line should have a value
    const varLines = exportText.split('\n').filter(l => l.includes('--snice-'));
    expect(varLines.length).toBeGreaterThan(10);
    for (const line of varLines) {
      const match = line.match(/:\s*(.+?);/);
      if (match) {
        expect(match[1].trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('exported CSS can be re-applied and produces same computed primary', async ({ page }) => {
    // Apply ocean
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(100);

    // Get the primary color with ocean active
    const oceanPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );

    // Get the exported CSS
    const exportedCSS = await page.locator('#export-code').textContent() ?? '';

    // Reset to default
    await page.locator('#reset-btn').click();
    await page.waitForTimeout(100);

    // Verify we're back to default
    const defaultPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );
    expect(defaultPrimary).not.toBe(oceanPrimary);

    // Now inject the exported CSS as a new style tag
    await page.evaluate((css) => {
      const style = document.createElement('style');
      style.id = 'test-reapply';
      style.textContent = css;
      document.head.appendChild(style);
    }, exportedCSS);
    await page.waitForTimeout(100);

    // Primary should now match the ocean value again
    const reappliedPrimary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
    );
    expect(reappliedPrimary).toBe(oceanPrimary);
  });

  test('dark mode preset overrides apply in dark mode', async ({ page }) => {
    // Switch to dark mode
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(200);

    // Record default dark background
    const defaultDarkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-background').trim()
    );

    // Apply ocean (it has cssDark overrides for background)
    await page.locator('.preset-card[data-preset="ocean"]').click();
    await page.waitForTimeout(200);

    const oceanDarkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-color-background').trim()
    );

    // Ocean dark background should differ from default dark
    expect(oceanDarkBg).not.toBe(defaultDarkBg);
  });

  test('each preset produces unique primary color', async ({ page }) => {
    const presetNames = ['default', 'ocean', 'forest', 'sunset', 'violet', 'rose'];
    const primaries: Record<string, string> = {};

    for (const name of presetNames) {
      if (name === 'default') {
        await page.locator('#reset-btn').click();
      } else {
        await page.locator(`.preset-card[data-preset="${name}"]`).click();
      }
      await page.waitForTimeout(100);

      primaries[name] = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim()
      );
    }

    // All should be unique (no two presets produce the same primary)
    const values = Object.values(primaries);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
