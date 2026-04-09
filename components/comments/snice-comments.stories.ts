import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-comments';

type Args = {
  currentUser?: string;
  allowReplies?: boolean;
  allowLikes?: boolean;
  maxDepth?: number;
};

const meta: Meta<Args> = {
  title: 'Specialty/Comments',
  component: 'snice-comments',
  tags: ['autodocs'],
  argTypes: {
    currentUser:  { control: 'text' },
    allowReplies: { control: 'boolean' },
    allowLikes:   { control: 'boolean' },
    maxDepth:     { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:700px;';
    const el = document.createElement('snice-comments') as any;
    if (args.currentUser !== undefined) el.setAttribute('current-user', args.currentUser);
    if (args.allowReplies === false) el.setAttribute('allow-replies', 'false');
    if (args.allowLikes === false) el.setAttribute('allow-likes', 'false');
    if (args.maxDepth !== undefined) el.maxDepth = args.maxDepth;
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = args.currentUser ?? 'Me';
    });
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { currentUser: 'Me' },
};

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;max-width:700px;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Empty (no comments)
export const EmptyNoComments: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Me';
    });
    return wrap;
  },
};

// h2: Threaded: avatars, likes, nested replies (max-depth="3" default)
export const ThreadedAvatarsLikesNestedRepliesMaxDepth3Default: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Alice';
      el.comments = [
        {
          id: '1', author: 'Alice', avatar: 'https://i.pravatar.cc/40?u=alice',
          text: 'Great feature! Threaded replies are excellent.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          likes: 5, liked: false,
          replies: [
            {
              id: '2', author: 'Bob', avatar: 'https://i.pravatar.cc/40?u=bob',
              text: 'Agreed, the nesting makes conversations easy to follow.',
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              likes: 2, liked: true,
              replies: [
                { id: '3', author: 'Alice', avatar: 'https://i.pravatar.cc/40?u=alice',
                  text: 'Thanks Bob!', timestamp: new Date(Date.now() - 600000).toISOString(), likes: 0, liked: false },
              ],
            },
          ],
        },
        { id: '4', author: 'Charlie', text: 'No avatar shows initials instead.', timestamp: new Date(Date.now() - 7200000).toISOString(), likes: 1, liked: false },
      ];
    });
    return wrap;
  },
};

// h2: allow-replies="false"
export const AllowRepliesFalse: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    el.setAttribute('allow-replies', 'false');
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Me';
      el.comments = [
        { id: 'a', author: 'User A', text: 'Reply button is hidden.', timestamp: new Date().toISOString(), likes: 0 },
        { id: 'b', author: 'User B', text: 'Cannot reply to this.', timestamp: new Date().toISOString(), likes: 3 },
      ];
    });
    return wrap;
  },
};

// h2: allow-likes="false"
export const AllowLikesFalse: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    el.setAttribute('allow-likes', 'false');
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Me';
      el.comments = [
        { id: 'x', author: 'User X', text: 'Like button is hidden.', timestamp: new Date().toISOString() },
        { id: 'y', author: 'User Y', text: 'No hearts here.', timestamp: new Date().toISOString() },
      ];
    });
    return wrap;
  },
};

// h2: max-depth="1" (shallow nesting)
export const MaxDepth1ShallowNesting: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Alice';
      el.maxDepth = 1;
      el.comments = [
        { id: 'm1', author: 'Alice', text: 'Top level', timestamp: new Date().toISOString(), likes: 0,
          replies: [
            { id: 'm2', author: 'Bob', text: 'Reply (depth 1) - no further nesting allowed', timestamp: new Date().toISOString(), likes: 0 },
          ],
        },
      ];
    });
    return wrap;
  },
};

// h2: Declarative children (snice-comment elements)
export const DeclarativeChildrenSniceCommentElements: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments');
    el.setAttribute('current-user', 'Me');

    const c1 = document.createElement('snice-comment');
    c1.setAttribute('author', 'Alice');
    c1.setAttribute('timestamp', '2026-01-15T10:30:00Z');
    c1.textContent = 'Declarative comment from Alice.';

    const reply1 = document.createElement('snice-comment');
    reply1.setAttribute('author', 'Bob');
    reply1.setAttribute('timestamp', '2026-01-15T11:00:00Z');
    reply1.textContent = 'Reply from Bob.';
    c1.appendChild(reply1);

    const c2 = document.createElement('snice-comment');
    c2.setAttribute('author', 'Charlie');
    c2.setAttribute('likes', '3');
    c2.textContent = 'Another top-level comment.';

    el.appendChild(c1);
    el.appendChild(c2);
    wrap.appendChild(el);
    return wrap;
  },
};

// h2: Own vs other comments (current-user="Me")
export const OwnVsOtherCommentsCurrentUserMe: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Me';
      el.comments = [
        { id: 'o1', author: 'Me', text: 'I can delete this (my own comment).', timestamp: new Date().toISOString(), likes: 0 },
        { id: 'o2', author: 'Other', text: 'I cannot delete this.', timestamp: new Date().toISOString(), likes: 2 },
      ];
    });
    return wrap;
  },
};

// h2: allow-replies="false" + allow-likes="false" (minimal)
export const AllowRepliesFalsePlusAllowLikesFalseMinimal: Story = {
  render: () => {
    const wrap = col();
    const el = document.createElement('snice-comments') as any;
    el.setAttribute('allow-replies', 'false');
    el.setAttribute('allow-likes', 'false');
    wrap.appendChild(el);
    customElements.whenDefined('snice-comments').then(() => {
      el.currentUser = 'Me';
      el.comments = [
        { id: 'r1', author: 'Admin', text: 'Read-only feed: no likes, no replies.', timestamp: new Date().toISOString() },
      ];
    });
    return wrap;
  },
};
