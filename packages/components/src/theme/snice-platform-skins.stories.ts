import type { Meta, StoryObj } from '@storybook/html-vite';
import '../button/snice-button';
import '../switch/snice-switch';
import '../checkbox/snice-checkbox';
import '../radio/snice-radio';
import '../chip/snice-chip';
import '../input/snice-input';
import '../slider/snice-slider';
import '../card/snice-card';
import '../tabs/snice-tabs';
import '../tabs/snice-tab';
import '../tabs/snice-tab-panel';
import '../table/snice-table';
import '../kanban/snice-kanban';

const meta: Meta = {
  title: 'Theme/Platform Skins Lab',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

const PLATFORMS = [
  { id: 'default', label: 'Default (Snice Neutral)' },
  { id: 'ios', label: 'iOS 26+ Liquid Glass' },
  { id: 'material', label: 'Android Material 3 Expressive' },
  { id: 'windows', label: 'Windows 11 Fluent 2 / WinUI 3' },
  { id: 'macos', label: 'macOS 26+ Liquid Glass / AppKit' },
] as const;

function createPlatformPanel(platformId: string, label: string): HTMLElement {
  const section = document.createElement('section');
  if (platformId !== 'default') {
    section.setAttribute('data-platform', platformId);
  }
  section.style.cssText =
    'padding: 16px; border-radius: 12px; border: 1px solid var(--snice-color-border); background: var(--snice-color-surface, var(--snice-color-background)); color: var(--snice-color-text); font-family: var(--snice-font-family); display: flex; flex-direction: column; gap: 12px;';

  const heading = document.createElement('h3');
  heading.textContent = label;
  heading.style.cssText = 'margin: 0; font-size: 0.875rem; font-weight: 600;';
  section.appendChild(heading);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; align-items: center;';
  btnRow.innerHTML = `
    <snice-button variant="primary">Primary</snice-button>
    <snice-button>Secondary</snice-button>
    <snice-button outline>Outline</snice-button>
  `;
  section.appendChild(btnRow);

  const toggleRow = document.createElement('div');
  toggleRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 12px; align-items: center;';
  toggleRow.innerHTML = `
    <snice-switch label="Enabled" checked></snice-switch>
    <snice-checkbox label="Sync" checked></snice-checkbox>
    <snice-chip label="Active" selectable selected></snice-chip>
  `;
  section.appendChild(toggleRow);

  const inputRow = document.createElement('div');
  inputRow.innerHTML = `
    <snice-input label="Workspace" placeholder="snice-app"></snice-input>
    <snice-slider label="Level" value="60" min="0" max="100"></snice-slider>
  `;
  section.appendChild(inputRow);

  const card = document.createElement('snice-card');
  card.innerHTML = `<span slot="header">Surface Card</span><p style="margin:0">One class, one template — pure CSS platform skin.</p>`;
  section.appendChild(card);

  const table = document.createElement('snice-table') as any;
  table.columns = [
    { key: 'name', label: 'Control', type: 'text' },
    { key: 'state', label: 'Status', type: 'text' },
  ];
  table.data = [
    { name: 'Button', state: 'Native' },
    { name: 'Table', state: 'Guideline' },
  ];
  section.appendChild(table);

  return section;
}

export const SideBySideComparison: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; padding: 16px;';
    for (const p of PLATFORMS) {
      wrap.appendChild(createPlatformPanel(p.id, p.label));
    }
    return wrap;
  },
};

export const NestedSubtreesAndBrandOverride: Story = {
  render: () => {
    const outer = document.createElement('div');
    outer.setAttribute('data-platform', 'macos');
    outer.style.cssText =
      'padding: 20px; display: grid; gap: 16px; background: var(--snice-color-surface); color: var(--snice-color-text); font-family: var(--snice-font-family);';

    const title = document.createElement('div');
    title.innerHTML = '<strong>Outer macOS 26+ subtree</strong> with nested iOS 26+ and branded Material 3 subtrees (pure CSS cascade):';
    outer.appendChild(title);

    const outerBtn = document.createElement('snice-button');
    outerBtn.setAttribute('variant', 'primary');
    outerBtn.textContent = 'macOS 26+ Desktop Button';
    outer.appendChild(outerBtn);

    const iosSub = createPlatformPanel('ios', 'Nested iOS 26+ Subtree');
    outer.appendChild(iosSub);

    const brandedMat = createPlatformPanel('material', 'Nested Material 3 with --snice-color-primary Brand Override');
    brandedMat.style.setProperty('--snice-color-primary', 'hsl(168 84% 32%)');
    outer.appendChild(brandedMat);

    return outer;
  },
};
