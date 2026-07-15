import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-location';

type Args = {
  mode?: 'full' | 'compact' | 'coordinates' | 'address';
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  showIcon?: boolean;
  icon?: string;
  mapUrl?: string;
  clickable?: boolean;
  showMap?: boolean;
};

const MODES: Array<'full' | 'compact' | 'coordinates' | 'address'> = ['full', 'compact', 'coordinates', 'address'];

function makeLoc(attrs: Record<string, string | boolean> = {}): HTMLElement {
  const el = document.createElement('snice-location');
  el.style.cssText = 'max-width:400px;display:block;';
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  return el;
}

const meta: Meta<Args> = {
  title: 'Location',
  component: 'snice-location',
  tags: ['autodocs'],
  argTypes: {
    mode:      { control: 'select', options: MODES },
    name:      { control: 'text' },
    address:   { control: 'text' },
    city:      { control: 'text' },
    state:     { control: 'text' },
    country:   { control: 'text' },
    zipCode:   { control: 'text' },
    latitude:  { control: 'text' },
    longitude: { control: 'text' },
    showIcon:  { control: 'boolean' },
    icon:      { control: 'text' },
    mapUrl:    { control: 'text' },
    clickable: { control: 'boolean' },
    showMap:   { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-location');
    el.style.cssText = 'max-width:400px;display:block;';
    if (args.mode      !== undefined) el.setAttribute('mode',      args.mode);
    if (args.name      !== undefined) el.setAttribute('name',      args.name);
    if (args.address   !== undefined) el.setAttribute('address',   args.address);
    if (args.city      !== undefined) el.setAttribute('city',      args.city);
    if (args.state     !== undefined) el.setAttribute('state',     args.state);
    if (args.country   !== undefined) el.setAttribute('country',   args.country);
    if (args.zipCode   !== undefined) el.setAttribute('zip-code',  args.zipCode);
    if (args.latitude  !== undefined) el.setAttribute('latitude',  args.latitude);
    if (args.longitude !== undefined) el.setAttribute('longitude', args.longitude);
    if (args.showIcon  === false)     el.setAttribute('show-icon', 'false');
    if (args.icon      !== undefined) el.setAttribute('icon',      args.icon);
    if (args.mapUrl    !== undefined) el.setAttribute('map-url',   args.mapUrl);
    if (args.clickable) el.toggleAttribute('clickable', true);
    if (args.showMap)   el.toggleAttribute('show-map',  true);
    wrap.appendChild(el);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {
    mode: 'full', name: 'Central Park', address: '59th to 110th Street',
    city: 'New York', state: 'NY', country: 'USA', zipCode: '10022',
    latitude: '40.7829', longitude: '-73.9654',
  },
};

// h2: Mode: full (default)
export const ModeFull: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      mode: 'full', name: 'Central Park', address: '59th to 110th Street',
      city: 'New York', state: 'NY', country: 'USA', 'zip-code': '10022',
      latitude: '40.7829', longitude: '-73.9654',
    }));
    return wrap;
  },
};

// h2: Mode: compact
export const ModeCompact: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      mode: 'compact', name: 'Times Square', address: 'Broadway & 7th Avenue',
      city: 'New York', state: 'NY', latitude: '40.7580', longitude: '-73.9855',
    }));
    return wrap;
  },
};

// h2: Mode: coordinates
export const ModeCoordinates: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ mode: 'coordinates', latitude: '40.7484', longitude: '-73.9857' }));
    return wrap;
  },
};

// h2: Mode: address
export const ModeAddress: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      mode: 'address', name: 'Empire State Building', address: '350 Fifth Avenue',
      city: 'New York', state: 'NY', 'zip-code': '10118', country: 'USA',
    }));
    return wrap;
  },
};

// h2: All modes side-by-side
export const AllModesSideBySide: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:0.75rem;flex-wrap:wrap;';
    wrap.appendChild(makeLoc({ mode: 'full', name: 'Location', address: '123 Main St', city: 'Springfield', state: 'IL', latitude: '39.7817', longitude: '-89.6501' }));
    wrap.appendChild(makeLoc({ mode: 'compact', name: 'Location', address: '123 Main St', city: 'Springfield', state: 'IL', latitude: '39.7817', longitude: '-89.6501' }));
    wrap.appendChild(makeLoc({ mode: 'coordinates', latitude: '39.7817', longitude: '-89.6501' }));
    wrap.appendChild(makeLoc({ mode: 'address', name: 'Location', address: '123 Main St', city: 'Springfield', state: 'IL' }));
    return wrap;
  },
};

// h2: Show icon: true (default)
export const ShowIconTrue: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ name: 'With Icon', address: '123 Main St', city: 'Town' }));
    return wrap;
  },
};

// h2: Show icon: false
export const ShowIconFalse: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ name: 'No Icon', address: '123 Main St', city: 'Town', 'show-icon': 'false' }));
    return wrap;
  },
};

// h2: Custom icon (emoji)
export const CustomIconEmoji: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ name: 'Office', address: '456 Corporate Blvd', city: 'Business City', icon: '\u{1F3E2}' }));
    return wrap;
  },
};

// h2: Custom icon (different emoji)
export const CustomIconDifferentEmoji: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ name: 'Home', address: '789 Residential Dr', city: 'Hometown', icon: '\u{1F3E0}' }));
    return wrap;
  },
};

// h2: Icon image (URL)
export const IconImageURL: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Custom Icon Image', address: '100 Icon Ave', city: 'Graphicville',
      'icon-image': 'https://cdn-icons-png.flaticon.com/24/854/854878.png',
    }));
    return wrap;
  },
};

// h2: Icon slot (Material Symbols)
export const IconSlotMaterialSymbols: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = document.createElement('snice-location');
    el.style.cssText = 'max-width:400px;display:block;';
    el.setAttribute('name', 'Slotted Icon');
    el.setAttribute('address', '200 Slot St');
    el.setAttribute('city', 'Slottown');
    const span = document.createElement('span');
    span.setAttribute('slot', 'icon');
    span.className = 'material-symbols-outlined';
    span.style.cssText = 'font-size:1.5rem;';
    span.textContent = 'business';
    el.appendChild(span);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Clickable
export const Clickable: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Clickable Location', address: 'Central Park West', city: 'New York',
      state: 'NY', latitude: '40.7829', longitude: '-73.9654', clickable: true,
    }));
    return wrap;
  },
};

// h2: Clickable + custom icon
export const ClickableCustomIcon: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Restaurant', address: '45 Food Lane', city: 'Eatville',
      latitude: '40.7128', longitude: '-74.0060', icon: '\u{1F37D}\uFE0F', clickable: true,
    }));
    return wrap;
  },
};

// h2: Show map (embedded)
export const ShowMapEmbedded: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Statue of Liberty', latitude: '40.6892', longitude: '-74.0445', 'show-map': true,
    }));
    return wrap;
  },
};

// h2: Show map + full address
export const ShowMapFullAddress: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Golden Gate Bridge', address: 'Golden Gate Bridge', city: 'San Francisco',
      state: 'CA', country: 'USA', latitude: '37.8199', longitude: '-122.4783', 'show-map': true,
    }));
    return wrap;
  },
};

// h2: Custom map URL
export const CustomMapURL: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Custom Map', address: 'Custom URL location', city: 'Mapville',
      'map-url': 'https://www.google.com/maps?q=48.8566,2.3522&output=embed', 'show-map': true,
    }));
    return wrap;
  },
};

// h2: Safe external navigation
export const SafeExternalNavigation: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';

    const safe = makeLoc({
      name: 'Safe relative destination', address: 'Activates locally in a new tab',
      'map-url': '#location-safe-navigation', clickable: true,
    });
    safe.id = 'location-story-safe';

    const blocked = makeLoc({
      name: 'Blocked unsafe destination', address: 'Still emits location-click; never opens',
      'map-url': 'javascript:globalThis.__sniceUnsafeLocationStory = 1', clickable: true,
    });
    blocked.id = 'location-story-blocked';

    const status = document.createElement('output');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Activate either location to inspect the event.';
    for (const location of [safe, blocked]) {
      location.addEventListener('location-click', () => {
        status.textContent = `location-click: ${location.getAttribute('name')}`;
      });
    }

    wrap.append(safe, blocked, status);
    return wrap;
  },
};

// h2: Name only
export const NameOnly: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ name: 'Just a Name' }));
    return wrap;
  },
};

// h2: Address only (no name)
export const AddressOnlyNoName: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ address: '123 Anonymous St', city: 'Unnamed', state: 'XX', 'zip-code': '00000' }));
    return wrap;
  },
};

// h2: Coordinates only
export const CoordinatesOnly: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({ latitude: '51.5074', longitude: '-0.1278' }));
    return wrap;
  },
};

// h2: Full address with all fields
export const FullAddressWithAllFields: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({
      name: 'Complete Address', address: '742 Evergreen Terrace', city: 'Springfield',
      state: 'IL', 'zip-code': '62704', country: 'USA', latitude: '39.7817', longitude: '-89.6501',
    }));
    return wrap;
  },
};

// h2: Empty (no props)
export const EmptyNoProps: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeLoc({}));
    return wrap;
  },
};

// h2: Mode x clickable matrix
export const ModeXClickableMatrix: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:0.75rem;flex-wrap:wrap;';
    wrap.appendChild(makeLoc({ mode: 'full', name: 'Full+Click', address: '1 St', city: 'Town', latitude: '40', longitude: '-74', clickable: true }));
    wrap.appendChild(makeLoc({ mode: 'compact', name: 'Compact+Click', address: '2 St', city: 'Town', latitude: '40', longitude: '-74', clickable: true }));
    wrap.appendChild(makeLoc({ mode: 'coordinates', latitude: '40', longitude: '-74', clickable: true }));
    wrap.appendChild(makeLoc({ mode: 'address', name: 'Addr+Click', address: '3 St', city: 'Town', clickable: true }));
    return wrap;
  },
};

// h2: No icon + different modes
export const NoIconDifferentModes: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:0.75rem;flex-wrap:wrap;';
    wrap.appendChild(makeLoc({ mode: 'full', name: 'No Icon Full', address: '1 St', city: 'Town', 'show-icon': 'false' }));
    wrap.appendChild(makeLoc({ mode: 'compact', name: 'No Icon Compact', address: '2 St', city: 'Town', 'show-icon': 'false' }));
    return wrap;
  },
};

// h2: CSS Parts Styling
// Available parts: base, icon, content, map
export const CSSPartsStyling: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:2rem;';

    // Default
    const defaultLabel = document.createElement('h3');
    defaultLabel.textContent = 'Default';
    defaultLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    const defaultEl = makeLoc({
      mode: 'full',
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Av. Anatole France',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      latitude: '48.8584',
      longitude: '2.2945',
    });
    wrap.appendChild(defaultLabel);
    wrap.appendChild(defaultEl);

    // Styled with ::part()
    const styledSection = document.createElement('div');
    styledSection.className = 'parts-demo-location';

    const styledLabel = document.createElement('h3');
    styledLabel.textContent = 'Styled with ::part()';
    styledLabel.style.cssText = 'margin:0 0 .5rem;font-size:.875rem;color:#888;';
    styledSection.appendChild(styledLabel);

    const style = document.createElement('style');
    style.textContent = `
      .parts-demo-location snice-location::part(base) {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid #e94560;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 4px 20px rgba(233,69,96,0.2);
        color: #e0e0ff;
      }
      .parts-demo-location snice-location::part(icon) {
        color: #e94560;
        font-size: 1.5rem;
        filter: drop-shadow(0 0 6px rgba(233,69,96,0.6));
      }
      .parts-demo-location snice-location::part(content) {
        color: #c8c8e8;
        font-family: 'Georgia', serif;
        line-height: 1.6;
      }
      .parts-demo-location snice-location::part(map) {
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e94560;
        margin-top: 0.75rem;
        filter: sepia(0.4) hue-rotate(200deg);
      }
    `;
    styledSection.appendChild(style);

    const styledEl = makeLoc({
      mode: 'full',
      name: 'Eiffel Tower',
      address: 'Champ de Mars, 5 Av. Anatole France',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      latitude: '48.8584',
      longitude: '2.2945',
    });
    styledSection.appendChild(styledEl);
    wrap.appendChild(styledSection);

    return wrap;
  },
};
