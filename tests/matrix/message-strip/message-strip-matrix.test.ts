/**
 * snice-message-strip feature-combination matrix.
 *
 * Dimensions (docs/ai/components/message-strip.md + the .types.ts contract):
 *
 *   variant x dismissible x icon mode      4 x 2 x 4 = 32  structural
 *   variant x dismiss channel              4 x 1     =  4  dismiss event
 *   variant x lifecycle                    4 x 1     =  4  show()/hide()
 *   runtime property changes                           6   reconfiguration
 *                                                   ─────────────────────
 *                                                      46 combos
 *
 * Sized to the component: a message strip is one row with an optional icon, a
 * message, and an optional close button. Forty-six combos exhaust that surface;
 * the table's thousand would be padding. The variant's PAINT — the whole point
 * of having four of them — is the visual tier's job
 * (tests/live/matrix/message-strip/).
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, cross, expectClean, mount, removeComponent, wait,
} from '../matrix-kit';
import {
  CUSTOM_ICON, ICON_MODES, MESSAGE, VARIANTS,
  checkStructure, contentPart, dismissPart, finishSlideOut, iconFor, iconPart, isHidden,
  lightDomFor, projectedMessage, showsIcon,
  type IconMode, type MessageStripVariant,
} from './message-strip-support';
import '../../../packages/components/src/message-strip/snice-message-strip';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountStrip(
  variant: MessageStripVariant,
  dismissible: boolean,
  mode: IconMode,
): Promise<HTMLElement> {
  const attrs: Record<string, string | boolean> = { variant };
  const icon = iconFor(mode);
  if (icon) attrs.icon = icon;
  if (dismissible) attrs.dismissible = true;
  el = await mount('snice-message-strip', attrs, {}, { html: lightDomFor(mode) });
  return el;
}

// ── Structure: variant x dismissible x icon mode ────────────────────────────

describe('message-strip matrix: structure', () => {
  for (const combo of cross({
    variant: VARIANTS,
    dismissible: [false, true],
    mode: ICON_MODES,
  })) {
    it(combo.id, async () => {
      const strip = await mountStrip(combo.variant, combo.dismissible, combo.mode);
      const problems = new Problems();

      checkStructure(strip, combo.mode, combo.dismissible, problems);
      // The variant is presentation only: it may not add, remove, or rename a
      // single documented region.
      problems.equal((strip as any).variant, combo.variant, 'variant property');
      problems.equal(strip.getAttribute('variant'), combo.variant, 'variant attribute');

      expectClean(problems, combo.id);
    });
  }
});

// ── The dismiss event ───────────────────────────────────────────────────────

describe('message-strip matrix: dismiss', () => {
  for (const combo of cross({ variant: VARIANTS })) {
    it(`${combo.id}/dismiss`, async () => {
      const strip = await mountStrip(combo.variant, true, 'default');
      const problems = new Problems();
      const seen = captureEvents<{ variant: string }>(strip, 'dismiss');

      click(dismissPart(strip));
      await wait(30);

      // Documented: `dismiss` → { variant }.
      problems.equal(seen, [{ variant: combo.variant }], 'dismiss detail');
      // …and the documented effect of the control is `hide()`, which the doc
      // describes as a slide-OUT: the strip is on its way out, and gone once
      // the animation ends.
      finishSlideOut(strip);
      await wait(30);
      problems.check(isHidden(strip), 'the strip is still visible after a completed dismiss');

      expectClean(problems, `${combo.id}/dismiss`);
    });
  }

  it('a non-dismissible strip has no dismiss control to press', async () => {
    const strip = await mountStrip('info', false, 'default');
    const problems = new Problems();
    const seen = captureEvents(strip, 'dismiss');

    problems.check(dismissPart(strip) === null, 'a non-dismissible strip rendered [part="dismiss"]');
    problems.equal(seen.length, 0, 'dismiss events from a strip with no control');
    problems.check(!isHidden(strip), 'a non-dismissible strip hid itself');

    expectClean(problems, 'non-dismissible');
  });
});

// ── show() / hide() ─────────────────────────────────────────────────────────

describe('message-strip matrix: lifecycle', () => {
  for (const combo of cross({ variant: VARIANTS })) {
    it(`${combo.id}/hide-show`, async () => {
      const strip = await mountStrip(combo.variant, true, 'default');
      const problems = new Problems();
      const seen = captureEvents(strip, 'dismiss');

      problems.check(!isHidden(strip), 'the strip starts hidden');

      (strip as any).hide();
      await wait(30);
      finishSlideOut(strip);
      await wait(30);
      problems.check(isHidden(strip), 'hide() left the strip visible');
      // hide() is a METHOD, not the dismiss control: it must not announce a
      // user dismissal nobody performed.
      problems.equal(seen.length, 0, 'dismiss events emitted by hide()');

      (strip as any).show();
      await wait(30);
      problems.check(!isHidden(strip), 'show() did not bring the strip back');
      // …and the content survived the round trip.
      problems.equal(projectedMessage(strip), MESSAGE, 'message after show()');

      // A second hide()/show() round trip has to behave identically — a
      // one-shot animation flag that never resets is the classic defect here.
      (strip as any).hide();
      await wait(30);
      finishSlideOut(strip);
      await wait(30);
      problems.check(isHidden(strip), 'the second hide() left the strip visible');
      (strip as any).show();
      await wait(30);
      problems.check(!isHidden(strip), 'the second show() did not bring the strip back');

      expectClean(problems, `${combo.id}/hide-show`);
    });
  }
});

// ── Runtime reconfiguration ─────────────────────────────────────────────────

describe('message-strip matrix: reconfiguration', () => {
  for (const combo of cross({ from: ICON_MODES } as const)) {
    it(`${combo.id}→none→custom`, async () => {
      const strip = await mountStrip('info', true, combo.from);
      const problems = new Problems();

      problems.equal(iconPart(strip) !== null, showsIcon(combo.from), `icon present for "${combo.from}"`);

      // Documented: icon="none" hides the icon. Switching to it at runtime has
      // to take the icon away, and switching back has to bring one back.
      (strip as any).icon = 'none';
      await wait(30);
      problems.check(iconPart(strip) === null, 'icon="none" left an icon behind');

      (strip as any).icon = CUSTOM_ICON;
      await wait(30);
      problems.check(iconPart(strip) !== null, `icon="${CUSTOM_ICON}" rendered no icon`);
      problems.equal(projectedMessage(strip), MESSAGE, 'message survived the icon changes');

      expectClean(problems, `${combo.id}→none→custom`);
    });
  }

  it('changing variant keeps every region intact', async () => {
    const strip = await mountStrip('info', true, 'default');
    const problems = new Problems();

    for (const variant of VARIANTS) {
      (strip as any).variant = variant;
      await wait(30);
      problems.equal((strip as any).variant, variant, `variant property after → ${variant}`);
      problems.check(contentPart(strip) !== null, `[part="content"] lost at variant=${variant}`);
      problems.check(iconPart(strip) !== null, `[part="icon"] lost at variant=${variant}`);
      problems.check(dismissPart(strip) !== null, `[part="dismiss"] lost at variant=${variant}`);
      problems.equal(projectedMessage(strip), MESSAGE, `message at variant=${variant}`);
    }

    expectClean(problems, 'variant switching');
  });

  it('turning dismissible on and off adds and removes the control', async () => {
    const strip = await mountStrip('info', false, 'default');
    const problems = new Problems();

    problems.check(dismissPart(strip) === null, 'dismissible=false rendered a dismiss control');
    (strip as any).dismissible = true;
    await wait(30);
    problems.check(dismissPart(strip) !== null, 'dismissible=true rendered no dismiss control');
    (strip as any).dismissible = false;
    await wait(30);
    problems.check(dismissPart(strip) === null, 'dismissible=false left the control behind');

    expectClean(problems, 'dismissible toggling');
  });
});
