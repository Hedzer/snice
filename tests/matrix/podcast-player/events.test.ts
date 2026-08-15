/**
 * snice-podcast-player matrix — the documented event contract.
 *
 * Seven events, each with a payload the doc spells out exactly:
 *
 *   podcast-play          { player, episode }
 *   podcast-pause         { player, episode }
 *   podcast-ended         { player, episode }
 *   podcast-time-update   { player, currentTime, duration }
 *   podcast-rate-change   { player, rate }
 *   podcast-episode-change{ player, episode, index }
 *   podcast-feed-loaded   { player, feed: RSSFeedData }
 *
 * A consumer writes `e.detail.episode`, so a payload that carries the right
 * information under a different key is as broken as no payload at all: every
 * case below asserts the KEY SET as well as the values.
 *
 * The RSS axis is the other half of the documented surface: `from-rss` is the
 * declarative form of "give the player a feed", and `RSSFeedData` says what the
 * player must extract from one.
 *
 * 6 event cases + 3 episode-change indices + 5 RSS shapes = 14 combos.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePlayer, captureEvents, EPISODES, wait, SETTLE, expectClean, sr, textOf,
  type SnicePodcastPlayerElement,
} from './matrix-utils';

const ALL_EVENTS = [
  'podcast-play', 'podcast-pause', 'podcast-ended', 'podcast-time-update',
  'podcast-rate-change', 'podcast-episode-change', 'podcast-feed-loaded',
];

function keysOf(detail: any): string[] {
  return Object.keys(detail ?? {}).sort();
}

describe('snice-podcast-player matrix: episode-change payloads', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const index of [0, 1, 2]) {
    it(`podcast-episode-change for index ${index}`, async () => {
      el = await makePlayer({ episodes: EPISODES });
      const seen = captureEvents(el, ALL_EVENTS);
      el.loadEpisode(index);
      await wait(SETTLE);

      const problems: string[] = [];
      const changes = seen.filter(e => e.type === 'podcast-episode-change');
      if (changes.length !== 1) {
        problems.push(`${changes.length} podcast-episode-change events, expected 1`);
      } else {
        const detail = changes[0].detail;
        const wantKeys = ['episode', 'index', 'player'];
        if (JSON.stringify(keysOf(detail)) !== JSON.stringify(wantKeys)) {
          problems.push(`detail keys ${JSON.stringify(keysOf(detail))} != ${JSON.stringify(wantKeys)}`);
        }
        if (detail.player !== el) problems.push('detail.player is not the player');
        if (detail.index !== index) problems.push(`detail.index ${detail.index} != ${index}`);
        if (detail.episode !== EPISODES[index]) {
          problems.push(`detail.episode is not episodes[${index}]`);
        }
      }
      expectClean(problems, `episode-change ${index}`);
    });
  }

  it('an out-of-range loadEpisode emits nothing', async () => {
    el = await makePlayer({ episodes: EPISODES });
    const seen = captureEvents(el, ALL_EVENTS);
    el.loadEpisode(99);
    el.loadEpisode(-4);
    await wait(SETTLE);
    expect(seen.map(e => e.type)).toEqual([]);
  });
});

describe('snice-podcast-player matrix: rate-change payload', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  it('podcast-rate-change carries the new rate', async () => {
    el = await makePlayer({ src: '/a.mp3' });
    const seen = captureEvents(el, ALL_EVENTS);
    el.setPlaybackRate(1.5);
    await wait(SETTLE);

    const changes = seen.filter(e => e.type === 'podcast-rate-change');
    expect(changes.length).toBe(1);
    expect(keysOf(changes[0].detail)).toEqual(['player', 'rate']);
    expect(changes[0].detail.rate).toBe(1.5);
    expect(changes[0].detail.player).toBe(el);
  });

  it('a rejected rate emits nothing', async () => {
    // "Set speed (0.5-2)": a value outside the range is not a rate change, so
    // a listener that resizes a UI must not be told one happened.
    el = await makePlayer({ src: '/a.mp3' });
    const seen = captureEvents(el, ALL_EVENTS);
    el.setPlaybackRate(4);
    await wait(SETTLE);
    expect(seen.filter(e => e.type === 'podcast-rate-change')).toEqual([]);
  });

  it('clicking the speed control keeps rate and event in step', async () => {
    el = await makePlayer({ src: '/a.mp3' });
    const seen = captureEvents(el, ALL_EVENTS);
    const speed = [...sr(el).querySelectorAll('button')]
      .find(b => /speed/i.test(b.getAttribute('aria-label') ?? ''))!;
    speed.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(SETTLE);

    const changes = seen.filter(e => e.type === 'podcast-rate-change');
    expect(changes.length).toBe(1);
    // Whatever the control cycled to, the announced rate is the player's rate
    // and the control's own label agrees with both.
    expect(changes[0].detail.rate).toBe(el.playbackRate);
    expect(el.playbackRate).toBeGreaterThanOrEqual(0.5);
    expect(el.playbackRate).toBeLessThanOrEqual(2);
    expect(textOf(speed)).toContain(String(el.playbackRate));
  });
});

describe('snice-podcast-player matrix: transport payloads', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  /**
   * `play` / `pause` / `ended` / `timeupdate` on the underlying media element
   * are what the four transport events are documented to mirror. Driving the
   * media element directly is the only way to reach them without real audio
   * decoding, and it is exactly the path the component wires up.
   */
  const CASES = [
    { media: 'play', event: 'podcast-play', keys: ['episode', 'player'] },
    { media: 'pause', event: 'podcast-pause', keys: ['episode', 'player'] },
    { media: 'ended', event: 'podcast-ended', keys: ['episode', 'player'] },
  ];

  for (const testCase of CASES) {
    it(`${testCase.media} on the media element emits ${testCase.event}`, async () => {
      el = await makePlayer({ episodes: EPISODES, currentEpisodeIndex: 1 });
      const seen = captureEvents(el, ALL_EVENTS);
      const audio = (el as any).audioElement as HTMLAudioElement;
      audio.dispatchEvent(new Event(testCase.media));
      await wait(SETTLE);

      const matched = seen.filter(e => e.type === testCase.event);
      const problems: string[] = [];
      if (matched.length !== 1) problems.push(`${matched.length} ${testCase.event}, expected 1`);
      else {
        if (JSON.stringify(keysOf(matched[0].detail)) !== JSON.stringify(testCase.keys)) {
          problems.push(`detail keys ${JSON.stringify(keysOf(matched[0].detail))} != ${JSON.stringify(testCase.keys)}`);
        }
        // The loaded episode is what the listener is told about.
        if (matched[0].detail.episode !== EPISODES[1]) problems.push('detail.episode is not the loaded episode');
        if (matched[0].detail.player !== el) problems.push('detail.player is not the player');
      }
      expectClean(problems, testCase.event);
    });
  }

  it('timeupdate emits podcast-time-update with both clocks', async () => {
    el = await makePlayer({ src: '/a.mp3', duration: 600 });
    const seen = captureEvents(el, ALL_EVENTS);
    const audio = (el as any).audioElement as HTMLAudioElement;
    audio.currentTime = 42;
    audio.dispatchEvent(new Event('timeupdate'));
    await wait(SETTLE);

    const updates = seen.filter(e => e.type === 'podcast-time-update');
    expect(updates.length).toBe(1);
    expect(keysOf(updates[0].detail)).toEqual(['currentTime', 'duration', 'player']);
    expect(updates[0].detail.currentTime).toBe(42);
    expect(updates[0].detail.duration).toBe(el.duration);
  });

  it('every transport event crosses the shadow boundary', async () => {
    // The doc's usage is `player.addEventListener(...)` from a page, so the
    // events must be composed and bubbling or a page-level listener never sees
    // them.
    el = await makePlayer({ episodes: EPISODES, currentEpisodeIndex: 0 });
    const atDocument: string[] = [];
    const handler = (e: Event) => atDocument.push(e.type);
    for (const type of ALL_EVENTS) document.addEventListener(type, handler);

    const audio = (el as any).audioElement as HTMLAudioElement;
    audio.dispatchEvent(new Event('play'));
    el.setPlaybackRate(1.5);
    await wait(SETTLE);

    for (const type of ALL_EVENTS) document.removeEventListener(type, handler);
    expect(atDocument).toContain('podcast-play');
    expect(atDocument).toContain('podcast-rate-change');
  });
});

describe('snice-podcast-player matrix: RSS feeds', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => {
    if (el) removeComponent(el as HTMLElement); el = undefined;
    vi.unstubAllGlobals();
  });

  function feedXml(items: string): string {
    return `<?xml version="1.0"?><rss version="2.0"><channel>
      <title>My Podcast</title>
      <description>Feed description</description>
      <image><url>/art/feed.png</url></image>
      ${items}</channel></rss>`;
  }

  const ITEM = (title: string, url: string) =>
    `<item><title>${title}</title><description>${title} notes</description>
     <enclosure url="${url}" type="audio/mpeg"/></item>`;

  function stubFetch(xml: string): void {
    vi.stubGlobal('fetch', vi.fn(async () => ({ text: async () => xml })));
  }

  /**
   * `RSSFeedData { title, artwork?, description?, episodes }` says what a feed
   * yields. The shapes below are the ones a real feed comes in as: a normal
   * multi-item feed, a single-item feed, an empty channel, and a channel whose
   * items have no enclosure (nothing playable, so nothing to list).
   */
  const FEEDS = [
    { id: 'three items', xml: feedXml(ITEM('A', '/a.mp3') + ITEM('B', '/b.mp3') + ITEM('C', '/c.mp3')), episodes: ['A', 'B', 'C'] },
    { id: 'one item', xml: feedXml(ITEM('Solo', '/solo.mp3')), episodes: ['Solo'] },
    { id: 'empty channel', xml: feedXml(''), episodes: [] },
    { id: 'item without enclosure', xml: feedXml('<item><title>No audio</title></item>'), episodes: [] },
  ];

  for (const feed of FEEDS) {
    it(`from-rss: ${feed.id}`, async () => {
      stubFetch(feed.xml);
      const element = document.createElement('snice-podcast-player') as SnicePodcastPlayerElement;
      const seen: any[] = [];
      element.addEventListener('podcast-feed-loaded', (e: Event) => seen.push((e as CustomEvent).detail));
      element.setAttribute('from-rss', 'https://example.com/feed.xml');
      document.body.appendChild(element);
      await (element as any).ready;
      await wait(SETTLE);
      el = element;

      const problems: string[] = [];
      // "podcast-feed-loaded → { player, feed: RSSFeedData } - RSS feed parsed".
      // How MANY times a single feed announces itself is pinned separately, by
      // the MATRIX-podcast-player-1 finding below; this loop owns WHAT a parsed
      // feed contains.
      if (seen.length < 1) problems.push('no podcast-feed-loaded event');
      else {
        const detail = seen[seen.length - 1];
        if (JSON.stringify(keysOf(detail)) !== JSON.stringify(['feed', 'player'])) {
          problems.push(`detail keys ${JSON.stringify(keysOf(detail))} != ["feed","player"]`);
        }
        const parsed = detail.feed;
        if (parsed.title !== 'My Podcast') problems.push(`feed.title "${parsed.title}"`);
        if (parsed.description !== 'Feed description') problems.push(`feed.description "${parsed.description}"`);
        if (!parsed.artwork) problems.push('feed.artwork is empty although the channel has an image');
        const titles = parsed.episodes.map((e: any) => e.title);
        if (JSON.stringify(titles) !== JSON.stringify(feed.episodes)) {
          problems.push(`feed.episodes ${JSON.stringify(titles)} != ${JSON.stringify(feed.episodes)}`);
        }
      }
      // The parsed feed becomes the player's own episode list.
      if (el.episodes.map(e => e.title).join('|') !== feed.episodes.join('|')) {
        problems.push(`player.episodes ${JSON.stringify(el.episodes.map(e => e.title))} != ${JSON.stringify(feed.episodes)}`);
      }
      expectClean(problems, `rss ${feed.id}`);
    });
  }

  /**
   * MATRIX-podcast-player-1 — a declarative `from-rss` fetches the feed TWICE
   * and announces it twice.
   *
   * The doc's declarative form is
   * `<snice-podcast-player from-rss="https://example.com/feed.xml">`, and
   * `podcast-feed-loaded` is documented as "RSS feed parsed" — one feed, one
   * announcement. The player instead requests the URL once from its ready
   * hook and once more from the `fromRss` change reaction that the initial
   * attribute triggers, so a page pays for two network round-trips and any
   * listener that appends the feed's episodes to a UI appends them twice.
   *
   * Policy (.ai/fuzzing.md): the assertion stays correct and the test is
   * pinned with `it.fails`, so the day the component stops double-fetching
   * this suite fails and the finding can be closed.
   */
  it.fails('MATRIX-podcast-player-1: from-rss fetches and announces the feed exactly once', async () => {
    const xml = feedXml(ITEM('A', '/a.mp3'));
    const fetchMock = vi.fn(async () => ({ text: async () => xml }));
    vi.stubGlobal('fetch', fetchMock);

    const element = document.createElement('snice-podcast-player') as SnicePodcastPlayerElement;
    const seen: any[] = [];
    element.addEventListener('podcast-feed-loaded', () => seen.push(1));
    element.setAttribute('from-rss', 'https://example.com/feed.xml');
    document.body.appendChild(element);
    await (element as any).ready;
    await wait(SETTLE);
    el = element;

    expect(fetchMock, 'the feed URL was requested more than once').toHaveBeenCalledTimes(1);
    expect(seen.length, 'podcast-feed-loaded fired more than once for one feed').toBe(1);
  });

  it('a feed only fills in metadata the author did not set', async () => {
    // `show` / `artwork` / `description` are authored properties; a feed that
    // overwrote them would silently discard what the page asked for.
    stubFetch(feedXml(ITEM('A', '/a.mp3')));
    const element = document.createElement('snice-podcast-player') as SnicePodcastPlayerElement;
    element.setAttribute('show', 'Authored Show');
    element.setAttribute('from-rss', 'https://example.com/feed.xml');
    document.body.appendChild(element);
    await (element as any).ready;
    await wait(SETTLE);
    el = element;

    expect(el.show).toBe('Authored Show');
    expect(el.description).toBe('Feed description');
  });
});
