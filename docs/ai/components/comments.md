# snice-comments

Threaded comment system with replies, likes, avatars, and real-time relative timestamps.

## Properties

```ts
comments: Comment[] = []        // Array of comment objects (set via JS)
currentUser: string = ''        // attr: current-user — name of logged-in user (enables delete on own comments)
allowReplies: boolean = true    // attr: allow-replies — enable nested replies
allowLikes: boolean = true      // attr: allow-likes — enable like/unlike
maxDepth: number = 3            // attr: max-depth — max nesting depth for replies
```

## Types

```ts
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

## Events

- `comment-add` -> `{ id: string, text: string, author: string }`
- `comment-reply` -> `{ id: string, text: string, author: string, parentId: string }`
- `comment-delete` -> `{ id: string }`
- `comment-like` -> `{ id: string, likes: number, liked: boolean }`

## Methods

- `addComment(text: string, parentId?: string): void` — Add top-level or reply comment
- `deleteComment(id: string): void` — Remove a comment by ID
- `likeComment(id: string): void` — Toggle like on a comment

## CSS Custom Properties

```css
--comments-bg             /* Background color */
--comments-border         /* Border color */
--comments-text           /* Primary text */
--comments-text-secondary /* Author name, secondary text */
--comments-text-tertiary  /* Timestamps, placeholders */
--comments-primary        /* Submit button, active like color */
--comments-danger         /* Delete action hover color */
--comments-bg-element     /* Avatar background, hover states */
```

## CSS Parts

- `base` — Root container
- `input-area` — New comment input area
- `list` — Comments list container

## Usage

```html
<snice-comments current-user="Alice" allow-replies max-depth="3"></snice-comments>
```

```js
const comments = document.querySelector('snice-comments');
comments.comments = [
  { id: '1', author: 'Bob', text: 'Great post!', timestamp: '2026-02-20T10:00:00Z', likes: 3 },
  { id: '2', author: 'Alice', text: 'Thanks!', timestamp: '2026-02-20T11:00:00Z', likes: 0 }
];
comments.addEventListener('comment-add', e => console.log(e.detail));
```
