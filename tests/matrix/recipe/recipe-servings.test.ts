/**
 * Matrix slice RECIPE / SERVINGS — the documented scaling rule.
 *
 * Contract (docs/ai/components/recipe.md):
 *   · `setServings(count)` — "Adjust serving count (scales ingredients)". The
 *     displayed amount of every ingredient is therefore
 *     `amount * count / servings`, where `servings` is the count the recipe was
 *     authored with.
 *   · `recipe-serving-change` -> `{ servings, previousServings }`.
 *   · The serving adjuster buttons carry aria-labels, and the meta bar reports
 *     the current serving count.
 *
 * Dimensions: authored servings (2,4) x target servings (1,2,3,4,8) x
 * ingredient shape (clean / grouped) = 20 scaling combos, plus the fractional
 * rendering cases and the adjuster-button paths.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, captureEvents, click } from '../matrix-utils';
import {
  recipe, attrsOf, propsOf, recipeProblems, readIngredients, readControls,
  metaValue, decodeAmount, scaled, expectedRows, EVENTS,
  CLEAN_INGREDIENTS, GROUPED_INGREDIENTS, STEPS,
  type RecipeCombo, type RecipeIngredient,
} from './recipe-support';

const mountRecipe = (c: RecipeCombo) =>
  mount<HTMLElement>('snice-recipe', attrsOf(c), '', propsOf(c));

describe('recipe matrix: servings and scaling', () => {
  afterEach(() => unmountAll());

  // ── setServings scales every ingredient ──────────────────────────────────

  for (const combo of product({
    base: [2, 4],
    target: [1, 2, 3, 4, 8],
    shape: ['clean', 'grouped'] as const,
  })) {
    const id = `setServings ${combo.base} -> ${combo.target} (${combo.shape})`;

    it(id, async () => {
      const ingredients = combo.shape === 'clean' ? CLEAN_INGREDIENTS : GROUPED_INGREDIENTS;
      const c = recipe({ title: 'Scaled', servings: combo.base, ingredients });
      const el = await mountRecipe(c);
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).setServings(combo.target);
      await (el as any).rendered;

      expect(recorder.types(), id).toEqual(['recipe-serving-change']);
      expect(recorder.events[0].detail, id)
        .toEqual({ servings: combo.target, previousServings: combo.base });

      // The whole rendered recipe, re-judged at the new serving count.
      expect(recipeProblems(el, c, combo.target), `combo ${id}`).toEqual([]);

      // And the scaling rule itself, spelled out: every ingredient in the
      // documented grouped order, at `amount * target / base`.
      const ordered = expectedRows(ingredients)
        .filter(row => row.kind === 'ingredient')
        .map(row => ingredients[row.index]);
      const rendered = readIngredients(el);
      expect(rendered.map(i => i.name), id).toEqual(ordered.map(i => i.name));
      expect(rendered.map(i => i.amount), id)
        .toEqual(ordered.map(i => scaled(i.amount, combo.target, combo.base)));
    });
  }

  it('a fractional scale renders a faithful amount', async () => {
    // 1 tbsp for 4 servings is a quarter tbsp for 1 — a value with no whole-number
    // spelling, so the oracle decodes whatever numeric form is used.
    const ingredients: RecipeIngredient[] = [
      { name: 'Olive oil', amount: 1, unit: 'tbsp' },
      { name: 'Salt', amount: 3, unit: 'tsp' },
    ];
    const c = recipe({ title: 'Fractions', servings: 4, ingredients });
    const el = await mountRecipe(c);

    (el as any).setServings(1);
    await (el as any).rendered;

    const rendered = readIngredients(el);
    expect(rendered[0].amount, `"${rendered[0].amountText}" should decode to 0.25`)
      .toBeCloseTo(scaled(1, 1, 4), 2);
    expect(rendered[1].amount, `"${rendered[1].amountText}" should decode to 0.75`)
      .toBeCloseTo(scaled(3, 1, 4), 2);
    expect(Number.isNaN(decodeAmount(rendered[0].amountText)), 'amount is not numeric at all').toBe(false);
  });

  it('scaling up multiplies through', async () => {
    const c = recipe({ title: 'Doubled', servings: 4, ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);

    (el as any).setServings(8);
    await (el as any).rendered;

    expect(readIngredients(el).map(i => i.amountText)).toEqual(['800', '400']);
    expect(metaValue(el, 'Servings')).toBe('8');
    expect(readControls(el).servingsCount).toBe('8');
  });

  it('setServings emits the previous count each time it changes', async () => {
    const c = recipe({ title: 'Stepped', servings: 4, ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).setServings(6);
    (el as any).setServings(2);
    await (el as any).rendered;

    expect(recorder.events.map(e => e.detail)).toEqual([
      { servings: 6, previousServings: 4 },
      { servings: 2, previousServings: 6 },
    ]);
  });

  // ── The adjuster buttons ─────────────────────────────────────────────────

  it('the increase button raises the serving count by one', async () => {
    const c = recipe({ title: 'Adjust', servings: 4, ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);
    const recorder = captureEvents(el, [...EVENTS]);

    click(readControls(el).increment);
    await (el as any).rendered;

    expect(recorder.events.map(e => e.detail)).toEqual([{ servings: 5, previousServings: 4 }]);
    expect(recipeProblems(el, c, 5)).toEqual([]);
  });

  it('the decrease button lowers the serving count by one', async () => {
    const c = recipe({ title: 'Adjust', servings: 4, ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);

    click(readControls(el).decrement);
    await (el as any).rendered;

    expect(readControls(el).servingsCount).toBe('3');
    expect(recipeProblems(el, c, 3)).toEqual([]);
  });

  it('a recipe never serves fewer than one', async () => {
    // A serving count below one is not a serving count: `setServings` is
    // documented as adjusting the count that ingredients scale to, and a zero
    // or negative multiplier has no meaning for an amount.
    const c = recipe({ title: 'Floor', servings: 1, ingredients: CLEAN_INGREDIENTS });
    const el = await mountRecipe(c);
    const recorder = captureEvents(el, [...EVENTS]);

    click(readControls(el).decrement);
    (el as any).setServings(0);
    (el as any).setServings(-3);
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(readControls(el).servingsCount).toBe('1');
  });

  // ── reset() restores the authored count ──────────────────────────────────

  it('reset() returns the serving count to the authored value', async () => {
    const c = recipe({ title: 'Reset', servings: 4, ingredients: CLEAN_INGREDIENTS, steps: STEPS });
    const el = await mountRecipe(c);

    (el as any).setServings(9);
    await (el as any).rendered;
    expect(readControls(el).servingsCount).toBe('9');

    (el as any).reset();
    await (el as any).rendered;

    expect(readControls(el).servingsCount).toBe('4');
    expect(readIngredients(el).map(i => i.amountText)).toEqual(['400', '200']);
    expect(recipeProblems(el, c, 4)).toEqual([]);
  });
});
