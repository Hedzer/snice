import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-nav';
import type { NavVariant, NavOrientation } from './snice-nav.types';

type Args = {
  variant?: NavVariant;
  orientation?: NavOrientation;
};

const VARIANTS: NavVariant[] = ['flat', 'grouped', 'hierarchical'];
const ORIENTATIONS: NavOrientation[] = ['horizontal', 'vertical'];

const basicPlacards = [
  { name: 'home', title: 'Home', order: 0 },
  { name: 'products', title: 'Products', order: 1 },
  { name: 'about', title: 'About', order: 2 },
  { name: 'contact', title: 'Contact', order: 3 },
];

const iconPlacards = [
  { name: 'home', title: 'Home', icon: '🏠', order: 0 },
  { name: 'products', title: 'Products', icon: '📦', order: 1 },
  { name: 'settings', title: 'Settings', icon: '⚙️', order: 2 },
  { name: 'profile', title: 'Profile', icon: '👤', order: 3 },
];

const groupedPlacards = [
  { name: 'home', title: 'Home', icon: '🏠', group: 'Main', order: 0 },
  { name: 'dashboard', title: 'Dashboard', icon: '📊', group: 'Main', order: 1 },
  { name: 'users', title: 'Users', icon: '👥', group: 'Admin', order: 0 },
  { name: 'settings', title: 'Settings', icon: '⚙️', group: 'Admin', order: 1 },
  { name: 'logs', title: 'Logs', icon: '📝', group: 'Admin', order: 2 },
];

const hierPlacards = [
  { name: 'products', title: 'Products', order: 0 },
  { name: 'products/electronics', title: 'Electronics', parent: 'products', order: 0 },
  { name: 'products/clothing', title: 'Clothing', parent: 'products', order: 1 },
  { name: 'products/books', title: 'Books', parent: 'products', order: 2 },
  { name: 'services', title: 'Services', order: 1 },
  { name: 'services/consulting', title: 'Consulting', parent: 'services', order: 0 },
  { name: 'services/support', title: 'Support', parent: 'services', order: 1 },
];

function makeNav(placards: any[], route: string, attrs: Record<string, string> = {}, styles = '') {
  const el = document.createElement('snice-nav');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.style.cssText = `display:block;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;padding:.5rem;${styles}`;
  (el as any).update(placards, undefined, route);
  return el;
}

const meta: Meta<Args> = {
  title: 'Navigation/Nav',
  component: 'snice-nav',
  tags: ['autodocs'],
  argTypes: {
    variant:     { control: 'select', options: VARIANTS },
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  render: (args) => {
    const el = document.createElement('snice-nav');
    if (args.variant)     el.setAttribute('variant', args.variant);
    if (args.orientation) el.setAttribute('orientation', args.orientation);
    el.style.cssText = 'display:block;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;padding:.5rem;';
    (el as any).update(basicPlacards, undefined, 'home');
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { variant: 'flat', orientation: 'horizontal' } };

// h2: Variant: flat + Orientation: horizontal
export const VariantFlatHorizontal: Story = {
  render: () => makeNav(basicPlacards, 'home', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: Variant: flat + Orientation: vertical
export const VariantFlatVertical: Story = {
  render: () => makeNav(basicPlacards, 'home', { variant: 'flat', orientation: 'vertical' }, 'max-width:220px;'),
};

// h2: Variant: grouped + Orientation: horizontal
export const VariantGroupedHorizontal: Story = {
  render: () => makeNav(groupedPlacards, 'home', { variant: 'grouped', orientation: 'horizontal' }),
};

// h2: Variant: grouped + Orientation: vertical
export const VariantGroupedVertical: Story = {
  render: () => makeNav(groupedPlacards, 'home', { variant: 'grouped', orientation: 'vertical' }, 'max-width:220px;'),
};

// h2: Variant: hierarchical + Orientation: horizontal
export const VariantHierarchicalHorizontal: Story = {
  render: () => makeNav(basicPlacards, 'home', { variant: 'hierarchical', orientation: 'horizontal' }),
};

// h2: Variant: hierarchical + Orientation: vertical
export const VariantHierarchicalVertical: Story = {
  render: () => makeNav(basicPlacards, 'home', { variant: 'hierarchical', orientation: 'vertical' }, 'max-width:220px;'),
};

// h2: Active route: home
export const ActiveRouteHome: Story = {
  render: () => makeNav(basicPlacards, 'home', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: Active route: products
export const ActiveRouteProducts: Story = {
  render: () => makeNav(basicPlacards, 'products', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: With icons
export const WithIcons: Story = {
  render: () => makeNav(iconPlacards, 'home', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: With icons (vertical)
export const WithIconsVertical: Story = {
  render: () => makeNav(iconPlacards, 'home', { variant: 'flat', orientation: 'vertical' }, 'max-width:220px;'),
};

// h2: Grouped with icons (vertical)
export const GroupedWithIconsVertical: Story = {
  render: () => makeNav(groupedPlacards, 'dashboard', { variant: 'grouped', orientation: 'vertical' }, 'max-width:220px;'),
};

// h2: Hierarchical with children
export const HierarchicalWithChildren: Story = {
  render: () => makeNav(hierPlacards, 'products/electronics', { variant: 'hierarchical', orientation: 'vertical' }, 'max-width:250px;'),
};

// h2: Single item
export const SingleItem: Story = {
  render: () => makeNav([{ name: 'home', title: 'Home', order: 0 }], 'home', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: Empty (no placards)
export const EmptyNoPlarads: Story = {
  render: () => makeNav([], '', { variant: 'flat', orientation: 'horizontal' }),
};

// h2: Many items
export const ManyItems: Story = {
  render: () => {
    const manyPlacards = Array.from({ length: 8 }, (_, i) => ({
      name: `page-${i}`,
      title: `Page ${i + 1}`,
      order: i,
    }));
    return makeNav(manyPlacards, 'page-2', { variant: 'flat', orientation: 'horizontal' });
  },
};

// h2: Ordered items
export const OrderedItems: Story = {
  render: () => {
    const orderedPlacards = [
      { name: 'z', title: 'Z (order 3)', order: 3 },
      { name: 'a', title: 'A (order 1)', order: 1 },
      { name: 'm', title: 'M (order 2)', order: 2 },
      { name: 'first', title: 'First (order 0)', order: 0 },
    ];
    return makeNav(orderedPlacards, 'first', { variant: 'flat', orientation: 'horizontal' });
  },
};

// h2: Items with descriptions/tooltips
export const ItemsWithDescriptions: Story = {
  render: () => {
    const descPlacards = [
      { name: 'home', title: 'Home', description: 'Go to the homepage', tooltip: 'Navigate to home', order: 0 },
      { name: 'docs', title: 'Docs', description: 'API documentation', tooltip: 'View documentation', order: 1 },
      { name: 'help', title: 'Help', description: 'Get help and support', order: 2 },
    ];
    return makeNav(descPlacards, 'docs', { variant: 'flat', orientation: 'horizontal' });
  },
};
