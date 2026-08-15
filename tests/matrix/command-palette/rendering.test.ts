/**
 * snice-command-palette matrix — the ITEM-SHAPE cross.
 *
 * A CommandItem has five optional fields that each gate exactly one documented
 * CSS part. The FULL product of the ways they can be present:
 *
 *   icon kind {none, glyph, image, both}                                   (4)
 *     x description {absent, present}                                      (2)
 *     x shortcut    {absent, present}                                      (2)
 *     x category    {absent, present}                                      (2)
 *   = 32 combos, with `disabled` rotated across them so both states of the
 *     documented disabled class are crossed against every icon kind.
 *
 * Enumerating rather than sampling is worth it because these fields share one
 * template with nested `<if>` blocks: `icon` and `iconImage` are mutually
 * exclusive branches INSIDE a shared `item-icon` wrapper, so "iconImage with no
 * icon" and "both set" are exactly the cells a hand-written test skips. The
 * category axis is crossed here too because a header is emitted BETWEEN items,
 * which is where an off-by-one in grouping shows up.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, expectPaletteMatches, expectOpenChrome, expectClosed,
  itemEls, partsOf, part, text, clearRecent, itemWith, CANONICAL,
  type CommandItem, type SniceCommandPaletteElement,
} from './matrix-utils';

const ICON_KINDS = ['none', 'glyph', 'image', 'both'] as const;
const FLAGS = [false, true] as const;

describe('snice-command-palette matrix: item shape cross', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  let n = 0;
  for (const iconKind of ICON_KINDS) {
    for (const description of FLAGS) {
      for (const shortcut of FLAGS) {
        for (const category of FLAGS) {
          const disabled = n % 2 === 1;
          n++;
          const id = `icon=${iconKind}/description=${description}/shortcut=${shortcut}`
            + `/category=${category}${disabled ? '/disabled' : ''}`;

          it(`renders exactly the documented parts: ${id}`, async () => {
            const command = itemWith({
              icon: iconKind === 'glyph' || iconKind === 'both',
              iconImage: iconKind === 'image' || iconKind === 'both',
              description, shortcut, category, disabled,
            });
            // A second, always-plain command sits after it so the oracle also
            // proves the optional parts belong to the item that declared them
            // and did not leak onto its neighbour.
            const commands: CommandItem[] = [command, { id: 'plain', label: 'Plain Command' }];

            el = await makePalette({ open: true, commands, showRecentCommands: false });
            expectPaletteMatches(el, { commands, query: '' });
          });
        }
      }
    }
  }
});

describe('snice-command-palette matrix: grouping and chrome', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc CSS parts: `category` is a "Category group header". Items carrying the
  // same `category` must sit under ONE header, in first-appearance order.
  it('emits one category header per distinct category, in first-appearance order', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
    expect(partsOf(el, 'category').map(node => text(node))).toEqual(['File', 'Preferences']);
  });

  // A command with no `category` is documented as optional, so it must render —
  // under no header at all rather than under an empty one.
  it('renders uncategorised commands without an empty header', async () => {
    const commands: CommandItem[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ];
    el = await makePalette({ open: true, commands, showRecentCommands: false });
    expectPaletteMatches(el, { commands, query: '' });
    expect(partsOf(el, 'category')).toHaveLength(0);
  });

  // Doc Properties: `open: boolean = false`. The default is closed, and closed
  // renders NOTHING — not a hidden container.
  it('renders nothing at all while closed', async () => {
    el = await makePalette({ commands: CANONICAL, showRecentCommands: false });
    expectClosed(el);
  });

  // Doc Methods: `show()` / `close()` / `toggle()` drive that same state.
  it('show/close/toggle round-trip the rendered tree', async () => {
    el = await makePalette({ commands: CANONICAL, showRecentCommands: false });
    expectClosed(el);
    el.show();
    await new Promise(resolve => setTimeout(resolve, 40));
    expectOpenChrome(el);
    expect(itemEls(el).length).toBe(CANONICAL.length);
    el.close();
    await new Promise(resolve => setTimeout(resolve, 40));
    expectClosed(el);
    el.toggle();
    await new Promise(resolve => setTimeout(resolve, 40));
    expectOpenChrome(el);
  });

  // Doc Properties: `placeholder: string = 'Type a command or search...'`.
  it('uses the documented default placeholder and an author override', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    expectOpenChrome(el);
    removeComponent(el);
    el = await makePalette({
      open: true, commands: CANONICAL, showRecentCommands: false,
      placeholder: 'Search everything',
    });
    expectOpenChrome(el, 'Search everything');
  });

  // Doc CSS parts: `item-icon-image` is the "Item icon image". An image icon
  // must be an <img> pointed at the URL the author gave, with an empty alt (it
  // is decorative — the label carries the meaning).
  it('points item-icon-image at the author\'s URL with a decorative alt', async () => {
    const commands: CommandItem[] = [
      { id: 'img', label: 'Image Command', iconImage: '/icons/x.png' },
    ];
    el = await makePalette({ open: true, commands, showRecentCommands: false });
    const image = part<HTMLImageElement>(el, 'item-icon-image');
    expect(image, 'no part="item-icon-image" rendered').not.toBeNull();
    expect(image!.tagName.toLowerCase()).toBe('img');
    expect(image!.getAttribute('src')).toBe('/icons/x.png');
    expect(image!.getAttribute('alt')).toBe('');
  });
});
