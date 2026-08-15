/**
 * Smoke slice of the snice-button matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts), exactly as `tests/matrix/table` is; the full
 * button matrix (107 combos) runs only via `npm run test:matrix`. This file
 * deliberately lives at `smoke.test.ts` so it stays collected.
 *
 * What it covers — one marquee combo per family the matrix enumerates:
 *   · presentation — a variant/size pair reaches the base as exactly one hook
 *     each, and the parts contract holds;
 *   · icon         — the `icon` slot produces the `icon` part on the declared
 *     side (the docs' override of the `icon` property);
 *   · loading      — `loading` is aria-busy, NOT native disabledness;
 *   · activation   — the form modes act, and `button-click` follows;
 *   · gating       — `disabled` and `loading` block every channel;
 *   · URL policy   — a rejected scheme neither navigates nor reports.
 *
 * Every assertion routes through the matrix's own oracles
 * (`expectedButtonShape` / `readButtonShape` / `expectedActivation`) so this
 * file cannot drift into asserting something weaker than the suite it stands in
 * for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, unmountAll, expectShape, settle, wait } from '../matrix-utils';
import {
  ICON_SLOT_HTML, expectedButtonShape, readButtonShape, readVariantHooks,
  nativeButton, expectedActivation, UNSAFE_HREF,
} from './button-support';

afterEach(() => { unmountAll(); vi.restoreAllMocks(); });

/** Click the control the way a pointer does — on the native button itself. */
function press(button: HTMLElement): void {
  nativeButton(button)?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

describe('snice-button matrix smoke', () => {
  it('presentation: a variant/size pair renders one hook each and the full parts contract', async () => {
    const button = await mount('snice-button', { variant: 'primary', size: 'large' }, 'Save');

    expectShape(readButtonShape(button), expectedButtonShape({}), 'primary/large');
    expectShape(readVariantHooks(button), {
      variantHooks: ['button--primary'],
      sizeHooks: ['button--large'],
      styleHooks: [],
    }, 'primary/large');
  });

  it('icon: the icon slot renders the icon part after the label for placement=end', async () => {
    const button = await mount(
      'snice-button', { 'icon-placement': 'end' }, `${ICON_SLOT_HTML}Save`);

    expectShape(
      readButtonShape(button),
      expectedButtonShape({ iconMode: 'slot', iconPlacement: 'end' }),
      'slot/end',
    );
  });

  it('loading: aria-busy is set and the control is NOT natively disabled', async () => {
    const button = await mount('snice-button', { loading: true }, 'Saving');
    expectShape(readButtonShape(button), expectedButtonShape({ loading: true }), 'loading');
  });

  it('activation: type=submit submits its owning form and reports button-click', async () => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    const button = document.createElement('snice-button') as any;
    button.setAttribute('type', 'submit');
    button.textContent = 'Submit';
    form.appendChild(button);
    await button.ready;
    await settle(button);

    let submitted = 0;
    let clicks = 0;
    vi.spyOn(form, 'requestSubmit').mockImplementation(() => { submitted++; });
    button.addEventListener('button-click', () => { clicks++; });

    press(button);
    await wait(10);

    const expected = expectedActivation('submit', 'enabled');
    expect({ submitted, clicks }).toEqual({
      submitted: expected.submitted, clicks: expected.buttonClick,
    });
  });

  it('gating: disabled and loading block the form channel and the event alike', async () => {
    for (const gate of ['disabled', 'loading'] as const) {
      const form = document.createElement('form');
      document.body.appendChild(form);
      const button = document.createElement('snice-button') as any;
      button.setAttribute('type', 'submit');
      button.setAttribute(gate, '');
      button.textContent = 'Submit';
      form.appendChild(button);
      await button.ready;
      await settle(button);

      let submitted = 0;
      let clicks = 0;
      vi.spyOn(form, 'requestSubmit').mockImplementation(() => { submitted++; });
      button.addEventListener('button-click', () => { clicks++; });

      press(button);
      button.click();
      await wait(10);

      const expected = expectedActivation('submit', gate);
      expect({ gate, submitted, clicks }).toEqual({
        gate, submitted: expected.submitted, clicks: expected.buttonClick,
      });
    }
  });

  it('URL policy: a javascript: href neither executes, opens, nor reports', async () => {
    (globalThis as any).__sniceMatrixInjected = 0;
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const button = await mount('snice-button', { href: UNSAFE_HREF, target: '_blank' }, 'Go');

    let clicks = 0;
    button.addEventListener('button-click', () => { clicks++; });
    press(button);
    await wait(10);

    const expected = expectedActivation('href-unsafe', 'enabled');
    expect(open).not.toHaveBeenCalled();
    expect((globalThis as any).__sniceMatrixInjected).toBe(0);
    expect(clicks).toBe(expected.buttonClick);
  });
});
