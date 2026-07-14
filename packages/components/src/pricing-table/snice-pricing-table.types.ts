export type PricingTableVariant = 'cards' | 'table';

export interface PricingFeature {
  name: string;
  included: boolean | string;
}

export interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;
  period?: string;
  currency?: string;
  description?: string;
  features: PricingFeature[];
  cta: string;
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  highlighted?: boolean;
  badge?: string;
}

export interface SnicePricingTableElement extends HTMLElement {
  plans: PricingPlan[];
  variant: PricingTableVariant;
  annual: boolean;
}

export interface PlanSelectDetail {
  plan: PricingPlan;
  index: number;
  billing: 'monthly' | 'annual';
}

export interface SnicePricingTableEventMap {
  'plan-select': CustomEvent<PlanSelectDetail>;
}

/**
 * Declarative usage via child elements:
 *
 * <snice-pricing-table>
 *   <snice-plan name="Free" price="0" cta="Get Started">
 *     <snice-feature>5 projects</snice-feature>
 *     <snice-feature excluded>API access</snice-feature>
 *     <snice-feature value="1GB">Storage</snice-feature>
 *   </snice-plan>
 *   <snice-plan name="Pro" price="29" annual-price="24" highlighted badge="Popular" cta="Start Trial" cta-variant="primary">
 *     <snice-feature>Unlimited projects</snice-feature>
 *     <snice-feature>API access</snice-feature>
 *   </snice-plan>
 * </snice-pricing-table>
 *
 * <snice-plan> attributes: name, price, annual-price, period, currency, description, cta, cta-variant, highlighted, badge
 * <snice-feature> attributes: excluded (boolean), value (string for custom display values)
 */
