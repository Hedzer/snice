import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-tabs';
import './snice-tab';
import './snice-tab-panel';
import type { TabsPlacement } from './snice-tabs.types';

type Args = {
  placement?: TabsPlacement;
  selected?: number;
  noScrollControls?: boolean;
};

const PLACEMENTS: TabsPlacement[] = ['top', 'bottom', 'start', 'end'];

function makeTabs(tabLabels: string[], panelContents: string[], attrs: Record<string, string | boolean> = {}) {
  const tabs = document.createElement('snice-tabs');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) tabs.toggleAttribute(k, true); }
    else tabs.setAttribute(k, v);
  }
  for (const label of tabLabels) {
    const tab = document.createElement('snice-tab');
    tab.slot = 'nav'; tab.textContent = label;
    tabs.appendChild(tab);
  }
  for (const content of panelContents) {
    const panel = document.createElement('snice-tab-panel');
    panel.style.cssText = 'padding:1rem;';
    panel.textContent = content;
    tabs.appendChild(panel);
  }
  return tabs;
}

function makeTab(label: string, attrs: Record<string, boolean> = {}) {
  const tab = document.createElement('snice-tab');
  tab.slot = 'nav'; tab.textContent = label;
  for (const [k, v] of Object.entries(attrs)) {
    if (v) tab.toggleAttribute(k, true);
  }
  return tab;
}

function makePanel(content: string) {
  const panel = document.createElement('snice-tab-panel');
  panel.style.cssText = 'padding:1rem;';
  panel.textContent = content;
  return panel;
}

const meta: Meta<Args> = {
  title: 'Layout/Tabs',
  component: 'snice-tabs',
  tags: ['autodocs'],
  argTypes: {
    placement:       { control: 'select', options: PLACEMENTS },
    selected:        { control: 'number' },
    noScrollControls:{ control: 'boolean' },
  },
  render: (args) => {
    const attrs: Record<string, string | boolean> = {};
    if (args.placement        !== undefined) attrs['placement'] = args.placement;
    if (args.selected         !== undefined) attrs['selected'] = String(args.selected);
    if (args.noScrollControls) attrs['no-scroll-controls'] = true;
    return makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Content for Tab 1', 'Content for Tab 2', 'Content for Tab 3'], attrs);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { placement: 'top' } };

// h2: Placement: Top (default)
export const PlacementTop: Story = {
  render: () => makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Content for Tab 1', 'Content for Tab 2', 'Content for Tab 3'], { placement: 'top' }),
};

// h2: Placement: Bottom
export const PlacementBottom: Story = {
  render: () => makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Content for Tab 1', 'Content for Tab 2', 'Content for Tab 3'], { placement: 'bottom' }),
};

// h2: Placement: Start (Vertical Left)
export const PlacementStart: Story = {
  render: () => {
    const tabs = makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Content for Tab 1', 'Content for Tab 2', 'Content for Tab 3'], { placement: 'start' });
    tabs.style.height = '200px';
    return tabs;
  },
};

// h2: Placement: End (Vertical Right)
export const PlacementEnd: Story = {
  render: () => {
    const tabs = makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Content for Tab 1', 'Content for Tab 2', 'Content for Tab 3'], { placement: 'end' });
    tabs.style.height = '200px';
    return tabs;
  },
};

// h2: Pre-selected Tab (selected=1)
export const PreSelectedTab: Story = {
  render: () => makeTabs(['First', 'Second (active)', 'Third'], ['First panel', 'Second panel (pre-selected)', 'Third panel'], { selected: '1' }),
};

// h2: Disabled Tab
export const DisabledTab: Story = {
  render: () => {
    const tabs = document.createElement('snice-tabs');
    tabs.appendChild(makeTab('Active'));
    tabs.appendChild(makeTab('Disabled', { disabled: true }));
    tabs.appendChild(makeTab('Active'));
    tabs.appendChild(makePanel('First panel'));
    tabs.appendChild(makePanel('Disabled panel'));
    tabs.appendChild(makePanel('Third panel'));
    return tabs;
  },
};

// h2: Closable Tabs
export const ClosableTabs: Story = {
  render: () => {
    const tabs = document.createElement('snice-tabs');
    tabs.appendChild(makeTab('Closable 1', { closable: true }));
    tabs.appendChild(makeTab('Closable 2', { closable: true }));
    tabs.appendChild(makeTab('Not closable'));
    tabs.appendChild(makePanel('Panel 1'));
    tabs.appendChild(makePanel('Panel 2'));
    tabs.appendChild(makePanel('Panel 3'));
    return tabs;
  },
};

// h2: Mixed: Disabled + Closable
export const MixedDisabledClosable: Story = {
  render: () => {
    const tabs = document.createElement('snice-tabs');
    tabs.appendChild(makeTab('Normal'));
    tabs.appendChild(makeTab('Disabled', { disabled: true }));
    tabs.appendChild(makeTab('Closable', { closable: true }));
    tabs.appendChild(makeTab('Disabled + Closable', { disabled: true, closable: true }));
    tabs.appendChild(makePanel('Normal panel'));
    tabs.appendChild(makePanel('Disabled panel'));
    tabs.appendChild(makePanel('Closable panel'));
    tabs.appendChild(makePanel('Disabled + Closable panel'));
    return tabs;
  },
};

// h2: No Scroll Controls
export const NoScrollControls: Story = {
  render: () => makeTabs(['Tab 1', 'Tab 2', 'Tab 3'], ['Panel 1', 'Panel 2', 'Panel 3'], { 'no-scroll-controls': true }),
};

// h2: Many Tabs (Scroll)
export const ManyTabsScroll: Story = {
  render: () => {
    const tabNames = ['Overview', 'Details', 'Settings', 'Permissions', 'Activity', 'Analytics', 'Integrations', 'Billing', 'Support', 'Advanced'];
    return makeTabs(tabNames, tabNames.map(n => `${n} content`));
  },
};

// h2: Two Tabs
export const TwoTabs: Story = {
  render: () => makeTabs(['On', 'Off'], ['On content', 'Off content']),
};

// h2: Single Tab
export const SingleTab: Story = {
  render: () => makeTabs(['Only Tab'], ['Only panel content']),
};
