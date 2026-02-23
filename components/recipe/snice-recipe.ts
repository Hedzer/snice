import { element, property, render, styles, dispatch, watch, html, css } from 'snice';
import cssContent from './snice-recipe.css?inline';
import type { RecipeDifficulty, RecipeVariant, RecipeIngredient, RecipeStep, RecipeNutrition, SniceRecipeElement } from './snice-recipe.types';

@element('snice-recipe')
export class SniceRecipe extends HTMLElement implements SniceRecipeElement {
  @property()
  title = '';

  @property()
  description = '';

  @property()
  image = '';

  @property()
  author = '';

  @property({ type: Number, attribute: 'prep-time' })
  prepTime = 0;

  @property({ type: Number, attribute: 'cook-time' })
  cookTime = 0;

  @property({ type: Number })
  servings = 4;

  @property()
  difficulty: RecipeDifficulty = 'medium';

  @property()
  cuisine = '';

  @property()
  variant: RecipeVariant = 'full';

  @property({ type: Array })
  ingredients: RecipeIngredient[] = [];

  @property({ type: Array })
  steps: RecipeStep[] = [];

  @property({ type: Object })
  nutrition: RecipeNutrition | null = null;

  @property({ type: Array })
  tags: string[] = [];

  // Internal state
  @property({ type: Number })
  private currentServings = 0;

  @property({ type: Array })
  private checkedIngredients: boolean[] = [];

  @property({ type: Array })
  private completedSteps: boolean[] = [];

  @property({ type: Number })
  private activeStep = -1;

  @property({ type: Number })
  private timerVersion = 0;

  private activeTimers: Map<number, { remaining: number; intervalId: number; done: boolean }> = new Map();

  private baseServings = 0;

  @watch('servings')
  onServingsChange() {
    if (this.baseServings === 0) {
      this.baseServings = this.servings;
      this.currentServings = this.servings;
    }
  }

  @watch('ingredients')
  onIngredientsChange() {
    this.checkedIngredients = new Array(this.ingredients.length).fill(false);
  }

  @watch('steps')
  onStepsChange() {
    this.completedSteps = new Array(this.steps.length).fill(false);
    this.activeStep = -1;
  }

  setServings(count: number): void {
    if (count < 1) return;
    const previous = this.currentServings;
    this.currentServings = count;
    this.emitServingChange(previous);
  }

  print(): void {
    window.print();
  }

  reset(): void {
    this.checkedIngredients = new Array(this.ingredients.length).fill(false);
    this.completedSteps = new Array(this.steps.length).fill(false);
    this.activeStep = -1;
    this.currentServings = this.baseServings || this.servings;
    // Clear all active timers
    for (const [, timer] of this.activeTimers.entries()) {
      clearInterval(timer.intervalId);
    }
    this.activeTimers.clear();
    this.timerVersion++;
  }

  private scaleAmount(amount: number): number {
    const base = this.baseServings || this.servings;
    if (base === 0) return amount;
    const scaled = (amount * this.currentServings) / base;
    return Math.round(scaled * 100) / 100;
  }

  private formatAmount(amount: number): string {
    const scaled = this.scaleAmount(amount);
    if (scaled === Math.floor(scaled)) return scaled.toString();
    // Common fractions
    const frac = scaled - Math.floor(scaled);
    const whole = Math.floor(scaled);
    const fractionMap: [number, string][] = [
      [0.25, '\u00BC'], [0.33, '\u2153'], [0.5, '\u00BD'],
      [0.67, '\u2154'], [0.75, '\u00BE'],
    ];
    for (const [val, sym] of fractionMap) {
      if (Math.abs(frac - val) < 0.05) {
        return whole > 0 ? `${whole}${sym}` : sym;
      }
    }
    return scaled.toFixed(1);
  }

  private toggleIngredient(index: number): void {
    const updated = [...this.checkedIngredients];
    updated[index] = !updated[index];
    this.checkedIngredients = updated;
    this.emitIngredientCheck(index, updated[index]);
  }

  private toggleStepComplete(index: number): void {
    const updated = [...this.completedSteps];
    updated[index] = !updated[index];
    this.completedSteps = updated;
    this.emitStepComplete(index, updated[index]);
  }

  private decrementServings(): void {
    if (this.currentServings > 1) {
      this.setServings(this.currentServings - 1);
    }
  }

  private incrementServings(): void {
    this.setServings(this.currentServings + 1);
  }

  private goToPrevStep(): void {
    if (this.activeStep > 0) {
      this.activeStep = this.activeStep - 1;
    }
  }

  private goToNextStep(): void {
    if (this.activeStep < this.steps.length - 1) {
      this.activeStep = this.activeStep + 1;
    } else {
      this.activeStep = -1;
    }
  }

  private startStepByStep(): void {
    this.activeStep = 0;
  }

  private startTimer(stepIndex: number, minutes: number): void {
    if (this.activeTimers.has(stepIndex)) return;

    const remaining = minutes * 60;
    const intervalId = window.setInterval(() => {
      const timer = this.activeTimers.get(stepIndex);
      if (!timer) return;

      if (timer.remaining <= 1) {
        clearInterval(timer.intervalId);
        this.activeTimers.set(stepIndex, { ...timer, remaining: 0, done: true });
        this.timerVersion++;
        return;
      }

      this.activeTimers.set(stepIndex, { ...timer, remaining: timer.remaining - 1 });
      this.timerVersion++;
    }, 1000);

    this.activeTimers.set(stepIndex, { remaining, intervalId, done: false });
    this.timerVersion++;
  }

  private cancelTimer(stepIndex: number): void {
    const timer = this.activeTimers.get(stepIndex);
    if (timer) {
      clearInterval(timer.intervalId);
      this.activeTimers.delete(stepIndex);
      this.timerVersion++;
    }
  }

  private formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }

  @dispatch('recipe-serving-change', { bubbles: true, composed: true })
  private emitServingChange(previousServings: number) {
    return { servings: this.currentServings, previousServings };
  }

  @dispatch('recipe-step-complete', { bubbles: true, composed: true })
  private emitStepComplete(stepIndex: number, completed: boolean) {
    return { stepIndex, completed };
  }

  @dispatch('recipe-ingredient-check', { bubbles: true, composed: true })
  private emitIngredientCheck(ingredientIndex: number, checked: boolean) {
    return { ingredientIndex, checked, ingredient: this.ingredients[ingredientIndex] };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  template() {
    // Initialize base servings on first render
    if (this.baseServings === 0 && this.servings > 0) {
      this.baseServings = this.servings;
      this.currentServings = this.servings;
    }

    const totalTime = this.prepTime + this.cookTime;

    // Group ingredients
    const groups = new Map<string, { ingredient: RecipeIngredient; index: number }[]>();
    this.ingredients.forEach((ing, i) => {
      const group = ing.group || '';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push({ ingredient: ing, index: i });
    });

    const hasStepByStep = this.activeStep >= 0;
    const hasTags = this.tags.length > 0 || this.cuisine.length > 0;
    const hasCuisine = this.cuisine.length > 0;
    const hasIngredients = this.ingredients.length > 0;
    const hasSteps = this.steps.length > 0;
    const hasContent = hasIngredients || hasSteps;
    const hasMeta = this.prepTime > 0 || this.cookTime > 0 || this.servings > 0 || this.difficulty.length > 0;

    // Pre-compute nutrition values to avoid null access in template
    const hasNutrition = this.nutrition !== null;
    const nutritionCalories = hasNutrition ? this.nutrition!.calories : 0;
    const nutritionProtein = hasNutrition ? this.nutrition!.protein : 0;
    const nutritionCarbs = hasNutrition ? this.nutrition!.carbs : 0;
    const nutritionFat = hasNutrition ? this.nutrition!.fat : 0;
    const nutritionFiber = hasNutrition ? this.nutrition!.fiber : 0;
    const nutritionSodium = hasNutrition ? this.nutrition!.sodium : 0;
    const hasFiber = hasNutrition && this.nutrition!.fiber !== undefined;
    const hasSodium = hasNutrition && this.nutrition!.sodium !== undefined;

    // Pre-build ingredient items to avoid nested template issues
    const ingredientItems: any[] = [];
    for (const [groupName, items] of groups.entries()) {
      if (groupName) {
        ingredientItems.push(html`<li class="recipe__ingredient-group-title">${groupName}</li>`);
      }
      for (const { ingredient, index } of items) {
        const isChecked = this.checkedIngredients[index] || false;
        const checkedClass = isChecked ? 'recipe__ingredient--checked' : '';
        ingredientItems.push(html`
          <li class="recipe__ingredient ${checkedClass}" @click=${() => this.toggleIngredient(index)}>
            <input type="checkbox" class="recipe__ingredient-checkbox" ?checked=${isChecked} @click=${(e: Event) => e.stopPropagation()} @change=${() => this.toggleIngredient(index)} />
            <span class="recipe__ingredient-amount">${this.formatAmount(ingredient.amount)} ${ingredient.unit}</span>
            <span class="recipe__ingredient-text">${ingredient.name}</span>
          </li>
        `);
      }
    }

    return html/*html*/`
      <div class="recipe" part="container">
        <if ${this.image}>
          <div class="recipe__hero" part="hero">
            <img src="${this.image}" alt="${this.title}" loading="lazy" />
          </div>
        </if>

        <div class="recipe__header" part="header">
          <h2 class="recipe__title">${this.title}</h2>
          <if ${this.description}>
            <p class="recipe__description">${this.description}</p>
          </if>
          <if ${this.author}>
            <span class="recipe__author">By ${this.author}</span>
          </if>
          <if ${hasTags}>
            <div class="recipe__tags">
              <if ${hasCuisine}>
                <span class="recipe__tag">${this.cuisine}</span>
              </if>
              ${this.tags.map(tag => html`<span class="recipe__tag">${tag}</span>`)}
            </div>
          </if>
        </div>

        <if ${hasMeta}>
          <div class="recipe__meta" part="meta">
            <if ${this.prepTime > 0}>
              <div class="recipe__meta-item">
                <span class="recipe__meta-label">Prep</span>
                <span class="recipe__meta-value">${this.formatMinutes(this.prepTime)}</span>
              </div>
            </if>
            <if ${this.cookTime > 0}>
              <div class="recipe__meta-item">
                <span class="recipe__meta-label">Cook</span>
                <span class="recipe__meta-value">${this.formatMinutes(this.cookTime)}</span>
              </div>
            </if>
            <if ${totalTime > 0}>
              <div class="recipe__meta-item">
                <span class="recipe__meta-label">Total</span>
                <span class="recipe__meta-value">${this.formatMinutes(totalTime)}</span>
              </div>
            </if>
            <if ${this.currentServings > 0}>
              <div class="recipe__meta-item">
                <span class="recipe__meta-label">Servings</span>
                <span class="recipe__meta-value">${this.currentServings}</span>
              </div>
            </if>
            <if ${this.difficulty}>
              <div class="recipe__meta-item">
                <span class="recipe__meta-label">Difficulty</span>
                <span class="recipe__meta-value recipe__difficulty--${this.difficulty}">${this.difficulty}</span>
              </div>
            </if>
          </div>
        </if>

        <if ${hasContent}>
          <div class="recipe__content" part="content">
            <if ${hasIngredients}>
              <div class="recipe__ingredients-section" part="ingredients">
                <h3 class="recipe__section-title">Ingredients</h3>
                <div class="recipe__servings-adjuster">
                  <button class="recipe__servings-btn" @click=${() => this.decrementServings()} aria-label="Decrease servings">-</button>
                  <span class="recipe__servings-count">${this.currentServings}</span>
                  <button class="recipe__servings-btn" @click=${() => this.incrementServings()} aria-label="Increase servings">+</button>
                  <span>servings</span>
                </div>
                <ul class="recipe__ingredients-list">
                  ${ingredientItems}
                </ul>
              </div>
            </if>

            <if ${hasSteps}>
              <div class="recipe__steps-section" part="steps">
                <h3 class="recipe__section-title">Instructions</h3>
                <ol class="recipe__steps-list">
                  ${this.steps.map((step, i) => {
                    const isCompleted = this.completedSteps[i] || false;
                    const isActive = this.activeStep === i;
                    const timer = this.activeTimers.get(i);
                    const hasTimer = timer !== undefined;
                    const timerDone = hasTimer && timer.done;
                    const timerClass = timerDone ? 'recipe__active-timer--done' : '';
                    const timerText = hasTimer ? (timer.done ? 'Done!' : this.formatTimer(timer.remaining)) : '';
                    const showTimerBtn = step.time && !hasTimer;
                    return html`
                      <li class="recipe__step ${isCompleted ? 'recipe__step--completed' : ''} ${isActive ? 'recipe__step--active' : ''}">
                        <span class="recipe__step-number" @click=${() => this.toggleStepComplete(i)} title="${isCompleted ? 'Mark incomplete' : 'Mark complete'}">
                          ${isCompleted ? '\u2713' : i + 1}
                        </span>
                        <div class="recipe__step-body">
                          <div class="recipe__step-text">${step.text}</div>
                          <if ${step.tip}>
                            <div class="recipe__step-tip">${step.tip}</div>
                          </if>
                          <if ${step.image}>
                            <img class="recipe__step-image" src="${step.image}" alt="Step ${i + 1}" loading="lazy" />
                          </if>
                          <if ${showTimerBtn}>
                            <button class="recipe__step-timer-btn" @click=${() => this.startTimer(i, step.time!)}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              ${this.formatMinutes(step.time!)}
                            </button>
                          </if>
                          <if ${hasTimer}>
                            <span class="recipe__active-timer ${timerClass}">
                              ${timerText}
                              <button class="recipe__timer-cancel" @click=${() => this.cancelTimer(i)} title="Cancel timer">\u2715</button>
                            </span>
                          </if>
                        </div>
                      </li>
                    `;
                  })}
                </ol>
              </div>
            </if>
          </div>
        </if>

        <if ${hasNutrition}>
          <div class="recipe__nutrition" part="nutrition">
            <h3 class="recipe__section-title">Nutrition Facts</h3>
            <span class="recipe__author">Per serving</span>
            <div class="recipe__nutrition-grid">
              <div class="recipe__nutrition-item">
                <div class="recipe__nutrition-value">${nutritionCalories}</div>
                <div class="recipe__nutrition-label">Calories</div>
              </div>
              <div class="recipe__nutrition-item">
                <div class="recipe__nutrition-value">${nutritionProtein}g</div>
                <div class="recipe__nutrition-label">Protein</div>
              </div>
              <div class="recipe__nutrition-item">
                <div class="recipe__nutrition-value">${nutritionCarbs}g</div>
                <div class="recipe__nutrition-label">Carbs</div>
              </div>
              <div class="recipe__nutrition-item">
                <div class="recipe__nutrition-value">${nutritionFat}g</div>
                <div class="recipe__nutrition-label">Fat</div>
              </div>
              <if ${hasFiber}>
                <div class="recipe__nutrition-item">
                  <div class="recipe__nutrition-value">${nutritionFiber}g</div>
                  <div class="recipe__nutrition-label">Fiber</div>
                </div>
              </if>
              <if ${hasSodium}>
                <div class="recipe__nutrition-item">
                  <div class="recipe__nutrition-value">${nutritionSodium}mg</div>
                  <div class="recipe__nutrition-label">Sodium</div>
                </div>
              </if>
            </div>
          </div>
        </if>

        <if ${hasSteps}>
          <div class="recipe__step-controls" part="controls">
            <if ${!hasStepByStep}>
              <button @click=${() => this.startStepByStep()}>Step-by-Step</button>
            </if>
            <if ${hasStepByStep}>
              <button @click=${() => this.goToPrevStep()} ?disabled=${this.activeStep <= 0}>Previous</button>
              <button @click=${() => this.goToNextStep()}>
                ${this.activeStep >= this.steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </if>
            <button class="recipe__print-btn" @click=${() => this.print()}>Print</button>
            <button @click=${() => this.reset()}>Reset</button>
          </div>
        </if>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-recipe': SniceRecipe;
  }
}
