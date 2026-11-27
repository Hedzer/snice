<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/comments.md -->

# Comments Component

A threaded comment system with nested replies, like/unlike functionality, user avatars, relative timestamps, and current-user awareness for delete permissions. Supports both programmatic and declarative usage.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `comments` | `Comment[]` | `[]` | Array of comment objects (set via JavaScript) |
| `currentUser` (attr: `current-user`) | `string` | `''` | Name of the logged-in user. Enables delete on own comments. |
| `allowReplies` (attr: `allow-replies`) | `boolean` | `true` | Enable nested reply threads |
| `allowLikes` (attr: `allow-likes`) | `boolean` | `true` | Enable like/unlike functionality per comment |
| `maxDepth` (attr: `max-depth`) | `number` | `3` | Maximum nesting depth for replies |

### Comment Type

```typescript
interface Comment {
  id: string;
  author: string;
  avatar?: string;       // URL for avatar image
  text: string;
  timestamp: string;     // ISO date string
  replies?: Comment[];
  likes?: number;
  liked?: boolean;
}
```

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `addComment()` | `text: string, parentId?: string` | Add a top-level comment or a reply (when `parentId` is provided) |
| `deleteComment()` | `id: string` | Remove a comment by its ID |
| `likeComment()` | `id: string` | Toggle the like state on a comment |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `comment-add` | `{ id: string, text: string, author: string }` | Fired when a new top-level comment is submitted |
| `comment-reply` | `{ id: string, text: string, author: string, parentId: string }` | Fired when a reply is submitted to an existing comment |
| `comment-delete` | `{ id: string }` | Fired when a comment is deleted |
| `comment-like` | `{ id: string, likes: number, liked: boolean }` | Fired when a comment is liked or unliked |

## CSS Custom Properties

| Property | Description |
|----------|-------------|
| `--comments-bg` | Background color |
| `--comments-border` | Border color |
| `--comments-text` | Primary text color |
| `--comments-text-secondary` | Author name and secondary text color |
| `--comments-text-tertiary` | Timestamps and placeholder text color |
| `--comments-primary` | Submit button and active like color |
| `--comments-danger` | Delete action hover color |
| `--comments-bg-element` | Avatar background and hover state color |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container element |
| `input-area` | The new comment input area |
| `input` | Any comment textarea (new comment and reply) |
| `submit-button` | Any post/reply submit button |
| `list` | The comments list container |
| `empty` | Empty state message shown with no comments |
| `comment` | A single comment row (also each nested reply) |
| `avatar` | Comment author avatar container |
| `avatar-image` | The `<img>` inside the avatar when one is supplied |
| `comment-body` | Wrapper for a comment's header, text, actions and replies |
| `comment-header` | Author + timestamp row |
| `author` | Comment author name |
| `timestamp` | Comment timestamp text |
| `text` | Comment body text |
| `actions` | Row of comment action buttons |
| `action` | Any comment action button |
| `action-like` | Added to `action` on the like button |
| `action-liked` | Added to `action` while the comment is liked |
| `action-reply` | Added to `action` on the reply button |
| `action-delete` | Added to `action` on the delete button |
| `like-icon` | Heart glyph inside the like button |
| `like-count` | Like count next to the heart glyph |
| `reply-input-area` | Inline reply composer shown while replying |
| `reply-input` | Added to `input` on the reply textarea |
| `reply-submit-button` | Added to `submit-button` on the reply submit button |
| `cancel-button` | Cancel button in the reply composer |
| `replies` | Container holding a comment's nested replies |

```css
snice-comments::part(base) {
  max-width: 600px;
  margin: 0 auto;
}
```

## Basic Usage

```html
<snice-comments current-user="Alice"></snice-comments>
```

```typescript
import 'snice/components/comments/snice-comments';
```

## Examples

### Basic Comment Thread

Set comments via JavaScript to display a threaded conversation.

```html
<snice-comments id="my-comments" current-user="Alice" allow-replies allow-likes></snice-comments>

<script type="module">
  import 'snice/components/comments/snice-comments';

  const el = document.getElementById('my-comments');
  el.comments = [
    {
      id: '1',
      author: 'Bob',
      avatar: '/avatars/bob.jpg',
      text: 'Great article! Really enjoyed the section on performance.',
      timestamp: '2026-02-20T10:00:00Z',
      likes: 5
    },
    {
      id: '2',
      author: 'Alice',
      text: 'Thanks Bob! I spent a lot of time on that section.',
      timestamp: '2026-02-20T11:30:00Z',
      likes: 2
    }
  ];
</script>
```

### Nested Replies

Use the `replies` array within a comment to create threaded conversations. Control the nesting depth with `max-depth`.

```html
<snice-comments id="nested-comments" current-user="Charlie" max-depth="3"></snice-comments>

<script type="module">
  const el = document.getElementById('nested-comments');
  el.comments = [
    {
      id: '1',
      author: 'Alice',
      text: 'Has anyone tried the new API?',
      timestamp: '2026-02-19T09:00:00Z',
      likes: 3,
      replies: [
        {
          id: '2',
          author: 'Bob',
          text: 'Yes! The response times are much better.',
          timestamp: '2026-02-19T10:15:00Z',
          likes: 1,
          replies: [
            {
              id: '3',
              author: 'Charlie',
              text: 'Agreed, the caching layer makes a big difference.',
              timestamp: '2026-02-19T11:00:00Z'
            }
          ]
        }
      ]
    }
  ];
</script>
```

### Read-Only Comments

Disable replies and likes for a read-only display of past comments.

```html
<snice-comments
  id="readonly-comments"
  current-user=""
  allow-replies="false"
  allow-likes="false">
</snice-comments>

<script type="module">
  const el = document.getElementById('readonly-comments');
  el.comments = [
    { id: '1', author: 'Admin', text: 'Version 2.0 has been released.', timestamp: '2026-01-15T08:00:00Z', likes: 12 },
    { id: '2', author: 'Support', text: 'Please update to the latest version.', timestamp: '2026-01-16T14:00:00Z', likes: 4 }
  ];
</script>
```

### Event Handling

Listen for comment actions to sync with a backend.

```html
<snice-comments id="event-comments" current-user="Alice"></snice-comments>

<script type="module">
  const el = document.getElementById('event-comments');
  el.comments = [];

  el.addEventListener('comment-add', (e) => {
    console.log('New comment:', e.detail.text, 'by', e.detail.author);
  });

  el.addEventListener('comment-reply', (e) => {
    console.log('Reply to', e.detail.parentId, ':', e.detail.text);
  });

  el.addEventListener('comment-like', (e) => {
    console.log('Comment', e.detail.id, 'now has', e.detail.likes, 'likes');
  });

  el.addEventListener('comment-delete', (e) => {
    console.log('Deleted comment:', e.detail.id);
  });
</script>
```

### Declarative Usage with Child Elements

Comments can also be defined declaratively using `<snice-comment>` child elements.

```html
<snice-comments current-user="John" allow-replies allow-likes>
  <snice-comment author="Alice" avatar="alice.jpg" timestamp="2026-01-15T10:30:00Z" likes="3">
    This is a great article!
    <snice-comment author="Bob" timestamp="2026-01-15T11:00:00Z">
      Thanks Alice!
    </snice-comment>
  </snice-comment>
  <snice-comment author="Charlie" timestamp="2026-01-15T12:00:00Z">
    Very informative.
  </snice-comment>
</snice-comments>
```

## Accessibility

- Keyboard support: Tab through comments, reply buttons, and like buttons. Enter or Space to activate controls.
- Timestamps displayed as relative times (e.g., "2 hours ago") for quick scanning
- Delete controls only appear on the current user's own comments
- Semantic markup conveys comment structure and author information to screen readers
