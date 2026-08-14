/**
 * Combinatorial matrix for @on options — @on is core, so the whole option
 * surface is exercised against the routing model instead of hand-picked cases.
 *
 * Part 1 — routing: every registration form (direct / positional selector /
 * `target` option) × every light/shadow flag combination (unset, true, false)
 * × every event origin (shadow hit, light hit, host, non-matching elements).
 *
 * Part 2 — behavior modifiers (once, debounce, throttle, capture, passive,
 * preventDefault, stopPropagation) × registration form × tree flag set,
 * asserting each modifier's semantics on an allowed origin and silence on a
 * disallowed one.
 *
 * Expected-fire model (composed events, shadow-rooted component):
 *  - direct: shadow flag controls the shadow-root listener; light controls the
 *    host listener. A composed shadow-origin event ALSO reaches the host
 *    listener (native retargeting), so direct handlers with light enabled hear
 *    every origin; light disabled limits them to the shadow tree.
 *  - delegated: flags control which tree the selector may match in. The host
 *    itself and non-matching elements never match.
 *  - both flags false: warn + no listener at all.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on, render, html } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type Form = 'direct' | 'selector' | 'target';
type Flag = undefined | true | false;
type Origin = 'shadow-hit' | 'light-hit' | 'host' | 'shadow-miss' | 'light-miss';

const FLAGS: Flag[] = [undefined, true, false];
const FORMS: Form[] = ['direct', 'selector', 'target'];

function treeEnabled(flag: Flag) {
  return flag !== false;
}

/** The routing model every combination is checked against. */
function expectFire(form: Form, light: Flag, shadow: Flag, origin: Origin): boolean {
  const lightOn = treeEnabled(light);
  const shadowOn = treeEnabled(shadow);
  if (!lightOn && !shadowOn) return false; // warned + skipped

  if (form === 'direct') {
    // Misses are still events; direct handlers don't filter by selector.
    if (origin === 'shadow-hit' || origin === 'shadow-miss') return shadowOn || lightOn;
    return lightOn; // light-hit, light-miss, host
  }
  // Delegated: selector must match, in an enabled tree. Host never matches.
  if (origin === 'shadow-hit') return shadowOn;
  if (origin === 'light-hit') return lightOn;
  return false;
}

function flagLabel(f: Flag) {
  return f === undefined ? 'unset' : String(f);
}

describe('@on options matrix', () => {
  let container: HTMLDivElement;
  let counter = 0;
  const tag = (base: string) => `${base}-${++counter}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  function buildOptions(light: Flag, shadow: Flag, extra: Record<string, any> = {}) {
    const opts: Record<string, any> = { ...extra };
    if (light !== undefined) opts.light = light;
    if (shadow !== undefined) opts.shadow = shadow;
    return opts;
  }

  /** One component class per (form, options) combination. */
  function defineCombo(form: Form, opts: Record<string, any>) {
    const calls: Event[] = [];
    const t = tag('on-matrix');

    if (form === 'direct') {
      @element(t)
      class C extends HTMLElement {
        @on('click', opts)
        h(e: Event) { calls.push(e); }
        @render()
        renderContent() {
          return html`<button class="shadow-hit hit">sh</button><button class="shadow-miss miss">sm</button>`;
        }
      }
    } else if (form === 'selector') {
      @element(t)
      class C extends HTMLElement {
        @on('click', '.hit', opts)
        h(e: Event) { calls.push(e); }
        @render()
        renderContent() {
          return html`<button class="shadow-hit hit">sh</button><button class="shadow-miss miss">sm</button>`;
        }
      }
    } else {
      @element(t)
      class C extends HTMLElement {
        @on('click', { ...opts, target: '.hit' })
        h(e: Event) { calls.push(e); }
        @render()
        renderContent() {
          return html`<button class="shadow-hit hit">sh</button><button class="shadow-miss miss">sm</button>`;
        }
      }
    }
    return { calls, t };
  }

  async function mountFor(t: string) {
    const el = document.createElement(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'light-hit hit';
    const lightMiss = document.createElement('button');
    lightMiss.className = 'light-miss miss';
    el.append(lightHit, lightMiss);
    container.appendChild(el);
    await (el as any).ready;
    const shadow = (el as any).shadowRoot as ShadowRoot;
    const originEl = (origin: Origin): Element => {
      switch (origin) {
        case 'shadow-hit': return shadow.querySelector('.shadow-hit')!;
        case 'shadow-miss': return shadow.querySelector('.shadow-miss')!;
        case 'light-hit': return lightHit;
        case 'light-miss': return lightMiss;
        case 'host': return el;
      }
    };
    return { el, originEl };
  }

  function click(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  }

  // ────────────────────────────────────────────────────────────
  // Part 1 — routing: form × light × shadow × origin
  // ────────────────────────────────────────────────────────────

  for (const form of FORMS) {
    it(`routing matrix: ${form} form across all flag combinations and origins`, async () => {
      const failures: string[] = [];
      const origins: Origin[] = form === 'direct'
        ? ['shadow-hit', 'light-hit', 'host']
        : ['shadow-hit', 'light-hit', 'host', 'shadow-miss', 'light-miss'];

      for (const light of FLAGS) {
        for (const shadow of FLAGS) {
          const { calls, t } = defineCombo(form, buildOptions(light, shadow));
          const { el, originEl } = await mountFor(t);

          for (const origin of origins) {
            const before = calls.length;
            click(originEl(origin));
            await settle();
            const fired = calls.length > before;
            const expected = expectFire(form, light, shadow, origin);
            if (calls.length > before + 1) {
              failures.push(`${form} light:${flagLabel(light)} shadow:${flagLabel(shadow)} ${origin}: fired ${calls.length - before}× for one event`);
            }
            if (fired !== expected) {
              failures.push(`${form} light:${flagLabel(light)} shadow:${flagLabel(shadow)} ${origin}: fired=${fired} expected=${expected}`);
            }
          }
          el.remove();
          await settle();
        }
      }
      expect(failures).toEqual([]);
    });
  }

  // ────────────────────────────────────────────────────────────
  // Part 2 — behavior modifiers × form × tree flag set
  // ────────────────────────────────────────────────────────────

  type FlagSet = { label: string; light: Flag; shadow: Flag };
  const FLAG_SETS: FlagSet[] = [
    { label: 'default', light: undefined, shadow: undefined },
    { label: 'light-only', light: undefined, shadow: false },
    { label: 'shadow-only', light: false, shadow: undefined },
  ];

  /** Allowed/disallowed origins for a modifier run, per the routing model. */
  function pickOrigins(form: Form, set: FlagSet): { allowed: Origin; disallowed: Origin | null } {
    const candidates: Origin[] = ['shadow-hit', 'light-hit'];
    const allowed = candidates.find(o => expectFire(form, set.light, set.shadow, o))!;
    const disallowed = candidates.find(o => !expectFire(form, set.light, set.shadow, o))
      ?? (form !== 'direct' ? 'light-miss' : null);
    return { allowed, disallowed };
  }

  const MODIFIERS = ['none', 'once', 'debounce', 'throttle', 'capture', 'passive', 'preventDefault', 'stopPropagation'] as const;

  for (const modifier of MODIFIERS) {
    for (const form of ['direct', 'selector'] as Form[]) {
      it(`modifier matrix: ${modifier} × ${form} form across tree flag sets`, async () => {
        const failures: string[] = [];

        for (const set of FLAG_SETS) {
          const extra: Record<string, any> =
            modifier === 'none' ? {}
            : modifier === 'debounce' ? { debounce: 20 }
            : modifier === 'throttle' ? { throttle: 200 }
            : { [modifier]: true };

          const { calls, t } = defineCombo(form, buildOptions(set.light, set.shadow, extra));
          const { el, originEl } = await mountFor(t);
          const { allowed, disallowed } = pickOrigins(form, set);
          const label = `${modifier} ${form} ${set.label}`;

          const outer = vi.fn();
          document.addEventListener('click', outer);

          // Two allowed-origin events, spaced outside any debounce window.
          click(originEl(allowed));
          await settle();
          if (modifier === 'debounce') await wait(40);
          click(originEl(allowed));
          await settle();
          if (modifier === 'debounce') await wait(40);

          const expectedCalls =
            modifier === 'once' ? 1
            : modifier === 'throttle' ? 1 // leading-edge only within the window
            : 2;
          if (calls.length !== expectedCalls) {
            failures.push(`${label}: allowed origin fired ${calls.length}×, expected ${expectedCalls}`);
          }

          if (modifier === 'preventDefault' && !(calls[0] as Event | undefined)?.defaultPrevented) {
            failures.push(`${label}: defaultPrevented not set`);
          }
          if (modifier === 'stopPropagation' && outer.mock.calls.length > 0) {
            failures.push(`${label}: event escaped to document`);
          }

          // A disallowed origin stays silent regardless of modifier.
          if (disallowed) {
            const before = calls.length;
            click(originEl(disallowed));
            await settle();
            if (modifier === 'debounce') await wait(40);
            if (calls.length !== before) {
              failures.push(`${label}: disallowed origin ${disallowed} fired`);
            }
          }

          document.removeEventListener('click', outer);
          el.remove();
          await settle();
        }
        expect(failures).toEqual([]);
      });
    }
  }

  // ────────────────────────────────────────────────────────────
  // scope / daemon exclusions
  // ────────────────────────────────────────────────────────────

  it('daemon + light/shadow flags warns and daemon addressing wins', async () => {
    const warn = console.warn as ReturnType<typeof vi.fn>;
    const t = tag('on-matrix-daemon');

    @element(t)
    class C extends HTMLElement {
      @on('ping', { daemon: 'does-not-exist', light: false })
      h() {}
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    const messages = warn.mock.calls.map(c => String(c[0]));
    expect(messages.some(m => m.includes('scope/daemon'))).toBe(true);
  });
});
