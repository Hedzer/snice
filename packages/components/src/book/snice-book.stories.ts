import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-book';

type Args = {
  coverImage?: string;
  title?: string;
  author?: string;
  currentPage?: number;
};

const meta: Meta<Args> = {
  title: 'Book',
  component: 'snice-book',
  tags: ['autodocs'],
  argTypes: {
    coverImage:  { control: 'text' },
    title:       { control: 'text' },
    author:      { control: 'text' },
    currentPage: { control: 'number' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const book = document.createElement('snice-book');
    if (args.coverImage !== undefined) book.setAttribute('cover-image', args.coverImage);
    if (args.title !== undefined) book.setAttribute('title', args.title);
    if (args.author !== undefined) book.setAttribute('author', args.author);
    if (args.currentPage !== undefined) book.setAttribute('current-page', String(args.currentPage));
    const page = document.createElement('snice-book-page');
    const front = document.createElement('div');
    front.slot = 'front';
    front.style.cssText = 'padding:1.5rem;font-size:0.9rem;line-height:1.6;';
    front.innerHTML = '<h3 style="margin:0 0 0.75rem;">Page 1</h3><p>Front of page one.</p>';
    const back = document.createElement('div');
    back.slot = 'back';
    back.style.cssText = 'padding:1.5rem;font-size:0.9rem;line-height:1.6;';
    back.innerHTML = '<h3 style="margin:0 0 0.75rem;">Page 1 (back)</h3><p>Back of page one.</p>';
    page.appendChild(front);
    page.appendChild(back);
    book.appendChild(page);
    wrap.appendChild(book);
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: {},
};

function pageContent(title: string, body: string, slot: 'front' | 'back') {
  const div = document.createElement('div');
  div.slot = slot;
  div.style.cssText = 'padding:1.5rem;font-size:0.9rem;line-height:1.6;';
  div.innerHTML = `<h3 style="margin:0 0 0.75rem;">${title}</h3><p>${body}</p>`;
  return div;
}

function bookPage(frontTitle: string, frontBody: string, backTitle?: string, backBody?: string) {
  const page = document.createElement('snice-book-page');
  page.appendChild(pageContent(frontTitle, frontBody, 'front'));
  if (backTitle) page.appendChild(pageContent(backTitle, backBody ?? '', 'back'));
  return page;
}

function col(...els: HTMLElement[]) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
  els.forEach(el => wrap.appendChild(el));
  return wrap;
}

// h2: Default (no cover image)
export const DefaultNoCoverImage: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.appendChild(bookPage('Page 1', 'Front of page one.', 'Page 1 (back)', 'Back of page one.'));
    book.appendChild(bookPage('Page 2', 'Front of page two.', 'Page 2 (back)', 'Back of page two.'));
    book.appendChild(bookPage('Page 3', 'Front of page three.', 'Page 3 (back)', 'Back of page three.'));
    return col(book);
  },
};

// h2: With cover-image
export const WithCoverImage: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=1');
    book.setAttribute('title', 'My Book');
    book.setAttribute('author', 'Author Name');
    book.appendChild(bookPage('Chapter 1', 'The story begins here.', undefined, 'Continued on the next page...'));
    book.appendChild(bookPage('Chapter 2', 'The plot thickens.', undefined, 'To be continued.'));
    return col(book);
  },
};

// h2: With title and author
export const WithTitleAndAuthor: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('title', 'The Great Adventure');
    book.setAttribute('author', 'Jane Doe');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=2');
    book.appendChild(bookPage('Prologue', 'It was a dark and stormy night...'));
    return col(book);
  },
};

// h2: current-page property (start on page 1)
export const CurrentPagePropertyStartOnPage1: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('current-page', '1');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=3');
    book.appendChild(bookPage('Page 1', 'You start here because current-page=1.', 'Page 1 (back)', 'Back of page 1.'));
    book.appendChild(bookPage('Page 2', 'Page two content.', 'Page 2 (back)', 'Back of page 2.'));
    return col(book);
  },
};

// h2: Many pages (5)
export const ManyPages5: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=4');
    for (let i = 1; i <= 5; i++) {
      book.appendChild(bookPage(`Page ${i}`, `Content ${['one', 'two', 'three', 'four', 'five'][i - 1]}.`, undefined, `Back ${['one', 'two', 'three', 'four', 'five'][i - 1]}.`));
    }
    return col(book);
  },
};

// h2: Single page
export const SinglePage: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.appendChild(bookPage('Only Page', 'A book with just one page.'));
    return col(book);
  },
};

// h2: Rich content in pages
export const RichContentInPages: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=5');
    const page = document.createElement('snice-book-page');
    const front = document.createElement('div');
    front.slot = 'front';
    front.style.cssText = 'padding:1.5rem;font-size:0.9rem;line-height:1.6;';
    front.innerHTML = '<h3 style="margin:0 0 0.75rem;">Rich Content</h3><p><strong>Bold text</strong>, <em>italic text</em>, and <a href="#">a link</a>.</p><ul><li>List item one</li><li>List item two</li></ul>';
    const back = document.createElement('div');
    back.slot = 'back';
    back.style.cssText = 'padding:1.5rem;font-size:0.9rem;line-height:1.6;';
    back.innerHTML = '<img src="https://picsum.photos/250/150?random=6" alt="Sample" style="width:100%;border-radius:4px;"><p>An image on the back.</p>';
    page.appendChild(front);
    page.appendChild(back);
    book.appendChild(page);
    return col(book);
  },
};

// h2: Edge case: no pages
export const EdgeCaseNoPages: Story = {
  render: () => {
    const book = document.createElement('snice-book');
    book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=7');
    return col(book);
  },
};

// h2: CSS Parts Styling
// Parts: base, book
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; flex-direction: column; gap: 2rem; font-family: sans-serif; }
      .parts-demo .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.5rem; }
      .parts-demo .row { display: flex; gap: 3rem; flex-wrap: wrap; align-items: flex-start; }

      /* Default (unstyled) */
      .parts-demo .demo-default snice-book::part(base) {}
      .parts-demo .demo-default snice-book::part(book) {}

      /* Styled: base — outermost perspective container */
      .parts-demo .demo-styled snice-book::part(base) {
        filter: drop-shadow(0 16px 48px rgba(168, 85, 247, 0.5));
      }
      /* Styled: book — the 3D book element */
      .parts-demo .demo-styled snice-book::part(book) {
        outline: 3px solid #a855f7;
        outline-offset: 4px;
        border-radius: 4px;
      }
    `;

    function makeBook() {
      const book = document.createElement('snice-book');
      book.setAttribute('cover-image', 'https://picsum.photos/300/400?random=12');
      return book;
    }

    const defaultEl = makeBook();
    const styledEl = makeBook();

    const defaultWrap = document.createElement('div');
    defaultWrap.className = 'demo-default';
    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'label';
    defaultLabel.textContent = 'Default';
    defaultWrap.appendChild(defaultLabel);
    defaultWrap.appendChild(defaultEl);

    const styledWrap = document.createElement('div');
    styledWrap.className = 'demo-styled';
    const styledLabel = document.createElement('div');
    styledLabel.className = 'label';
    styledLabel.textContent = 'Styled (::part(base, book))';
    styledWrap.appendChild(styledLabel);
    styledWrap.appendChild(styledEl);

    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(defaultWrap);
    row.appendChild(styledWrap);

    const wrap = document.createElement('div');
    wrap.className = 'parts-demo';
    wrap.appendChild(style);
    wrap.appendChild(row);
    return wrap;
  },
};
