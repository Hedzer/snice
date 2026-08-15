/**
 * snice-qr-reader matrix — the rendered shell across every documented mode.
 *
 * `pickFirst`, `manualSnap` and `tapStart` are three INDEPENDENT documented
 * switches over the same reader, and `camera` is a fourth axis that must not
 * change the shell at all. Crossing them is the point: the doc's part list is
 * one list, so no combination of modes may drop `base`, `viewport`, `video`,
 * `canvas`, `controls` or the camera-switch button, and the start/stop pair
 * must follow the scanning state rather than the mode.
 *
 * 8 mode vectors x 2 cameras = 16 idle combos, and the same 8 mode vectors
 * driven into the scanning state = 8 more. 24 combos.
 */
import { describe, it, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeReader, expectReaderMatches, comboId, wait, SETTLE,
  installCaptureStack, restoreCaptureStack, stubDecoder, isScanning,
  type ReaderCombo, type SniceQRReaderElement,
} from './matrix-utils';

/** All 2^3 vectors over the three documented mode switches. */
function modeVectors(): Array<Pick<ReaderCombo, 'pickFirst' | 'manualSnap' | 'tapStart'>> {
  const out: Array<Pick<ReaderCombo, 'pickFirst' | 'manualSnap' | 'tapStart'>> = [];
  for (let bits = 0; bits < 8; bits++) {
    out.push({
      pickFirst: !!(bits & 1),
      manualSnap: !!(bits & 2),
      tapStart: !!(bits & 4),
    });
  }
  return out;
}

describe('snice-qr-reader matrix: idle shell', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) removeComponent(el as HTMLElement); el = undefined;
    restoreCaptureStack();
  });

  for (const camera of ['back', 'front'] as const) {
    for (const modes of modeVectors()) {
      const combo: ReaderCombo = { camera, ...modes };
      it(comboId(combo), async () => {
        el = await makeReader(combo);
        expectReaderMatches(el, combo, { scanning: false });
      });
    }
  }
});

describe('snice-qr-reader matrix: scanning shell', () => {
  let el: SniceQRReaderElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) { (el as any).stop?.(); removeComponent(el as HTMLElement); }
    el = undefined;
    restoreCaptureStack();
  });

  for (const modes of modeVectors()) {
    const combo: ReaderCombo = { ...modes };
    it(`scanning/${comboId(combo)}`, async () => {
      el = await makeReader(combo);
      // A decoder that never finds anything keeps the reader in the scanning
      // state, which is the state this describe block is about. `pickFirst`
      // would otherwise stop the reader on the first frame.
      stubDecoder(el, null);
      await el.start();
      await wait(SETTLE);

      expectReaderMatches(el, combo, { scanning: isScanning(el) });
    });
  }
});
