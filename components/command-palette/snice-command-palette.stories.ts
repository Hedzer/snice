import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-command-palette';
import type { CommandItem } from './snice-command-palette.types';

type Args = {
  open?: boolean;
  placeholder?: string;
  noResultsText?: string;
  maxResults?: number;
  showRecentCommands?: boolean;
  caseSensitive?: boolean;
};

const DEFAULT_COMMANDS: CommandItem[] = [
  { id: 'new',      label: 'New File',      description: 'Create a new file',   icon: '📄', shortcut: '⌘N', category: 'File' },
  { id: 'open',     label: 'Open File',     description: 'Open existing file',  icon: '📂', shortcut: '⌘O', category: 'File' },
  { id: 'save',     label: 'Save',          description: 'Save current file',   icon: '💾', shortcut: '⌘S', category: 'File' },
  { id: 'cut',      label: 'Cut',                                                icon: '✂️', shortcut: '⌘X', category: 'Edit' },
  { id: 'copy',     label: 'Copy',                                               icon: '📋', shortcut: '⌘C', category: 'Edit' },
  { id: 'paste',    label: 'Paste',                                              icon: '📄', shortcut: '⌘V', category: 'Edit' },
  { id: 'find',     label: 'Find',          description: 'Find in document',    icon: '🔍', shortcut: '⌘F', category: 'Search' },
  { id: 'settings', label: 'Settings',      description: 'Open settings',       icon: '⚙️', shortcut: '⌘,', category: 'View' },
  { id: 'theme',    label: 'Toggle Theme',                                       icon: '🌓',                 category: 'View' },
];

function makePalette(commands: CommandItem[], attrs: Record<string, string | boolean> = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;min-height:400px;';

  const el = document.createElement('snice-command-palette');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); else el.setAttribute(k, 'false'); }
    else el.setAttribute(k, v);
  }
  (el as any).commands = commands;

  // Open button
  const btn = document.createElement('button');
  btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#e2e2e2);border-radius:4px;background:var(--snice-color-background);cursor:pointer;font-family:inherit;color:var(--snice-color-text);margin-bottom:.5rem;';
  btn.textContent = 'Open Palette';
  btn.addEventListener('click', () => (el as any).show());

  wrap.appendChild(btn);
  wrap.appendChild(el);
  return wrap;
}

const meta: Meta<Args> = {
  title: 'Navigation/CommandPalette',
  component: 'snice-command-palette',
  tags: ['autodocs'],
  argTypes: {
    open:               { control: 'boolean' },
    placeholder:        { control: 'text' },
    noResultsText:      { control: 'text' },
    maxResults:         { control: 'number' },
    showRecentCommands: { control: 'boolean' },
    caseSensitive:      { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;min-height:400px;';
    const el = document.createElement('snice-command-palette');
    if (args.placeholder        !== undefined) el.setAttribute('placeholder',           args.placeholder);
    if (args.noResultsText      !== undefined) el.setAttribute('no-results-text',        args.noResultsText);
    if (args.maxResults         !== undefined) el.setAttribute('max-results',            String(args.maxResults));
    if (args.showRecentCommands === false)      el.setAttribute('show-recent-commands',  'false');
    if (args.caseSensitive)                    el.toggleAttribute('case-sensitive',      true);
    if (args.open)                             el.toggleAttribute('open',                true);
    (el as any).commands = DEFAULT_COMMANDS;
    const btn = document.createElement('button');
    btn.style.cssText = 'padding:.5rem 1rem;border:1px solid var(--snice-color-border,#e2e2e2);border-radius:4px;background:var(--snice-color-background);cursor:pointer;font-family:inherit;color:var(--snice-color-text);margin-bottom:.5rem;';
    btn.textContent = 'Open Palette';
    btn.addEventListener('click', () => (el as any).show());
    wrap.appendChild(btn);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { open: false } };

// h2: Default: categories, icons, shortcuts, descriptions
export const DefaultCategoriesIconsShortcutsDescriptions: Story = {
  render: () => makePalette(DEFAULT_COMMANDS),
};

// h2: Minimal: no icons, no categories, no shortcuts
export const MinimalNoIconsNoCategoriesNoShortcuts: Story = {
  render: () => makePalette([
    { id: 'a', label: 'Action One' },
    { id: 'b', label: 'Action Two' },
    { id: 'c', label: 'Action Three' },
  ], { placeholder: 'Search actions...' }),
};

// h2: Disabled items
export const DisabledItems: Story = {
  render: () => makePalette([
    { id: 'e1', label: 'Enabled',      icon: '✅', category: 'Status' },
    { id: 'd1', label: 'Disabled',     icon: '❌', category: 'Status', disabled: true },
    { id: 'e2', label: 'Also enabled', icon: '✅', category: 'Status' },
    { id: 'd2', label: 'Also disabled',icon: '❌', category: 'Status', disabled: true },
  ]),
};

// h2: placeholder + no-results-text customized
export const PlaceholderAndNoResultsTextCustomized: Story = {
  render: () => makePalette([
    { id: 'x', label: 'Only one command' },
  ], { placeholder: 'Type something unique...', 'no-results-text': 'Nothing matches your query' }),
};

// h2: max-results="10" (100 commands, capped at 10)
export const MaxResults10: Story = {
  render: () => makePalette(
    Array.from({ length: 100 }, (_, i) => ({
      id: `cmd-${i}`,
      label: `Command ${i + 1}`,
      description: `Description for command ${i + 1}`,
      category: `Category ${Math.floor(i / 10) + 1}`,
    })),
    { 'max-results': '10' },
  ),
};

// h2: show-recent-commands="false"
export const ShowRecentCommandsFalse: Story = {
  render: () => makePalette([
    { id: 'img1', label: 'GitHub',    iconImage: 'https://github.com/favicon.ico', category: 'Links' },
    { id: 'img2', label: 'Google',    iconImage: 'https://www.google.com/favicon.ico', category: 'Links' },
    { id: 'emoji', label: 'Emoji icon', icon: '🚀', category: 'Icons' },
    { id: 'text', label: 'No icon',   category: 'Icons' },
  ], { 'show-recent-commands': 'false' }),
};

// h2: case-sensitive
export const CaseSensitive: Story = {
  render: () => makePalette([
    { id: 'upper', label: 'UPPERCASE', description: 'All caps' },
    { id: 'lower', label: 'lowercase', description: 'All lower' },
    { id: 'mixed', label: 'MiXeD CaSe', description: 'Mixed case' },
  ], { 'case-sensitive': true }),
};
