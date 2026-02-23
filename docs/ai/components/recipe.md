# snice-recipe

Interactive recipe card with ingredient scaling, step-by-step mode, per-step timers, and nutrition facts.

## Properties

```ts
title: string                            // Recipe title
description: string                      // Short description
image: string                            // Hero image URL
author: string                           // Author name
prepTime: number                         // Prep time in minutes (attr: prep-time)
cookTime: number                         // Cook time in minutes (attr: cook-time)
servings: number                         // Base serving count (default: 4)
difficulty: 'easy' | 'medium' | 'hard'  // Difficulty level (default: 'medium')
cuisine: string                          // Cuisine type (shown as tag)
variant: 'card' | 'full'                // Display variant (default: 'full')
ingredients: RecipeIngredient[]          // Ingredient list
steps: RecipeStep[]                      // Instruction steps
nutrition: RecipeNutrition | null        // Nutrition facts per serving
tags: string[]                           // Recipe tags
```

### Types

```ts
interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  group?: string;                        // Group header for ingredient sections
}

interface RecipeStep {
  text: string;
  image?: string;                        // Step photo URL
  tip?: string;                          // Pro tip text
  time?: number;                         // Timer duration in minutes
}

interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;                       // in mg
}
```

## Methods

- `setServings(count: number)` -- Adjust serving count (scales ingredients)
- `print()` -- Print the recipe
- `reset()` -- Reset checked ingredients, completed steps, timers, and servings

## Events

- `recipe-serving-change` -> `{ servings: number; previousServings: number }` -- Serving count changed
- `recipe-step-complete` -> `{ stepIndex: number; completed: boolean }` -- Step toggled
- `recipe-ingredient-check` -> `{ ingredientIndex: number; checked: boolean; ingredient: RecipeIngredient }` -- Ingredient checked/unchecked

## CSS Parts

`container`, `hero`, `header`, `meta`, `content`, `ingredients`, `steps`, `nutrition`, `controls`

## Usage

```js
const recipe = document.querySelector('snice-recipe');
recipe.title = 'Pasta Carbonara';
recipe.prepTime = 10;
recipe.cookTime = 20;
recipe.servings = 4;
recipe.difficulty = 'medium';
recipe.cuisine = 'Italian';
recipe.ingredients = [
  { name: 'Spaghetti', amount: 400, unit: 'g' },
  { name: 'Pancetta', amount: 200, unit: 'g' },
  { name: 'Eggs', amount: 4, unit: '', group: 'Sauce' },
  { name: 'Parmesan', amount: 100, unit: 'g', group: 'Sauce' }
];
recipe.steps = [
  { text: 'Boil pasta in salted water.', time: 10 },
  { text: 'Fry pancetta until crispy.', tip: 'Use medium heat to render fat slowly.' },
  { text: 'Mix eggs and parmesan.' },
  { text: 'Combine all ingredients off heat.' }
];
recipe.nutrition = { calories: 650, protein: 28, carbs: 72, fat: 24 };
```
