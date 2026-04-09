import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-chat';

type Args = {
  currentUser?: string;
  placeholder?: string;
  showAvatars?: boolean;
  showTimestamps?: boolean;
  allowFiles?: boolean;
  showTyping?: boolean;
};

const meta: Meta<Args> = {
  title: 'Specialty/Chat',
  component: 'snice-chat',
  tags: ['autodocs'],
  argTypes: {
    currentUser:    { control: 'text' },
    placeholder:    { control: 'text' },
    showAvatars:    { control: 'boolean' },
    showTimestamps: { control: 'boolean' },
    allowFiles:     { control: 'boolean' },
    showTyping:     { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:600px;';
    const el = document.createElement('snice-chat');
    (el as any).style.setProperty('--snice-chat-height', '400px');
    if (args.currentUser    !== undefined) el.setAttribute('current-user',     args.currentUser);
    if (args.placeholder    !== undefined) el.setAttribute('placeholder',       args.placeholder);
    if (args.showAvatars    !== undefined) el.setAttribute('show-avatars',      String(args.showAvatars));
    if (args.showTimestamps !== undefined) el.setAttribute('show-timestamps',   String(args.showTimestamps));
    if (args.allowFiles     !== undefined) el.setAttribute('allow-files',       String(args.allowFiles));
    if (args.showTyping     !== undefined) el.setAttribute('show-typing',       String(args.showTyping));
    wrap.appendChild(el);
    const now = Date.now();
    customElements.whenDefined('snice-chat').then(() => {
      (el as any).addMessage({ type: 'system', content: 'Chat started', author: 'System', timestamp: new Date(now - 3600000) });
      (el as any).addMessage({ type: 'text', content: 'Hello!', author: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', timestamp: new Date(now - 300000) });
      (el as any).addMessage({ type: 'text', content: 'Hi Alice!', author: 'You', timestamp: new Date(now - 100000) });
    });
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

function makeChat(attrs: Record<string, string> = {}, setup?: (el: HTMLElement) => void) {
  const el = document.createElement('snice-chat');
  (el as any).style.setProperty('--snice-chat-height', '400px');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (setup) customElements.whenDefined('snice-chat').then(() => setup(el));
  const wrap = document.createElement('div');
  wrap.style.cssText = 'max-width:600px;';
  wrap.appendChild(el);
  return wrap;
}

const now = Date.now();

export const Default: Story = {
  args: { currentUser: 'You' },
};

// h2: Empty (no messages)
export const EmptyNoMessages: Story = {
  render: () => makeChat({ 'current-user': 'You' }),
};

// h2: Default: system + text messages, avatars, timestamps, reactions
export const DefaultSystemTextMessagesAvatarsTimestampsReactions: Story = {
  render: () => makeChat({ 'current-user': 'You' }, (el) => {
    (el as any).addMessage({ type: 'system', content: 'Chat started', author: 'System', timestamp: new Date(now - 3600000) });
    (el as any).addMessage({ type: 'text', content: 'Hello everyone!', author: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', timestamp: new Date(now - 300000) });
    (el as any).addMessage({ type: 'text', content: 'Hi Alice, how are you?', author: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', timestamp: new Date(now - 200000), reactions: [{ emoji: '👋', count: 2, users: ['Alice', 'Charlie'] }] });
    (el as any).addMessage({ type: 'text', content: 'Doing great, thanks!', author: 'You', timestamp: new Date(now - 100000) });
  }),
};

// h2: Image and file attachments
export const ImageAndFileAttachments: Story = {
  render: () => makeChat({ 'current-user': 'You' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Check this out', author: 'Diana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana', timestamp: new Date(now - 500000) });
    (el as any).addMessage({ type: 'image', content: '', author: 'Diana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana', timestamp: new Date(now - 400000), attachment: { type: 'image', url: 'https://picsum.photos/400/200', name: 'mockup.png' } });
    (el as any).addMessage({ type: 'file', content: '', author: 'Eve', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve', timestamp: new Date(now - 300000), attachment: { type: 'file', url: '#', name: 'report.pdf', size: 245760 } });
  }),
};

// h2: Edited message
export const EditedMessage: Story = {
  render: () => makeChat({ 'current-user': 'You' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'This message was edited', author: 'You', timestamp: new Date(now - 60000), edited: true });
    (el as any).addMessage({ type: 'text', content: 'Original message', author: 'Alice', timestamp: new Date(now - 30000) });
  }),
};

// h2: show-avatars="false"
export const ShowAvatarsFalse: Story = {
  render: () => makeChat({ 'current-user': 'You', 'show-avatars': 'false' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Message without avatar', author: 'User', timestamp: new Date() });
    (el as any).addMessage({ type: 'text', content: 'Another message', author: 'Other', timestamp: new Date() });
  }),
};

// h2: show-timestamps="false"
export const ShowTimestampsFalse: Story = {
  render: () => makeChat({ 'current-user': 'You', 'show-timestamps': 'false' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Timestamps are hidden', author: 'Alice', timestamp: new Date() });
  }),
};

// h2: allow-files="false"
export const AllowFilesFalse: Story = {
  render: () => makeChat({ 'current-user': 'You', 'allow-files': 'false' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'File upload button is hidden', author: 'Alice', timestamp: new Date() });
  }),
};

// h2: placeholder="Ask a question..."
export const CustomPlaceholder: Story = {
  render: () => makeChat({ 'current-user': 'You', placeholder: 'Ask a question...' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Custom placeholder below', author: 'Alice', timestamp: new Date() });
  }),
};

// h2: current-user="Admin"
export const CurrentUserAdmin: Story = {
  render: () => makeChat({ 'current-user': 'Admin' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'I am the current user', author: 'Admin', timestamp: new Date() });
    (el as any).addMessage({ type: 'text', content: 'This is from someone else', author: 'Guest', timestamp: new Date() });
  }),
};

// h2: All features off: show-avatars="false" show-timestamps="false" allow-files="false" show-typing="false"
export const AllFeaturesOff: Story = {
  render: () => makeChat({
    'current-user': 'You',
    'show-avatars': 'false',
    'show-timestamps': 'false',
    'allow-files': 'false',
    'show-typing': 'false',
  }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Minimal chat: no avatars, no timestamps, no files, no typing', author: 'User', timestamp: new Date() });
  }),
};

// h2: Multiple reactions on a message
export const MultipleReactionsOnAMessage: Story = {
  render: () => makeChat({ 'current-user': 'You' }, (el) => {
    (el as any).addMessage({ type: 'text', content: 'Reactions showcase', author: 'You', timestamp: new Date(), reactions: [
      { emoji: '👍', count: 3, users: ['Alice', 'Bob', 'You'] },
      { emoji: '❤️', count: 1, users: ['Charlie'] },
      { emoji: '😂', count: 5, users: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] },
    ]});
  }),
};
