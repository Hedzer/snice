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

// h2: CSS Parts Styling
// Parts: base, input-area, list
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .col { display: flex; flex-direction: column; gap: 0.5rem; }
      .parts-demo .row { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-comments::part(base) {}

      /* Styled: base — outermost container */
      .parts-demo .demo-styled snice-comments::part(base) {
        border: 2px solid #34d399;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(52, 211, 153, 0.2);
        background: #0a1a14;
      }
      /* Styled: input-area — new comment input section */
      .parts-demo .demo-styled snice-comments::part(input-area) {
        background: #064e3b;
        padding: 1.25rem;
        border-bottom: 2px solid #34d399;
      }
      /* Styled: list — comments list area */
      .parts-demo .demo-styled snice-comments::part(list) {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    `;

    const sampleComments = [
      { id: 'c1', author: 'Alice', text: 'Great post! Really helpful content.', timestamp: new Date(Date.now() - 3600000).toISOString(), likes: 4 },
      { id: 'c2', author: 'Bob', text: 'I agree with Alice, very insightful.', timestamp: new Date(Date.now() - 1800000).toISOString(), likes: 1 },
    ];

    function makeComments(className: string) {
      const el = document.createElement('snice-comments') as any;
      el.setAttribute('current-user', 'Me');
      el.style.cssText = 'display:block;width:460px;';
      customElements.whenDefined('snice-comments').then(() => {
        el.currentUser = 'Me';
        el.comments = sampleComments;
      });

      const wrap = document.createElement('div');
      wrap.className = className;
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = className === 'demo-default' ? 'Default' : 'Styled (::part(base, input-area, list))';
      wrap.appendChild(label);
      wrap.appendChild(el);
      return wrap;
    }

    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(makeComments('demo-default'));
    row.appendChild(makeComments('demo-styled'));

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(row);
    return wrap;
  },
};
