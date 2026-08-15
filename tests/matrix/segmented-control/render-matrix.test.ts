/**
 * snice-segmented-control matrix — RENDER slice.
 *
 * The full cross of {3 sizes} x {host enabled, host disabled} x {5 option-set
 * shapes} x {3 initial-value kinds} = 90 combos. Every one mounts the control
 * the documented way (options assigned as a JS property) and runs the shared
 * oracle in matrix-utils, which is derived from
 * docs/ai/components/segmented-control.md.
 *
 * The four axes are not independent in the docs, which is the point of crossing
 * them: `disabled` on the host interacts with `disabled` on an option (native
 * flag vs `aria-disabled`), and the option shape interacts with the initial
 * value (the auto-selection rule fires only when no value is set, and only ever
 * lands on a non-disabled option).
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mount, optionsFor, initialValue, expectedInitialValue,
  expectRender, type SniceSegmentedControlElement,
} from './matrix-utils';

let el: SniceSegmentedControlElement | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

describe('segmented-control matrix: render', () => {
  for (const combo of generateCombos()) {
    it(combo.id, async () => {
      const options = optionsFor(combo.shape);
      const authored = initialValue(combo.valueKind, options);
      el = await mount(combo);
      expectRender(el, options, expectedInitialValue(authored, options), combo);
    });
  }
});
