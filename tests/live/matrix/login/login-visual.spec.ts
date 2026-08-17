/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-login TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/login, `npm run test:matrix`) owns behavioural
 * truth: the request payload, the four events, the four methods, the
 * accessibility attributes and which controls exist for a property vector. It
 * cannot own visual truth, because happy-dom performs no layout, paints
 * nothing, and — crucially for this component — assigns EVERY light-DOM child
 * to the default slot regardless of its `slot` attribute.
 *
 * So three groups of documented claims are reachable only here:
 *
 *   · SLOT ASSIGNMENT. Ten named slots is the component's main extension
 *     surface, and the DOM tier can only check that the slots are declared.
 *     Only a real engine can show that `slot="between-fields"` content lands
 *     BETWEEN the two fields and `slot="footer"` content lands at the bottom.
 *   · LAYOUT. `variant` (default/card/minimal) and `size`
 *     (small/medium/large) are pure stylesheet switches: a card has its own
 *     panel, a larger size is really larger, labels sit above their inputs,
 *     and the options row puts remember-me and forgot-password on opposite
 *     sides.
 *   · STATE AS PAINT. `disabled` and `loading` are documented to "propagate to
 *     every input and the submit button" — in the DOM that is an attribute; on
 *     screen it is a dimmed, non-interactive control, and only a hit-test can
 *     say a disabled field cannot be clicked into.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/login/matrix.html';

const VARIANTS = ['default', 'card', 'minimal'] as const;
const SIZES = ['small', 'medium', 'large'] as const;

interface Combo {
  id: string;
  variant: typeof VARIANTS[number];
  size: typeof SIZES[number];
  showRememberMe: boolean;
  showForgotPassword: boolean;
  disabled?: boolean;
  loading?: boolean;
  alertMessage?: string;
  alertVariant?: 'error' | 'success';
  slots?: boolean;
}

/**
 * The cross: 3 variants x 3 sizes x all 4 vectors of the two optional controls
 * = 36 combos, with the state switches and the alert rotated across the
 * product so each is covered in several layouts without multiplying the count.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const variant of VARIANTS) {
    for (const size of SIZES) {
      for (const showRememberMe of [true, false]) {
        for (const showForgotPassword of [true, false]) {
          const disabled = n % 6 === 2;
          const loading = n % 6 === 4;
          const alertMessage = n % 5 === 1 ? 'Invalid credentials' : undefined;
          combos.push({
            id: `${variant}/${size}`
              + `/${showRememberMe ? 'remember' : 'no-remember'}`
              + `/${showForgotPassword ? 'forgot' : 'no-forgot'}`
              + (disabled ? '/disabled' : '') + (loading ? '/loading' : '')
              + (alertMessage ? '/alert' : ''),
            variant, size, showRememberMe, showForgotPassword,
            disabled, loading, alertMessage,
            alertVariant: alertMessage ? 'error' : undefined,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const base = partNamed('base');
    if (!base) { say('no part="base"'); return problems; }
    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`part="base" renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }

    // ── The documented stack: header, form, footer, top to bottom ──────────
    const header = partNamed('header');
    const form = partNamed('form');
    const footer = partNamed('footer');
    if (!header) say('no part="header"');
    if (!form) { say('no part="form"'); return problems; }
    if (!footer) say('no part="footer"');

    const formBox = rect(form);
    if (formBox.width <= 0 || formBox.height <= 0) {
      say(`part="form" renders at ${formBox.width}x${formBox.height}`);
      return problems;
    }
    if (header && rect(header).bottom > formBox.top + EPS) {
      say('the header overlaps the form');
    }
    if (footer && rect(footer).height > 0 && rect(footer).top < formBox.bottom - EPS) {
      say('the footer overlaps the form');
    }

    // ── The title ──────────────────────────────────────────────────────────
    const title = partNamed('title');
    if (!title) {
      say('no part="title"');
    } else {
      const box = rect(title);
      const cs = getComputedStyle(title);
      if (title.textContent?.trim()) {
        if (box.height <= 0) say(`the title renders at ${box.width}x${box.height}`);
        if (parseFloat(cs.fontSize) < 9) say(`title font-size ${cs.fontSize}`);
      }
    }

    // ── Fields: a label ABOVE its input, and both inside the form ──────────
    const fields: Array<[string, HTMLInputElement | null]> = [
      ['username', sr.querySelector('input[name="username"]')],
      ['password', sr.querySelector('input[name="password"]')],
    ];
    for (const [name, input] of fields) {
      if (!input) { say(`no ${name} input`); continue; }
      const box = rect(input);
      if (box.width <= 0 || box.height <= 0) {
        say(`the ${name} input renders at ${box.width}x${box.height}`);
        continue;
      }
      if (box.left < formBox.left - EPS || box.right > formBox.right + EPS) {
        say(`the ${name} input escapes the form horizontally`);
      }
      const label = sr.querySelector(`label[for="${input.id}"]`) as HTMLElement | null;
      if (!label) {
        say(`no label for the ${name} input`);
      } else {
        const labelBox = rect(label);
        if (labelBox.height <= 0) say(`the ${name} label renders at 0 height`);
        if (labelBox.bottom > box.top + EPS) {
          say(`the ${name} label (bottom ${labelBox.bottom.toFixed(1)}) is not above its`
            + ` input (top ${box.top.toFixed(1)})`);
        }
      }

      // The disabled/loading claim, as PAINT rather than as an attribute.
      const inert = !!combo.disabled || !!combo.loading;
      const cs = getComputedStyle(input);
      if (inert) {
        if (!input.disabled) say(`the ${name} input is not actually disabled`);
      } else {
        if (input.disabled) say(`the ${name} input is disabled with no state asking for it`);
        // An enabled field must be reachable: nothing paints over it.
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`the ${name} input's hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the login form`);
        }
      }
      if (parseFloat(cs.fontSize) < 9) say(`${name} input font-size ${cs.fontSize}`);
    }

    // Fields stack: username above password.
    const [u, p] = fields.map(([, input]) => input);
    if (u && p && rect(u).bottom > rect(p).top + EPS) {
      say('the username and password fields overlap');
    }

    // ── The options row ────────────────────────────────────────────────────
    const remember = sr.querySelector('input[name="remember"]') as HTMLElement | null;
    const forgot = sr.querySelector('.login__forgot') as HTMLElement | null;
    if (combo.showRememberMe !== !!remember) {
      say(`show-remember-me=${combo.showRememberMe} but the checkbox is`
        + ` ${remember ? 'present' : 'absent'}`);
    }
    if (combo.showForgotPassword !== !!forgot) {
      say(`show-forgot-password=${combo.showForgotPassword} but the link is`
        + ` ${forgot ? 'present' : 'absent'}`);
    }
    if (remember) {
      const box = rect(remember);
      if (box.width <= 0 || box.height <= 0) {
        say(`the remember-me checkbox renders at ${box.width}x${box.height}`);
      }
    }
    if (forgot) {
      const box = rect(forgot);
      if (box.width <= 0 || box.height <= 0) {
        say(`the forgot-password link renders at ${box.width}x${box.height}`);
      }
      if (getComputedStyle(forgot).color === getComputedStyle(base).color) {
        say('the forgot-password link is the same colour as the surrounding text');
      }
    }
    if (remember && forgot) {
      // `justify-content: space-between` on the options row.
      const r = rect(remember.closest('label') ?? remember);
      const f = rect(forgot);
      if (r.right > f.left + EPS) say('remember-me and forgot-password overlap');
    }

    // ── The submit button ──────────────────────────────────────────────────
    const button = sr.querySelector('snice-button') as HTMLElement | null;
    if (!button) {
      say('no submit button');
    } else {
      const box = rect(button);
      if (box.width <= 0 || box.height <= 0) {
        say(`the submit button renders at ${box.width}x${box.height}`);
      }
      if (box.top < formBox.top - EPS || box.bottom > formBox.bottom + EPS) {
        say('the submit button escapes the form');
      }
      if (p && rect(p).bottom > box.top + EPS) {
        say('the submit button overlaps the password field');
      }
      if (!combo.disabled && !combo.loading) {
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const outer = document.elementFromPoint(x, y);
        if (outer !== host) {
          say(`the submit button's hit-test found`
            + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the login form`);
        }
      }
    }

    // ── The inline alert sits in the stack, not over it ────────────────────
    const alert = sr.querySelector('snice-alert') as HTMLElement | null;
    if (!!combo.alertMessage !== !!alert) {
      say(`alertMessage=${JSON.stringify(combo.alertMessage)} but the alert is`
        + ` ${alert ? 'present' : 'absent'}`);
    }
    if (alert) {
      const box = rect(alert);
      if (box.width <= 0 || box.height <= 0) {
        say(`the alert renders at ${box.width}x${box.height}`);
      }
      if (box.left < baseBox.left - EPS || box.right > baseBox.right + EPS) {
        say('the alert escapes the login container');
      }
    }

    // ── Slot projection: the whole point of the visual tier here ───────────
    if (combo.slots) {
      const projected = (name: string) =>
        host.querySelector(`#in-${name}`) as HTMLElement | null;
      const boxOf = (name: string) => {
        const node = projected(name);
        return node ? rect(node) : null;
      };
      for (const name of [
        'before-header', 'after-header', 'subtitle', 'before-form', 'after-form',
        'form-top', 'between-fields', 'before-submit', 'after-submit', 'footer',
      ]) {
        const box = boxOf(name);
        if (!box) { say(`slot content "${name}" was not projected at all`); continue; }
        if (box.width <= 0 || box.height <= 0) {
          say(`slot content "${name}" renders at ${box.width}x${box.height}`);
        }
      }

      const order: Array<[string, string]> = [
        ['before-header', 'after-header'],
        ['after-header', 'before-form'],
        ['before-form', 'form-top'],
        ['form-top', 'between-fields'],
        ['between-fields', 'before-submit'],
        ['before-submit', 'after-submit'],
        ['after-submit', 'after-form'],
        ['after-form', 'footer'],
      ];
      for (const [first, second] of order) {
        const a = boxOf(first);
        const b = boxOf(second);
        if (!a || !b) continue;
        if (a.top > b.top + EPS) {
          say(`slot "${first}" (y ${a.top.toFixed(0)}) is painted below`
            + ` slot "${second}" (y ${b.top.toFixed(0)})`);
        }
      }

      // The two positional claims that name a specific neighbour.
      const between = boxOf('between-fields');
      if (between && u && p) {
        if (between.top < rect(u).bottom - EPS || between.bottom > rect(p).top + EPS) {
          say('slot "between-fields" is not between the username and password fields');
        }
      }
      const beforeSubmit = boxOf('before-submit');
      if (beforeSubmit && button && beforeSubmit.bottom > rect(button).top + EPS) {
        say('slot "before-submit" is not above the submit button');
      }
      const footerContent = boxOf('footer');
      if (footerContent && footerContent.top < formBox.bottom - EPS) {
        say('slot "footer" is not below the form');
      }
    }

    return problems;
  }, combo);
}

const combos = generateCombos();

test.describe('login visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.hasRemember, `combo ${combo.id} remember-me presence`)
        .toBe(combo.showRememberMe);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('login visual matrix: slot projection', () => {
  for (const variant of VARIANTS) {
    test(`all ten slots land in order (${variant})`, async () => {
      const combo: Combo = {
        id: `slots/${variant}`, variant, size: 'medium',
        showRememberMe: true, showForgotPassword: true, slots: true,
      };
      await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('login visual matrix: size really changes the size', () => {
  test('small, medium and large produce three different form heights', async () => {
    const heights: number[] = [];
    for (const size of SIZES) {
      await page.evaluate(s => (window as any).matrix.mount({
        variant: 'default', size: s, showRememberMe: true, showForgotPassword: true,
      }), size);
      heights.push(await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        return (sr.querySelector('input[name="username"]') as HTMLElement)
          .getBoundingClientRect().height;
      }));
    }
    expect(new Set(heights.map(h => Math.round(h))).size,
      `the three sizes produced input heights ${heights.map(h => h.toFixed(1)).join(', ')}`)
      .toBe(SIZES.length);
    expect(heights[0], 'small is not smaller than large').toBeLessThan(heights[2]);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('login visual matrix: marquee pixels', () => {
  test('variant="card" paints a panel the default variant does not', async () => {
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const base = sr.querySelector('[part~="base"]').getBoundingClientRect();
      return [{ x: base.left + 2, y: base.top + 2 }];
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'card', size: 'medium', showRememberMe: true, showForgotPassword: true,
    }));
    const [card] = await capture(page, '#subject', 'login-card', probe);
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'medium', showRememberMe: true, showForgotPassword: true,
    }));
    const [plain] = await capture(page, '#subject', 'login-default', probe);

    expect(sameColor(card, plain),
      `variant="card" painted ${card.join(',')} at its top-left corner, the same as`
      + ' variant="default" — the card has no panel of its own').toBe(false);
  });

  test('the submit button is a filled, legible target', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'medium', showRememberMe: true, showForgotPassword: true,
      actionText: 'Sign In',
    }));
    // `snice-button` is a host element whose painted control may be narrower
    // than its own box, so the probe scans the button's row rather than
    // pinning one x — the claim is "the primary action is a filled target",
    // not "the fill starts exactly 6px in". The last point is the form
    // surface beside it, and is the reference.
    const scan = await capture(
      page, '#subject', 'login-submit',
      `(host) => {
        const sr = host.shadowRoot;
        const b = sr.querySelector('snice-button').getBoundingClientRect();
        const base = sr.querySelector('[part~="base"]').getBoundingClientRect();
        const y = b.y + b.height / 2;
        const points = [];
        for (let x = Math.round(b.left); x < Math.round(b.right); x += 2) points.push({ x, y });
        points.push({ x: base.right - 3, y: base.top + 2 });
        return points;
      }`,
    );
    const surface = scan[scan.length - 1];
    const fills = scan.slice(0, -1).filter(px => !sameColor(px, surface));
    expect(fills.length,
      `every pixel across the submit button painted ${surface.join(',')}, the same as the`
      + ' surface behind the form — the primary action has no fill').toBeGreaterThan(0);
    const best = fills.map(px => contrast(px, surface)).reduce((hi, v) => Math.max(hi, v), 1);
    expect(best,
      `the submit button's strongest ink sits at ${best.toFixed(2)}:1 against the form`)
      .toBeGreaterThan(1.5);
  });

  test('a disabled form is visibly dimmer than an enabled one', async () => {
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const input = sr.querySelector('input[name="username"]').getBoundingClientRect();
      const points = [];
      for (let x = Math.round(input.left); x < Math.round(input.left) + 40; x++) {
        points.push({ x, y: input.y + input.height / 2 });
      }
      return points;
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'medium', showRememberMe: true, showForgotPassword: true,
    }));
    const enabled = await capture(page, '#subject', 'login-enabled', probe);
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'medium', showRememberMe: true, showForgotPassword: true,
      disabled: true,
    }));
    const disabled = await capture(page, '#subject', 'login-disabled', probe);

    const differing = enabled.filter((px, i) => !sameColor(px, disabled[i]));
    expect(differing.length,
      'the disabled form painted every pixel of its username field exactly as the'
      + ' enabled one — `disabled` is invisible to a reader').toBeGreaterThan(0);
  });

  test('an error alert paints in ink the form does not otherwise use', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      variant: 'default', size: 'medium', showRememberMe: true, showForgotPassword: true,
      alertMessage: 'Invalid credentials', alertVariant: 'error',
    }));
    const scan = await capture(
      page, '#subject', 'login-alert',
      `(host) => {
        const sr = host.shadowRoot;
        const alert = sr.querySelector('snice-alert').getBoundingClientRect();
        const base = sr.querySelector('[part~="base"]').getBoundingClientRect();
        const points = [];
        for (let x = Math.round(alert.left) + 1; x < Math.round(alert.right) - 1; x += 3) {
          points.push({ x, y: alert.y + alert.height / 2 });
        }
        points.push({ x: base.right - 3, y: alert.y - 12 });
        return points;
      }`,
    );
    const surface = scan[scan.length - 1];
    const inked = scan.slice(0, -1).filter(px => !sameColor(px, surface));
    expect(inked.length,
      `the alert painted nothing but ${surface.join(',')} — the error is invisible`)
      .toBeGreaterThan(0);
  });
});
