/**
 * snice-banner matrix — the generated cross.
 *
 * variant x icon-source x dismissible (32 combos), with position, action-text,
 * a custom label and `open` rotated across them. Every combo is judged by the
 * shared oracle in banner-matrix-utils.ts, which encodes
 * docs/ai/components/banner.md — never observed output.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, makeBanner, expectBanner, bannerProblems, partsNamed,
  VARIANTS, ICON_MODES, DEFAULTS,
} from './banner-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('banner matrix: generated cross', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      el = await makeBanner(combo);
      // `allow: ['role']` suppresses exactly ONE claim — the `role="alert"`
      // one — and only because it is pinned as MATRIX-banner-1 in its own
      // `it.fails` test below, where the correct assertion is kept in full.
      // Every other documented claim stays live in every combo: a divergence
      // that affects all 32 combos must not be allowed to blind the other
      // thirty assertions each of them makes.
      expectBanner(el, combo, { allow: ['role'] });
    });
  }
});

// MATRIX-banner-1: the banner container is `role="region"`, not the documented
// `role="alert"`. docs/ai/components/banner.md's Accessibility section states
// `role="alert"` on the banner container, and docs/components/banner.md repeats
// it. The difference is not cosmetic: `alert` is an assertive live region, so a
// banner that appears while the user is elsewhere on the page is announced;
// `region` is a landmark and announces nothing. The assertion below stays
// correct and unweakened.
describe('banner matrix: MATRIX-banner-1 (documented role)', () => {
  for (const variant of VARIANTS) {
    it.fails(`MATRIX-banner-1 ${variant}: the banner container is role="alert"`, async () => {
      const combo = {
        id: `role/${variant}`, variant, position: 'top' as const, dismissible: true,
        actionText: '', iconMode: 'default' as const, message: 'hello', label: '',
        open: true,
      };
      el = await makeBanner(combo);
      expectBanner(el, combo);
    });
  }
});

describe('banner matrix: the cross is what it claims to be', () => {
  it('covers every variant against every icon source and both dismissible states', () => {
    const seen = new Set(combos.map(c => `${c.variant}/${c.iconMode}/${c.dismissible}`));
    const want = VARIANTS.length * ICON_MODES.length * 2;
    if (combos.length !== want || seen.size !== want) {
      throw new Error(`generator produced ${combos.length} combos, ${seen.size} distinct,`
        + ` expected ${want}`);
    }
  });

  it('rotates position, action-text, a custom label and open into the cross', () => {
    for (const position of ['top', 'bottom']) {
      if (!combos.some(c => c.position === position)) {
        throw new Error(`no combo exercises position="${position}"`);
      }
    }
    if (!combos.some(c => c.actionText)) throw new Error('action-text is never set');
    if (!combos.some(c => c.label)) throw new Error('label is never customised');
    if (!combos.some(c => c.open)) throw new Error('open is never true');
    if (!combos.some(c => !c.open)) throw new Error('open is never false');
  });
});

describe('banner matrix: the documented defaults', () => {
  it('a banner authored with nothing at all is closed, dismissible and info', async () => {
    // "dismissible: boolean = true" is the unusual one: a banner nobody
    // configured still owes a close button.
    el = await makeBanner({ iconMode: 'default' });
    expectBanner(el, {
      id: 'defaults', variant: DEFAULTS.variant, position: DEFAULTS.position,
      dismissible: true, actionText: '', iconMode: 'default', message: '',
      label: '', open: false,
    }, { allow: ['role'] });
    if (partsNamed(el, 'close').length !== 1) {
      throw new Error('the default banner has no close button');
    }
  });
});

describe('banner matrix: the oracle is not vacuous', () => {
  it('rejects a banner missing its documented close button', async () => {
    el = await makeBanner({ iconMode: 'default', dismissible: false, message: 'x' });
    const problems = bannerProblems(el, {
      id: 'probe', variant: 'info', position: 'top', dismissible: true,
      actionText: '', iconMode: 'default', message: 'x', label: '', open: false,
    }, { allow: ['role'] });
    if (problems.length === 0) {
      throw new Error('oracle accepted a banner with no close button where one was documented');
    }
  });

  it('rejects a banner whose aria-label does not follow the documented fallback', async () => {
    el = await makeBanner({ iconMode: 'default', variant: 'error', message: 'x' });
    const problems = bannerProblems(el, {
      id: 'probe', variant: 'error', position: 'top', dismissible: true,
      actionText: '', iconMode: 'default', message: 'x',
      label: 'Something else entirely', open: false,
    }, { allow: ['role'] });
    if (problems.length === 0) {
      throw new Error('oracle accepted a banner whose accessible name is not its label');
    }
  });
});
