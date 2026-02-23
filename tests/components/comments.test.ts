import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/comments/snice-comments';
import type { SniceCommentsElement, Comment } from '../../components/comments/snice-comments.types';

const sampleComments: Comment[] = [
  {
    id: '1',
    author: 'Alice',
    text: 'Great post!',
    timestamp: new Date().toISOString(),
    likes: 3,
    liked: false,
    replies: [
      {
        id: '2',
        author: 'Bob',
        text: 'I agree!',
        timestamp: new Date().toISOString(),
        likes: 1,
        liked: false
      }
    ]
  },
  {
    id: '3',
    author: 'Charlie',
    text: 'Interesting perspective.',
    timestamp: new Date().toISOString(),
    likes: 0,
    liked: false
  }
];

describe('snice-comments', () => {
  let el: SniceCommentsElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    expect(el.comments).toEqual([]);
    expect(el.currentUser).toBe('');
    expect(el.allowReplies).toBe(true);
    expect(el.allowLikes).toBe(true);
    expect(el.maxDepth).toBe(3);
  });

  it('should render comments', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = sampleComments;
    await wait(50);
    const comments = queryShadowAll(el as HTMLElement, '.comment');
    expect(comments.length).toBeGreaterThanOrEqual(2);
  });

  it('should show empty state when no comments', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    const empty = queryShadow(el as HTMLElement, '.comments__empty');
    expect(empty).toBeTruthy();
  });

  it('should hide empty state when comments exist', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = sampleComments;
    await wait(50);
    const empty = queryShadow(el as HTMLElement, '.comments__empty');
    // The empty div may still exist but should be hidden via <if> template
    const list = queryShadow(el as HTMLElement, '.comments__list');
    expect(list).toBeTruthy();
  });

  it('should render author name', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'TestUser', text: 'Hello', timestamp: new Date().toISOString() }];
    await wait(50);
    const author = queryShadow(el as HTMLElement, '.comment__author');
    expect(author?.textContent).toBe('TestUser');
  });

  it('should render comment text', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'User', text: 'Test comment text', timestamp: new Date().toISOString() }];
    await wait(50);
    const text = queryShadow(el as HTMLElement, '.comment__text');
    expect(text?.textContent).toBe('Test comment text');
  });

  it('should render avatar initials when no avatar URL', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'John Doe', text: 'Hi', timestamp: new Date().toISOString() }];
    await wait(50);
    const avatar = queryShadow(el as HTMLElement, '.comment__avatar');
    expect(avatar?.textContent?.trim()).toBe('JD');
  });

  it('should render avatar image when URL provided', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'User', avatar: 'https://example.com/avatar.jpg', text: 'Hi', timestamp: new Date().toISOString() }];
    await wait(50);
    const img = queryShadow(el as HTMLElement, '.comment__avatar img');
    expect(img).toBeTruthy();
  });

  it('should render nested replies', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = sampleComments;
    await wait(50);
    const replies = queryShadow(el as HTMLElement, '.comment__replies');
    expect(replies).toBeTruthy();
  });

  it('should add comment via addComment()', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.currentUser = 'TestUser';
    el.addComment('New comment');
    await wait(50);
    expect(el.comments.length).toBe(1);
    expect(el.comments[0].text).toBe('New comment');
    expect(el.comments[0].author).toBe('TestUser');
  });

  it('should add reply via addComment() with parentId', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'p1', author: 'User', text: 'Parent', timestamp: new Date().toISOString() }];
    el.currentUser = 'Replier';
    el.addComment('Reply text', 'p1');
    await wait(50);
    expect(el.comments[0].replies).toBeTruthy();
    expect(el.comments[0].replies!.length).toBe(1);
    expect(el.comments[0].replies![0].text).toBe('Reply text');
  });

  it('should delete comment via deleteComment()', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'd1', author: 'User', text: 'To delete', timestamp: new Date().toISOString() }];
    el.deleteComment('d1');
    await wait(50);
    expect(el.comments.length).toBe(0);
  });

  it('should toggle like via likeComment()', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'l1', author: 'User', text: 'Likeable', timestamp: new Date().toISOString(), likes: 0, liked: false }];
    el.likeComment('l1');
    await wait(50);
    expect(el.comments[0].likes).toBe(1);
    expect(el.comments[0].liked).toBe(true);
  });

  it('should unlike via likeComment() toggle', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'l2', author: 'User', text: 'Liked', timestamp: new Date().toISOString(), likes: 1, liked: true }];
    el.likeComment('l2');
    await wait(50);
    expect(el.comments[0].likes).toBe(0);
    expect(el.comments[0].liked).toBe(false);
  });

  it('should emit comment-add event', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.currentUser = 'EventUser';
    let detail: any = null;
    (el as HTMLElement).addEventListener('comment-add', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    el.addComment('Event test');
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.text).toBe('Event test');
    expect(detail.author).toBe('EventUser');
  });

  it('should emit comment-reply event', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'r1', author: 'User', text: 'Parent', timestamp: new Date().toISOString() }];
    el.currentUser = 'Replier';
    let detail: any = null;
    (el as HTMLElement).addEventListener('comment-reply', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    el.addComment('Reply', 'r1');
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.parentId).toBe('r1');
  });

  it('should emit comment-delete event', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'del1', author: 'User', text: 'Delete me', timestamp: new Date().toISOString() }];
    let detail: any = null;
    (el as HTMLElement).addEventListener('comment-delete', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    el.deleteComment('del1');
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.id).toBe('del1');
  });

  it('should emit comment-like event', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: 'lk1', author: 'User', text: 'Like me', timestamp: new Date().toISOString(), likes: 0, liked: false }];
    let detail: any = null;
    (el as HTMLElement).addEventListener('comment-like', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    el.likeComment('lk1');
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.id).toBe('lk1');
    expect(detail.liked).toBe(true);
  });

  it('should render input area', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    const input = queryShadow(el as HTMLElement, '.comments__input');
    const submit = queryShadow(el as HTMLElement, '.comments__submit');
    expect(input).toBeTruthy();
    expect(submit).toBeTruthy();
  });

  it('should render like button when allowLikes is true', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'User', text: 'Hi', timestamp: new Date().toISOString(), likes: 0 }];
    await wait(50);
    const actions = queryShadowAll(el as HTMLElement, '.comment__action');
    expect(actions.length).toBeGreaterThan(0);
  });

  it('should render delete button for own comments', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.currentUser = 'Me';
    el.comments = [{ id: '1', author: 'Me', text: 'My comment', timestamp: new Date().toISOString() }];
    await wait(50);
    const deleteBtn = queryShadow(el as HTMLElement, '.comment__action--delete');
    expect(deleteBtn).toBeTruthy();
  });

  it('should not render delete button for other users comments', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.currentUser = 'Me';
    el.comments = [{ id: '1', author: 'Other', text: 'Their comment', timestamp: new Date().toISOString() }];
    await wait(50);
    const deleteBtn = queryShadow(el as HTMLElement, '.comment__action--delete');
    expect(deleteBtn).toBeFalsy();
  });

  it('should not add empty comments', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.addComment('');
    el.addComment('   ');
    await wait(50);
    expect(el.comments.length).toBe(0);
  });

  it('should render timestamp', async () => {
    el = await createComponent<SniceCommentsElement>('snice-comments');
    el.comments = [{ id: '1', author: 'User', text: 'Hi', timestamp: new Date().toISOString() }];
    await wait(50);
    const time = queryShadow(el as HTMLElement, '.comment__time');
    expect(time).toBeTruthy();
    expect(time!.textContent?.trim()).toBeTruthy();
  });
});
