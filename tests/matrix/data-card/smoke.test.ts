/**
 * Smoke slice of the snice-data-card matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/data-card/, 110 combos) is excluded
 * from the default Vitest include and runs via `npm run test:matrix`. This file
 * lives at `smoke.test.ts` so it stays collected, and it routes every
 * assertion through the matrix's own oracle so it cannot assert anything weaker
 * than the suite it stands in for.
 *
 * The marquee: one card carrying every documented value type at once, the
 * grouping rule, one full edit round-trip with both events, and the
 * hidden-when-nothing-is-editable toggle.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import {
  Problems, captureEvents, click, expectClean, mount, press, removeComponent, wait,
} from '../matrix-kit';
import {
  EXTERNAL_HREF, SAME_ORIGIN_HREF,
  checkGroups, checkStructure, editButtonOf, editToggleOf, inputOf, rowFor, typeInto,
  type DataCardField,
} from './data-card-support';
import '../../../packages/components/src/data-card/snice-data-card';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const EVERY_TYPE: DataCardField[] = [
  { label: 'Name', value: 'John Doe', icon: 'user', group: 'Personal' },
  { label: 'Email', value: 'john@example.test', type: 'link', href: `mailto:john@example.test`, group: 'Personal' },
  { label: 'Profile', value: 'In-app', type: 'link', href: SAME_ORIGIN_HREF, group: 'Personal' },
  { label: 'Site', value: 'example.test', type: 'link', href: EXTERNAL_HREF, group: 'Personal' },
  { label: 'Status', value: 'Active', type: 'badge', badgeVariant: 'success', group: 'Account' },
  { label: 'Joined', value: '2024-01-15', type: 'date', group: 'Account' },
  { label: 'Balance', value: '$1,250.00', type: 'currency', group: 'Account' },
  { label: 'Plan', value: 'Enterprise', editable: false, group: 'Account' },
];

describe('data-card matrix smoke', () => {
  it('every documented value type renders its documented shape', async () => {
    el = await mount('snice-data-card', { variant: 'default' }, { fields: EVERY_TYPE });
    const problems = new Problems();

    checkStructure(el, EVERY_TYPE, false, problems);
    checkGroups(el, EVERY_TYPE, problems);

    expectClean(problems, 'smoke/every-type');
  });

  it('grouping splits the card into its documented sections, in first-seen order', async () => {
    el = await mount('snice-data-card', { variant: 'compact' }, {
      fields: [
        { label: 'A', value: '1', group: 'Personal' },
        { label: 'B', value: '2', group: 'Account' },
        { label: 'C', value: '3', group: 'Personal' },
        { label: 'D', value: '4' },
      ] as DataCardField[],
    });
    const problems = new Problems();
    const fields = (el as any).fields as DataCardField[];

    checkGroups(el, fields, problems);
    checkStructure(el, fields, false, problems);

    expectClean(problems, 'smoke/grouping');
  });

  it('an edit round-trip commits the value and emits both documented events', async () => {
    const fields: DataCardField[] = [
      { label: 'Reference', value: 'REF-001' },
      { label: 'Subject', value: 'before' },
    ];
    el = await mount('snice-data-card', { editable: true }, { fields });
    const problems = new Problems();
    const changes = captureEvents<{ value: unknown; previousValue: unknown }>(el, 'field-change');
    const saves = captureEvents<{ value: unknown }>(el, 'field-save');

    click(editButtonOf(rowFor(el, 'Subject')!));
    await wait(30);
    const input = inputOf(rowFor(el, 'Subject')!)!;
    problems.check(input !== null && input !== undefined, 'no [part="field-input"] after starting an edit');
    typeInto(input, 'after');
    press(input, 'Enter');
    await wait(30);

    problems.equal((el as any).getValues().Subject, 'after', 'committed value');
    problems.equal(changes, [{ field: changes[0]?.field, value: 'after', previousValue: 'before' }] as any,
      'field-change detail');
    problems.equal(saves.length, 1, 'field-save count');
    problems.check(inputOf(rowFor(el, 'Subject')!) === null, 'the editor stayed open after Enter');

    expectClean(problems, 'smoke/edit-round-trip');
  });

  it('Escape cancels an edit without emitting anything', async () => {
    el = await mount('snice-data-card', { editable: true }, {
      fields: [{ label: 'Subject', value: 'before' }] as DataCardField[],
    });
    const problems = new Problems();
    const changes = captureEvents(el, 'field-change');

    click(editButtonOf(rowFor(el, 'Subject')!));
    await wait(30);
    typeInto(inputOf(rowFor(el, 'Subject')!)!, 'after');
    press(inputOf(rowFor(el, 'Subject')!)!, 'Escape');
    await wait(30);

    problems.equal((el as any).getValues().Subject, 'before', 'value after Escape');
    problems.equal(changes.length, 0, 'field-change count after Escape');
    expectClean(problems, 'smoke/escape');
  });

  it('the edit toggle is hidden when no field is editable', async () => {
    el = await mount('snice-data-card', {}, {
      fields: [
        { label: 'A', value: '1', editable: false },
        { label: 'B', value: '2', editable: false },
      ] as DataCardField[],
    });
    const problems = new Problems();

    const toggle = editToggleOf(el);
    problems.check(toggle !== null, 'no [part="edit-toggle"] in the tree');
    problems.check(
      (toggle?.getAttribute('style') ?? '').includes('display: none'),
      `the edit toggle is visible with nothing editable (style="${toggle?.getAttribute('style') ?? ''}")`,
    );

    expectClean(problems, 'smoke/toggle-hidden');
  });
});
