import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-calendar';

type Args = {
  highlightToday?: boolean;
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1;
  locale?: string;
};

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const today = new Date();

const meta: Meta<Args> = {
  title: 'Calendar',
  component: 'snice-calendar',
  tags: ['autodocs'],
  argTypes: {
    highlightToday:  { control: 'boolean' },
    showWeekNumbers: { control: 'boolean' },
    firstDayOfWeek:  { control: 'select', options: [0, 1] },
    locale:          { control: 'text' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    if (args.highlightToday === false) el.setAttribute('highlight-today', 'false');
    else if (args.highlightToday)      el.toggleAttribute('highlight-today', true);
    if (args.showWeekNumbers) el.toggleAttribute('show-week-numbers', true);
    if (args.firstDayOfWeek !== undefined) el.setAttribute('first-day-of-week', String(args.firstDayOfWeek));
    if (args.locale !== undefined) el.setAttribute('locale', args.locale);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { highlightToday: true, firstDayOfWeek: 0 } };

// h2: Default (month view)
export const DefaultMonthView: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: highlight-today: true (default) vs false
export const HighlightTodayTrueVsFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const a = document.createElement('snice-calendar');
    a.style.cssText = 'max-width:400px;';
    a.toggleAttribute('highlight-today', true);
    const b = document.createElement('snice-calendar');
    b.style.cssText = 'max-width:400px;';
    b.setAttribute('highlight-today', 'false');
    wrap.appendChild(a);
    wrap.appendChild(b);
    return wrap;
  },
};

// h2: show-week-numbers
export const ShowWeekNumbers: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    el.toggleAttribute('show-week-numbers', true);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: first-day-of-week: 0 (Sunday) vs 1 (Monday)
export const FirstDayOfWeekSundayVsMonday: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const sun = document.createElement('snice-calendar');
    sun.style.cssText = 'max-width:400px;';
    sun.setAttribute('first-day-of-week', '0');
    const mon = document.createElement('snice-calendar');
    mon.style.cssText = 'max-width:400px;';
    mon.setAttribute('first-day-of-week', '1');
    wrap.appendChild(sun);
    wrap.appendChild(mon);
    return wrap;
  },
};

// h2: With events
export const WithEvents: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    (el as any).events = [
      { id: 1, title: 'Meeting', start: addDays(today, 1), color: '#2563eb' },
      { id: 2, title: 'Lunch', start: addDays(today, 2), color: '#16a34a' },
      { id: 3, title: 'Review', start: addDays(today, 3), end: addDays(today, 5), color: '#dc2626' },
      { id: 4, title: 'Deploy', start: addDays(today, 7), color: '#7c3aed' },
      { id: 5, title: 'Offsite', start: addDays(today, 9), end: addDays(today, 16), color: '#0891b2' },
      {
        id: 6, title: 'On call', start: addDays(today, 12), end: addDays(today, 14), color: '#7c3aed',
        avatar: { name: 'Sam Reyes' }, tooltip: 'Pager rotation — reachable on #incidents',
        popover: 'Rotation: Sam Reyes → Dana Ives. Escalation: #incidents.',
      },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Event popovers (click an event)
export const EventPopovers: Story = {
  render: () => {
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    (el as any).events = [
      { id: 'p1', title: 'Kickoff', start: addDays(today, 1), color: '#2563eb',
        popover: 'Project kickoff — room 2, bring the roadmap.' },
      { id: 'p2', title: 'Audit', start: addDays(today, 3), end: addDays(today, 6), color: '#dc2626', popover: true },
      { id: 'p3', title: 'Retro', start: addDays(today, 8), color: '#16a34a' },
    ];
    (el as any).eventPopover = async (event: any) => {
      await new Promise((r) => setTimeout(r, 250));
      const card = document.createElement('div');
      card.innerHTML = `<strong>${event.title}</strong><p style="margin:0.4rem 0">Loaded lazily · 4 auditors</p>`;
      return card;
    };
    return el;
  },
};

// h2: no-day-select (display-only)
export const NoDaySelectDisplayOnly: Story = {
  render: () => {
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    el.setAttribute('no-day-select', '');
    (el as any).events = [
      { id: 'n1', title: 'All hands', start: addDays(today, 2), color: '#2563eb' },
      { id: 'n2', title: 'Freeze', start: addDays(today, 4), end: addDays(today, 8), color: '#dc2626' },
    ];
    return el;
  },
};

// h2: cell-sizing: square (default) vs stretch
export const CellSizingSquareVsStretch: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1rem;';
    const square = document.createElement('snice-calendar');
    const stretch = document.createElement('snice-calendar');
    stretch.setAttribute('cell-sizing', 'stretch');
    wrap.append(square, stretch);
    return wrap;
  },
};

// h2: With disabled dates
export const WithDisabledDates: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    const disabled: Date[] = [];
    for (let i = 1; i <= 5; i++) disabled.push(addDays(today, i * 3));
    (el as any).disabledDates = disabled;
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: With min-date and max-date
export const WithMinDateAndMaxDate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    (el as any).minDate = addDays(today, -7);
    (el as any).maxDate = addDays(today, 30);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Locale: en-US vs de-DE vs ja-JP
export const LocaleEnUSVsDeDEVsJaJP: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:1.5rem;flex-wrap:wrap;';
    const en = document.createElement('snice-calendar');
    en.style.cssText = 'max-width:400px;';
    en.setAttribute('locale', 'en-US');
    const de = document.createElement('snice-calendar');
    de.style.cssText = 'max-width:400px;';
    de.setAttribute('locale', 'de-DE');
    de.setAttribute('first-day-of-week', '1');
    const ja = document.createElement('snice-calendar');
    ja.style.cssText = 'max-width:400px;';
    ja.setAttribute('locale', 'ja-JP');
    wrap.appendChild(en);
    wrap.appendChild(de);
    wrap.appendChild(ja);
    return wrap;
  },
};

// h2: Pre-selected value
export const PreSelectedValue: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    (el as any).value = addDays(today, 5);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Multiple colored events on same date
export const MultipleColoredEventsOnSameDate: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    // A height of its own, so the day cell has room for all three lanes and
    // none of them collapse into a "+N more" chip.
    el.style.cssText = 'max-width:30rem;height:46rem;';
    const d = addDays(today, 2);
    (el as any).events = [
      { id: 1, title: 'Event A', start: d, color: '#dc2626' },
      { id: 2, title: 'Event B', start: d, color: '#2563eb' },
      { id: 3, title: 'Event C', start: d, color: '#16a34a' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Many events (overflow with +N more)
export const ManyEventsOverflowWithNMore: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    el.style.cssText = 'max-width:400px;';
    const od = addDays(today, 4);
    (el as any).events = [
      { id: 1, title: 'Alpha', start: od, color: '#dc2626' },
      { id: 2, title: 'Beta', start: od, color: '#2563eb' },
      { id: 3, title: 'Gamma', start: od, color: '#16a34a' },
      { id: 4, title: 'Delta', start: od, color: '#7c3aed' },
      { id: 5, title: 'Epsilon', start: od, color: '#f59e0b' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Adaptive lanes: the same five events in a tall calendar
export const AdaptiveLanesInATallCalendar: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-calendar');
    // A height of its own: the week rows share it, so the derived lane budget
    // grows and the stack that collapses into "+4 more" is shown in full.
    el.style.cssText = 'height:64rem;max-width:34rem;';
    const od = addDays(today, 4);
    (el as any).events = [
      { id: 1, title: 'Alpha', start: od, color: '#dc2626' },
      { id: 2, title: 'Beta', start: od, color: '#2563eb' },
      { id: 3, title: 'Gamma', start: od, color: '#16a34a' },
      { id: 4, title: 'Delta', start: od, color: '#7c3aed' },
      { id: 5, title: 'Epsilon', start: od, color: '#f59e0b' },
    ];
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: CSS Parts Styling
// Available parts: base, header, grid
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;';

    // Default
    const defaultSection = document.createElement('div');
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    const defaultEl = document.createElement('snice-calendar');
    defaultEl.style.cssText = 'max-width:340px;display:block;';
    defaultEl.toggleAttribute('highlight-today', true);
    (defaultEl as any).events = [
      { id: 1, title: 'Meeting', start: addDays(today, 2), color: '#2563eb' },
      { id: 2, title: 'Review', start: addDays(today, 5), color: '#16a34a' },
    ];
    defaultSection.appendChild(defaultLabel);
    defaultSection.appendChild(defaultEl);
    wrap.appendChild(defaultSection);

    // Styled with ::part()
    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-calendar';

    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-calendar snice-calendar::part(base) {
        background: #1e1b4b;
        border: 1px solid #4338ca;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(67,56,202,0.4);
        max-width: 340px;
      }
      .parts-demo-calendar snice-calendar::part(header) {
        background: linear-gradient(135deg, #312e81, #4338ca);
        color: #e0e7ff;
        padding: 1rem;
        font-weight: 700;
        font-size: 1.1rem;
        letter-spacing: 0.05em;
      }
      .parts-demo-calendar snice-calendar::part(grid) {
        background: #1e1b4b;
        padding: 0.75rem;
        gap: 2px;
        color: #c7d2fe;
      }
    `;
    styledSection.appendChild(style);

    const styledEl = document.createElement('snice-calendar');
    styledEl.style.cssText = 'max-width:340px;display:block;';
    styledEl.toggleAttribute('highlight-today', true);
    (styledEl as any).events = [
      { id: 1, title: 'Meeting', start: addDays(today, 2), color: '#818cf8' },
      { id: 2, title: 'Review', start: addDays(today, 5), color: '#a5b4fc' },
    ];
    styledSection.appendChild(styledEl);
    wrap.appendChild(styledSection);

    return wrap;
  },
};
