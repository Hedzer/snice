/**
 * Smoke slice of the snice-message-strip matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/message-strip/, 47 combos) is
 * excluded from the default Vitest include and runs via `npm run test:matrix`.
 * This file lives at `smoke.test.ts` so it stays collected, and every
 * assertion routes through the matrix's own oracle.
 *
 * The marquee: the fully-featured strip (dismissible, default icon), the two
 * icon switches the doc singles out ("none" and a custom one), the dismiss
 * event, and the show()/hide() pair.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, expectClean, mount, removeComponent, wait,
} from '../matrix-kit';
import {
  MESSAGE, checkStructure, dismissPart, finishSlideOut, iconFor, iconPart, isHidden,
  lightDomFor, projectedMessage, type IconMode,
} from './message-strip-support';
import '../../../packages/components/src/message-strip/snice-message-strip';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountStrip(variant: string, dismissible: boolean, mode: IconMode) {
  const attrs: Record<string, string | boolean> = { variant };
  const icon = iconFor(mode);
  if (icon) attrs.icon = icon;
  if (dismissible) attrs.dismissible = true;
  el = await mount('snice-message-strip', attrs, {}, { html: lightDomFor(mode) });
  return el;
}

describe('message-strip matrix smoke', () => {
  it('a dismissible danger strip renders every documented region', async () => {
    const strip = await mountStrip('danger', true, 'default');
    const problems = new Problems();

    checkStructure(strip, 'default', true, problems);

    expectClean(problems, 'smoke/full');
  });

  it('icon="none" hides the icon and a custom icon brings one back', async () => {
    const strip = await mountStrip('info', false, 'none');
    const problems = new Problems();

    checkStructure(strip, 'none', false, problems);
    (strip as any).icon = 'bell';
    await wait(30);
    problems.check(iconPart(strip) !== null, 'a custom icon rendered no [part="icon"]');
    problems.equal(projectedMessage(strip), MESSAGE, 'the message survived the icon change');

    expectClean(problems, 'smoke/icon-none');
  });

  it('the dismiss control emits dismiss with its variant and hides the strip', async () => {
    const strip = await mountStrip('warning', true, 'default');
    const problems = new Problems();
    const seen = captureEvents<{ variant: string }>(strip, 'dismiss');

    click(dismissPart(strip));
    await wait(30);
    finishSlideOut(strip);
    await wait(30);

    problems.equal(seen, [{ variant: 'warning' }], 'dismiss detail');
    problems.check(isHidden(strip), 'the strip is still visible after a completed dismiss');

    expectClean(problems, 'smoke/dismiss');
  });

  it('hide() then show() is a round trip, and hide() announces nothing', async () => {
    const strip = await mountStrip('success', true, 'default');
    const problems = new Problems();
    const seen = captureEvents(strip, 'dismiss');

    (strip as any).hide();
    await wait(30);
    finishSlideOut(strip);
    await wait(30);
    problems.check(isHidden(strip), 'hide() left the strip visible');
    problems.equal(seen.length, 0, 'dismiss events emitted by hide()');

    (strip as any).show();
    await wait(30);
    problems.check(!isHidden(strip), 'show() did not bring the strip back');
    problems.equal(projectedMessage(strip), MESSAGE, 'message after show()');

    expectClean(problems, 'smoke/hide-show');
  });
});
