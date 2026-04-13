import type { Preview } from '@storybook/html-vite';

const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = '/snice-components/theme/theme.css';
document.head.appendChild(themeLink);

document.documentElement.setAttribute('data-theme', 'dark');

// Centered column layout — prevents stretching on wide screens.
// Scoped to .sb-main-padded so layout:'fullscreen' stories stay full-width.
const layoutStyle = document.createElement('style');
layoutStyle.textContent = `
  .sb-main-padded #storybook-root {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem;
  }
  #storybook-docs {
    max-width: 960px;
    margin: 0 auto;
  }
`;
document.head.appendChild(layoutStyle);

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
