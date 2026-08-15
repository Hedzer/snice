/**
 * snice-button matrix — activation slice.
 *
 * SIZING. The presentation slice crosses appearance; this one crosses the only
 * other thing a button does: decide what a click MEANS. The documented answer
 * has three independent inputs — the activation MODE (button.md "URL Policy",
 * "Target and Download Semantics", the form types), the GATE that may block it
 * ("Disabled Fieldset Contract" plus the `loading` rule on `button-click`), and
 * the ENTRY POINT the activation arrives through. Those genuinely interact:
 * the whole point of the disabled contract is that it holds for every mode and
 * every entry point, so this cross is 8 x 4 x 2 = 64 real questions, not 64
 * restatements.
 *
 * Every combo asserts through `expectedActivation()` — the oracle in
 * button-support.ts, which encodes the doc lines rather than the component.
 */
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest';
import { unmountAll, product, comboId, expectShape, settle, wait } from '../matrix-utils';
import {
  MODES, GATES, ENTRIES, HASH_TARGET, modeAttrs, gateAttrs, expectedActivation, nativeButton,
  type Activation, type Entry, type Gate, type Mode,
} from './button-support';

/**
 * A run of the activation harness. Every documented channel is observed, so a
 * blocked activation is asserted to have done NOTHING rather than merely to
 * have skipped the channel the mode was aiming at.
 */
interface Harness {
  activation: Activation;
  restore: () => void;
}

let harness: Harness | null = null;

beforeEach(() => { (globalThis as any).__sniceMatrixInjected = 0; });

afterEach(() => {
  harness?.restore();
  harness = null;
  unmountAll();
  vi.restoreAllMocks();
});

/**
 * Mount a button for a mode/gate pair and click it through `entry`, recording
 * every documented activation channel.
 *
 * The button always lives inside a <form> so the form modes have an owner; a
 * form is inert for the other modes, which is exactly the point — `href` mode
 * must not reach it.
 */
let hashSeq = 0;

async function activate(mode: Mode, gate: Gate, entry: Entry): Promise<{ activation: Activation; hash: string }> {
  const hash = `${HASH_TARGET}-${++hashSeq}`;
  const startHash = window.location.hash;
  const startHref = window.location.href;

  const activation: Activation = {
    buttonClick: 0, opened: [], downloaded: [], submitted: 0, reset: 0, hash: '',
  };

  const form = document.createElement('form');
  document.body.appendChild(form);
  const submitted = vi.spyOn(form, 'requestSubmit').mockImplementation(() => { activation.submitted++; });
  const reset = vi.spyOn(form, 'reset').mockImplementation(() => { activation.reset++; });

  const open = vi.spyOn(window, 'open').mockImplementation((url?: any, target?: any, features?: any) => {
    activation.opened.push([url, target, features].join('|'));
    return null;
  });

  // The download channel is a detached anchor activation; intercept its click
  // rather than the navigation it would perform.
  const createElement = document.createElement.bind(document);
  const created = vi.spyOn(document, 'createElement').mockImplementation(((tag: string, options?: any) => {
    const node = createElement(tag, options);
    if (String(tag).toLowerCase() === 'a') {
      (node as HTMLAnchorElement).click = () => {
        activation.downloaded.push(
          `${(node as HTMLAnchorElement).getAttribute('href')}|${(node as HTMLAnchorElement).download}`);
      };
    }
    return node;
  }) as any);

  const button = createElement('snice-button') as any;
  for (const [name, value] of Object.entries({ ...modeAttrs(mode, hash), ...gateAttrs(gate) })) {
    if (typeof value === 'boolean') { if (value) button.setAttribute(name, ''); continue; }
    button.setAttribute(name, String(value));
  }
  button.textContent = 'Go';
  form.appendChild(button);
  await button.ready;
  await settle(button);

  // happy-dom implements no fieldset ancestry, so effective disabledness is
  // delivered the way the browser delivers it — see matrix/internals-mock.ts.
  if (gate === 'fieldset') {
    (button as any).formDisabledCallback(true);
    await settle(button, 10);
  }

  button.addEventListener('button-click', () => { activation.buttonClick++; });

  if (entry === 'public') {
    button.click();
  } else {
    nativeButton(button)?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  }
  await wait(10);

  activation.hash = window.location.hash === startHash ? '' : window.location.hash;

  harness = {
    activation,
    restore: () => {
      submitted.mockRestore();
      reset.mockRestore();
      open.mockRestore();
      created.mockRestore();
      window.history.replaceState(null, '', startHref);
    },
  };
  return { activation, hash };
}

describe('button matrix: activation mode x gate x entry', () => {
  for (const combo of product({ mode: MODES, gate: GATES, entry: ENTRIES })) {
    const label = comboId(combo);
    it(label, async () => {
      const { activation, hash } = await activate(combo.mode, combo.gate, combo.entry);
      expectShape(activation as any, expectedActivation(combo.mode, combo.gate, hash) as any, label);
    });
  }
});

describe('button matrix: a rejected href executes nothing', () => {
  for (const entry of ENTRIES) {
    it(`${entry}: a javascript: href neither runs nor reports`, async () => {
      // DOCUMENTED (button.md "URL Policy"): rejected schemes never execute and
      // never produce a success event. The injected counter is the proof that
      // "blocked" means the URL was never handed to the platform at all.
      await activate('href-unsafe', 'enabled', entry);
      expect((globalThis as any).__sniceMatrixInjected, 'the href was executed').toBe(0);
    });
  }
});
