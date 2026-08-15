/**
 * snice-avatar matrix — the generated cross.
 *
 * size x shape x src (36 combos), with name / alt / loading /
 * fallback-background / fallback-color and the broken-image path rotated across
 * them. Every combo is judged by the shared oracle in avatar-matrix-utils.ts,
 * which encodes docs/ai/components/avatar.md and the documented reflection
 * rules — never observed output.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, makeAvatar, expectAvatar, avatarProblems, expectedInitials,
  SIZES, SHAPES, NAMES,
} from './avatar-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('avatar matrix: generated cross', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      el = await makeAvatar(combo);
      expectAvatar(el, combo);
    });
  }
});

describe('avatar matrix: the cross is what it claims to be', () => {
  it('covers every documented size and shape against both src states', () => {
    const seen = new Set(combos.map(c => `${c.size}/${c.shape}/${!!c.src}`));
    const want = SIZES.length * SHAPES.length * 2;
    if (combos.length !== want || seen.size !== want) {
      throw new Error(`generator produced ${combos.length} combos, ${seen.size} distinct,`
        + ` expected ${want}`);
    }
  });

  it('rotates every documented name shape, loading mode and colour override in', () => {
    for (const name of NAMES) {
      if (!combos.some(c => c.name === name)) {
        throw new Error(`no combo exercises name=${JSON.stringify(name)}`);
      }
    }
    for (const loading of ['lazy', 'eager']) {
      if (!combos.some(c => c.loading === loading)) {
        throw new Error(`no combo exercises loading="${loading}"`);
      }
    }
    if (!combos.some(c => c.alt)) throw new Error('alt is never exercised');
    if (!combos.some(c => c.fallbackBackground)) {
      throw new Error('fallback-background is never exercised');
    }
    if (!combos.some(c => c.fallbackColor !== '#ffffff')) {
      throw new Error('fallback-color is never overridden');
    }
    if (!combos.some(c => c.broken)) throw new Error('the broken-image path is never exercised');
  });
});

describe('avatar matrix: the documented initials rule', () => {
  // getInitials is a documented METHOD, so these are contract cases, not
  // implementation trivia. They are asserted directly as well as through every
  // combo's fallback text.
  const cases: Array<[string, string]> = [
    ['', ''],
    ['Cher', 'C'],
    ['John Doe', 'JD'],
    ['  padded   name  ', 'PN'],
    ['ada lovelace king', 'AL'],
    ['jd', 'J'],
  ];
  for (const [name, expected] of cases) {
    it(`getInitials(${JSON.stringify(name)}) === ${JSON.stringify(expected)}`, async () => {
      el = await makeAvatar({ name });
      const got = el.getInitials(name);
      if (got !== expected) throw new Error(`got "${got}", expected "${expected}"`);
      if (expectedInitials(name) !== expected) {
        throw new Error('the oracle and the case table disagree — fix the oracle');
      }
    });
  }
});

describe('avatar matrix: the oracle is not vacuous', () => {
  it('rejects an avatar whose documented initials are absent', async () => {
    el = await makeAvatar({ name: '' });
    const problems = avatarProblems(el, {
      id: 'probe', ...{
        size: 'medium', shape: 'circle', loading: 'lazy', src: '', alt: '',
        name: 'John Doe', fallbackColor: '#ffffff', fallbackBackground: '', broken: false,
      },
    } as any);
    if (problems.length === 0) {
      throw new Error('oracle accepted an avatar that shows no initials for a name');
    }
  });

  it('rejects an avatar whose img never rendered', async () => {
    el = await makeAvatar({ src: '' });
    const problems = avatarProblems(el, {
      id: 'probe', size: 'medium', shape: 'circle', loading: 'lazy',
      src: '/fixtures/user.jpg', alt: '', name: '',
      fallbackColor: '#ffffff', fallbackBackground: '', broken: false,
    } as any);
    if (problems.length === 0) {
      throw new Error('oracle accepted an avatar with no image where one was documented');
    }
  });
});
