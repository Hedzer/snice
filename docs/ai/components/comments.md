# snice-comments

Threaded comment system with replies, likes, avatars, and relative timestamps.

## Properties

```typescript
comments: Comment[] = [];          // Set via JS
currentUser: string = '';          // attribute: current-user
allowReplies: boolean = true;      // attribute: allow-replies
allowLikes: boolean = true;        // attribute: allow-likes
maxDepth: number = 3;              // attribute: max-depth
```

### Comment Type

```typescript
interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;     // ISO date string
  replies?: Comment[];
  likes?: number;
  liked?: boolean;
}
```

## Methods

- `addComment(text: string, parentId?: string)` - Add top-level or reply comment
- `deleteComment(id: string)` - Remove a comment by ID
- `likeComment(id: string)` - Toggle like on a comment

## Events

- `comment-add` -> `{ id, text, author }` - New top-level comment
- `comment-reply` -> `{ id, text, author, parentId }` - Reply submitted
- `comment-delete` -> `{ id }` - Comment deleted
- `comment-like` -> `{ id, likes, liked }` - Like toggled

## CSS Custom Properties

```css
--comments-bg              /* Background color */
--comments-border          /* Border color */
--comments-text            /* Primary text */
--comments-text-secondary  /* Author name, secondary text */
--comments-text-tertiary   /* Timestamps, placeholders */
--comments-primary         /* Submit button, active like color */
--comments-danger          /* Delete action hover color */
--comments-bg-element      /* Avatar background, hover states */
```

## CSS Parts

- `base` - Root container element
- `input-area` - The new comment input area
- `input` - Any comment textarea (new comment and reply)
- `submit-button` - Any post/reply submit button
- `list` - The comments list container
- `empty` - Empty state message shown with no comments
- `comment` - A single comment row (also each nested reply)
- `avatar` - Comment author avatar container
- `avatar-image` - The `<img>` inside the avatar when one is supplied
- `comment-body` - Wrapper for a comment's header, text, actions and replies
- `comment-header` - Author + timestamp row
- `author` - Comment author name
- `timestamp` - Comment timestamp text
- `text` - Comment body text
- `actions` - Row of comment action buttons
- `action` - Any comment action button
- `action-like` - Added to `action` on the like button
- `action-liked` - Added to `action` while the comment is liked
- `action-reply` - Added to `action` on the reply button
- `action-delete` - Added to `action` on the delete button
- `like-icon` - Heart glyph inside the like button
- `like-count` - Like count next to the heart glyph
- `reply-input-area` - Inline reply composer shown while replying
- `reply-input` - Added to `input` on the reply textarea
- `reply-submit-button` - Added to `submit-button` on the reply submit button
- `cancel-button` - Cancel button in the reply composer
- `replies` - Container holding a comment's nested replies

## Basic Usage

```html
<snice-comments current-user="Alice" allow-replies allow-likes></snice-comments>
```

```typescript
import 'snice/components/comments/snice-comments';

el.comments = [
  { id: '1', author: 'Bob', text: 'Great post!', timestamp: '2026-02-20T10:00:00Z', likes: 3 }
];
el.addEventListener('comment-add', (e) => console.log(e.detail));
```

### Declarative

```html
<snice-comments current-user="John">
  <snice-comment author="Alice" timestamp="2026-01-15T10:30:00Z" likes="3">
    Great article!
    <snice-comment author="Bob" timestamp="2026-01-15T11:00:00Z">Reply</snice-comment>
  </snice-comment>
</snice-comments>
```

## Accessibility

- Tab through comments, Enter/Space to activate
- Relative timestamps
- Delete only on own comments
- Semantic markup for screen readers
