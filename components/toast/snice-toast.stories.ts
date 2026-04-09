import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-toast';
import './snice-toast-container';
import type { ToastType } from './snice-toast.types';

type Args = {
  type?: ToastType;
  message?: string;
  closable?: boolean;
  icon?: boolean;
};

const TYPES: ToastType[] = ['success', 'error', 'warning', 'info'];

function makeToast(type: ToastType, message: string, attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-toast');
  el.setAttribute('type', type);
  el.setAttribute('message', message);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') {
      if (v) el.toggleAttribute(k, true);
      else el.setAttribute(k, 'false');
    } else {
      el.setAttribute(k, v);
    }
  }
  return el;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:.75rem;align-items:flex-start;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

function row(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Feedback/Toast',
  component: 'snice-toast',
  tags: ['autodocs'],
  argTypes: {
    type:     { control: 'select', options: TYPES },
    message:  { control: 'text' },
    closable: { control: 'boolean' },
    icon:     { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-toast');
    el.setAttribute('type', args.type ?? 'info');
    el.setAttribute('message', args.message ?? 'Toast notification');
    if (args.closable === false) el.setAttribute('closable', 'false');
    if (args.icon === false) el.setAttribute('icon', 'false');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;';
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { type: 'info', message: 'New message received', closable: true, icon: true },
};

// h2: Static Toast Elements: All Types
export const StaticToastElementsAllTypes: Story = {
  render: () => col(
    makeToast('success', 'Changes saved successfully!'),
    makeToast('error',   'Something went wrong.'),
    makeToast('warning', 'Please review your input.'),
    makeToast('info',    'New message received.'),
  ),
};

// h2: Closable: true (default) vs false
export const ClosableTrueVsFalse: Story = {
  render: () => col(
    makeToast('info', 'Closable (default)', {}),
    makeToast('info', 'Not closable', { closable: 'false' }),
  ),
};

// h2: Icon: true (default) vs false
export const IconTrueVsFalse: Story = {
  render: () => col(
    makeToast('success', 'With icon (default)', {}),
    makeToast('success', 'No icon', { icon: 'false' }),
  ),
};

// h2: No Icon + No Close Button
export const NoIconNoCloseButton: Story = {
  render: () => col(
    ...TYPES.map(t => makeToast(t, `${t.charAt(0).toUpperCase() + t.slice(1)} — plain`, { icon: 'false', closable: 'false' })),
  ),
};

// h2: Long Messages
export const LongMessages: Story = {
  render: () => col(
    makeToast('info',    'This is a much longer toast message that tests how the component handles wrapping and overflow when the text content is extensive.'),
    makeToast('warning', 'Another long warning message that provides detailed context about what the user should do next to resolve the situation.'),
  ),
};

// h2: Type x Closable x Icon Matrix
export const TypeXClosableXIconMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;';
    for (const type of TYPES) {
      const r = row(
        makeToast(type, `${type} · closable · icon`),
        makeToast(type, `${type} · no close`, { closable: 'false' }),
        makeToast(type, `${type} · no icon`, { icon: 'false' }),
      );
      wrap.appendChild(r);
    }
    return wrap;
  },
};

// h2: Container Positions (click buttons to test)
export const ContainerPositions: Story = {
  render: () => {
    const positions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;';

    positions.forEach(pos => {
      const containerId = `toast-container-${pos}`;
      const btn = document.createElement('button');
      btn.textContent = pos;
      btn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;font-size:.8rem;';
      btn.onclick = () => {
        const container = document.getElementById(containerId) as any;
        if (container) container.show(`Toast at ${pos}`, { type: 'info', duration: 2000 });
      };

      const container = document.createElement('snice-toast-container') as any;
      container.id = containerId;
      container.setAttribute('position', pos);

      wrap.appendChild(btn);
      wrap.appendChild(container);
    });

    return wrap;
  },
};

// h2: Toast API: Type Methods
export const ToastApiTypeMethods: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;';
    const container = document.createElement('snice-toast-container') as any;
    container.id = 'toast-api-demo';
    container.setAttribute('position', 'bottom-right');

    const types: ToastType[] = ['success', 'error', 'warning', 'info'];
    types.forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t;
      btn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;';
      btn.onclick = () => {
        const c = document.getElementById('toast-api-demo') as any;
        if (c) c.show(`${t.charAt(0).toUpperCase() + t.slice(1)} toast!`, { type: t, duration: 2500 });
      };
      wrap.appendChild(btn);
    });

    wrap.appendChild(container);
    return wrap;
  },
};

// h2: Duration Options
export const DurationOptions: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;';
    const container = document.createElement('snice-toast-container') as any;
    container.id = 'toast-duration-demo';
    container.setAttribute('position', 'bottom-right');

    const durations: [string, number][] = [['1s', 1000], ['3s', 3000], ['5s', 5000], ['Persistent', 0]];
    durations.forEach(([label, dur]) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;';
      btn.onclick = () => {
        const c = document.getElementById('toast-duration-demo') as any;
        if (c) c.show(`Toast for ${label}`, { type: 'info', duration: dur });
      };
      wrap.appendChild(btn);
    });

    wrap.appendChild(container);
    return wrap;
  },
};

// h2: Programmatic Hide & Clear
export const ProgrammaticHideClear: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap;';
    const container = document.createElement('snice-toast-container') as any;
    container.id = 'toast-hide-demo';
    container.setAttribute('position', 'bottom-right');

    let lastId = '';

    const showBtn = document.createElement('button');
    showBtn.textContent = 'Show';
    showBtn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;';
    showBtn.onclick = () => {
      const c = document.getElementById('toast-hide-demo') as any;
      if (c) lastId = c.show('Persistent toast', { type: 'info', duration: 0 });
    };

    const hideBtn = document.createElement('button');
    hideBtn.textContent = 'Hide Last';
    hideBtn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;';
    hideBtn.onclick = () => {
      const c = document.getElementById('toast-hide-demo') as any;
      if (c && lastId) c.hide(lastId);
    };

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear All';
    clearBtn.style.cssText = 'padding:.4rem .75rem;border:1px solid currentColor;border-radius:4px;cursor:pointer;';
    clearBtn.onclick = () => {
      const c = document.getElementById('toast-hide-demo') as any;
      if (c) c.clear();
    };

    wrap.appendChild(showBtn);
    wrap.appendChild(hideBtn);
    wrap.appendChild(clearBtn);
    wrap.appendChild(container);
    return wrap;
  },
};
