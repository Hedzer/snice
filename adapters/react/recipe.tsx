import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the Recipe component
 */
export interface RecipeProps extends SniceBaseProps {
  title?: any;
  description?: any;
  image?: any;
  author?: any;
  prepTime?: any;
  cookTime?: any;
  servings?: any;
  difficulty?: any;
  cuisine?: any;
  variant?: any;
  ingredients?: any;
  steps?: any;
  nutrition?: any;
  tags?: any;
  currentServings?: any;
  checkedIngredients?: any;
  completedSteps?: any;
  activeStep?: any;
  timerVersion?: any;

}

/**
 * Recipe - React adapter for snice-recipe
 *
 * This is an auto-generated React wrapper for the Snice recipe component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/recipe';
 * import { Recipe } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Recipe />;
 * }
 * ```
 */
export const Recipe = createReactAdapter<RecipeProps>({
  tagName: 'snice-recipe',
  properties: ["title","description","image","author","prepTime","cookTime","servings","difficulty","cuisine","variant","ingredients","steps","nutrition","tags","currentServings","checkedIngredients","completedSteps","activeStep","timerVersion"],
  events: {},
  formAssociated: false
});
