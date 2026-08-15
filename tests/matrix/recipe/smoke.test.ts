/**
 * Smoke slice of the snice-recipe matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/recipe/`, excluded from the
 * default Vitest include. This file stays collected and buys the marquee only:
 *
 *   · the fully-populated recipe — every documented part in one render;
 *   · the two content shapes that switch whole regions off (ingredients-only,
 *     steps-only);
 *   · the scaling rule, the one piece of arithmetic the component owns;
 *   · one instance of each of the three documented events;
 *   · `reset()`, the method that has to undo all of them at once.
 *
 * Structural assertions route through the matrix's own `recipeProblems` oracle.
 * BUDGET: well under 1s — no timer case here, that one costs a real second and
 * belongs to the fuzz tier.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, captureEvents, click } from '../matrix-utils';
import {
  recipe, attrsOf, propsOf, recipeProblems, readIngredients, readSteps, readControls,
  CLEAN_INGREDIENTS, STEPS, NUTRITION_FULL, EVENTS, type RecipeCombo,
} from './recipe-support';

const mountRecipe = (c: RecipeCombo) =>
  mount<HTMLElement>('snice-recipe', attrsOf(c), '', propsOf(c));

const FULL = recipe({
  title: 'Pasta Carbonara',
  description: 'A Roman classic.',
  image: '/images/carbonara.jpg',
  author: 'Nonna',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  difficulty: 'medium',
  cuisine: 'Italian',
  tags: ['Quick'],
  ingredients: CLEAN_INGREDIENTS,
  steps: STEPS,
  nutrition: NUTRITION_FULL,
});

describe('recipe matrix smoke', () => {
  afterEach(() => unmountAll());

  const marquee: Array<[string, RecipeCombo]> = [
    ['every documented region at once', FULL],
    ['card variant', recipe({ ...FULL, variant: 'card' })],
    ['ingredients only', recipe({ title: 'Shopping', ingredients: CLEAN_INGREDIENTS })],
    ['steps only', recipe({ title: 'Method', steps: STEPS })],
    ['empty recipe', recipe()],
  ];

  for (const [id, c] of marquee) {
    it(id, async () => {
      const el = await mountRecipe(c);
      expect(recipeProblems(el, c), `combo ${id}`).toEqual([]);
    });
  }

  it('setServings scales the ingredients and emits recipe-serving-change', async () => {
    const el = await mountRecipe(FULL);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).setServings(8);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['recipe-serving-change']);
    expect(recorder.events[0].detail).toEqual({ servings: 8, previousServings: 4 });
    expect(readIngredients(el).map(i => i.amountText)).toEqual(['800', '400']);
    expect(recipeProblems(el, FULL, 8)).toEqual([]);
  });

  it('checking an ingredient and completing a step emit their documented events', async () => {
    const el = await mountRecipe(FULL);
    const recorder = captureEvents(el, [...EVENTS]);

    click(readIngredients(el)[1].node);
    click(readSteps(el)[2].numberNode);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['recipe-ingredient-check', 'recipe-step-complete']);
    expect(recorder.events[0].detail)
      .toEqual({ ingredientIndex: 1, checked: true, ingredient: CLEAN_INGREDIENTS[1] });
    expect(recorder.events[1].detail).toEqual({ stepIndex: 2, completed: true });
  });

  it('reset() undoes checks, completions, and servings', async () => {
    const el = await mountRecipe(FULL);

    click(readIngredients(el)[0].node);
    click(readSteps(el)[0].numberNode);
    (el as any).setServings(6);
    await (el as any).rendered;

    (el as any).reset();
    await (el as any).rendered;

    expect(readIngredients(el).filter(i => i.checked)).toHaveLength(0);
    expect(readSteps(el).filter(s => s.completed)).toHaveLength(0);
    expect(readControls(el).servingsCount).toBe('4');
    expect(recipeProblems(el, FULL, 4)).toEqual([]);
  });
});
