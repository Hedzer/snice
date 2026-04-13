import type { Preview } from '@storybook/html-vite';

const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = '/snice-components/theme/theme.css';
document.head.appendChild(themeLink);

document.documentElement.setAttribute('data-theme', 'dark');

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
