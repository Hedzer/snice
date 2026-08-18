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
      // Every documented claim is live in every combo, `role="alert"`
      // included: MATRIX-banner-1 is fixed and asserted unpinned below.
      expectBanner(el, combo);
    });
  }
});

// MATRIX-banner-1 (fixed): the banner container used to be `role="region"`,
// not the documented `role="alert"`. docs/ai/components/banner.md's
// Accessibility section states `role="alert"` on the banner container, and
// docs/components/banner.md repeats it. The difference is not cosmetic:
// `alert` is an assertive live region, so a banner that appears while the
// user is elsewhere on the page is announced; `region` is a landmark and
// announces nothing. The template now renders the documented role; the
// assertions run unpinned as regression guards.
describe('banner matrix: MATRIX-banner-1 (fixed, documented role)', () => {
  for (const variant of VARIANTS) {
    it(`MATRIX-banner-1 (fixed) ${variant}: the banner container is role="alert"`, async () => {
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
    });
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
    });
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
    });
    if (problems.length === 0) {
      throw new Error('oracle accepted a banner whose accessible name is not its label');
    }
  });
});
