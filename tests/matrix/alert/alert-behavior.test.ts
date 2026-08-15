/**
 * Matrix slice ALERT / BEHAVIOR — dismissal, the show/hide lifecycle, and the
 * auto-dismiss countdown.
 *
 * Dimensions: the dismiss path crosses variant (4) x titled (2) = 8 combos,
 * because both fields of every documented event payload come from those two
 * properties and a single-variant test could not tell a hard-coded payload from
 * a derived one. The lifecycle and countdown paths add 12 more.
 *
 * Documented contract under test (docs/ai/components/alert.md):
 *   · Events — `alert-dismiss -> { variant, title }` "Dismiss button clicked",
 *     `alert-shown -> { variant, title }`, `alert-hidden -> { variant, title }`
 *     "Alert hidden after animation".
 *   · Methods — `show()` / `hide()` ("Hide alert with animation").
 *   · `duration: number = 0` — "ms until auto-dismiss, 0 = off; countdown
 *     pauses on hover".
 *
 * The animation itself is supplied by the test (`finishHideAnimation`) because
 * happy-dom runs no animations. That substitutes for the ENGINE, not for the
 * component: the component still has to decide to dispatch.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  VARIANTS, TITLE,
  combo, comboId, makeAlert, collectEvents, clickDismiss,
  finishHideAnimation, baseClassList, hover, wait, removeComponent,
} from './alert-support';

describe('alert matrix: dismissal', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  for (const variant of VARIANTS) {
    for (const titled of [false, true]) {
      const c = combo({ variant, titled, dismissible: true });

      it(`${comboId(c)}: alert-dismiss carries { variant, title }`, async () => {
        alert = await makeAlert(c);
        const seen = collectEvents(alert);

        expect(clickDismiss(alert), 'a dismissible alert has a dismiss button').toBe(true);
        await wait(20);

        expect(seen.map(e => e.type)).toEqual(['alert-dismiss']);
        expect(seen[0].detail).toEqual({ variant, title: titled ? TITLE : '' });
      });
    }
  }

  it('a non-dismissible alert renders no dismiss button and emits nothing', async () => {
    alert = await makeAlert(combo({ dismissible: false }));
    const seen = collectEvents(alert);

    expect(clickDismiss(alert)).toBe(false);
    await wait(20);
    expect(seen).toEqual([]);
  });

  it('dismissing starts the documented hide animation', async () => {
    alert = await makeAlert(combo({ dismissible: true }));
    clickDismiss(alert);
    await wait(20);

    expect(baseClassList(alert), 'hide() animates rather than removing').toContain('alert--hiding');
  });
});

describe('alert matrix: show / hide lifecycle', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  it('show() emits alert-shown with { variant, title }', async () => {
    const c = combo({ variant: 'success', titled: true });
    alert = await makeAlert(c);
    const seen = collectEvents(alert);

    alert.show();
    await wait(20);

    expect(seen.map(e => e.type)).toEqual(['alert-shown']);
    expect(seen[0].detail).toEqual({ variant: 'success', title: TITLE });
  });

  it('hide() emits alert-hidden only AFTER the animation finishes', async () => {
    const c = combo({ variant: 'error', titled: true });
    alert = await makeAlert(c);
    const seen = collectEvents(alert);

    alert.hide();
    await wait(20);
    expect(seen, 'nothing is announced mid-animation').toEqual([]);

    finishHideAnimation(alert);
    await wait(20);
    expect(seen.map(e => e.type)).toEqual(['alert-hidden']);
    expect(seen[0].detail).toEqual({ variant: 'error', title: TITLE });
  });

  it('a finished hide leaves the alert in its hidden state', async () => {
    alert = await makeAlert(combo());
    alert.hide();
    finishHideAnimation(alert);
    await wait(20);

    const classes = baseClassList(alert);
    expect(classes, 'the hidden state class replaces the hiding one').toContain('alert--hidden');
    expect(classes).not.toContain('alert--hiding');
  });

  it('show() after a completed hide clears the hidden state', async () => {
    alert = await makeAlert(combo());
    alert.hide();
    finishHideAnimation(alert);
    await wait(20);

    alert.show();
    await wait(20);

    const classes = baseClassList(alert);
    expect(classes).not.toContain('alert--hidden');
    expect(classes).not.toContain('alert--hiding');
  });
});

describe('alert matrix: auto-dismiss countdown', () => {
  let alert: any;
  afterEach(() => { if (alert) { removeComponent(alert); alert = null; } });

  it('duration = 0 never auto-dismisses', async () => {
    alert = await makeAlert(combo());
    await wait(120);
    expect(baseClassList(alert)).not.toContain('alert--hiding');
  });

  for (const variant of ['info', 'warning'] as const) {
    it(`${variant}: a positive duration auto-dismisses after it elapses`, async () => {
      alert = await makeAlert(combo({ variant }));
      alert.duration = 40;
      await wait(10);
      expect(baseClassList(alert), 'still visible before the deadline').not.toContain('alert--hiding');

      await wait(90);
      expect(baseClassList(alert), 'hidden after the deadline').toContain('alert--hiding');
    });
  }

  it('the countdown pauses on hover', async () => {
    alert = await makeAlert(combo());
    alert.duration = 60;
    await wait(10);

    hover(alert, 'mouseenter');
    await wait(140);

    expect(baseClassList(alert), 'a hovered alert must not dismiss itself')
      .not.toContain('alert--hiding');
  });

  it('the countdown resumes when the pointer leaves', async () => {
    alert = await makeAlert(combo());
    alert.duration = 60;
    await wait(10);

    hover(alert, 'mouseenter');
    await wait(120);
    hover(alert, 'mouseleave');
    await wait(20);
    expect(baseClassList(alert), 'the remaining time restarts, it does not fire instantly')
      .not.toContain('alert--hiding');

    await wait(120);
    expect(baseClassList(alert)).toContain('alert--hiding');
  });

  it('setting duration back to 0 cancels a running countdown', async () => {
    alert = await makeAlert(combo());
    alert.duration = 50;
    await wait(10);
    alert.duration = 0;

    await wait(120);
    expect(baseClassList(alert)).not.toContain('alert--hiding');
  });

  it('a disconnected alert stops its countdown', async () => {
    alert = await makeAlert(combo());
    alert.duration = 40;
    const seen = collectEvents(alert);
    removeComponent(alert);

    await wait(120);
    expect(seen, 'no event from a torn-down alert').toEqual([]);
    alert = null;
  });
});
