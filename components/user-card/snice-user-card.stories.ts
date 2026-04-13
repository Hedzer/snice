import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-user-card';
import type { UserCardVariant, UserCardStatus, SocialLink } from './snice-user-card.types';

type Args = {
  name?: string;
  avatar?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  location?: string;
  status?: UserCardStatus;
  variant?: UserCardVariant;
};

const VARIANTS: UserCardVariant[] = ['card', 'horizontal', 'compact'];
const STATUSES: UserCardStatus[] = ['online', 'away', 'busy', 'offline'];

function makeCard(attrs: Record<string, string> = {}, social?: SocialLink[]): HTMLElement {
  const el = document.createElement('snice-user-card');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  if (social) (el as any).social = social;
  return el;
}

function grid(...els: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Data/UserCard',
  component: 'snice-user-card',
  tags: ['autodocs'],
  argTypes: {
    name:     { control: 'text' },
    avatar:   { control: 'text' },
    role:     { control: 'text' },
    company:  { control: 'text' },
    email:    { control: 'text' },
    phone:    { control: 'text' },
    location: { control: 'text' },
    status:   { control: 'select', options: STATUSES },
    variant:  { control: 'select', options: VARIANTS },
  },
  render: (args) => {
    const el = document.createElement('snice-user-card');
    if (args.name     !== undefined) el.setAttribute('name',     args.name);
    if (args.avatar   !== undefined) el.setAttribute('avatar',   args.avatar);
    if (args.role     !== undefined) el.setAttribute('role',     args.role);
    if (args.company  !== undefined) el.setAttribute('company',  args.company);
    if (args.email    !== undefined) el.setAttribute('email',    args.email);
    if (args.phone    !== undefined) el.setAttribute('phone',    args.phone);
    if (args.location !== undefined) el.setAttribute('location', args.location);
    if (args.status   !== undefined) el.setAttribute('status',   args.status);
    if (args.variant  !== undefined) el.setAttribute('variant',  args.variant);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    name: 'Sarah Johnson', role: 'Senior Engineer', company: 'Acme Corp',
    email: 'sarah@acme.com', status: 'online',
  },
};

// h2: Variant: card (default)
export const VariantCard: Story = {
  render: () => grid(makeCard({
    name: 'Sarah Johnson', role: 'Senior Engineer', company: 'Acme Corp',
    email: 'sarah@acme.com', phone: '+1 555-0123', location: 'San Francisco, CA', status: 'online',
  })),
};

// h2: Variant: horizontal
export const VariantHorizontal: Story = {
  render: () => grid(makeCard({
    variant: 'horizontal', name: 'Alex Chen', role: 'CTO', company: 'TechCo',
    email: 'alex@techco.com', status: 'online',
  })),
};

// h2: Variant: compact
export const VariantCompact: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:400px;';
    const entries: [string, string, UserCardStatus][] = [
      ['Lisa Park',      'Designer', 'away'],
      ['Marcus Rivera',  'DevOps',   'online'],
      ['Priya Sharma',   'PM',       'busy'],
      ['Tom Wilson',     'QA Lead',  'offline'],
    ];
    for (const [name, role, status] of entries) {
      wrap.appendChild(makeCard({ variant: 'compact', name, role, status }));
    }
    return wrap;
  },
};

// h2: Status: all values
export const StatusAllValues: Story = {
  render: () => grid(
    makeCard({ name: 'Online User',  role: 'Engineer', status: 'online' }),
    makeCard({ name: 'Away User',    role: 'Designer', status: 'away' }),
    makeCard({ name: 'Busy User',    role: 'Manager',  status: 'busy' }),
    makeCard({ name: 'Offline User', role: 'Intern',   status: 'offline' }),
  ),
};

// h2: Status x Variant Matrix
export const StatusXVariantMatrix: Story = {
  render: () => grid(
    makeCard({ variant: 'card',       name: 'Card Online',      status: 'online', role: 'Dev' }),
    makeCard({ variant: 'horizontal', name: 'Horizontal Away',  status: 'away',   role: 'Dev' }),
    makeCard({ variant: 'compact',    name: 'Compact Busy',     status: 'busy',   role: 'Dev' }),
    makeCard({ variant: 'card',       name: 'Card Offline',     status: 'offline', role: 'Dev' }),
  ),
};

// h2: Avatar (with image)
export const AvatarWithImage: Story = {
  render: () => grid(
    makeCard({ name: 'Jane Doe',    avatar: 'https://i.pravatar.cc/150?img=5',  role: 'Lead',     status: 'online' }),
    makeCard({ variant: 'horizontal', name: 'John Smith', avatar: 'https://i.pravatar.cc/150?img=12', role: 'Engineer', status: 'away' }),
    makeCard({ variant: 'compact',    name: 'Amy Lee',    avatar: 'https://i.pravatar.cc/150?img=32', role: 'Designer', status: 'online' }),
  ),
};

// h2: Avatar Fallback (initials, no image)
export const AvatarFallbackInitials: Story = {
  render: () => grid(
    makeCard({ name: 'Alice Brown', role: 'Manager', status: 'online' }),
    makeCard({ name: 'Bob',         role: 'Intern',  status: 'offline' }),
    makeCard({ name: '',            role: 'Anonymous' }),
  ),
};

// h2: Contact Info Combinations
export const ContactInfoCombinations: Story = {
  render: () => grid(
    makeCard({ name: 'All Contact',   email: 'user@example.com', phone: '+1 555-9999', location: 'New York, NY', role: 'Full Contact', status: 'online' }),
    makeCard({ name: 'Email Only',    email: 'email@example.com', role: 'Partial', status: 'online' }),
    makeCard({ name: 'Phone Only',    phone: '+1 555-0000', role: 'Partial', status: 'online' }),
    makeCard({ name: 'Location Only', location: 'London, UK', role: 'Partial', status: 'online' }),
    makeCard({ name: 'No Contact',    role: 'Minimal', status: 'online' }),
  ),
};

// h2: Role and Company
export const RoleAndCompany: Story = {
  render: () => grid(
    makeCard({ name: 'Role + Company',        role: 'VP of Engineering', company: 'BigTech Inc', status: 'online' }),
    makeCard({ name: 'Role Only',             role: 'Freelancer', status: 'online' }),
    makeCard({ name: 'Company Only',          company: 'Startup LLC', status: 'online' }),
    makeCard({ name: 'No Role or Company',    status: 'online' }),
  ),
};

// h2: Social Links
export const SocialLinks: Story = {
  render: () => {
    const wrap = grid();
    const allSocials = makeCard({ name: 'All Socials', role: 'Influencer', status: 'online' }, [
      { platform: 'github',    url: 'https://github.com/user' },
      { platform: 'twitter',   url: 'https://twitter.com/user' },
      { platform: 'linkedin',  url: 'https://linkedin.com/in/user' },
      { platform: 'facebook',  url: 'https://facebook.com/user' },
      { platform: 'instagram', url: 'https://instagram.com/user' },
      { platform: 'youtube',   url: 'https://youtube.com/user' },
      { platform: 'website',   url: 'https://example.com' },
    ]);
    const devProfile = makeCard({ name: 'Dev Profile', role: 'Developer', status: 'online' }, [
      { platform: 'github',   url: 'https://github.com/dev' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/dev' },
      { platform: 'website',  url: 'https://dev.example.com' },
    ]);
    wrap.appendChild(allSocials);
    wrap.appendChild(devProfile);
    return wrap;
  },
};

// h2: Slot: Action Buttons
export const SlotActionButtons: Story = {
  render: () => {
    const wrap = grid();

    const card1 = makeCard({ name: 'With Actions', role: 'Team Lead', status: 'online', email: 'lead@example.com' });
    const btn1 = document.createElement('button');
    btn1.style.cssText = 'padding:.375rem .75rem;border:none;border-radius:6px;background:var(--snice-color-primary,#3b82f6);color:white;cursor:pointer;font-size:.8rem;';
    btn1.textContent = 'Follow';
    const btn2 = document.createElement('button');
    btn2.style.cssText = 'padding:.375rem .75rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:transparent;cursor:pointer;font-size:.8rem;';
    btn2.textContent = 'Message';
    card1.appendChild(btn1);
    card1.appendChild(btn2);

    const card2 = makeCard({ variant: 'horizontal', name: 'Horizontal Actions', role: 'Manager', status: 'away' });
    const btn3 = document.createElement('button');
    btn3.style.cssText = 'padding:.375rem .75rem;border:none;border-radius:6px;background:var(--snice-color-primary,#3b82f6);color:white;cursor:pointer;font-size:.8rem;';
    btn3.textContent = 'Connect';
    card2.appendChild(btn3);

    wrap.appendChild(card1);
    wrap.appendChild(card2);
    return wrap;
  },
};

// h2: Full Card (all properties)
export const FullCardAllProperties: Story = {
  render: () => {
    const card = makeCard({
      name: 'Maria Garcia',
      avatar: 'https://i.pravatar.cc/150?img=47',
      role: 'Chief Technology Officer',
      company: 'Innovation Labs',
      email: 'maria@innovationlabs.com',
      phone: '+1 415-555-0198',
      location: 'San Jose, CA',
      status: 'online',
    }, [
      { platform: 'linkedin', url: 'https://linkedin.com/in/maria' },
      { platform: 'twitter',  url: 'https://twitter.com/maria' },
      { platform: 'github',   url: 'https://github.com/maria' },
    ]);
    const btn1 = document.createElement('button');
    btn1.style.cssText = 'padding:.375rem .75rem;border:none;border-radius:6px;background:var(--snice-color-primary,#3b82f6);color:white;cursor:pointer;font-size:.8rem;';
    btn1.textContent = 'Schedule Meeting';
    const btn2 = document.createElement('button');
    btn2.style.cssText = 'padding:.375rem .75rem;border:1px solid var(--snice-color-border,#ddd);border-radius:6px;background:transparent;cursor:pointer;font-size:.8rem;';
    btn2.textContent = 'View Profile';
    card.appendChild(btn1);
    card.appendChild(btn2);
    return card;
  },
};

// h2: Edge Cases
export const EdgeCases: Story = {
  render: () => grid(
    makeCard({ name: '', role: '', status: 'offline' }),
    makeCard({ name: 'Very Long Name That Might Overflow The Card Layout Boundary', role: 'Extremely Long Position Title at a Very Large Corporation', status: 'online' }),
    makeCard({ name: 'Broken Avatar', avatar: 'https://invalid-url.example/broken.jpg', role: 'Error Case', status: 'online' }),
  ),
};

// h2: CSS Parts Styling
// Parts: base, avatar, status, name, role, contact, social, actions
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 1rem; }
      .parts-demo .item { display: flex; flex-direction: column; gap: .4rem; }
      .parts-demo .label { font-size: .65rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }

      /* Styled: custom card shell */
      .parts-demo snice-user-card.styled::part(base) {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid #334155;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,.4);
      }

      /* ::part(avatar) — avatar wrapper */
      .parts-demo snice-user-card.styled::part(avatar) {
        outline: 3px solid #6366f1;
        outline-offset: 3px;
        border-radius: 50%;
      }

      /* ::part(status) — online/away dot */
      .parts-demo snice-user-card.styled::part(status) {
        width: 14px;
        height: 14px;
        border: 3px solid #0f172a;
        box-shadow: 0 0 8px currentColor;
      }

      /* ::part(name) — display name heading */
      .parts-demo snice-user-card.styled::part(name) {
        color: #f1f5f9;
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: -.02em;
      }

      /* ::part(role) — role/title text */
      .parts-demo snice-user-card.styled::part(role) {
        color: #818cf8;
        font-style: italic;
      }

      /* ::part(contact) — email/phone/location section */
      .parts-demo snice-user-card.styled::part(contact) {
        border-top: 1px solid #334155;
        padding-top: .75rem;
        color: #94a3b8;
      }

      /* ::part(social) — social links row */
      .parts-demo snice-user-card.styled::part(social) {
        border-top: 1px solid #334155;
        padding-top: .5rem;
        filter: invert(1) brightness(2);
      }

      /* ::part(actions) — action buttons slot */
      .parts-demo snice-user-card.styled::part(actions) {
        border-top: 1px solid #334155;
        padding-top: .75rem;
      }
    `;

    const wrap = document.createElement('div');
    wrap.appendChild(style);

    const demo = document.createElement('div');
    demo.className = 'parts-demo';

    const makeItem = (label: string, el: HTMLElement) => {
      const item = document.createElement('div');
      item.className = 'item';
      const lbl = document.createElement('div');
      lbl.className = 'label';
      lbl.textContent = label;
      item.appendChild(lbl);
      item.appendChild(el);
      return item;
    };

    const def = makeCard({
      name: 'Alice Chen',
      role: 'Senior Engineer',
      company: 'Tech Co',
      email: 'alice@tech.co',
      status: 'online',
    }, [{ platform: 'github', url: 'https://github.com/alice' }]);
    demo.appendChild(makeItem('default (no ::part overrides)', def));

    const styled = makeCard({
      name: 'Alice Chen',
      role: 'Senior Engineer',
      company: 'Tech Co',
      email: 'alice@tech.co',
      status: 'online',
    }, [{ platform: 'github', url: 'https://github.com/alice' }]);
    styled.className = 'styled';
    demo.appendChild(makeItem('all parts styled (dark theme)', styled));

    wrap.appendChild(demo);
    return wrap;
  },
};
