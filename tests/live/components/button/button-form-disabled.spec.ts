import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadButton(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/button/snice-button.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/button/snice-button.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-button.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-button')));
}

async function exerciseFieldsetContract(page: Page) {
  return page.evaluate(async () => {
    type ButtonElement = HTMLElement & {
      disabled: boolean;
      href: string;
      target: string;
      type: 'button' | 'submit' | 'reset';
      internals: ElementInternals;
      ready: Promise<void>;
      rendered: Promise<void>;
      click(): void;
    };

    document.body.insertAdjacentHTML('beforeend', `
      <form id="button-form-a">
        <input id="button-reset-input" name="value" value="authored">
        <fieldset id="button-outer" disabled>
          <legend id="button-first-legend">
            <snice-button id="legend-button">Legend ordinary</snice-button>
            <snice-button id="legend-submit" type="submit">Legend submit</snice-button>
            <snice-button id="legend-reset" type="reset">Legend reset</snice-button>
            <snice-button id="legend-nav" href="/guide.html#legend-nav" target="_blank">Legend navigate</snice-button>
          </legend>
          <legend id="button-second-legend">
            <snice-button id="second-legend-button">Second legend</snice-button>
          </legend>
          <snice-button id="blocked-button">Blocked ordinary</snice-button>
          <snice-button id="move-submit" type="submit">Blocked submit</snice-button>
          <snice-button id="blocked-reset" type="reset">Blocked reset</snice-button>
          <snice-button id="blocked-nav" href="/guide.html#blocked-nav" target="_blank">Blocked navigate</snice-button>
          <fieldset id="button-nested-outer">
            <legend><snice-button id="nested-outer-legend">Nested outer legend</snice-button></legend>
            <snice-button id="nested-outer-body">Nested outer body</snice-button>
          </fieldset>
        </fieldset>
        <fieldset id="button-inner" disabled>
          <legend><snice-button id="inner-legend-button">Inner first legend</snice-button></legend>
          <snice-button id="inner-body-button">Inner body</snice-button>
        </fieldset>
      </form>
      <form id="button-form-b"></form>
    `);

    const buttons = Array.from(document.querySelectorAll('snice-button')) as ButtonElement[];
    await Promise.all(buttons.map(button => button.ready));
    await Promise.all(buttons.map(button => button.rendered));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const formA = document.querySelector('#button-form-a') as HTMLFormElement;
    const formB = document.querySelector('#button-form-b') as HTMLFormElement;
    const outer = document.querySelector('#button-outer') as HTMLFieldSetElement;
    const firstLegend = document.querySelector('#button-first-legend') as HTMLLegendElement;
    const resetInput = document.querySelector('#button-reset-input') as HTMLInputElement;
    const originalOpen = window.open;
    const counters = { events: 0, opens: 0, submitA: 0, submitB: 0, resets: 0 };

    window.open = (() => {
      counters.opens++;
      return null;
    }) as typeof window.open;
    buttons.forEach(button => button.addEventListener('button-click', () => counters.events++));
    formA.addEventListener('submit', event => {
      event.preventDefault();
      counters.submitA++;
    });
    formB.addEventListener('submit', event => {
      event.preventDefault();
      counters.submitB++;
    });
    formA.addEventListener('reset', () => counters.resets++);

    const getButton = (id: string) => document.querySelector(`#${id}`) as ButtonElement;
    const state = (id: string) => {
      const button = getButton(id);
      const internal = button.shadowRoot?.querySelector('button') as HTMLButtonElement;
      return {
        authoredDisabled: button.disabled,
        hasDisabledAttribute: button.hasAttribute('disabled'),
        effectiveDisabled: button.matches(':disabled'),
        internalDisabled: internal.disabled,
        disabledClass: internal.classList.contains('button--disabled'),
        form: button.internals.form?.id ?? null,
      };
    };
    const settle = async (button: ButtonElement) => {
      await button.rendered;
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    };
    const activateEveryWay = (button: ButtonElement) => {
      button.click();
      (button.shadowRoot?.querySelector('button') as HTMLButtonElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true, composed: true, cancelable: true })
      );
    };

    const blockedIds = [
      'second-legend-button',
      'blocked-button',
      'move-submit',
      'blocked-reset',
      'blocked-nav',
      'nested-outer-legend',
      'nested-outer-body',
      'inner-body-button',
    ];
    const initiallyDisabled = Object.fromEntries(blockedIds.map(id => [id, state(id)]));
    const initiallyEnabled = Object.fromEntries([
      'legend-button',
      'legend-submit',
      'legend-reset',
      'legend-nav',
      'inner-legend-button',
    ].map(id => [id, state(id)]));

    for (const id of blockedIds) activateEveryWay(getButton(id));
    const blockedCounters = { ...counters };

    resetInput.value = 'changed';
    for (const id of ['legend-button', 'legend-submit', 'legend-reset', 'legend-nav', 'inner-legend-button']) {
      getButton(id).click();
    }
    const enabledCounters = { ...counters };
    const resetValue = resetInput.value;

    const moving = getButton('move-submit');
    formB.appendChild(moving);
    await settle(moving);
    const movedToFormB = state('move-submit');
    moving.click();

    outer.appendChild(moving);
    await settle(moving);
    const movedBackDisabled = state('move-submit');
    moving.click();

    firstLegend.appendChild(moving);
    await settle(moving);
    const movedToLegend = state('move-submit');
    moving.click();

    moving.remove();
    await Promise.resolve();
    outer.appendChild(moving);
    await settle(moving);
    const reconnectedDisabled = state('move-submit');

    moving.disabled = true;
    await settle(moving);
    const authoredWhileFieldsetDisabled = state('move-submit');
    moving.disabled = false;
    await settle(moving);
    const authoredRemovedWhileFieldsetDisabled = state('move-submit');

    outer.disabled = false;
    await settle(moving);
    const enabledAfterFieldset = state('move-submit');
    moving.click();

    resetInput.value = 'changed-again';
    for (const id of ['blocked-button', 'blocked-reset', 'blocked-nav']) getButton(id).click();
    const restoredCounters = { ...counters };
    const restoredResetValue = resetInput.value;

    window.open = originalOpen;
    return {
      initiallyDisabled,
      initiallyEnabled,
      blockedCounters,
      enabledCounters,
      resetValue,
      movedToFormB,
      movedBackDisabled,
      movedToLegend,
      reconnectedDisabled,
      authoredWhileFieldsetDisabled,
      authoredRemovedWhileFieldsetDisabled,
      enabledAfterFieldset,
      restoredCounters,
      restoredResetValue,
    };
  });
}

function assertFieldsetContract(result: Awaited<ReturnType<typeof exerciseFieldsetContract>>) {
  for (const state of Object.values(result.initiallyDisabled)) {
    expect(state).toEqual({
      authoredDisabled: false,
      hasDisabledAttribute: false,
      effectiveDisabled: true,
      internalDisabled: true,
      disabledClass: true,
      form: 'button-form-a',
    });
  }
  for (const state of Object.values(result.initiallyEnabled)) {
    expect(state).toEqual({
      authoredDisabled: false,
      hasDisabledAttribute: false,
      effectiveDisabled: false,
      internalDisabled: false,
      disabledClass: false,
      form: 'button-form-a',
    });
  }
  expect(result.blockedCounters).toEqual({ events: 0, opens: 0, submitA: 0, submitB: 0, resets: 0 });
  expect(result.enabledCounters).toEqual({ events: 5, opens: 1, submitA: 1, submitB: 0, resets: 1 });
  expect(result.resetValue).toBe('authored');
  expect(result.movedToFormB).toMatchObject({
    authoredDisabled: false,
    effectiveDisabled: false,
    internalDisabled: false,
    form: 'button-form-b',
  });
  expect(result.movedBackDisabled).toMatchObject({
    authoredDisabled: false,
    effectiveDisabled: true,
    internalDisabled: true,
    form: 'button-form-a',
  });
  expect(result.movedToLegend).toMatchObject({
    authoredDisabled: false,
    effectiveDisabled: false,
    internalDisabled: false,
    form: 'button-form-a',
  });
  expect(result.reconnectedDisabled).toMatchObject({
    authoredDisabled: false,
    effectiveDisabled: true,
    internalDisabled: true,
    form: 'button-form-a',
  });
  expect(result.authoredWhileFieldsetDisabled).toMatchObject({
    authoredDisabled: true,
    hasDisabledAttribute: true,
    effectiveDisabled: true,
    internalDisabled: true,
  });
  expect(result.authoredRemovedWhileFieldsetDisabled).toMatchObject({
    authoredDisabled: false,
    hasDisabledAttribute: false,
    effectiveDisabled: true,
    internalDisabled: true,
  });
  expect(result.enabledAfterFieldset).toMatchObject({
    authoredDisabled: false,
    effectiveDisabled: false,
    internalDisabled: false,
  });
  expect(result.restoredCounters).toEqual({ events: 11, opens: 2, submitA: 3, submitB: 1, resets: 2 });
  expect(result.restoredResetValue).toBe('authored');
}

async function exerciseCustomerActivation(page: Page) {
  await page.evaluate(async () => {
    document.body.insertAdjacentHTML('beforeend', `
      <form id="button-customer-form">
        <input id="button-customer-input" value="authored">
        <fieldset id="button-customer-fieldset">
          <legend><snice-button id="button-customer-legend">Legend action</snice-button></legend>
          <snice-button id="button-customer-ordinary">Ordinary action</snice-button>
          <snice-button id="button-customer-submit" type="submit">Submit action</snice-button>
          <snice-button id="button-customer-reset" type="reset">Reset action</snice-button>
          <snice-button id="button-customer-nav" href="/guide.html#blocked-customer" target="_blank">Navigate action</snice-button>
          <snice-button id="button-customer-nav-submit" href="/guide.html#nav-submit" target="_blank" type="submit">Navigate, not submit</snice-button>
          <snice-button id="button-customer-nav-reset" href="/guide.html#nav-reset" target="_blank" type="reset">Navigate, not reset</snice-button>
        </fieldset>
      </form>
    `);
    const buttons = Array.from(document.querySelectorAll('#button-customer-form snice-button')) as any[];
    await Promise.all(buttons.map(button => button.ready));
    await Promise.all(buttons.map(button => button.rendered));
    const counters = { events: 0, submits: 0, resets: 0, opens: 0 };
    buttons.forEach(button => button.addEventListener('button-click', () => counters.events++));
    const form = document.querySelector('#button-customer-form') as HTMLFormElement;
    form.addEventListener('submit', event => {
      event.preventDefault();
      counters.submits++;
    });
    form.addEventListener('reset', () => counters.resets++);
    window.open = (() => {
      counters.opens++;
      return null;
    }) as typeof window.open;
    (globalThis as any).__buttonCustomerCounters = counters;
  });

  const fieldset = page.locator('#button-customer-fieldset');
  const blockedIds = [
    'button-customer-ordinary',
    'button-customer-submit',
    'button-customer-reset',
    'button-customer-nav',
    'button-customer-nav-submit',
    'button-customer-nav-reset',
  ];

  for (const id of blockedIds) {
    const control = page.locator(`#${id}`).getByRole('button');
    await fieldset.evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
    await control.focus();
    await fieldset.evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
    await expect(control).toBeDisabled();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await control.click({ force: true });
    await control.dispatchEvent('click');
  }

  expect(await page.evaluate(() => (globalThis as any).__buttonCustomerCounters)).toEqual({
    events: 0,
    submits: 0,
    resets: 0,
    opens: 0,
  });

  const legend = page.locator('#button-customer-legend').getByRole('button');
  await expect(legend).toBeEnabled();
  await legend.click();
  await legend.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');

  await fieldset.evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await page.locator('#button-customer-input').fill('changed');
  for (const id of blockedIds) await page.locator(`#${id}`).getByRole('button').click();

  expect(await page.evaluate(() => ({
    counters: (globalThis as any).__buttonCustomerCounters,
    input: (document.querySelector('#button-customer-input') as HTMLInputElement).value,
  }))).toEqual({
    counters: { events: 9, submits: 1, resets: 1, opens: 3 },
    input: 'authored',
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`honors disabled fieldsets through every button mode in ${build}`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadButton(page, build);
    assertFieldsetContract(await exerciseFieldsetContract(page));
    expect(pageErrors).toEqual([]);
  });

  test(`suppresses and restores real pointer and keyboard activation in ${build}`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await loadButton(page, build);
    await exerciseCustomerActivation(page);
    expect(pageErrors).toEqual([]);
  });
}
