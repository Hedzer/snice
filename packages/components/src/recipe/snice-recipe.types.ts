export type RecipeDifficulty = 'easy' | 'medium' | 'hard';
export type RecipeVariant = 'card' | 'full';

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  group?: string;
}

export interface RecipeStep {
  text: string;
  image?: string;
  tip?: string;
  time?: number; // minutes
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface SniceRecipeElement extends HTMLElement {
  title: string;
  description: string;
  image: string;
  author: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  cuisine: string;
  variant: RecipeVariant;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition | null;
  tags: string[];

  setServings(count: number): void;
  print(): void;
  reset(): void;
}

export interface SniceRecipeEventMap {
  'recipe-serving-change': CustomEvent<{ servings: number; previousServings: number }>;
  'recipe-step-complete': CustomEvent<{ stepIndex: number; completed: boolean }>;
  'recipe-ingredient-check': CustomEvent<{ ingredientIndex: number; checked: boolean; ingredient: RecipeIngredient }>;
}
