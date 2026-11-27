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

- `base` / `container` - Outer recipe container (both tokens are on the same element)
- `hero` - Hero image area
- `hero-image` - Hero image
- `header` - Title/description/author
- `title` - Recipe title
- `description` - Recipe description
- `author` - Author line
- `tags` - Tag row
- `tag` - Individual tag
- `cuisine-tag` - Added to `tag` on the cuisine tag
- `meta` - Metadata bar (times, servings, difficulty)
- `meta-item` - One metadata field
- `meta-label` - Metadata field label
- `meta-value` - Metadata field value
- `difficulty` - Added to `meta-value` on the difficulty field
- `content` - Main content (ingredients + steps)
- `section-title` - Section heading
- `ingredients` - Ingredients section
- `servings-adjuster` - Servings stepper row
- `servings-button` - Servings stepper button
- `servings-decrease` / `servings-increase` - Added to `servings-button` on the minus and plus buttons
- `servings-count` - Current servings number
- `servings-label` - The "servings" word
- `list` - Ingredients and steps lists
- `ingredients-list` - Added to `list` on the ingredients list
- `ingredient-group-title` - Ingredient group heading row
- `ingredient` - Ingredient row
- `ingredient-checked` - Added to `ingredient` while checked off
- `checkbox` - Ingredient checkbox
- `ingredient-amount` - Ingredient amount and unit
- `ingredient-text` - Ingredient name
- `steps` - Instructions section
- `steps-list` - Added to `list` on the steps list
- `step` - Step row
- `step-completed` - Added to `step` while completed
- `step-active` - Added to `step` while it is the active step
- `step-number` - Step number badge
- `step-body` - Step content column
- `step-text` - Step instruction text
- `step-tip` - Step tip
- `step-image` - Step image
- `button` - Any recipe button
- `timer-button` - Added to `button` on the start-timer button
- `icon` - Timer button icon
- `timer` - Running timer chip
- `timer-done` - Added to `timer` when the timer has finished
- `timer-cancel-button` - Added to `button` on the timer cancel button
- `nutrition` - Nutrition facts panel
- `nutrition-note` - The "Per serving" note
- `nutrition-grid` - Nutrition value grid
- `nutrition-item` - One nutrition figure
- `nutrition-value` - Nutrition figure value
- `nutrition-label` - Nutrition figure label
- `controls` - Bottom control buttons
- `step-by-step-button` / `prev-button` / `next-button` / `print-button` / `reset-button` - Added to `button` on the matching control

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
