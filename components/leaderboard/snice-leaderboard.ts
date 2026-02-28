import { element, property, dispatch, ready, observe, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-leaderboard.css?inline';
import './snice-leaderboard-entry';
import type { LeaderboardEntry, LeaderboardVariant, LeaderboardSize, SniceLeaderboardElement, SniceLeaderboardEntryElement } from './snice-leaderboard.types';

@element('snice-leaderboard')
export class SniceLeaderboard extends HTMLElement implements SniceLeaderboardElement {
  @property()
  variant: LeaderboardVariant = 'default';

  @property()
  size: LeaderboardSize = 'medium';

  @property({ attribute: 'title' })
  title = '';

  /** Internal entries list for rendering. Private — use setEntries() or child elements. */
  @property({ type: Array, attribute: false })
  private entries: LeaderboardEntry[] = [];

  /** Tracks whether slot children are driving the data */
  private usingSlotMode = false;

  @dispatch('entry-click', { bubbles: true, composed: true })
  private emitEntryClick(entry: LeaderboardEntry, index: number) {
    return { entry, index };
  }

  /**
   * Imperative API: set entries programmatically.
   * Slot children take precedence — if <snice-leaderboard-entry> children
   * are present, they override imperative data.
   */
  setEntries(entries: LeaderboardEntry[]): void {
    if (!this.usingSlotMode) {
      this.entries = [...entries];
    }
  }

  @ready()
  init() {
    this.syncFromChildren();
  }

  /** Watch light DOM for added/removed <snice-leaderboard-entry> children */
  @observe('mutation:childList')
  onChildListChange() {
    this.syncFromChildren();
  }

  /** Watch light DOM for attribute changes on <snice-leaderboard-entry> children */
  @observe('mutation:attributes', { subtree: true })
  onChildAttrChange() {
    this.syncFromChildren();
  }

  private syncFromChildren() {
    const children = Array.from(this.querySelectorAll('snice-leaderboard-entry')) as SniceLeaderboardEntryElement[];
    if (children.length > 0) {
      this.usingSlotMode = true;
      this.entries = children.map(child => ({
        rank: Number(child.getAttribute('rank')) || 0,
        name: child.getAttribute('name') || '',
        score: child.getAttribute('score') || '',
        avatar: child.getAttribute('avatar') || undefined,
        change: child.hasAttribute('change') ? Number(child.getAttribute('change')) : undefined,
        highlighted: child.hasAttribute('highlighted'),
      }));
    } else {
      this.usingSlotMode = false;
    }
  }

  private handleEntryClick(entry: LeaderboardEntry, index: number) {
    this.emitEntryClick(entry, index);
  }

  private getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  private renderChangeIndicator(change?: number) {
    if (change === undefined || change === null) return '';

    if (change > 0) {
      return html`<span class="leaderboard__change leaderboard__change--up">\u25B2 ${change}</span>`;
    } else if (change < 0) {
      return html`<span class="leaderboard__change leaderboard__change--down">\u25BC ${Math.abs(change)}</span>`;
    }
    return html`<span class="leaderboard__change leaderboard__change--none">\u2014</span>`;
  }

  private renderAvatar(entry: LeaderboardEntry) {
    if (entry.avatar) {
      return html`<img class="leaderboard__avatar" src="${entry.avatar}" alt="${entry.name}" loading="lazy" />`;
    }
    return html`<span class="leaderboard__avatar-placeholder">${this.getInitial(entry.name)}</span>`;
  }

  private renderPodiumAvatar(entry: LeaderboardEntry) {
    if (entry.avatar) {
      return html`<img class="leaderboard__podium-avatar" src="${entry.avatar}" alt="${entry.name}" loading="lazy" />`;
    }
    return html`<span class="leaderboard__podium-avatar-placeholder">${this.getInitial(entry.name)}</span>`;
  }

  private renderPodium(entries: LeaderboardEntry[]) {
    const podiumEntries = entries.slice(0, 3);

    return html`
      <div class="leaderboard__podium">
        ${podiumEntries.map(entry => html`
          <div class="leaderboard__podium-entry leaderboard__podium-entry--${entry.rank}"
               @click=${() => this.handleEntryClick(entry, entry.rank - 1)}>
            ${this.renderPodiumAvatar(entry)}
            <span class="leaderboard__podium-rank leaderboard__podium-rank--${entry.rank}">#${entry.rank}</span>
            <span class="leaderboard__podium-name">${entry.name}</span>
            <span class="leaderboard__podium-score">${entry.score}</span>
          </div>
        `)}
      </div>
    `;
  }

  private renderEntry(entry: LeaderboardEntry, index: number) {
    const highlightedClass = entry.highlighted ? ' leaderboard__entry--highlighted' : '';
    const rankClass = entry.rank <= 3 ? ` leaderboard__rank--${entry.rank}` : '';

    return html`
      <li class="leaderboard__entry${highlightedClass}"
          @click=${() => this.handleEntryClick(entry, index)}>
        <span class="leaderboard__rank${rankClass}">${entry.rank}</span>
        ${this.renderAvatar(entry)}
        <div class="leaderboard__info">
          <span class="leaderboard__name">${entry.name}</span>
        </div>
        <span class="leaderboard__score">${entry.score}</span>
        ${this.renderChangeIndicator(entry.change)}
      </li>
    `;
  }

  @render()
  template() {
    const isPodium = this.variant === 'podium';
    const podiumEntries = isPodium ? this.entries.slice(0, 3) : [];
    const listEntries = isPodium ? this.entries.slice(3) : this.entries;

    return html`
      <div class="leaderboard" part="base">
        <if ${this.title}>
          <h3 class="leaderboard__title" part="title">${this.title}</h3>
        </if>
        <if ${isPodium && podiumEntries.length > 0}>
          ${this.renderPodium(podiumEntries)}
        </if>
        <if ${listEntries.length > 0}>
          <ol class="leaderboard__list" part="list">
            ${listEntries.map((entry, i) => this.renderEntry(entry, isPodium ? i + 3 : i))}
          </ol>
        </if>
        <if ${this.entries.length === 0}>
          <div class="leaderboard__empty" part="empty">No entries</div>
        </if>
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
