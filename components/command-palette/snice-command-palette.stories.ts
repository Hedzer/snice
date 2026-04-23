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
  title: 'CommandPalette',
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

// h2: CSS Parts Styling
// Parts: container, search, input, results, empty, category, item, item-icon,
//        item-icon-image, item-content, item-label, item-description, item-shortcut
export const CSSPartsStyling: Story = {
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'parts-demo';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2.5rem; font-family: sans-serif; }
      .parts-demo .label { font-size: .7rem; color: #888; margin-bottom: .25rem; }
      .parts-demo .palette-wrap { position: relative; min-height: 320px; }
      .parts-demo .open-btn {
        padding: .4rem .9rem;
        border: 1px solid var(--snice-color-border, #e2e2e2);
        border-radius: 4px;
        background: var(--snice-color-background);
        cursor: pointer;
        font-family: inherit;
        color: var(--snice-color-text);
        margin-bottom: .5rem;
      }

      /* Styled: container */
      .parts-demo .styled-container::part(container) {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 14px;
        box-shadow: 0 16px 48px rgba(0,0,0,.5);
      }

      /* Styled: search area */
      .parts-demo .styled-search::part(search) {
        background: #0f172a;
        border-bottom: 2px solid #7c3aed;
        border-radius: 12px 12px 0 0;
      }

      /* Styled: input */
      .parts-demo .styled-input::part(input) {
        color: #f97316;
        font-size: 1.1em;
        font-weight: 600;
        caret-color: #f97316;
      }

      /* Styled: results */
      .parts-demo .styled-results::part(results) {
        background: #0f172a;
        border-radius: 0 0 12px 12px;
        max-height: 240px;
      }

      /* Styled: category header */
      .parts-demo .styled-category::part(category) {
        color: #7c3aed;
        font-weight: 900;
        font-size: .7em;
        letter-spacing: .12em;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(124,58,237,.3);
      }

      /* Styled: item row */
      .parts-demo .styled-item::part(item) {
        border-radius: 8px;
        margin: 2px 6px;
      }

      /* Styled: item-label */
      .parts-demo .styled-item-label::part(item-label) {
        color: #f97316;
        font-weight: 700;
        font-size: 1em;
      }

      /* Styled: item-description */
      .parts-demo .styled-item-desc::part(item-description) {
        color: #64748b;
        font-style: italic;
        font-size: .78em;
      }

      /* Styled: item-shortcut */
      .parts-demo .styled-item-shortcut::part(item-shortcut) {
        background: #7c3aed;
        color: #fff;
        border-radius: 5px;
        padding: 1px 6px;
        font-size: .7em;
        font-weight: 700;
        border: none;
        box-shadow: none;
      }
    `;
    outer.appendChild(style);

    const cmds = DEFAULT_COMMANDS;

    function row(lbl: string, cls: string) {
      const d = document.createElement('div');
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = lbl;
      d.appendChild(l);

      const pw = document.createElement('div');
      pw.className = 'palette-wrap';

      const el = document.createElement('snice-command-palette');
      el.toggleAttribute('open', true);
      if (cls) el.classList.add(cls);
      (el as any).commands = cmds;

      pw.appendChild(el);
      d.appendChild(pw);
      return d;
    }

    outer.appendChild(row('Default (no ::part styles)', ''));
    outer.appendChild(row('::part(container) — dark rounded container', 'styled-container'));
    outer.appendChild(row('::part(search) — dark header + purple bottom border', 'styled-search'));
    outer.appendChild(row('::part(input) — orange input text', 'styled-input'));
    outer.appendChild(row('::part(results) — dark results pane', 'styled-results'));
    outer.appendChild(row('::part(category) — purple uppercase category headers', 'styled-category'));
    outer.appendChild(row('::part(item) — rounded item rows', 'styled-item'));
    outer.appendChild(row('::part(item-label) — orange bold labels', 'styled-item-label'));
    outer.appendChild(row('::part(item-description) — muted italic descriptions', 'styled-item-desc'));
    outer.appendChild(row('::part(item-shortcut) — purple pill shortcuts', 'styled-item-shortcut'));

    return outer;
  },
};

// h2: CSS Parts Advanced
// Demonstrates item-icon, item-icon-image, empty state, and full themed combination
export const CSSPartsAdvanced: Story = {
  render: () => {
    const outer = document.createElement('div');
    outer.className = 'parts-demo-adv';

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-adv { display: flex; flex-direction: column; gap: 2.5rem; font-family: sans-serif; }
      .parts-demo-adv .label { font-size: .7rem; color: #888; margin-bottom: .25rem; }
      .parts-demo-adv .palette-wrap { position: relative; min-height: 240px; }

      /* Styled: item-icon (emoji/text icon) */
      .parts-demo-adv .styled-icon::part(item-icon) {
        font-size: 1.4em;
        filter: hue-rotate(90deg) saturate(1.5);
        width: 2em;
        text-align: center;
      }

      /* Styled: item-icon-image (URL image icon) */
      .parts-demo-adv .styled-icon-img::part(item-icon-image) {
        border-radius: 50%;
        border: 2px solid #7c3aed;
        width: 20px;
        height: 20px;
      }

      /* Styled: empty state */
      .parts-demo-adv .styled-empty::part(empty) {
        color: #f43f5e;
        font-weight: 700;
        font-size: 1.1em;
        text-align: center;
        padding: 2rem;
        background: rgba(244,63,94,0.06);
        border-radius: 8px;
      }

      /* Full dark theme combination */
      .parts-demo-adv .styled-full::part(container) { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
      .parts-demo-adv .styled-full::part(search) { background: #1e293b; border-bottom: 1px solid #334155; border-radius: 14px 14px 0 0; padding: .75rem 1rem; }
      .parts-demo-adv .styled-full::part(input) { color: #e2e8f0; font-size: 1em; }
      .parts-demo-adv .styled-full::part(results) { background: #0f172a; }
      .parts-demo-adv .styled-full::part(category) { color: #475569; font-size: .65em; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #1e293b; }
      .parts-demo-adv .styled-full::part(item) { border-radius: 6px; margin: 1px 6px; }
      .parts-demo-adv .styled-full::part(item-label) { color: #f1f5f9; font-weight: 500; }
      .parts-demo-adv .styled-full::part(item-description) { color: #475569; font-size: .78em; }
      .parts-demo-adv .styled-full::part(item-icon) { font-size: 1.1em; opacity: .8; }
      .parts-demo-adv .styled-full::part(item-shortcut) { background: #1e293b; color: #64748b; border: 1px solid #334155; border-radius: 4px; padding: 1px 5px; font-size: .68em; box-shadow: none; }
    `;
    outer.appendChild(style);

    function row(lbl: string, cls: string, cmds: CommandItem[]) {
      const d = document.createElement('div');
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = lbl;
      d.appendChild(l);
      const pw = document.createElement('div');
      pw.className = 'palette-wrap';
      const el = document.createElement('snice-command-palette');
      el.toggleAttribute('open', true);
      if (cls) el.classList.add(cls);
      (el as any).commands = cmds;
      pw.appendChild(el);
      d.appendChild(pw);
      return d;
    }

    outer.appendChild(row(
      '::part(item-icon) — hue-rotated emoji icons',
      'styled-icon',
      DEFAULT_COMMANDS,
    ));

    outer.appendChild(row(
      '::part(item-icon-image) — circular bordered image icons',
      'styled-icon-img',
      [
        { id: 'gh', label: 'GitHub', iconImage: 'https://github.com/favicon.ico', category: 'Links' },
        { id: 'ggl', label: 'Google', iconImage: 'https://www.google.com/favicon.ico', category: 'Links' },
      ],
    ));

    outer.appendChild(row(
      '::part(empty) — red bold empty state (search for "zzz" to trigger)',
      'styled-empty',
      [{ id: 'x', label: 'Only match' }],
    ));

    outer.appendChild(row(
      'Full dark theme: all parts combined',
      'styled-full',
      DEFAULT_COMMANDS,
    ));

    return outer;
  },
};
