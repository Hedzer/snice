import { element, property, watch, dispatch, ready, on, render, styles, html, css } from 'snice';
import cssContent from './snice-pricing-table.css?inline';
import type { SnicePricingTableElement, PricingTableVariant, PricingPlan, PricingFeature, PlanSelectDetail } from './snice-pricing-table.types';

/**
 * <snice-plan> — declarative child element for pricing plans.
 *
 * Usage:
 *   <snice-pricing-table>
 *     <snice-plan name="Free" price="0" cta="Get Started">
 *       <snice-feature>5 projects</snice-feature>
 *       <snice-feature excluded>API access</snice-feature>
 *       <snice-feature value="1GB">Storage</snice-feature>
 *     </snice-plan>
 *     <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial">
 *       <snice-feature>Unlimited projects</snice-feature>
 *       <snice-feature>API access</snice-feature>
 *     </snice-plan>
 *   </snice-pricing-table>
 */
@element('snice-plan')
export class SnicePlan extends HTMLElement {
  @render()
  renderContent() {
    return html`<slot></slot>`;
  }

  @styles()
  componentStyles() {
    return css/*css*/`:host { display: none; }`;
  }
}

@element('snice-feature')
export class SniceFeature extends HTMLElement {
  @render()
  renderContent() {
    return html`<slot></slot>`;
  }

  @styles()
  componentStyles() {
    return css/*css*/`:host { display: none; }`;
  }
}

@element('snice-pricing-table')
export class SnicePricingTable extends HTMLElement implements SnicePricingTableElement {
  @property({ type: Array, attribute: false })
  plans: PricingPlan[] = [];

  @property()
  variant: PricingTableVariant = 'cards';

  @property({ type: Boolean })
  annual = false;

  @ready()
  init() {
    this.collectPlansFromChildren();
  }

  @on('slotchange', { target: 'slot' })
  handleSlotChange() {
    this.collectPlansFromChildren();
  }

  /** Reads <snice-plan> and <snice-feature> children into the plans array (only if no plans set via property) */
  private collectPlansFromChildren() {
    // Don't override programmatically-set plans
    if (this.plans.length > 0) return;

    const planEls = Array.from(this.querySelectorAll('snice-plan'));
    if (planEls.length === 0) return;

    const collected: PricingPlan[] = planEls.map(planEl => {
      const features: PricingFeature[] = Array.from(planEl.querySelectorAll('snice-feature')).map(featureEl => {
        const excluded = featureEl.hasAttribute('excluded');
        const value = featureEl.getAttribute('value');
        const name = featureEl.textContent?.trim() || '';

        return {
          name,
          included: value ? value : !excluded
        };
      });

      const price = parseFloat(planEl.getAttribute('price') || '0');
      const annualPriceAttr = planEl.getAttribute('annual-price');
      const plan: PricingPlan = {
        name: planEl.getAttribute('name') || '',
        price,
        features,
        cta: planEl.getAttribute('cta') || 'Select',
      };

      if (annualPriceAttr) plan.annualPrice = parseFloat(annualPriceAttr);
      if (planEl.getAttribute('period')) plan.period = planEl.getAttribute('period')!;
      if (planEl.getAttribute('currency')) plan.currency = planEl.getAttribute('currency')!;
      if (planEl.getAttribute('description')) plan.description = planEl.getAttribute('description')!;
      if (planEl.hasAttribute('highlighted')) plan.highlighted = true;
      if (planEl.getAttribute('badge')) plan.badge = planEl.getAttribute('badge')!;
      if (planEl.getAttribute('cta-variant')) plan.ctaVariant = planEl.getAttribute('cta-variant') as PricingPlan['ctaVariant'];

      return plan;
    });

    this.plans = collected;
  }

  @watch('plans')
  handlePlansChange() {
    // Re-render on plans change
  }

  @watch('annual')
  handleAnnualChange() {
    // Re-render on billing toggle
  }

  private getPrice(plan: PricingPlan): number {
    if (this.annual && plan.annualPrice !== undefined) {
      return plan.annualPrice;
    }
    return plan.price;
  }

  private formatPrice(price: number): string {
    return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  private handleSelect(plan: PricingPlan, index: number) {
    this.emitPlanSelect({
      plan,
      index,
      billing: this.annual ? 'annual' : 'monthly'
    });
  }

  @dispatch('plan-select', { bubbles: true, composed: true })
  private emitPlanSelect(detail?: PlanSelectDetail): PlanSelectDetail {
    return detail!;
  }

  private hasAnnualPricing(): boolean {
    return this.plans.some(p => p.annualPrice !== undefined);
  }

  private renderCheckIcon(): unknown {
    return html/*html*/`
      <svg class="pricing__feature-icon pricing__feature-icon--included" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  private renderXIcon(): unknown {
    return html/*html*/`
      <svg class="pricing__feature-icon pricing__feature-icon--excluded" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    `;
  }

  private renderFeature(feature: PricingFeature): unknown {
    const isBoolean = typeof feature.included === 'boolean';
    const included = isBoolean ? feature.included : true;

    return html/*html*/`
      <li class="pricing__feature ${!included ? 'pricing__feature--excluded' : ''}">
        <if ${isBoolean && included}>
          ${this.renderCheckIcon()}
        </if>
        <if ${isBoolean && !included}>
          ${this.renderXIcon()}
        </if>
        <span>
          ${feature.name}
          <if ${!isBoolean}>
            <span class="pricing__feature-value"> - ${feature.included}</span>
          </if>
        </span>
      </li>
    `;
  }

  private renderCard(plan: PricingPlan, index: number): unknown {
    const price = this.getPrice(plan);
    const currency = plan.currency || '$';
    const period = plan.period || '/mo';
    const ctaClass = `pricing__cta pricing__cta--${plan.ctaVariant || (plan.highlighted ? 'primary' : 'secondary')}`;

    return html/*html*/`
      <div class="pricing__card ${plan.highlighted ? 'pricing__card--highlighted' : ''}" part="card">
        <if ${plan.badge}>
          <span class="pricing__badge">${plan.badge}</span>
        </if>
        <div>
          <h3 class="pricing__plan-name">${plan.name}</h3>
          <if ${plan.description}>
            <p class="pricing__plan-description">${plan.description}</p>
          </if>
        </div>
        <div class="pricing__price">
          <span class="pricing__currency">${currency}</span>
          <span class="pricing__amount">${this.formatPrice(price)}</span>
          <span class="pricing__period">${period}</span>
        </div>
        <ul class="pricing__features">
          ${plan.features.map(f => this.renderFeature(f))}
        </ul>
        <button class="${ctaClass}"
                @click=${() => this.handleSelect(plan, index)}
                part="cta">
          ${plan.cta}
        </button>
      </div>
    `;
  }

  private renderCardsView(): unknown {
    return html/*html*/`
      <div class="pricing__cards" part="cards">
        ${this.plans.map((plan, i) => this.renderCard(plan, i))}
      </div>
    `;
  }

  private getAllFeatureNames(): string[] {
    const names = new Set<string>();
    for (const plan of this.plans) {
      for (const f of plan.features) {
        names.add(f.name);
      }
    }
    return Array.from(names);
  }

  private getFeatureValue(plan: PricingPlan, featureName: string): PricingFeature | undefined {
    return plan.features.find(f => f.name === featureName);
  }

  private renderTableView(): unknown {
    const featureNames = this.getAllFeatureNames();

    return html/*html*/`
      <div class="pricing__table-wrapper" part="table-wrapper">
        <table class="pricing__table" part="table">
          <thead>
            <tr>
              <th>Feature</th>
              ${this.plans.map(plan => html/*html*/`
                <th class="${plan.highlighted ? 'pricing__table-highlight' : ''}">${plan.name}</th>
              `)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price</td>
              ${this.plans.map(plan => {
                const price = this.getPrice(plan);
                const currency = plan.currency || '$';
                const period = plan.period || '/mo';
                return html/*html*/`
                  <td class="${plan.highlighted ? 'pricing__table-highlight' : ''}">
                    <strong>${currency}${this.formatPrice(price)}</strong>${period}
                  </td>
                `;
              })}
            </tr>
            ${featureNames.map(name => html/*html*/`
              <tr>
                <td>${name}</td>
                ${this.plans.map(plan => {
                  const feature = this.getFeatureValue(plan, name);
                  const isIncluded = feature ? (typeof feature.included === 'boolean' ? feature.included : true) : false;
                  const value = feature && typeof feature.included === 'string' ? feature.included : '';
                  return html/*html*/`
                    <td class="${plan.highlighted ? 'pricing__table-highlight' : ''}">
                      <if ${!feature}>
                        ${this.renderXIcon()}
                      </if>
                      <if ${feature && typeof feature.included === 'boolean' && isIncluded}>
                        ${this.renderCheckIcon()}
                      </if>
                      <if ${feature && typeof feature.included === 'boolean' && !isIncluded}>
                        ${this.renderXIcon()}
                      </if>
                      <if ${value}>
                        ${value}
                      </if>
                    </td>
                  `;
                })}
              </tr>
            `)}
            <tr>
              <td></td>
              ${this.plans.map((plan, i) => html/*html*/`
                <td class="${plan.highlighted ? 'pricing__table-highlight' : ''}">
                  <button class="pricing__cta pricing__cta--${plan.ctaVariant || (plan.highlighted ? 'primary' : 'outline')}"
                          @click=${() => this.handleSelect(plan, i)}>
                    ${plan.cta}
                  </button>
                </td>
              `)}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  @render()
  renderContent() {
    const isCards = this.variant === 'cards';
    const showToggle = this.hasAnnualPricing();

    return html/*html*/`
      <div class="pricing" part="base">
        <if ${showToggle}>
          <div class="pricing__toggle" part="toggle" role="radiogroup" aria-label="Billing period">
            <button class="pricing__toggle-btn ${!this.annual ? 'pricing__toggle-btn--active' : ''}"
                    @click=${() => { this.annual = false; }}
                    role="radio"
                    aria-checked="${!this.annual}">
              Monthly
            </button>
            <button class="pricing__toggle-btn ${this.annual ? 'pricing__toggle-btn--active' : ''}"
                    @click=${() => { this.annual = true; }}
                    role="radio"
                    aria-checked="${this.annual}">
              Annual
            </button>
          </div>
        </if>

        <if ${isCards}>
          ${this.renderCardsView()}
        </if>
        <if ${!isCards}>
          ${this.renderTableView()}
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
