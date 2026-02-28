import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/leaderboard/snice-leaderboard';
import type { SniceLeaderboardElement, LeaderboardEntry } from '../../components/leaderboard/snice-leaderboard.types';

const sampleEntries: LeaderboardEntry[] = [
  { rank: 1, name: 'Alice Johnson', score: 2850, change: 2 },
  { rank: 2, name: 'Bob Smith', score: 2720, change: -1 },
  { rank: 3, name: 'Carol Williams', score: 2680, change: 1 },
  { rank: 4, name: 'David Brown', score: 2510, change: 0, highlighted: true },
  { rank: 5, name: 'Eve Davis', score: 2340, change: -2 }
];

describe('snice-leaderboard', () => {
  let el: SniceLeaderboardElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    expect(el.entries).toEqual([]);
    expect(el.variant).toBe('list');
    expect(el.metricLabel).toBe('Score');
  });

  it('should render list rows', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const rows = queryShadowAll(el as HTMLElement, '.lb__row');
    expect(rows.length).toBe(5);
  });

  it('should render entry names', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const names = queryShadowAll(el as HTMLElement, '.lb__name');
    expect(names.length).toBe(5);
    expect(names[0].textContent).toBe('Alice Johnson');
  });

  it('should render entry scores', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const scores = queryShadowAll(el as HTMLElement, '.lb__score');
    expect(scores.length).toBe(5);
    expect(scores[0].textContent).toBe('2850');
  });

  it('should render medals for top 3', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const goldMedal = queryShadow(el as HTMLElement, '.lb__medal--gold');
    const silverMedal = queryShadow(el as HTMLElement, '.lb__medal--silver');
    const bronzeMedal = queryShadow(el as HTMLElement, '.lb__medal--bronze');
    expect(goldMedal).toBeTruthy();
    expect(silverMedal).toBeTruthy();
    expect(bronzeMedal).toBeTruthy();
  });

  it('should render rank numbers for entries below top 3', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const rankNumbers = queryShadowAll(el as HTMLElement, '.lb__rank-number');
    expect(rankNumbers.length).toBe(2);
    expect(rankNumbers[0].textContent).toBe('#4');
  });

  it('should render change indicators', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const upChanges = queryShadowAll(el as HTMLElement, '.lb__change--up');
    const downChanges = queryShadowAll(el as HTMLElement, '.lb__change--down');
    expect(upChanges.length).toBeGreaterThan(0);
    expect(downChanges.length).toBeGreaterThan(0);
  });

  it('should highlight current user row', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const highlighted = queryShadow(el as HTMLElement, '.lb__row--highlighted');
    expect(highlighted).toBeTruthy();
  });

  it('should render avatar initials when no avatar URL', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const initials = queryShadow(el as HTMLElement, '.lb__avatar--initials');
    expect(initials).toBeTruthy();
    expect(initials!.textContent).toBe('AJ');
  });

  it('should render avatar image when provided', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = [{ rank: 1, name: 'Test', score: 100, avatar: 'https://example.com/avatar.jpg' }];
    await wait(50);
    const img = queryShadow(el as HTMLElement, 'img.lb__avatar');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('should emit entry-click event', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('entry-click', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const rows = queryShadowAll(el as HTMLElement, '.lb__row');
    (rows[0] as HTMLElement).click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.entry.name).toBe('Alice Johnson');
    expect(detail.index).toBe(0);
  });

  it('should render podium variant', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.variant = 'podium';
    el.entries = sampleEntries;
    await wait(50);
    const podium = queryShadow(el as HTMLElement, '.lb__podium');
    expect(podium).toBeTruthy();
  });

  it('should render podium items for top 3', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.variant = 'podium';
    el.entries = sampleEntries;
    await wait(50);
    const podiumItems = queryShadowAll(el as HTMLElement, '.lb__podium-item');
    expect(podiumItems.length).toBe(3);
  });

  it('should render remaining entries below podium', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.variant = 'podium';
    el.entries = sampleEntries;
    await wait(50);
    const belowPodium = queryShadow(el as HTMLElement, '.lb__list--below-podium');
    expect(belowPodium).toBeTruthy();
    const rows = queryShadowAll(el as HTMLElement, '.lb__list--below-podium .lb__row');
    expect(rows.length).toBe(2);
  });

  it('should use custom metric label', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.metricLabel = 'Points';
    el.entries = sampleEntries;
    await wait(50);
    const header = queryShadow(el as HTMLElement, '.lb__header-score');
    expect(header?.textContent).toBe('Points');
  });

  it('should render header in list variant', async () => {
    el = await createComponent<SniceLeaderboardElement>('snice-leaderboard');
    el.entries = sampleEntries;
    await wait(50);
    const header = queryShadow(el as HTMLElement, '.lb__header');
    expect(header).toBeTruthy();
  });
});
