/**
 * snice-button matrix — presentation slice.
 *
 * SIZING. The button is a mid-complexity component, so this slice is a
 * SEMI-cross, not a full one: variant x size (18) and style x size (12) are
 * crossed separately rather than variant x size x style (72). `variant` and
 * `style` do not interact — they select different, additive class hooks on the
 * same element — so the 54 combos the full product would add are 54 restatements
 * of the same fact. The pairwise style interactions, which DO exist (a pill that
 * is also outlined), are enumerated explicitly below.
 */
import { describe, it, afterEach, expect } from 'vitest';
import {
  mount, unmountAll, product, comboId, expectShape, attrsFrom, slottedText, part,
} from '../matrix-utils';
import {
  VARIANTS, SIZES, STYLES, STYLE_PAIRS, ICON_MODES, PLACEMENTS, ICON_SLOT_HTML,
  styleFlags, expectedButtonShape, readButtonShape, readVariantHooks,
} from './button-support';

afterEach(unmountAll);

const LABEL = 'Click me';

describe('button matrix: variant x size', () => {
  for (const combo of product({ variant: VARIANTS, size: SIZES })) {
    it(comboId(combo), async () => {
      const button = await mount('snice-button', attrsFrom(combo), LABEL);

      // The documented parts contract holds for every appearance.
      expectShape(readButtonShape(button), expectedButtonShape({}), comboId(combo));

      // …and the declared variant/size reach the base element as exactly one
      // hook each. Two size hooks would mean a stylesheet race no paint test
      // could attribute back to a property.
      expectShape(readVariantHooks(button), {
        variantHooks: [`button--${combo.variant}`],
        sizeHooks: [`button--${combo.size}`],
        styleHooks: [],
      }, comboId(combo));

      expect(slottedText(button, '[part~="label"] slot:not([name])'),
        'the default slot projects into the label part').toBe(LABEL);
    });
  }
});

describe('button matrix: style x size', () => {
  for (const combo of product({ style: STYLES, size: SIZES })) {
    it(comboId(combo), async () => {
      const button = await mount('snice-button', {
        ...attrsFrom({ size: combo.size }),
        ...styleFlags(combo.style),
      }, LABEL);

      expectShape(readButtonShape(button), expectedButtonShape({}), comboId(combo));
      expectShape(readVariantHooks(button), {
        variantHooks: ['button--default'],
        sizeHooks: [`button--${combo.size}`],
        styleHooks: combo.style === 'plain' ? [] : [`button--${combo.style}`],
      }, comboId(combo));
    });
  }
});

describe('button matrix: style switches combine', () => {
  for (const pair of STYLE_PAIRS) {
    it(`[${pair.join(',')}]`, async () => {
      const button = await mount('snice-button', styleFlags(pair), LABEL);
      expectShape(readVariantHooks(button), {
        variantHooks: ['button--default'],
        sizeHooks: ['button--medium'],
        styleHooks: pair.map(s => `button--${s}`).sort(),
      }, `[${pair.join(',')}]`);
    });
  }
});

describe('button matrix: icon source x placement', () => {
  for (const combo of product({ iconMode: ICON_MODES, iconPlacement: PLACEMENTS })) {
    it(comboId(combo), async () => {
      const button = await mount(
        'snice-button',
        {
          'icon-placement': combo.iconPlacement,
          ...(combo.iconMode === 'property' ? { icon: '->' } : {}),
        },
        combo.iconMode === 'slot' ? `${ICON_SLOT_HTML}${LABEL}` : LABEL,
      );

      // DOCUMENTED (button.md "Slots"): the `icon` slot overrides the `icon`
      // property, and either one produces the `icon` part on the declared side.
      expectShape(
        readButtonShape(button),
        expectedButtonShape({ iconMode: combo.iconMode, iconPlacement: combo.iconPlacement }),
        comboId(combo),
      );
    });
  }

  it('the icon slot wins over the icon property', async () => {
    const button = await mount('snice-button', { icon: '->' }, `${ICON_SLOT_HTML}${LABEL}`);
    const icon = part(button, 'icon');
    expect(icon?.querySelector('slot[name="icon"]'), 'icon part hosts the named slot').not.toBeNull();
    // The property's fallback icon lives INSIDE the slot's fallback content, so
    // a slotted child suppresses it without the property being cleared.
    expect(button.icon, 'the property is untouched by the slot').toBe('->');
  });
});

describe('button matrix: loading and disabled presentation', () => {
  for (const combo of product({ disabled: [false, true], loading: [false, true] })) {
    it(comboId(combo), async () => {
      const button = await mount('snice-button', attrsFrom(combo), LABEL);

      // DOCUMENTED (button.md "Properties" + "Accessibility"): `loading`
      // surfaces as aria-busy; only `disabled` natively disables the control.
      // Loading blocks ACTIVATION (asserted in activation.test.ts) but is not
      // the same thing as being disabled.
      expectShape(
        readButtonShape(button),
        expectedButtonShape({ effectiveDisabled: combo.disabled, loading: combo.loading }),
        comboId(combo),
      );
    });
  }
});
