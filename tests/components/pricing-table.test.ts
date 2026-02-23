import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/pricing-table/snice-pricing-table';
import type { SnicePricingTableElement, PricingPlan } from '../../components/pricing-table/snice-pricing-table.types';

const samplePlans: PricingPlan[] = [
  {
    name: 'Free',
    price: 0,
    description: 'For individuals',
    features: [
      { name: '1 user', included: true },
      { name: '1GB storage', included: true },
      { name: 'Priority support', included: false }
    ],
    cta: 'Get Started'
  },
  {
    name: 'Pro',
    price: 29,
    annualPrice: 24,
    description: 'For teams',
    features: [
      { name: '10 users', included: true },
      { name: '100GB storage', included: true },
      { name: 'Priority support', included: true }
    ],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular'
  },
  {
    name: 'Enterprise',
    price: 99,
    annualPrice: 79,
    description: 'For large orgs',
    features: [
      { name: 'Unlimited users', included: true },
      { name: '1TB storage', included: true },
      { name: 'Priority support', included: true }
    ],
    cta: 'Contact Sales'
  }
];

describe('snice-pricing-table', () => {
  let el: SnicePricingTableElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    expect(el.plans).toEqual([]);
    expect(el.variant).toBe('cards');
    expect(el.annual).toBe(false);
  });

  it('should render plan cards', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const cards = queryShadowAll(el as HTMLElement, '.pricing__card');
    expect(cards.length).toBe(3);
  });

  it('should render plan names', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const names = queryShadowAll(el as HTMLElement, '.pricing__plan-name');
    expect(names.length).toBe(3);
    expect(names[0].textContent).toBe('Free');
    expect(names[1].textContent).toBe('Pro');
  });

  it('should render prices', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const amounts = queryShadowAll(el as HTMLElement, '.pricing__amount');
    expect(amounts.length).toBe(3);
    expect(amounts[0].textContent).toBe('0');
    expect(amounts[1].textContent).toBe('29');
  });

  it('should render features', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const features = queryShadowAll(el as HTMLElement, '.pricing__feature');
    expect(features.length).toBeGreaterThan(0);
  });

  it('should highlight recommended plan', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const highlighted = queryShadow(el as HTMLElement, '.pricing__card--highlighted');
    expect(highlighted).toBeTruthy();
  });

  it('should render badge on highlighted plan', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const badge = queryShadow(el as HTMLElement, '.pricing__badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toBe('Most Popular');
  });

  it('should render CTA buttons', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const ctas = queryShadowAll(el as HTMLElement, '.pricing__cta');
    expect(ctas.length).toBe(3);
  });

  it('should show billing toggle when annual prices exist', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const toggle = queryShadow(el as HTMLElement, '.pricing__toggle');
    expect(toggle).toBeTruthy();
  });

  it('should not show toggle when no annual prices', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = [{ name: 'Basic', price: 10, features: [], cta: 'Buy' }];
    await wait(50);
    const toggle = queryShadow(el as HTMLElement, '.pricing__toggle');
    expect(toggle).toBeFalsy();
  });

  it('should switch to annual pricing', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    el.annual = true;
    await wait(50);
    const amounts = queryShadowAll(el as HTMLElement, '.pricing__amount');
    expect(amounts[1].textContent).toBe('24');
  });

  it('should emit plan-select event', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('plan-select', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const ctas = queryShadowAll(el as HTMLElement, '.pricing__cta');
    (ctas[0] as HTMLElement).click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.plan.name).toBe('Free');
    expect(detail.index).toBe(0);
    expect(detail.billing).toBe('monthly');
  });

  it('should emit annual billing in event when toggled', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    el.annual = true;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('plan-select', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const ctas = queryShadowAll(el as HTMLElement, '.pricing__cta');
    (ctas[1] as HTMLElement).click();
    await wait(50);
    expect(detail.billing).toBe('annual');
  });

  it('should render table variant', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.variant = 'table';
    el.plans = samplePlans;
    await wait(50);
    const table = queryShadow(el as HTMLElement, '.pricing__table');
    expect(table).toBeTruthy();
  });

  it('should render table headers for each plan', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.variant = 'table';
    el.plans = samplePlans;
    await wait(50);
    const headers = queryShadowAll(el as HTMLElement, '.pricing__table th');
    // Feature column + 3 plan columns
    expect(headers.length).toBe(4);
  });

  it('should render plan descriptions', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = samplePlans;
    await wait(50);
    const desc = queryShadow(el as HTMLElement, '.pricing__plan-description');
    expect(desc).toBeTruthy();
  });

  it('should use default currency symbol', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = [{ name: 'Basic', price: 10, features: [], cta: 'Buy' }];
    await wait(50);
    const currency = queryShadow(el as HTMLElement, '.pricing__currency');
    expect(currency?.textContent).toBe('$');
  });

  it('should use custom currency', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = [{ name: 'Basic', price: 10, currency: '\u20AC', features: [], cta: 'Buy' }];
    await wait(50);
    const currency = queryShadow(el as HTMLElement, '.pricing__currency');
    expect(currency?.textContent).toBe('\u20AC');
  });

  it('should render excluded features differently', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = [{
      name: 'Test',
      price: 0,
      features: [
        { name: 'Included', included: true },
        { name: 'Excluded', included: false }
      ],
      cta: 'Go'
    }];
    await wait(50);
    const excluded = queryShadow(el as HTMLElement, '.pricing__feature--excluded');
    expect(excluded).toBeTruthy();
  });

  it('should render string feature values', async () => {
    el = await createComponent<SnicePricingTableElement>('snice-pricing-table');
    el.plans = [{
      name: 'Test',
      price: 0,
      features: [{ name: 'Storage', included: '50GB' }],
      cta: 'Go'
    }];
    await wait(50);
    const value = queryShadow(el as HTMLElement, '.pricing__feature-value');
    expect(value).toBeTruthy();
    expect(value!.textContent?.trim()).toContain('50GB');
  });
});
