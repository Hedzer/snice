import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-pricing-table';

type Args = {
  variant?: 'cards' | 'table';
  annual?: boolean;
};

const meta: Meta<Args> = {
  title: 'Specialty/PricingTable',
  component: 'snice-pricing-table',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['cards', 'table'] },
    annual:  { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-pricing-table');
    el.style.display = 'block';
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.annual) el.toggleAttribute('annual', true);
    (el as any).plans = [
      { name: 'Free', price: 0, cta: 'Get Started', features: [
        { name: '5 projects', included: true },
        { name: 'API access', included: false },
        { name: 'Storage', included: '1GB' },
        { name: 'Support', included: false },
      ]},
      { name: 'Pro', price: 29, annualPrice: 24, cta: 'Start Trial', highlighted: true, badge: 'Popular', features: [
        { name: '5 projects', included: true },
        { name: 'API access', included: true },
        { name: 'Storage', included: '100GB' },
        { name: 'Support', included: false },
      ]},
      { name: 'Enterprise', price: 99, annualPrice: 79, cta: 'Contact Sales', ctaVariant: 'outline', features: [
        { name: '5 projects', included: true },
        { name: 'API access', included: true },
        { name: 'Storage', included: 'Unlimited' },
        { name: 'Support', included: true },
      ]},
    ];
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

const defaultPlans = [
  { name: 'Free', price: 0, cta: 'Get Started', features: [
    { name: '5 projects', included: true },
    { name: 'API access', included: false },
    { name: 'Storage', included: '1GB' },
    { name: 'Support', included: false },
  ]},
  { name: 'Pro', price: 29, annualPrice: 24, cta: 'Start Trial', highlighted: true, badge: 'Popular', features: [
    { name: '5 projects', included: true },
    { name: 'API access', included: true },
    { name: 'Storage', included: '100GB' },
    { name: 'Support', included: false },
  ]},
  { name: 'Enterprise', price: 99, annualPrice: 79, cta: 'Contact Sales', ctaVariant: 'outline', features: [
    { name: '5 projects', included: true },
    { name: 'API access', included: true },
    { name: 'Storage', included: 'Unlimited' },
    { name: 'Support', included: true },
  ]},
];

function makePT(attrs: Record<string, string | boolean> = {}, plans?: object[]) {
  const el = document.createElement('snice-pricing-table');
  el.style.display = 'block';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  if (plans) (el as any).plans = plans;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  wrap.appendChild(el);
  return wrap;
}

function makeDeclarative(variant: string, plans: Array<{
  name: string; price: number; annualPrice?: number; cta: string; ctaVariant?: string;
  highlighted?: boolean; badge?: string; description?: string; currency?: string; period?: string;
  features: Array<{ text: string; value?: string; excluded?: boolean }>;
}>) {
  const el = document.createElement('snice-pricing-table');
  el.style.display = 'block';
  el.setAttribute('variant', variant);

  for (const p of plans) {
    const plan = document.createElement('snice-plan');
    plan.setAttribute('name', p.name);
    plan.setAttribute('price', String(p.price));
    if (p.annualPrice !== undefined) plan.setAttribute('annual-price', String(p.annualPrice));
    if (p.cta)         plan.setAttribute('cta', p.cta);
    if (p.ctaVariant)  plan.setAttribute('cta-variant', p.ctaVariant);
    if (p.highlighted) plan.toggleAttribute('highlighted', true);
    if (p.badge)       plan.setAttribute('badge', p.badge);
    if (p.description) plan.setAttribute('description', p.description);
    if (p.currency)    plan.setAttribute('currency', p.currency);
    if (p.period)      plan.setAttribute('period', p.period);
    for (const f of p.features) {
      const feat = document.createElement('snice-feature');
      if (f.value)    feat.setAttribute('value', f.value);
      if (f.excluded) feat.toggleAttribute('excluded', true);
      feat.textContent = f.text;
      plan.appendChild(feat);
    }
    el.appendChild(plan);
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  wrap.appendChild(el);
  return wrap;
}

export const Default: Story = {
  args: { variant: 'cards', annual: false },
};

// h2: Variant: cards (default) - Declarative
export const VariantCardsDeclarative: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Free', price: 0, cta: 'Get Started', features: [
      { text: '5 projects' }, { text: '1GB storage' }, { text: 'API access', excluded: true }, { text: 'Priority support', excluded: true },
    ]},
    { name: 'Pro', price: 29, annualPrice: 24, highlighted: true, badge: 'Popular', cta: 'Start Trial', description: 'For growing teams', features: [
      { text: 'Unlimited projects' }, { text: 'Storage', value: '100GB' }, { text: 'API access' }, { text: 'Priority support', excluded: true },
    ]},
    { name: 'Enterprise', price: 99, annualPrice: 79, cta: 'Contact Sales', ctaVariant: 'outline', description: 'For large organizations', features: [
      { text: 'Unlimited projects' }, { text: 'Storage', value: 'Unlimited' }, { text: 'API access' }, { text: 'Priority support' },
    ]},
  ]),
};

// h2: Variant: table
export const VariantTable: Story = {
  render: () => makePT({ variant: 'table' }, defaultPlans),
};

// h2: Annual billing toggled on
export const AnnualBillingToggledOn: Story = {
  render: () => makePT({ variant: 'cards', annual: true }, defaultPlans),
};

// h2: No annual pricing (toggle hidden)
export const NoAnnualPricing: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Basic',   price: 10, cta: 'Select', features: [{ text: '10 items' }] },
    { name: 'Premium', price: 30, cta: 'Select', highlighted: true, features: [{ text: 'Unlimited items' }] },
  ]),
};

// h2: Custom currency and period
export const CustomCurrencyAndPeriod: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Starter',  price: 19, currency: 'EUR', period: '/month', cta: 'Subscribe', features: [{ text: 'Basic features' }] },
    { name: 'Business', price: 49, currency: 'EUR', period: '/month', cta: 'Subscribe', highlighted: true, badge: 'Best Value', features: [{ text: 'All features' }] },
  ]),
};

// h2: CTA variants: primary, secondary, outline
export const CtaVariants: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Plan A', price: 10, cta: 'Primary',   ctaVariant: 'primary',   features: [{ text: 'Feature 1' }] },
    { name: 'Plan B', price: 20, cta: 'Secondary', ctaVariant: 'secondary', features: [{ text: 'Feature 1' }] },
    { name: 'Plan C', price: 30, cta: 'Outline',   ctaVariant: 'outline',   features: [{ text: 'Feature 1' }] },
  ]),
};

// h2: Plan with description
export const PlanWithDescription: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Hobby', price: 0,  cta: 'Start Free', description: 'For personal projects and experiments', features: [{ text: '3 projects' }] },
    { name: 'Team',  price: 49, cta: 'Try Free',   description: 'Collaboration for small teams', highlighted: true, badge: 'Recommended', features: [{ text: 'Unlimited projects' }, { text: 'Team management' }] },
  ]),
};

// h2: Badge variations
export const BadgeVariations: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'No Badge',   price: 5,  cta: 'Select', features: [{ text: 'Basic' }] },
    { name: 'Popular',    price: 15, cta: 'Select', highlighted: true, badge: 'Popular',    features: [{ text: 'More' }] },
    { name: 'Best Value', price: 25, cta: 'Select', highlighted: true, badge: 'Best Value', features: [{ text: 'Most' }] },
  ]),
};

// h2: Feature with string value
export const FeatureWithStringValue: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Free', price: 0,  cta: 'Start',   features: [{ text: 'Storage', value: '1GB' }, { text: 'API Calls', value: '100/day' }, { text: 'Custom Domain', excluded: true }] },
    { name: 'Pro',  price: 29, cta: 'Upgrade', highlighted: true, features: [{ text: 'Storage', value: '100GB' }, { text: 'API Calls', value: 'Unlimited' }, { text: 'Custom Domain' }] },
  ]),
};

// h2: Single plan
export const SinglePlan: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'One Plan', price: 9.99, cta: 'Subscribe', highlighted: true, features: [{ text: 'Everything included' }] },
  ]),
};

// h2: Four plans
export const FourPlans: Story = {
  render: () => makeDeclarative('cards', [
    { name: 'Free',       price: 0,  cta: 'Start',   features: [{ text: '1 user' }] },
    { name: 'Basic',      price: 9,  cta: 'Select',  features: [{ text: '5 users' }] },
    { name: 'Pro',        price: 29, cta: 'Select',  highlighted: true, badge: 'Popular', features: [{ text: '25 users' }] },
    { name: 'Enterprise', price: 99, cta: 'Contact', features: [{ text: 'Unlimited' }] },
  ]),
};

// h2: Table variant with annual toggle
export const TableVariantWithAnnualToggle: Story = {
  render: () => makePT({ variant: 'table' }, defaultPlans),
};

// h2: CSS Parts Styling
// Parts: base, toggle, cards, card, cta, table-wrapper, table
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo--pt-styled snice-pricing-table::part(base) {
        background: #0a0a0f;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid rgba(99,102,241,0.3);
      }
      .parts-demo--pt-styled snice-pricing-table::part(toggle) {
        background: rgba(99,102,241,0.1);
        border: 1px solid rgba(99,102,241,0.4);
        border-radius: 999px;
        padding: 0.25rem;
        gap: 0.25rem;
      }
      .parts-demo--pt-styled snice-pricing-table::part(cards) {
        gap: 1.5rem;
      }
      .parts-demo--pt-styled snice-pricing-table::part(card) {
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 12px;
        background: #12121a;
        padding: 1.5rem;
        box-shadow: 0 4px 16px rgba(99,102,241,0.15);
      }
      .parts-demo--pt-styled snice-pricing-table::part(cta) {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border: none;
        border-radius: 8px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: #fff;
        box-shadow: 0 2px 12px rgba(99,102,241,0.4);
      }
      .parts-demo--pt-styled snice-pricing-table::part(table-wrapper) {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(99,102,241,0.3);
      }
      .parts-demo--pt-styled snice-pricing-table::part(table) {
        background: #12121a;
      }
    `;
    wrap.appendChild(style);

    const twoPlans = [
      { name: 'Free', price: 0, cta: 'Get Started', features: [
        { text: '5 projects', included: true },
        { text: 'API access', included: false },
      ]},
      { name: 'Pro', price: 29, annualPrice: 24, cta: 'Start Trial', highlighted: true, badge: 'Popular', features: [
        { text: '5 projects', included: true },
        { text: 'API access', included: true },
      ]},
    ];

    const defaultBox = document.createElement('div');
    defaultBox.className = 'parts-demo';
    const defaultLabel = document.createElement('p');
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.75rem;color:#888;text-transform:uppercase;letter-spacing:.05em;';
    defaultLabel.textContent = 'Default (no ::part() styles)';
    defaultBox.appendChild(defaultLabel);
    defaultBox.appendChild(makePT({ variant: 'cards' }, twoPlans));

    const styledBox = document.createElement('div');
    styledBox.className = 'parts-demo parts-demo--pt-styled';
    const styledLabel = document.createElement('p');
    styledLabel.style.cssText = defaultLabel.style.cssText;
    styledLabel.textContent = 'Styled via ::part(base · toggle · cards · card · cta · table-wrapper · table)';
    styledBox.appendChild(styledLabel);
    styledBox.appendChild(makePT({ variant: 'cards' }, twoPlans));

    wrap.appendChild(defaultBox);
    wrap.appendChild(styledBox);
    return wrap;
  },
};
