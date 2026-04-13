import type { Preview } from '@storybook/html-vite';

// Snice theme CSS
const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = '/snice-components/theme/theme.css';
document.head.appendChild(themeLink);

// Material Symbols icon font (used by many components for icons)
const iconFont = document.createElement('link');
iconFont.rel = 'stylesheet';
iconFont.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap';
document.head.appendChild(iconFont);

document.documentElement.setAttribute('data-theme', 'dark');

// Global styles: typography, layout, story content
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  /* Base typography — matches what all full-showcase.html files use */
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Centered column — prevents stretching on wide screens.
     Scoped to .sb-main-padded so layout:'fullscreen' stories stay full-width. */
  .sb-main-padded #storybook-root {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  #storybook-docs {
    max-width: 960px;
    margin: 0 auto;
  }

  /* Section headings inside stories (h2/h3 labels) */
  #storybook-root h2, #storybook-root h3 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--snice-color-text-tertiary, #888);
    margin: 0 0 0.75rem;
  }

  /* Make slotted/inner content visible in container components
     (tabs, accordion, card, modal, drawer, etc.) */
  #storybook-root p, #storybook-root .panel-content {
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--snice-color-text, #e0e0e0);
  }
`;
document.head.appendChild(globalStyle);

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark',  value: '#0f1115' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: { expanded: true, matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Snice theme',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark',  title: 'Dark'  },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      document.documentElement.setAttribute('data-theme', context.globals.theme || 'dark');
      return story();
    },
  ],
};

export default preview;
