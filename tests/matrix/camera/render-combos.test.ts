/**
 * snice-camera matrix — the rendered shell across every documented enum.
 *
 * The camera's declarative surface is four enums and two switches, and the
 * doc gives every one of them an attribute. Crossing them is the point: the
 * two documented parts (`base`, `controls`) and the documented `controls`
 * slot form ONE contract, so no combination of position, aspect ratio,
 * object-fit or facing mode may drop any of them, and every documented enum
 * value must survive its attribute conversion.
 *
 * 9 control positions x 2 show-controls states = 18 combos,
 * 6 aspect ratios x 2 object-fits = 12 combos,
 * 2 facing modes x 2 mirror states = 4 combos,
 * plus 4 frame sizes and 2 slotted-overlay combos. 40 combos.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeCamera, expectCameraMatches, comboId, controlSlot, partEl,
  CONTROLS_POSITIONS, ASPECT_RATIOS, FACING_MODES,
  installCaptureStack, restoreCaptureStack,
  type CameraCombo, type SniceCameraElement,
} from './matrix-utils';

describe('snice-camera matrix: controls placement', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  // `controlsPosition: ControlsPosition = 'auto'` has nine documented values,
  // and `showControls: boolean = true` decides whether the built-in bar is
  // there to position at all. Crossed, because a position that only survives
  // when the controls are visible is half a feature.
  for (const controlsPosition of CONTROLS_POSITIONS) {
    for (const showControls of [true, false]) {
      const combo: CameraCombo = { controlsPosition, showControls };
      it(comboId(combo), async () => {
        el = await makeCamera(combo);
        expectCameraMatches(el, combo);
      });
    }
  }

  it('an explicit position leaves a trace on the controls element', async () => {
    // `ControlsPosition` is a documented ENUM of placements. A component that
    // accepted all nine and rendered them identically would satisfy every
    // property assertion above and still be broken, so each explicit value
    // must be distinguishable in the rendered controls.
    const traces = new Map<string, string>();
    for (const position of CONTROLS_POSITIONS.filter(p => p !== 'auto')) {
      const camera = await makeCamera({ controlsPosition: position });
      traces.set(position, partEl(camera, 'controls')?.className ?? '');
      removeComponent(camera as HTMLElement);
    }
    for (const [position, trace] of traces) {
      expect(trace, `controls for position "${position}" carry no trace of it`).toContain(position);
    }
    // …and no two placements render the same.
    expect(new Set(traces.values()).size).toBe(traces.size);
  });
});

describe('snice-camera matrix: framing', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  // `aspectRatio: string = 'auto'  // 'auto','16:9','9:16','4:3','1:1','21:9'`
  // crossed with `objectFit: 'contain'|'cover' = 'cover'`. Both are documented
  // as attributes, and both are pure framing: neither may disturb the parts.
  for (const aspectRatio of ASPECT_RATIOS) {
    for (const objectFit of ['cover', 'contain'] as const) {
      const combo: CameraCombo = { aspectRatio, objectFit };
      it(comboId(combo), async () => {
        el = await makeCamera(combo);
        expectCameraMatches(el, combo);
      });
    }
  }

  // `width: number = 1280` / `height: number = 720` are the requested capture
  // resolution; they must survive their numeric attribute conversion intact.
  for (const size of [
    { width: 1280, height: 720 },
    { width: 640, height: 480 },
    { width: 1920, height: 1080 },
    { width: 720, height: 1280 },
  ]) {
    it(`resolution ${size.width}x${size.height}`, async () => {
      el = await makeCamera(size);
      expectCameraMatches(el, size);
      expect(typeof el.width).toBe('number');
      expect(typeof el.height).toBe('number');
    });
  }
});

describe('snice-camera matrix: facing mode and mirroring', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  for (const facingMode of FACING_MODES) {
    for (const mirror of [true, false]) {
      const combo: CameraCombo = { facingMode, mirror };
      it(comboId(combo), async () => {
        el = await makeCamera(combo);
        expectCameraMatches(el, combo);
      });
    }
  }
});

describe('snice-camera matrix: custom controls overlay', () => {
  let el: SniceCameraElement | undefined;

  beforeEach(() => { installCaptureStack({ cameras: 2 }); });
  afterEach(() => {
    if (el) { el.stop(); removeComponent(el as HTMLElement); } el = undefined;
    restoreCaptureStack();
  });

  // "Slots — `controls`: Custom controls overlay". The extension point is
  // documented without reference to `show-controls`, so it must project in
  // both states.
  for (const showControls of [true, false]) {
    it(`slotted overlay projects with show-controls ${showControls ? 'on' : 'off'}`, async () => {
      const combo: CameraCombo = {
        showControls,
        html: '<button slot="controls" id="mine" aria-label="Custom shutter">Shoot</button>',
      };
      el = await makeCamera(combo);
      expectCameraMatches(el, combo);

      const slot = controlSlot(el)!;
      const assigned = slot.assignedElements({ flatten: true }).map(node => node.id);
      expect(assigned, 'the custom overlay was not projected').toEqual(['mine']);
    });
  }
});
