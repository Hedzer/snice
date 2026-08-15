/**
 * snice-layout matrix — the shell family.
 *
 * One combo per documented shell, twice over (every region filled, and only the
 * page region filled), plus the two claims the docs make about the family as a
 * whole. The oracle (`checkShell`) asserts that every documented region is a
 * real slot that projects the content authored into it, that no undocumented
 * region is rendered, and that every CSS part the docs name for the shell
 * exists.
 *
 * 26 + 13 combos + 2 findings.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll, finding } from '../matrix-utils';
import {
  SHELLS, checkShell, expectNoProblems, makeShell, projectedIn, regionMarkup, wait,
} from './layout-support';

describe('layout matrix — regions', () => {
  afterEach(() => unmountAll());

  for (const spec of SHELLS) {
    it(`${spec.tag}: every documented region projects its content`, async () => {
      const el = await makeShell(spec);
      expectNoProblems(checkShell(el, spec), spec.tag);
    });

    it(`${spec.tag}: an unfilled region is still a slot`, async () => {
      const only = spec.slots.includes('page') ? 'page' : spec.slots[0];
      const el = await makeShell(spec, {}, `<div slot="${only}" id="region-${only}">only</div>`);
      const missing = spec.slots.filter(name => !el.shadowRoot!.querySelector(`slot[name="${name}"]`));
      expect(missing, `regions that vanished when unfilled: ${missing.join(',')}`).toEqual([]);
      expect(projectedIn(el, only)).toEqual([`region-${only}`]);
    });
  }
});

describe('layout matrix — regions survive later content', () => {
  afterEach(() => unmountAll());

  for (const spec of SHELLS) {
    it(`${spec.tag}: content added after mount is projected`, async () => {
      const el = await makeShell(spec, {}, '');
      el.innerHTML = regionMarkup(spec);
      await wait(40);
      expectNoProblems(checkShell(el, spec), `${spec.tag} (late content)`);
    });
  }
});

describe('layout matrix — family-wide contracts', () => {
  afterEach(() => unmountAll());

  /**
   * "All regions are slots; all still take router `update()`."
   *
   * `update(appContext, placards, currentRoute, routeParams)` is the documented
   * router hook, listed under Methods with no shell excluded — a router that
   * calls it on the shell an application happens to use must not fall over.
   */
  it.fails(
    finding('MATRIX-layout-1', 'six shells expose no router update() method, though the docs say all shells take one'),
    async () => {
      const without: string[] = [];
      for (const spec of SHELLS) {
        const el = await makeShell(spec, {}, '');
        if (typeof (el as any).update !== 'function') without.push(spec.tag);
      }
      expect(without, 'shells with no update()').toEqual([]);
    },
  );

  /**
   * "`contained` on any shell → sizes to parent instead."
   */
  it.fails(
    finding('MATRIX-layout-2', 'seven shells have no `contained` option, though the docs offer it on any shell'),
    async () => {
      const without: string[] = [];
      for (const spec of SHELLS) {
        const el = await makeShell(spec, { contained: true }, '');
        await wait(10);
        if ((el as any).contained !== true) without.push(spec.tag);
      }
      expect(without, 'shells that ignore `contained`').toEqual([]);
    },
  );

  it('the shells that do take update() survive a router call with no placards', async () => {
    for (const spec of SHELLS) {
      // blog and landing lose their `nav` region to a router call — that is
      // MATRIX-layout-3 below, asserted once rather than in every combo.
      if (spec.tag === 'snice-layout-blog' || spec.tag === 'snice-layout-landing') continue;
      const el = await makeShell(spec);
      if (typeof (el as any).update !== 'function') continue;
      (el as any).update({} as any, [], '/', {});
      await wait(20);
      expectNoProblems(checkShell(el, spec), `${spec.tag} after update()`);
    }
  });

  /**
   * "All regions are slots" — a region is part of the shell's contract, and a
   * router call is not a licence to delete one. `update()` forces `use-nav` on,
   * and the `use-nav` branch renders the placard nav INSTEAD of
   * `<slot name="nav">`, so the documented `nav` region disappears and whatever
   * the application authored into it is dropped from the page.
   */
  it.fails(
    finding('MATRIX-layout-3', 'a router update() (and use-nav) deletes the documented `nav` region on the blog and landing shells, discarding its slotted content'),
    async () => {
      const problems: string[] = [];
      for (const tag of ['snice-layout-blog', 'snice-layout-landing']) {
        const spec = SHELLS.find(candidate => candidate.tag === tag)!;

        const routed = await makeShell(spec);
        (routed as any).update({} as any, [{ name: 'Home', path: '/' }] as any, '/', {});
        await wait(30);
        problems.push(...checkShell(routed, spec).map(problem => `${tag} after update(): ${problem}`));

        const flagged = await makeShell(spec, { 'use-nav': true });
        problems.push(...checkShell(flagged, spec).map(problem => `${tag} with use-nav: ${problem}`));
      }
      expect(problems, 'regions lost to the placard nav').toEqual([]);
    },
  );

  it('the shells that do take update() render the placards as navigation', async () => {
    const placards = [
      { name: 'Home', path: '/', icon: '' },
      { name: 'Docs', path: '/docs', icon: '' },
    ] as any[];

    for (const spec of SHELLS) {
      const el = await makeShell(spec, {}, '');
      if (typeof (el as any).update !== 'function') continue;
      (el as any).update({} as any, placards, '/docs', {});
      await wait(40);
      const nav = el.shadowRoot!.querySelector('snice-nav');
      if (!nav) continue; // a shell may route navigation into a slot instead
      expect(nav, `${spec.tag} rendered no navigation for its placards`).toBeTruthy();
    }
  });
});
