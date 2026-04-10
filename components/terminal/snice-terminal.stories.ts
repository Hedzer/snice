import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-terminal';

type Args = {
  prompt?: string;
  cwd?: string;
  readonly?: boolean;
  showTimestamps?: boolean;
  maxLines?: number;
};

const meta: Meta<Args> = {
  title: 'Specialty/Terminal',
  component: 'snice-terminal',
  tags: ['autodocs'],
  argTypes: {
    prompt:         { control: 'text' },
    cwd:            { control: 'text' },
    readonly:       { control: 'boolean' },
    showTimestamps: { control: 'boolean' },
    maxLines:       { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-terminal');
    el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;';
    if (args.prompt !== undefined) el.setAttribute('prompt', args.prompt);
    if (args.cwd !== undefined) el.setAttribute('cwd', args.cwd);
    if (args.readonly) el.toggleAttribute('readonly', true);
    if (args.showTimestamps) el.toggleAttribute('show-timestamps', true);
    if (args.maxLines !== undefined) el.setAttribute('max-lines', String(args.maxLines));
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {},
};

function termStyle(el: HTMLElement) {
  el.style.cssText = 'height:250px;border:1px solid rgba(128,128,128,0.2);border-radius:6px;overflow:hidden;';
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Default
export const DefaultTerminal: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal');
    termStyle(el);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Custom Prompt
export const CustomPrompt: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.setAttribute('prompt', 'user@host:~$ ');
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') el.writeln('Welcome to the terminal', 'info');
    });
    return wrap;
  },
};

// h2: Custom CWD
export const CustomCwd: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.setAttribute('cwd', '/home/user/projects');
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') el.writeln('Current directory: /home/user/projects', 'info');
    });
    return wrap;
  },
};

// h2: Readonly
export const Readonly: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.toggleAttribute('readonly', true);
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        el.writeln('$ npm install', 'input');
        el.writeln('added 150 packages in 3.2s', 'output');
        el.writeln('$ npm run build', 'input');
        el.writeln('Build completed successfully.', 'success');
      }
    });
    return wrap;
  },
};

// h2: Show Timestamps
export const ShowTimestamps: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.toggleAttribute('show-timestamps', true);
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        el.writeln('Server started on port 3000', 'info');
        el.writeln('GET /api/users 200 12ms', 'output');
        el.writeln('POST /api/login 401 5ms', 'warning');
        el.writeln('Database connection error', 'error');
      }
    });
    return wrap;
  },
};

// h2: Custom Max Lines (10)
export const CustomMaxLines10: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.setAttribute('max-lines', '10');
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        for (let i = 1; i <= 15; i++) el.writeln(`Line ${i} of 15`, 'output');
        el.writeln('Only the last 10 lines should be visible', 'info');
      }
    });
    return wrap;
  },
};

// h2: Pre-filled with Output Lines
export const PreFilledWithOutputLines: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        el.writeln('$ git status', 'input');
        el.writeln('On branch main', 'output');
        el.writeln("Your branch is up to date with 'origin/main'.", 'output');
        el.writeln('nothing to commit, working tree clean', 'output');
        el.writeln('$ git log --oneline -3', 'input');
        el.writeln('abc1234 feat: add new feature', 'output');
        el.writeln('def5678 fix: resolve issue', 'output');
        el.writeln('ghi9012 chore: update deps', 'output');
      }
    });
    return wrap;
  },
};

// h2: All Line Types
export const AllLineTypes: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.toggleAttribute('readonly', true);
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        el.writeln('This is an input line', 'input');
        el.writeln('This is an output line', 'output');
        el.writeln('This is an error line', 'error');
        el.writeln('This is an info line', 'info');
        el.writeln('This is a success line', 'success');
        el.writeln('This is a warning line', 'warning');
      }
    });
    return wrap;
  },
};

// h2: With Timestamps + Readonly
export const WithTimestampsPlusReadonly: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.toggleAttribute('show-timestamps', true);
    el.toggleAttribute('readonly', true);
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') {
        el.writeln('Application started', 'success');
        el.writeln('Listening on port 8080', 'info');
        el.writeln('Request: GET /health', 'output');
        el.writeln('Response: 200 OK', 'output');
        el.writeln('Warning: Memory usage high', 'warning');
        el.writeln('Error: Connection refused', 'error');
      }
    });
    return wrap;
  },
};

// h2: Empty Terminal
export const EmptyTerminal: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal');
    termStyle(el);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Arrow Prompt
export const ArrowPrompt: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.setAttribute('prompt', '> ');
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') el.writeln('Using arrow prompt style', 'info');
    });
    return wrap;
  },
};

// h2: Hash Prompt
export const HashPrompt: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-terminal') as any;
    termStyle(el);
    el.setAttribute('prompt', '# ');
    wrap.appendChild(el);
    customElements.whenDefined('snice-terminal').then(() => {
      if (typeof el.writeln === 'function') el.writeln('Using hash prompt (root style)', 'info');
    });
    return wrap;
  },
};
