/**
 * Matrix slice RECIPE / STRUCTURE — every documented region crossed against the
 * property that decides whether it exists.
 *
 * Dimensions (docs/ai/components/recipe.md § Properties, § CSS Parts):
 *   variant (2) x image (2) x description (2) x author (2)
 *   x tagging (3: none / cuisine only / cuisine + tags) x nutrition (3: null /
 *   required-only / with the optional fiber+sodium) = 144 combos.
 *
 * Plus a meta-bar cross (prepTime x cookTime x difficulty = 18) and the
 * content-region cases, all judged by `recipeProblems`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, part } from '../matrix-utils';
import {
  VARIANTS, DIFFICULTIES, recipe, attrsOf, propsOf, comboId, recipeProblems,
  CLEAN_INGREDIENTS, STEPS, NUTRITION_MIN, NUTRITION_FULL, metaValue,
  type RecipeCombo,
} from './recipe-support';

const TITLE = 'Pasta Carbonara';
const DESCRIPTION = 'A Roman classic with egg, cheese, and pepper.';
const AUTHOR = 'Nonna';
const IMAGE = '/images/carbonara.jpg';

const mountRecipe = (c: RecipeCombo) =>
  mount<HTMLElement>('snice-recipe', attrsOf(c), '', propsOf(c));

describe('recipe matrix: structure', () => {
  afterEach(() => unmountAll());

  // ── Region presence ──────────────────────────────────────────────────────

  for (const combo of product({
    variant: VARIANTS,
    image: [false, true],
    description: [false, true],
    author: [false, true],
    tagging: ['none', 'cuisine', 'both'] as const,
    nutrition: ['null', 'min', 'full'] as const,
  })) {
    const c = recipe({
      title: TITLE,
      variant: combo.variant,
      image: combo.image ? IMAGE : '',
      description: combo.description ? DESCRIPTION : '',
      author: combo.author ? AUTHOR : '',
      cuisine: combo.tagging === 'none' ? '' : 'Italian',
      tags: combo.tagging === 'both' ? ['Quick', 'Comfort'] : [],
      nutrition: combo.nutrition === 'null' ? null
        : combo.nutrition === 'min' ? NUTRITION_MIN : NUTRITION_FULL,
      prepTime: 10,
      cookTime: 20,
      ingredients: CLEAN_INGREDIENTS,
      steps: STEPS,
    });

    it(comboId(c), async () => {
      const el = await mountRecipe(c);
      expect(recipeProblems(el, c), `combo ${comboId(c)}`).toEqual([]);
    });
  }

  // ── The meta bar ─────────────────────────────────────────────────────────

  for (const combo of product({
    prepTime: [0, 10, 90],
    cookTime: [0, 20],
    difficulty: DIFFICULTIES,
  })) {
    const c = recipe({
      title: TITLE,
      prepTime: combo.prepTime,
      cookTime: combo.cookTime,
      difficulty: combo.difficulty,
      ingredients: CLEAN_INGREDIENTS,
    });
    const id = `meta prep=${combo.prepTime} cook=${combo.cookTime} difficulty=${combo.difficulty}`;

    it(id, async () => {
      const el = await mountRecipe(c);
      expect(recipeProblems(el, c), `combo ${id}`).toEqual([]);
      // Minutes are the documented unit, so a sub-hour time reports minutes.
      if (combo.prepTime > 0 && combo.prepTime < 60) {
        expect(metaValue(el, 'Prep'), id).toBe(`${combo.prepTime} min`);
      }
    });
  }

  // ── The content region ───────────────────────────────────────────────────

  const contentCases: Array<[string, RecipeCombo]> = [
    ['ingredients only', recipe({ title: TITLE, ingredients: CLEAN_INGREDIENTS })],
    ['steps only', recipe({ title: TITLE, steps: STEPS })],
    ['both', recipe({ title: TITLE, ingredients: CLEAN_INGREDIENTS, steps: STEPS })],
    ['neither', recipe({ title: TITLE })],
  ];

  for (const [id, c] of contentCases) {
    it(`content region: ${id}`, async () => {
      const el = await mountRecipe(c);
      expect(recipeProblems(el, c), `combo ${id}`).toEqual([]);
      expect(!!part(el, 'ingredients'), 'ingredients section').toBe(c.ingredients.length > 0);
      expect(!!part(el, 'steps'), 'steps section').toBe(c.steps.length > 0);
      expect(!!part(el, 'controls'), 'controls').toBe(c.steps.length > 0);
    });
  }

  it('an entirely empty recipe still renders its container and header', async () => {
    const c = recipe();
    const el = await mountRecipe(c);
    expect(recipeProblems(el, c)).toEqual([]);
    expect(part(el, 'container')).not.toBeNull();
    expect(part(el, 'header')).not.toBeNull();
  });

  it('every documented property at once', async () => {
    const c = recipe({
      title: TITLE, description: DESCRIPTION, image: IMAGE, author: AUTHOR,
      prepTime: 10, cookTime: 20, servings: 4, difficulty: 'hard', cuisine: 'Italian',
      variant: 'card', ingredients: CLEAN_INGREDIENTS, steps: STEPS,
      nutrition: NUTRITION_FULL, tags: ['Quick', 'Comfort'],
    });
    const el = await mountRecipe(c);
    expect(recipeProblems(el, c)).toEqual([]);
  });
});
