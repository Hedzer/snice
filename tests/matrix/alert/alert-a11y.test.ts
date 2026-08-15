/**
 * Matrix slice ALERT / ACCESSIBILITY — the documented a11y surface across every
 * combination that can change it.
 *
 * Dimensions: variant (4) x dismissible (2) = 8 combos for the live region,
 * plus the focused checks below.
 *
 * Documented contract under test (docs/ai/components/alert.md "Accessibility"):
 *   · `role="alert"` with `aria-live="polite"`;
 *   · "Dismiss button is keyboard accessible";
 * and from the Properties table, `title` is a PROPERTY — a `title` attribute
 * left on the host would make the browser paint a native tooltip over the whole
 * alert, so the host must not keep one.
 *
 * The live region deliberately wraps only the icon + content, not the dismiss
 * button: an announced alert should read its message, not "Dismiss alert".
 * That is asserted here as containment rather than assumed.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  VARIANTS, TITLE, MESSAGE,
  combo, comboId, makeAlert, readFacts, removeComponent, wait,
} from './alert-support';

describe('alert matrix: live region', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  for (const variant of VARIANTS) {
    for (const dismissible of [false, true]) {
      const c = combo({ variant, dismissible, titled: true });

      it(`${comboId(c)}: announces politely with role="alert"`, async () => {
        alert = await makeAlert(c);
        const facts = readFacts(alert);
        expect(facts.role).toBe('alert');
        expect(facts.ariaLive).toBe('polite');
      });
    }
  }

  it('the live region contains the message and the title, not the dismiss button', async () => {
    alert = await makeAlert(combo({ titled: true, dismissible: true }));
    const sr = alert.shadowRoot as ShadowRoot;
    const region = sr.querySelector('.alert-region') as HTMLElement;
    const dismiss = sr.querySelector('.alert-dismiss') as HTMLElement;

    expect(region.textContent).toContain(TITLE);
    expect(region.contains(dismiss), 'the dismiss control is not announced content').toBe(false);
  });
});

describe('alert matrix: dismiss control', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  it('the dismiss control is a real button, so it is keyboard reachable', async () => {
    alert = await makeAlert(combo({ dismissible: true }));
    const button = alert.shadowRoot.querySelector('.alert-dismiss') as HTMLElement;

    expect(button.tagName, 'a native button is in the tab order by default').toBe('BUTTON');
    expect(button.getAttribute('type'), 'never submits an enclosing form').toBe('button');
    expect((button.getAttribute('aria-label') ?? '').trim(), 'has an accessible name')
      .not.toBe('');
    expect(button.hasAttribute('disabled')).toBe(false);
  });
});

describe('alert matrix: title is a property, not a native tooltip', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  it('an authored title attribute becomes the property and leaves the host', async () => {
    alert = await makeAlert(combo({ titled: true }));

    expect(alert.title, 'the authored value survives as the property').toBe(TITLE);
    expect(alert.getAttribute('title'), 'no native tooltip over the whole alert').toBe(null);
    expect(readFacts(alert).titleText).toBe(TITLE);
  });

  it('a title assigned later still never lands on the host', async () => {
    alert = await makeAlert(combo());
    alert.title = 'Later';
    await wait(30);

    expect(alert.getAttribute('title')).toBe(null);
    expect(readFacts(alert).titleText).toBe('Later');
    expect(readFacts(alert).message, 'the message is untouched').toBe(MESSAGE);
  });
});
