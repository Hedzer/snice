/**
 * Matrix slice ALERT / ICON — the icon precedence chain crossed with variant.
 *
 * Dimensions: iconSource (6) x variant (4) = 24 combos.
 *
 * Documented contract under test (docs/ai/components/alert.md):
 *   · `icon: string = ''` — "URL, emoji, or 'none'. Use icon slot for icon
 *     fonts." So an empty `icon` shows the built-in default for the variant,
 *     `'none'` shows nothing at all, a URL becomes an image, and anything else
 *     is rendered as text.
 *   · slot `icon` — "Custom icon content (overrides `icon` property and default
 *     icons)". The `slot+prop` combos are that precedence edge: the property is
 *     set AND the slot is filled, and the slot must win.
 *   · CSS part `icon` — "The icon container" — exists exactly when an icon is
 *     shown, so `icon="none"` must remove it rather than render an empty box.
 *
 * The variant axis rides along because the built-in default icon is chosen from
 * the variant; a variant that resolved to no icon would be invisible in a
 * single-variant test.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  ICON_SOURCES, VARIANTS, SLOT_ICON, EMOJI_ICON, URL_ICON,
  combo, comboId, makeAlert, expectAlertMatches, readFacts, removeComponent,
} from './alert-support';

describe('alert matrix: icon sources', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  for (const iconSource of ICON_SOURCES) {
    for (const variant of VARIANTS) {
      const c = combo({ iconSource, variant });

      it(`${comboId(c)}: resolves the documented icon`, async () => {
        alert = await makeAlert(c);
        expectAlertMatches(alert, c);
      });
    }
  }

  it('icon="none" removes the icon container entirely', async () => {
    const c = combo({ iconSource: 'none' });
    alert = await makeAlert(c);
    expect(readFacts(alert).hasIconPart, 'CSS part "icon" must not exist').toBe(false);
  });

  it('the icon slot overrides the icon property', async () => {
    const c = combo({ iconSource: 'slot+prop' });
    alert = await makeAlert(c);
    const facts = readFacts(alert);
    expect(facts.iconText, 'slotted icon wins').toBe(SLOT_ICON);
    expect(facts.iconText, 'the property must not also show').not.toBe(EMOJI_ICON);
  });

  it('a URL-shaped icon property renders an image', async () => {
    const c = combo({ iconSource: 'url' });
    alert = await makeAlert(c);
    expect(readFacts(alert).iconImgSrc).toBe(URL_ICON);
  });
});
