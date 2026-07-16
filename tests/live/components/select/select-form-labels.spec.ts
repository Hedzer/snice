import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadSelect(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });
  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/select/snice-select.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/select/snice-select.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-select.min.js' });
  }
  await page.waitForFunction(() => Boolean(customElements.get('snice-select')));
}

async function installFixture(page: Page) {
  await page.evaluate(async () => {
    document.body.innerHTML = `
      <label id="explicit-primary" for="standard-select">Billing <strong>country</strong></label>
      <label id="explicit-secondary" for="standard-select">required</label>
      <snice-select
        id="standard-select"
        data-contract="standard"
        label="Internal fallback"
        helper-text="Used for tax calculation."
      >
        <snice-option value="us">United States</snice-option>
        <snice-option value="ca">Canada</snice-option>
      </snice-select>

      <label id="wrapped-label">
        <span id="wrapped-label-text">Preferred timezone</span>
        <span aria-hidden="true">ignored decoration</span>
        <snice-select
          id="wrapped-select"
          label="Editable fallback"
          helper-text="Choose a suggested timezone or type one."
          editable
          allow-free-text
        >
          <snice-option value="est">Eastern Time</snice-option>
          <snice-option value="pst">Pacific Time</snice-option>
        </snice-select>
      </label>

      <snice-select id="internal-select" label="Internal region">
        <snice-option value="east">East</snice-option>
      </snice-select>
      <snice-select id="absent-select">
        <snice-option value="one">One</snice-option>
      </snice-select>
      <label id="disabled-label" for="disabled-select">Disabled region</label>
      <snice-select id="disabled-select" disabled>
        <snice-option value="one">One</snice-option>
      </snice-select>
    `;

    const selects = Array.from(document.querySelectorAll('snice-select')) as Array<HTMLElement & {
      ready: Promise<void>;
      rendered: Promise<void>;
    }>;
    await Promise.all(selects.map(select => select.ready));
    await Promise.all(selects.map(select => select.rendered));
    (globalThis as any).__selectLabelOpens = 0;
    document.querySelector('#standard-select')!.addEventListener('select-open', () => {
      (globalThis as any).__selectLabelOpens++;
    });
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`associates explicit, wrapping, multiple, and absent labels through ${build}`, async ({ page }) => {
    await loadSelect(page, build);
    await installFixture(page);

    const standard = page.locator('snice-select[data-contract="standard"]');
    const standardTrigger = standard.locator('.select-trigger');
    const wrapped = page.locator('#wrapped-select');
    const wrappedInput = wrapped.locator('.select-editable-input');

    expect(await page.evaluate(() => {
      const labels = (document.querySelector('#standard-select') as any).labels;
      return Array.from(labels, (label: any) => label.id);
    })).toEqual(['explicit-primary', 'explicit-secondary']);
    await expect(standardTrigger).toHaveAccessibleName('Billing country required');
    await expect(standardTrigger).toHaveAttribute('aria-describedby', /snice-select-desc-/);
    await expect(standard.locator('.select-helper-text')).toHaveText('Used for tax calculation.');
    await expect(standard.locator('.select-helper-text')).toHaveCount(1);

    await page.locator('#explicit-primary').click();
    await expect(standardTrigger).toBeFocused();
    await expect(standard).not.toHaveAttribute('open');
    expect(await page.evaluate(() => (globalThis as any).__selectLabelOpens)).toBe(0);

    await standard.locator('.select-label').click();
    await expect(standardTrigger).toBeFocused();
    await expect(standard).not.toHaveAttribute('open');

    expect(await page.evaluate(() => {
      const labels = (document.querySelector('#wrapped-select') as any).labels;
      return Array.from(labels, (label: any) => label.id);
    })).toEqual(['wrapped-label']);
    await expect(wrappedInput).toHaveAccessibleName('Preferred timezone');
    await expect(wrappedInput).not.toHaveAccessibleName(/Eastern|Pacific|ignored/);
    await expect(wrappedInput).toHaveAttribute('aria-describedby', /snice-select-desc-/);
    await page.locator('#wrapped-label-text').click();
    await expect(wrappedInput).toBeFocused();

    await expect(page.locator('#internal-select').locator('.select-trigger')).toHaveAccessibleName('Internal region');
    await expect(page.locator('#absent-select').locator('.select-trigger')).toHaveAccessibleName('Select');
    expect(await page.evaluate(() => (document.querySelector('#absent-select') as any).labels.length)).toBe(0);

    await page.locator('#disabled-label').click();
    await expect(page.locator('#disabled-select').locator('.select-trigger')).toBeDisabled();
    expect(await page.evaluate(() => (document.querySelector('#disabled-select') as any).open)).toBe(false);
  });

  test(`keeps dynamic label names, targets, and descriptions synchronized through ${build}`, async ({ page }) => {
    await loadSelect(page, build);
    await installFixture(page);

    const standard = page.locator('snice-select[data-contract="standard"]');
    let target = standard.locator('.select-trigger');

    await page.evaluate(() => {
      document.querySelector('#explicit-primary')!.firstChild!.textContent = 'Shipping ';
      (document.querySelector('#explicit-secondary') as HTMLLabelElement).htmlFor = 'absent-select';
      const tertiary = document.createElement('label');
      tertiary.id = 'explicit-tertiary';
      tertiary.htmlFor = 'standard-select';
      tertiary.setAttribute('aria-label', 'destination');
      document.querySelector('#standard-select')!.before(tertiary);
    });
    await expect(target).toHaveAccessibleName('Shipping country destination');
    expect(await page.evaluate(() => (document.querySelector('#standard-select') as any).labels.length)).toBe(2);

    await page.evaluate(() => {
      document.querySelector('#standard-select')!.id = 'renamed-select';
    });
    await expect(target).toHaveAccessibleName('Internal fallback');
    expect(await page.evaluate(() => (document.querySelector('#renamed-select') as any).labels.length)).toBe(0);

    await page.evaluate(() => {
      (document.querySelector('#explicit-primary') as HTMLLabelElement).htmlFor = 'renamed-select';
      (document.querySelector('#explicit-tertiary') as HTMLLabelElement).htmlFor = 'renamed-select';
    });
    await expect(target).toHaveAccessibleName('Shipping country destination');

    await page.evaluate(async () => {
      const select = document.querySelector('#renamed-select') as any;
      select.editable = true;
      await select.rendered;
    });
    target = standard.locator('.select-editable-input');
    await expect(target).toHaveAccessibleName('Shipping country destination');
    await expect(target).toHaveAttribute('aria-describedby', /snice-select-desc-/);
    await page.locator('#explicit-primary').click();
    await expect(target).toBeFocused();

    await page.evaluate(async () => {
      const select = document.querySelector('#renamed-select') as any;
      select.invalid = true;
      select.errorText = 'Choose an available destination.';
      await select.rendered;
    });
    await expect(target).toHaveAttribute('aria-invalid', 'true');
    const description = await target.getAttribute('aria-describedby');
    expect(description).toBeTruthy();
    await expect(standard.locator(`#${description}`)).toHaveText('Choose an available destination.');
    await expect(standard.locator(`#${description}`)).toHaveCount(1);
    await expect(standard.locator('.select-error-text[role="alert"]')).toHaveCount(1);
    await expect(standard.locator('.select-helper-text')).toHaveCount(0);

    await page.evaluate(async () => {
      document.querySelector('#explicit-primary')!.remove();
      document.querySelector('#explicit-tertiary')!.remove();
      const select = document.querySelector('#renamed-select') as any;
      select.remove();
      document.body.append(select);
      await select.ready;
      await select.rendered;
    });
    await expect(target).toHaveAccessibleName('Internal fallback');
    expect(await page.evaluate(() => (document.querySelector('#renamed-select') as any).labels.length)).toBe(0);

    await page.evaluate(async () => {
      const label = document.querySelector('#wrapped-label')!;
      const select = document.querySelector('#wrapped-select') as any;
      label.after(select);
      await select.rendered;
    });
    await expect(page.locator('#wrapped-select').locator('.select-editable-input')).toHaveAccessibleName('Editable fallback');
    expect(await page.evaluate(() => (document.querySelector('#wrapped-select') as any).labels.length)).toBe(0);
  });

  test(`keeps shadow-root labels and ARIA references synchronized through ${build}`, async ({ page }) => {
    await loadSelect(page, build);
    await page.evaluate(async () => {
      const fixture = document.createElement('div');
      fixture.id = 'shadow-label-fixture';
      const root = fixture.attachShadow({ mode: 'open' });
      const referenced = document.createElement('span');
      referenced.id = 'shadow-label-name';
      referenced.textContent = 'Shadow shipping';
      const label = document.createElement('label');
      label.id = 'shadow-explicit-label';
      label.htmlFor = 'shadow:select[quoted]';
      label.setAttribute('aria-labelledby', referenced.id);
      label.textContent = 'Visible fallback';
      const select = document.createElement('snice-select') as HTMLElement & {
        ready: Promise<void>;
        rendered: Promise<void>;
      };
      select.id = 'shadow:select[quoted]';
      select.dataset.shadowContract = 'select';
      select.setAttribute('label', 'Internal shadow fallback');
      select.setAttribute('helper-text', 'Shadow-root description.');
      const option = document.createElement('snice-option');
      option.setAttribute('value', 'one');
      option.textContent = 'One';
      select.append(option);
      root.append(referenced, label, select);
      document.body.replaceChildren(fixture);
      await select.ready;
      await select.rendered;
    });

    const fixture = page.locator('#shadow-label-fixture');
    const select = fixture.locator('snice-select[data-shadow-contract="select"]');
    const target = select.locator('.select-trigger');
    await expect(target).toHaveAccessibleName('Shadow shipping');
    await expect(target).toHaveAttribute('aria-describedby', /snice-select-desc-/);
    expect(await select.evaluate((element: any) => Array.from(element.labels, (label: HTMLLabelElement) => label.id)))
      .toEqual(['shadow-explicit-label']);

    await fixture.locator('#shadow-explicit-label').click();
    await expect(target).toBeFocused();
    expect(await select.evaluate((element: any) => element.open)).toBe(false);

    await fixture.locator('#shadow-label-name').evaluate(node => { node.textContent = 'Shadow billing'; });
    await expect(target).toHaveAccessibleName('Shadow billing');

    await fixture.locator('#shadow-label-name').evaluate(node => node.remove());
    await expect(target).toHaveAccessibleName('Visible fallback');
    await fixture.evaluate(host => {
      const root = host.shadowRoot!;
      const replacement = document.createElement('span');
      replacement.id = 'shadow-label-name';
      replacement.textContent = 'Reinserted destination';
      root.prepend(replacement);
    });
    await expect(target).toHaveAccessibleName('Reinserted destination');

    await fixture.evaluate(async host => {
      const root = host.shadowRoot!;
      const label = root.querySelector('label')!;
      const select = root.querySelector('snice-select') as any;
      label.setAttribute('for', 'unassociated');
      select.remove();
      root.append(select);
      await select.rendered;
    });
    await expect(target).toHaveAccessibleName('Internal shadow fallback');
    expect(await select.evaluate((element: any) => element.labels?.length ?? 0)).toBe(0);

    await fixture.locator('#shadow-explicit-label').evaluate((label: HTMLLabelElement) => {
      label.htmlFor = 'shadow:select[quoted]';
    });
    await expect(target).toHaveAccessibleName('Reinserted destination');
    expect(await select.evaluate((element: any) => element.labels?.length ?? 0)).toBe(1);
  });
}
