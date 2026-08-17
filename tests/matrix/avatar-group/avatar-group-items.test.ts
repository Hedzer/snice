/**
 * MATRIX slice — snice-avatar-group: the item shape and the style axes.
 *
 * Dimensions (docs/ai/components/avatar-group.md):
 *   item shape (5) x size (3) = 15 combos, then size (3) x overlap (4) = 12.
 *
 * The item shape is a documented FALLBACK CHAIN, and each of the five shapes
 * puts a different link of it in charge:
 *
 *   · `src`      — "Image URL": an `<img>` named after its person;
 *   · `initials` — "Fallback initials": the monogram wins over anything a name
 *                  would have derived;
 *   · `name`     — "used for initials/color/title": the monogram is DERIVED,
 *                  the title is the name, and the colour is chosen from it;
 *   · `color`    — "Custom background color": the derived colour is replaced;
 *   · nothing    — still an avatar, still a `<button>` with an accessible name.
 *
 * The style axes are crossed separately because they change no DOM per item:
 * `size` is a `:host([size=…])` rule and `overlap` is a custom property the
 * component computes for its own stylesheet, so their observable DOM contract
 * is the attribute and that property.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll } from '../matrix-utils';
import {
  SIZES, ITEM_SHAPES, mountAvatarGroup, expectedShape, readShape,
  expectedAxes, readAxes, expectedInitials, initialsFromName,
  avatarButtons, readContent, type ShapeName,
} from './avatar-group-support';
import '../../../packages/components/src/avatar-group/snice-avatar-group';

const SHAPE_NAMES = Object.keys(ITEM_SHAPES) as ShapeName[];

const ITEM_COMBOS = product({ shape: SHAPE_NAMES, size: SIZES });

afterEach(() => { unmountAll(); });

describe(`avatar-group matrix: the item shape (${ITEM_COMBOS.length} combos)`, () => {
  for (const combo of ITEM_COMBOS) {
    const id = `${combo.shape}/${combo.size}`;

    it(id, async () => {
      // The shape under test sits between two ordinary neighbours, so an
      // oracle that only ever saw one item could not tell a per-item rule from
      // a whole-group one.
      const avatars = [
        { name: 'Zoe Anderson' },
        ITEM_SHAPES[combo.shape],
        { name: 'Yuri Petrov' },
      ];
      const vector = { avatars, size: combo.size, max: 5 };
      const el = await mountAvatarGroup(vector);

      expectShape(readShape(el), expectedShape(vector), `shape ${id}`);
      expectShape(readAxes(el), expectedAxes(vector), `axes ${id}`);

      const subject = avatarButtons(el)[1];
      expect(subject.tagName.toLowerCase(), `${id} is not a button`).toBe('button');
      expect(subject.getAttribute('type'), `${id} button type`).toBe('button');
    });
  }
});

/**
 * The fallback chain, asserted item by item so the rule is legible without
 * reading the oracle.
 */
describe('avatar-group matrix: the documented fallback chain', () => {
  it('an image URL renders an <img> named after its person', async () => {
    const el = await mountAvatarGroup({ avatars: [ITEM_SHAPES.image] });
    const button = avatarButtons(el)[0];
    expect(readContent(button)).toBe('image');
    const image = button.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('/avatars/bob.jpg');
    expect(image.getAttribute('alt')).toBe('Bob Smith');
    expect(button.getAttribute('title')).toBe('Bob Smith');
    expect(button.getAttribute('aria-label')).toBe('Bob Smith');
  });

  it('explicit initials win over the ones a name would derive', async () => {
    const el = await mountAvatarGroup({
      avatars: [{ name: 'Alice Johnson', initials: 'ZZ' }],
    });
    const button = avatarButtons(el)[0];
    expect(readContent(button)).toBe('initials');
    expect(button.querySelector('.avatar-initials')?.textContent).toBe('ZZ');
    // The name still names the avatar, even when it does not draw it.
    expect(button.getAttribute('title')).toBe('Alice Johnson');
  });

  it('a name alone derives its own monogram', async () => {
    const el = await mountAvatarGroup({ avatars: [{ name: 'Carol Williams' }] });
    const button = avatarButtons(el)[0];
    expect(readContent(button)).toBe('initials');
    expect(button.querySelector('.avatar-initials')?.textContent).toBe('CW');
  });

  const DERIVED: Array<[string, string]> = [
    ['Alice Johnson', 'AJ'],
    ['Carol', 'C'],
    ['ada lovelace', 'AL'],
    ['  Grace   Hopper  ', 'GH'],
    ['Jean-Luc Picard', 'JP'],
    ['A B C D', 'AB'],
    ['', ''],
    ['   ', ''],
  ];

  for (const [name, initials] of DERIVED) {
    it(`"${name}" derives "${initials}"`, async () => {
      expect(initialsFromName(name)).toBe(initials);
      expect(expectedInitials({ name })).toBe(initials);
      const el = await mountAvatarGroup({ avatars: [{ name }] });
      const button = avatarButtons(el)[0];
      if (initials) {
        expect(button.querySelector('.avatar-initials')?.textContent).toBe(initials);
      } else {
        // Nothing to draw a monogram from — the documented avatar is still an
        // avatar, and still a button.
        expect(readContent(button)).toBe('fallback');
        expect(button.tagName.toLowerCase()).toBe('button');
        // The accessible name is only asserted for the ABSENT name. What a
        // whitespace-only name should announce is not something either doc
        // version says, and inventing an expectation for it would be asserting
        // this suite's taste rather than the component's contract.
        if (name === '') expect(button.getAttribute('aria-label')).toBe('Avatar');
      }
    });
  }

  it('an item with nothing at all is still a labelled button', async () => {
    const el = await mountAvatarGroup({ avatars: [{}] });
    const button = avatarButtons(el)[0];
    expect(readContent(button)).toBe('fallback');
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Avatar');
    expect(button.getAttribute('title')).toBe('');
  });

  it('a custom colour paints that avatar and no other', async () => {
    const el = await mountAvatarGroup({
      avatars: [{ name: 'Zoe' }, { name: 'Dan', color: '#7c3aed' }, { name: 'Yuri' }],
    });
    const styles = avatarButtons(el).map(button => button.getAttribute('style') ?? '');
    expect(styles[1]).toContain('#7c3aed');
    expect(styles[0], 'a colourless avatar took a custom background').not.toContain('#7c3aed');
    expect(styles[2], 'a colourless avatar took a custom background').not.toContain('#7c3aed');
  });

  it('the same name always draws the same colour, and different names differ', async () => {
    // "`name` … used for … color" — the colour is a FUNCTION of the name, which
    // is what makes an avatar recognisable across two different groups.
    const first = await mountAvatarGroup({ avatars: [{ name: 'Alice Johnson' }] });
    const firstClass = avatarButtons(first)[0].className;
    first.remove();

    const second = await mountAvatarGroup({
      avatars: [{ name: 'Alice Johnson' }, { name: 'Bob Smith' }],
    });
    const classes = avatarButtons(second).map(button => button.className);
    expect(classes[0], 'the same name drew a different colour').toBe(firstClass);
    expect(classes[1], 'two names drew the same colour').not.toBe(classes[0]);
  });
});

/**
 * The style axes. Neither changes the per-item DOM, so what is graded is the
 * channel the stylesheet reads.
 */
describe('avatar-group matrix: size and overlap', () => {
  const STYLE_COMBOS = product({ size: SIZES, overlap: [0, 4, 8, 20] });

  for (const combo of STYLE_COMBOS) {
    const id = `${combo.size}/overlap=${combo.overlap}`;
    it(id, async () => {
      const vector = { avatars: [{ name: 'Zoe' }, { name: 'Yuri' }], ...combo };
      const el = await mountAvatarGroup(vector);
      expectShape(readAxes(el), expectedAxes(vector), `axes ${id}`);
    });
  }

  it('the documented defaults are 5 / medium / 8px', async () => {
    const el = await mountAvatarGroup({ avatars: [{ name: 'Zoe' }] });
    expect(el.max).toBe(5);
    expect(el.size).toBe('medium');
    expect(el.overlap).toBe(8);
    // 8px on a 16px root is half a rem, applied as a NEGATIVE margin.
    expect(el.style.getPropertyValue('--avatar-group-overlap')).toBe('-0.5rem');
  });

  it('changing overlap rewrites the custom property the stylesheet reads', async () => {
    const el = await mountAvatarGroup({ avatars: [{ name: 'Zoe' }], overlap: 8 });
    expect(el.style.getPropertyValue('--avatar-group-overlap')).toBe('-0.5rem');

    el.overlap = 16;
    await el.rendered;
    expect(el.style.getPropertyValue('--avatar-group-overlap')).toBe('-1rem');

    el.overlap = 0;
    await el.rendered;
    expect(el.style.getPropertyValue('--avatar-group-overlap')).toBe('-0rem');
  });
});
