import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-login';
import type { LoginVariant, LoginSize } from './snice-login.types';

type Args = {
  variant?: LoginVariant;
  size?: LoginSize;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  actionText?: string;
};

const VARIANTS: LoginVariant[] = ['default', 'card', 'minimal'];
const SIZES: LoginSize[] = ['small', 'medium', 'large'];

function makeLogin(attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-login');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1.5rem;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Feedback/Login',
  component: 'snice-login',
  tags: ['autodocs'],
  argTypes: {
    variant:           { control: 'select', options: VARIANTS },
    size:              { control: 'select', options: SIZES },
    title:             { control: 'text' },
    disabled:          { control: 'boolean' },
    loading:           { control: 'boolean' },
    showRememberMe:    { control: 'boolean' },
    showForgotPassword:{ control: 'boolean' },
    actionText:        { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-login');
    if (args.variant    !== undefined) el.setAttribute('variant',     String(args.variant));
    if (args.size       !== undefined) el.setAttribute('size',        String(args.size));
    if (args.title      !== undefined) el.setAttribute('title',       String(args.title));
    if (args.actionText !== undefined) el.setAttribute('action-text', String(args.actionText));
    if (args.disabled)          el.toggleAttribute('disabled',           true);
    if (args.loading)           el.toggleAttribute('loading',            true);
    if (args.showRememberMe)    el.toggleAttribute('show-remember-me',   true);
    if (args.showForgotPassword)el.toggleAttribute('show-forgot-password',true);
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { variant: 'default', size: 'medium', title: 'Sign In', actionText: 'Sign In', showRememberMe: true, showForgotPassword: true },
};

// h2: Variant: default
export const VariantDefault: Story = {
  render: () => makeLogin({ variant: 'default', 'show-remember-me': true, 'show-forgot-password': true }),
};

// h2: Variant: card
export const VariantCard: Story = {
  render: () => makeLogin({ variant: 'card', title: 'Welcome Back', 'action-text': 'Sign In', 'show-remember-me': true, 'show-forgot-password': true }),
};

// h2: Variant: minimal
export const VariantMinimal: Story = {
  render: () => makeLogin({ variant: 'minimal', title: 'Quick Sign In', 'action-text': 'Continue' }),
};

// h2: All variants side-by-side
export const AllVariantsSideBySide: Story = {
  render: () => row(
    makeLogin({ variant: 'default', size: 'small' }),
    makeLogin({ variant: 'card',    size: 'small', title: 'Card',    'action-text': 'Sign In' }),
    makeLogin({ variant: 'minimal', size: 'small', title: 'Minimal', 'action-text': 'Continue' }),
  ),
};

// h2: Size: small
export const SizeSmall: Story = {
  render: () => makeLogin({ variant: 'card', size: 'small', 'show-remember-me': true, 'show-forgot-password': true }),
};

// h2: Size: medium (default)
export const SizeMedium: Story = {
  render: () => makeLogin({ variant: 'card', size: 'medium', 'show-remember-me': true }),
};

// h2: Size: large
export const SizeLarge: Story = {
  render: () => makeLogin({ variant: 'card', size: 'large', 'show-remember-me': true }),
};

// h2: Variant x Size: card + small
export const VariantXSizeCardSmall: Story = {
  render: () => makeLogin({ variant: 'card', size: 'small', title: 'Card Small', 'action-text': 'Sign In' }),
};

// h2: Variant x Size: card + large
export const VariantXSizeCardLarge: Story = {
  render: () => makeLogin({ variant: 'card', size: 'large', title: 'Card Large', 'action-text': 'Sign In' }),
};

// h2: Variant x Size: minimal + small
export const VariantXSizeMinimalSmall: Story = {
  render: () => makeLogin({ variant: 'minimal', size: 'small', title: 'Minimal Small', 'action-text': 'Continue' }),
};

// h2: Variant x Size: minimal + large
export const VariantXSizeMinimalLarge: Story = {
  render: () => makeLogin({ variant: 'minimal', size: 'large', title: 'Minimal Large', 'action-text': 'Continue' }),
};

// h2: Custom title
export const CustomTitle: Story = {
  render: () => makeLogin({ variant: 'card', title: 'Welcome to MyApp' }),
};

// h2: Custom action text
export const CustomActionText: Story = {
  render: () => makeLogin({ variant: 'card', 'action-text': 'Log me in' }),
};

// h2: Custom title + action text
export const CustomTitleActionText: Story = {
  render: () => makeLogin({ variant: 'card', title: 'Admin Portal', 'action-text': 'Access Dashboard' }),
};

// h2: Disabled
export const Disabled: Story = {
  render: () => makeLogin({ variant: 'card', disabled: true }),
};

// h2: Loading
export const Loading: Story = {
  render: () => makeLogin({ variant: 'card', loading: true }),
};

// h2: Show remember me: true (default)
export const ShowRememberMeTrue: Story = {
  render: () => makeLogin({ variant: 'card', 'show-remember-me': true }),
};

// h2: Show remember me: false
export const ShowRememberMeFalse: Story = {
  render: () => makeLogin({ variant: 'card' }),
};

// h2: Show forgot password: true (default)
export const ShowForgotPasswordTrue: Story = {
  render: () => makeLogin({ variant: 'card', 'show-forgot-password': true }),
};

// h2: Show forgot password: false
export const ShowForgotPasswordFalse: Story = {
  render: () => makeLogin({ variant: 'card' }),
};

// h2: Both options hidden
export const BothOptionsHidden: Story = {
  render: () => makeLogin({ variant: 'card', title: 'Simple Login' }),
};

// h2: Disabled + Loading
export const DisabledLoading: Story = {
  render: () => makeLogin({ variant: 'card', disabled: true, loading: true }),
};

// h2: Slot: subtitle
export const SlotSubtitle: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Welcome' });
    const p = document.createElement('p');
    p.slot = 'subtitle';
    p.style.cssText = 'margin:0;font-size:.85rem;opacity:.7;';
    p.textContent = 'Sign in to your account to continue';
    el.appendChild(p);
    return el;
  },
};

// h2: Slot: before-header
export const SlotBeforeHeader: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const logo = document.createElement('div');
    logo.slot = 'before-header';
    logo.style.cssText = 'text-align:center;font-size:2rem;margin-bottom:.5rem;';
    logo.textContent = '🏢';
    el.appendChild(logo);
    return el;
  },
};

// h2: Slot: after-header
export const SlotAfterHeader: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const badge = document.createElement('div');
    badge.slot = 'after-header';
    badge.style.cssText = 'background:#4f46e5;color:#fff;border-radius:4px;padding:.25rem .5rem;font-size:.75rem;margin-bottom:.5rem;';
    badge.textContent = 'Beta Access';
    el.appendChild(badge);
    return el;
  },
};

// h2: Slot: before-form
export const SlotBeforeForm: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const notice = document.createElement('div');
    notice.slot = 'before-form';
    notice.style.cssText = 'font-size:.8rem;color:#ef4444;margin-bottom:.5rem;';
    notice.textContent = 'Maintenance mode: read-only access only.';
    el.appendChild(notice);
    return el;
  },
};

// h2: Slot: after-form
export const SlotAfterForm: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const divider = document.createElement('div');
    divider.slot = 'after-form';
    divider.style.cssText = 'text-align:center;margin-top:.5rem;font-size:.85rem;';
    divider.textContent = '— or sign in with SSO —';
    el.appendChild(divider);
    return el;
  },
};

// h2: Slot: form-top
export const SlotFormTop: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const banner = document.createElement('div');
    banner.slot = 'form-top';
    banner.style.cssText = 'background:#fef3c7;border-radius:4px;padding:.5rem;font-size:.8rem;margin-bottom:.5rem;';
    banner.textContent = 'Use your corporate credentials.';
    el.appendChild(banner);
    return el;
  },
};

// h2: Slot: between-fields
export const SlotBetweenFields: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const sep = document.createElement('div');
    sep.slot = 'between-fields';
    sep.style.cssText = 'border-top:1px dashed #ccc;margin:.25rem 0;';
    el.appendChild(sep);
    return el;
  },
};

// h2: Slot: before-submit
export const SlotBeforeSubmit: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const terms = document.createElement('label');
    terms.slot = 'before-submit';
    terms.style.cssText = 'display:flex;gap:.5rem;align-items:center;font-size:.8rem;margin-bottom:.5rem;';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    terms.appendChild(cb);
    terms.appendChild(document.createTextNode('I agree to the Terms of Service'));
    el.appendChild(terms);
    return el;
  },
};

// h2: Slot: after-submit
export const SlotAfterSubmit: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const link = document.createElement('div');
    link.slot = 'after-submit';
    link.style.cssText = 'text-align:center;font-size:.8rem;margin-top:.5rem;';
    link.innerHTML = 'New here? <a href="#">Create an account</a>';
    el.appendChild(link);
    return el;
  },
};

// h2: Slot: footer
export const SlotFooter: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Sign In' });
    const footer = document.createElement('div');
    footer.slot = 'footer';
    footer.style.cssText = 'text-align:center;font-size:.75rem;opacity:.6;';
    footer.textContent = '© 2026 MyCompany. All rights reserved.';
    el.appendChild(footer);
    return el;
  },
};

// h2: Multiple slots combined
export const MultipleSlotsCombined: Story = {
  render: () => {
    const el = makeLogin({ variant: 'card', title: 'Welcome', 'action-text': 'Sign In', 'show-remember-me': true, 'show-forgot-password': true });

    const subtitle = document.createElement('p');
    subtitle.slot = 'subtitle';
    subtitle.style.cssText = 'margin:0;font-size:.85rem;opacity:.7;';
    subtitle.textContent = 'Sign in to your account';
    el.appendChild(subtitle);

    const footer = document.createElement('div');
    footer.slot = 'footer';
    footer.style.cssText = 'text-align:center;font-size:.8rem;';
    footer.innerHTML = "Don't have an account? <a href='#'>Sign up</a>";
    el.appendChild(footer);

    return el;
  },
};
