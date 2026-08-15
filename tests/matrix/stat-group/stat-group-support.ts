/**
 * Oracle for the snice-stat-group matrix.
 *
 * Everything asserted here is read off `docs/ai/components/stat-group.md` and
 * `snice-stat-group.types.ts`:
 *
 *   stats: StatItem[]                     one card per item, in order
 *   StatItem { label, value, trend?, trendValue?, icon?, color? }
 *   columns: number = 0                   0 = auto-fit
 *   variant: 'card'|'minimal'|'bordered'  presentation only
 *   parts: base (grid container), stat (individual card)
 *   event: stat-click -> { stat, index }
 *   a11y: cards are role="button" and keyboard accessible (Enter/Space)
 *
 * The doc says a stat card carries a trend INDICATOR and a trend VALUE, and
 * lists both `trend` and `trendValue` as independently optional — so the
 * oracle treats them as independent: the indicator belongs to `trend`, the
 * text to `trendValue`, and a card with neither has no trend region at all.
 */
import { Problems, all, one, sr, text } from '../matrix-kit';
import type { StatItem, StatGroupVariant } from
  '../../../packages/components/src/stat-group/snice-stat-group.types';

export type { StatItem, StatGroupVariant };

/** The documented variants, and the documented column settings. */
export const VARIANTS: StatGroupVariant[] = ['card', 'minimal', 'bordered'];
export const COLUMN_SETTINGS = [0, 1, 2, 4] as const;

/**
 * The optional-field shapes of StatItem. `trend` and `trendValue` are separate
 * axes because the type marks them separately optional; `icon` and `color` are
 * separate for the same reason (a colour with no icon must still tint the
 * value, per the doc's "With icons and colors" example which pairs them but
 * never says they are coupled).
 */
export interface Shape {
  name: string;
  trend?: StatItem['trend'];
  trendValue?: string;
  icon?: string;
  color?: string;
}

export const SHAPES: Shape[] = [
  { name: 'bare' },
  { name: 'trend-up', trend: 'up' },
  { name: 'trend-down', trend: 'down' },
  { name: 'trend-neutral', trend: 'neutral' },
  { name: 'value-only', trendValue: '+4.0%' },
  { name: 'trend+value', trend: 'up', trendValue: '+12.5%' },
  { name: 'icon', icon: '$' },
  { name: 'icon+color', icon: '$', color: 'rgb(22, 163, 74)' },
  { name: 'color-only', color: 'rgb(220, 38, 38)' },
  { name: 'full', trend: 'down', trendValue: '-3.1%', icon: 'trending_up', color: 'rgb(37, 99, 235)' },
];

/**
 * A dataset built around one shape. Item 1 carries the shape under test; the
 * neighbours are deliberately plain, so a card that leaks its icon/colour/trend
 * onto a sibling is caught rather than hidden by a uniform dataset. Numeric and
 * string values both appear because `value` is `string | number`.
 */
export function datasetFor(shape: Shape): StatItem[] {
  const { name: _name, ...fields } = shape;
  return [
    { label: 'Revenue', value: '$45,231' },
    { label: 'Users', value: 2338, ...fields },
    { label: 'Orders', value: '1,245' },
  ];
}

/** Whether the doc's contract says this item shows a trend region at all. */
export const hasTrendRegion = (stat: StatItem): boolean =>
  Boolean(stat.trend || stat.trendValue);

/**
 * The whole structural oracle for one mounted stat-group: card count and
 * order, label/value text, the optional icon, and the trend region's three
 * documented pieces (region, indicator, value).
 */
export function checkStructure(el: HTMLElement, stats: StatItem[], problems: Problems): void {
  const base = one(el, '[part~="base"]');
  problems.check(base !== null, 'no [part="base"] grid container');

  const cards = all(el, '[part~="stat"]');
  if (!problems.equal(cards.length, stats.length, 'rendered card count')) return;

  cards.forEach((card, i) => {
    const stat = stats[i];
    const where = `card ${i} (${stat.label})`;

    // a11y contract: every card is an activatable button in the tab order.
    problems.equal(card.getAttribute('role'), 'button', `${where} role`);
    problems.check(card.getAttribute('tabindex') === '0', `${where} is not focusable (tabindex)`);

    problems.equal(text(card.querySelector('.stat__label')), stat.label, `${where} label`);
    problems.equal(text(card.querySelector('.stat__value')), String(stat.value), `${where} value`);

    // Icon: present exactly when the item declares one, and painted with the
    // item's own glyph.
    const icon = card.querySelector('.stat__icon');
    if (stat.icon) {
      if (problems.check(icon !== null, `${where} declares icon "${stat.icon}" but renders none`)) {
        problems.check(
          icon!.querySelector('.stat__icon-glyph') !== null,
          `${where} icon wrapper has no glyph`,
        );
      }
    } else {
      problems.check(icon === null, `${where} has no icon but rendered one`);
    }

    // Colour tints the value (and the icon when there is one). The doc's
    // `color` field is a colour for the stat, so a declared colour that lands
    // nowhere is a broken promise.
    const value = card.querySelector('.stat__value') as HTMLElement | null;
    if (stat.color) {
      problems.check(
        (value?.getAttribute('style') ?? '').includes(stat.color),
        `${where} declares color "${stat.color}" but the value carries style `
        + `"${value?.getAttribute('style') ?? ''}"`,
      );
    } else {
      problems.check(
        !(value?.getAttribute('style') ?? '').includes('color:'),
        `${where} declares no color but the value is tinted`,
      );
    }

    // Trend region.
    const region = card.querySelector('.stat__trend');
    if (!hasTrendRegion(stat)) {
      problems.check(region === null, `${where} has neither trend nor trendValue but shows a trend region`);
      return;
    }
    if (!problems.check(region !== null, `${where} should show a trend region`)) return;

    // Direction class falls back to neutral when only a trendValue is given —
    // a value with no direction cannot claim up or down.
    problems.check(
      region!.classList.contains(`stat__trend--${stat.trend ?? 'neutral'}`),
      `${where} trend region classes "${region!.className}" lack `
      + `stat__trend--${stat.trend ?? 'neutral'}`,
    );

    const indicator = region!.querySelector('.stat__trend-icon');
    if (stat.trend) {
      if (problems.check(indicator !== null, `${where} declares trend "${stat.trend}" but shows no indicator`)) {
        problems.check(
          indicator!.classList.contains(`stat__trend-icon--${stat.trend}`),
          `${where} indicator classes "${indicator!.getAttribute('class')}" lack `
          + `stat__trend-icon--${stat.trend}`,
        );
      }
    } else {
      problems.check(indicator === null, `${where} has no trend but shows a direction indicator`);
    }

    const valueText = region!.querySelector('.stat__trend-value');
    if (stat.trendValue) {
      problems.equal(text(valueText), stat.trendValue, `${where} trendValue text`);
    } else {
      problems.check(valueText === null, `${where} has no trendValue but shows trend text`);
    }
  });
}

/**
 * `columns: 0` means auto-fit, so the component must NOT pin a column count;
 * any positive value must reach the grid. The custom property is the only
 * channel a stylesheet can read, so that is what is asserted.
 */
export function checkColumns(el: HTMLElement, columns: number, problems: Problems): void {
  const pinned = el.style.getPropertyValue('--sg-columns');
  if (columns > 0) {
    problems.equal(pinned, String(columns), `columns=${columns} custom property`);
  } else {
    problems.check(pinned === '', `columns=0 is auto-fit but --sg-columns is "${pinned}"`);
  }
}

/** Cards, as the elements a user clicks. */
export const cardsOf = (el: HTMLElement): HTMLElement[] =>
  [...sr(el).querySelectorAll<HTMLElement>('[part~="stat"]')];
