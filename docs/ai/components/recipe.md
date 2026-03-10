# snice-recipe

Interactive recipe card with ingredient scaling, step-by-step mode, per-step timers, and nutrition facts.

## Properties

```typescript
title: string = '';
description: string = '';
image: string = '';                          // Hero image URL
author: string = '';
prepTime: number = 0;                       // attr: prep-time, minutes
cookTime: number = 0;                       // attr: cook-time, minutes
servings: number = 4;
difficulty: 'easy'|'medium'|'hard' = 'medium';
cuisine: string = '';                        // Shown as tag
variant: 'card'|'full' = 'full';
ingredients: RecipeIngredient[] = [];        // JS only
steps: RecipeStep[] = [];                    // JS only
nutrition: RecipeNutrition | null = null;    // JS only
tags: string[] = [];                         // JS only
```

## Types

```typescript
interface RecipeIngredient {
  name: string; amount: number; unit: string; group?: string;
}
interface RecipeStep {
  text: string; image?: string; tip?: string; time?: number; // minutes
}
interface RecipeNutrition {
  calories: number; protein: number; carbs: number; fat: number;
  fiber?: number; sodium?: number;
}
```

## Methods

- `setServings(count)` - Adjust serving count (scales ingredients)
- `print()` - Print the recipe
- `reset()` - Reset checked ingredients, completed steps, timers, servings

## Events

- `recipe-serving-change` → `{ servings: number, previousServings: number }`
- `recipe-step-complete` → `{ stepIndex: number, completed: boolean }`
- `recipe-ingredient-check` → `{ ingredientIndex: number, checked: boolean, ingredient: RecipeIngredient }`

## CSS Parts

- `container` - Outer recipe container
- `hero` - Hero image area
- `header` - Title/description/author
- `meta` - Metadata bar (times, servings, difficulty)
- `content` - Main content (ingredients + steps)
- `ingredients` - Ingredients section
- `steps` - Instructions section
- `nutrition` - Nutrition facts panel
- `controls` - Bottom control buttons

## Basic Usage

```typescript
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
  { text: 'Fry pancetta until crispy.', tip: 'Use medium heat.' },
  { text: 'Mix eggs and parmesan.' },
  { text: 'Combine all ingredients off heat.' }
];
recipe.nutrition = { calories: 650, protein: 28, carbs: 72, fat: 24 };
```

## Accessibility

- Keyboard accessible checkboxes, step toggles, and timer buttons
- Serving adjuster buttons have aria-labels
- Print-friendly layout via `print()`
