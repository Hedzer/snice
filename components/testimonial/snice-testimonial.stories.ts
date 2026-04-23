import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-testimonial';

type Args = {
  variant?: string;
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
};

const meta: Meta<Args> = {
  title: 'Testimonial',
  component: 'snice-testimonial',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['card', 'minimal', 'featured'] },
    quote:   { control: 'text' },
    author:  { control: 'text' },
    role:    { control: 'text' },
    company: { control: 'text' },
    avatar:  { control: 'text' },
    rating:  { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-testimonial');
    el.style.cssText = 'max-width:350px;';
    if (args.variant !== undefined) el.setAttribute('variant', args.variant);
    if (args.quote !== undefined) el.setAttribute('quote', args.quote);
    if (args.author !== undefined) el.setAttribute('author', args.author);
    if (args.role !== undefined) el.setAttribute('role', args.role);
    if (args.company !== undefined) el.setAttribute('company', args.company);
    if (args.avatar !== undefined) el.setAttribute('avatar', args.avatar);
    if (args.rating !== undefined) el.setAttribute('rating', String(args.rating));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    variant: 'card',
    quote: 'This product changed the way we work. Highly recommended.',
    author: 'Alice Johnson',
    role: 'CTO',
    company: 'TechCorp',
  },
};

function t(attrs: Record<string, string | number>) {
  const el = document.createElement('snice-testimonial');
  el.style.cssText = 'max-width:350px;';
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:flex-start;gap:0.75rem;flex-wrap:wrap;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Variants
export const Variants: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'This product changed the way we work. Highly recommended.', author: 'Alice Johnson', role: 'CTO', company: 'TechCorp' }),
    t({ variant: 'minimal', quote: 'Simple yet powerful. Exactly what we needed.', author: 'Bob Smith', role: 'Designer', company: 'DesignCo' }),
    t({ variant: 'featured', quote: 'Outstanding quality and support. Five stars all around.', author: 'Charlie Brown', role: 'CEO', company: 'StartupInc' }),
  ),
};

// h2: With Rating (0-5)
export const WithRating05: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Rating 0 stars', author: 'Reviewer', rating: 0 }),
    t({ variant: 'card', quote: 'Rating 1 star', author: 'Reviewer', rating: 1 }),
    t({ variant: 'card', quote: 'Rating 2 stars', author: 'Reviewer', rating: 2 }),
    t({ variant: 'card', quote: 'Rating 3 stars', author: 'Reviewer', rating: 3 }),
    t({ variant: 'card', quote: 'Rating 4 stars', author: 'Reviewer', rating: 4 }),
    t({ variant: 'card', quote: 'Rating 5 stars', author: 'Reviewer', rating: 5 }),
  ),
};

// h2: With Avatar
export const WithAvatar: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Great experience working with this team.', author: 'Diana Prince', role: 'Product Manager', company: 'Acme Corp', avatar: 'https://i.pravatar.cc/80?img=1', rating: 5 }),
    t({ variant: 'minimal', quote: 'The best tool we have used this year.', author: 'Eve Wilson', role: 'Engineer', company: 'DevShop', avatar: 'https://i.pravatar.cc/80?img=5', rating: 4 }),
    t({ variant: 'featured', quote: 'Transformed our workflow completely.', author: 'Frank Miller', role: 'VP Engineering', company: 'BigTech', avatar: 'https://i.pravatar.cc/80?img=12', rating: 5 }),
  ),
};

// h2: Author Only (No Role/Company)
export const AuthorOnlyNoRoleCompany: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Clean and intuitive interface.', author: 'Grace Lee' }),
  ),
};

// h2: Role Only (No Company)
export const RoleOnlyNoCompany: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Perfect for our use case.', author: 'Hank Davis', role: 'Senior Developer' }),
  ),
};

// h2: Company Only (No Role)
export const CompanyOnlyNoRole: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Would use again without hesitation.', author: 'Ivy Chen', company: 'GlobalCo' }),
  ),
};

// h2: Minimal Content (Quote + Author Only)
export const MinimalContentQuotePlusAuthorOnly: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Love it.', author: 'Jack' }),
    t({ variant: 'minimal', quote: 'Love it.', author: 'Jack' }),
    t({ variant: 'featured', quote: 'Love it.', author: 'Jack' }),
  ),
};

// h2: Long Quote
export const LongQuote: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'This is a much longer testimonial that spans multiple lines to test how the component handles longer content. It should wrap gracefully and maintain proper spacing and readability throughout the entire quote block.', author: 'Katherine Williams', role: 'Head of Operations', company: 'Enterprise Solutions Ltd', avatar: 'https://i.pravatar.cc/80?img=9', rating: 5 }),
  ),
};

// h2: All Variants with Full Data
export const AllVariantsWithFullData: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'Card variant with all properties set.', author: 'User A', role: 'Manager', company: 'Company A', avatar: 'https://i.pravatar.cc/80?img=20', rating: 4 }),
    t({ variant: 'minimal', quote: 'Minimal variant with all properties set.', author: 'User B', role: 'Director', company: 'Company B', avatar: 'https://i.pravatar.cc/80?img=30', rating: 5 }),
    t({ variant: 'featured', quote: 'Featured variant with all properties set.', author: 'User C', role: 'Founder', company: 'Company C', avatar: 'https://i.pravatar.cc/80?img=40', rating: 3 }),
  ),
};

// h2: Ratings x Variants
export const RatingsXVariants: Story = {
  render: () => {
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,350px);gap:0.75rem;';
    grid.appendChild(t({ variant: 'card', quote: '3 stars card', author: 'A', rating: 3 }));
    grid.appendChild(t({ variant: 'minimal', quote: '3 stars minimal', author: 'A', rating: 3 }));
    grid.appendChild(t({ variant: 'featured', quote: '3 stars featured', author: 'A', rating: 3 }));
    grid.appendChild(t({ variant: 'card', quote: '5 stars card', author: 'B', rating: 5 }));
    grid.appendChild(t({ variant: 'minimal', quote: '5 stars minimal', author: 'B', rating: 5 }));
    grid.appendChild(t({ variant: 'featured', quote: '5 stars featured', author: 'B', rating: 5 }));
    return col(grid);
  },
};

// h2: No Rating
export const NoRating: Story = {
  render: () => row(
    t({ variant: 'card', quote: 'No rating provided', author: 'No Stars', role: 'Tester' }),
  ),
};

// h2: CSS Parts Styling
// Parts: base, quote, author, stars
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-testimonial::part(base) {}

      /* Styled: base — card container */
      .parts-demo .demo-styled snice-testimonial::part(base) {
        background: linear-gradient(135deg, #0f172a, #1e1b4b);
        border: 2px solid #818cf8;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(129, 140, 248, 0.3);
        color: #e2e8f0;
      }
      /* Styled: stars — star rating row */
      .parts-demo .demo-styled snice-testimonial::part(stars) {
        color: #fbbf24;
        font-size: 1.4rem;
        letter-spacing: 4px;
        text-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
        margin-bottom: 0.75rem;
      }
      /* Styled: quote — quoted text */
      .parts-demo .demo-styled snice-testimonial::part(quote) {
        font-size: 1.1rem;
        font-style: italic;
        color: #c7d2fe;
        border-left: 4px solid #818cf8;
        padding-left: 1rem;
        line-height: 1.7;
        margin-bottom: 1.25rem;
      }
      /* Styled: author — author info row */
      .parts-demo .demo-styled snice-testimonial::part(author) {
        border-top: 1px solid rgba(129, 140, 248, 0.3);
        padding-top: 1rem;
        font-weight: 600;
        color: #a5b4fc;
      }
    `;

    const defaultEl = t({ variant: 'card', quote: 'This product is outstanding!', author: 'Jane Smith', role: 'Product Lead', rating: 5 });
    const styledEl = t({ variant: 'card', quote: 'This product is outstanding!', author: 'Jane Smith', role: 'Product Lead', rating: 5 });

    const defaultWrap = document.createElement('div');
    defaultWrap.className = 'demo-default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'label';
    defaultLabel.textContent = 'Default';
    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultEl);

    const styledWrap = document.createElement('div');
    styledWrap.className = 'demo-styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'label';
    styledLabel.textContent = 'Styled (::part(base, stars, quote, author))';
    styledWrap.appendChild(styledLabel);
    styledWrap.appendChild(styledEl);

    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    rowEl.appendChild(defaultWrap);
    rowEl.appendChild(styledWrap);

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(rowEl);
    return wrap;
  },
};
