import { element, property, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-leaderboard.css?inline';
import type { SniceLeaderboardElement, LeaderboardVariant, LeaderboardEntry, EntryClickDetail } from './snice-leaderboard.types';

@element('snice-leaderboard')
export class SniceLeaderboard extends HTMLElement implements SniceLeaderboardElement {
  @property({ type: Array })
  entries: LeaderboardEntry[] = [];

  @property()
  variant: LeaderboardVariant = 'list';

  @property()
  metricLabel = 'Score';

  @watch('entries')
  handleEntriesChange() {
    // Re-render on entries change
  }

  private handleEntryClick(entry: LeaderboardEntry, index: number) {
    this.emitEntryClick({ entry, index });
  }

  @dispatch('entry-click', { bubbles: true, composed: true })
  private emitEntryClick(detail?: EntryClickDetail): EntryClickDetail {
    return detail!;
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private getMedalClass(rank: number): string {
    if (rank === 1) return 'lb__medal--gold';
    if (rank === 2) return 'lb__medal--silver';
    if (rank === 3) return 'lb__medal--bronze';
    return '';
  }

  private renderChangeIndicator(change: number): unknown {
    if (change > 0) {
      return html/*html*/`
        <span class="lb__change lb__change--up">
          <svg class="lb__change-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
          +${change}
        </span>
      `;
    }
    if (change < 0) {
      return html/*html*/`
        <span class="lb__change lb__change--down">
          <svg class="lb__change-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          ${change}
        </span>
      `;
    }
    return html/*html*/`<span class="lb__change lb__change--none">&mdash;</span>`;
  }

  private renderAvatar(entry: LeaderboardEntry): unknown {
    if (entry.avatar) {
      return html/*html*/`
        <img class="lb__avatar" src="${entry.avatar}" alt="${entry.name}" loading="lazy" />
      `;
    }
    return html/*html*/`
      <div class="lb__avatar lb__avatar--initials">${this.getInitials(entry.name)}</div>
    `;
  }

  private renderListEntry(entry: LeaderboardEntry, index: number): unknown {
    const isTopThree = entry.rank <= 3;
    const medalClass = this.getMedalClass(entry.rank);
    const rowClasses = `lb__row${entry.highlighted ? ' lb__row--highlighted' : ''}${isTopThree ? ' lb__row--top' : ''}`;

    return html/*html*/`
      <div class="${rowClasses}"
           part="entry"
           tabindex="0"
           role="button"
           @click=${() => this.handleEntryClick(entry, index)}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleEntryClick(entry, index); } }}>
        <div class="lb__rank">
          <if ${isTopThree}>
            <span class="lb__medal ${medalClass}">${entry.rank}</span>
          </if>
          <if ${!isTopThree}>
            <span class="lb__rank-number">#${entry.rank}</span>
          </if>
        </div>
        ${this.renderAvatar(entry)}
        <div class="lb__name">${entry.name}</div>
        <div class="lb__score">${entry.score}</div>
        <if ${entry.change !== undefined}>
          ${this.renderChangeIndicator(entry.change!)}
        </if>
      </div>
    `;
  }

  private renderPodiumEntry(entry: LeaderboardEntry, index: number): unknown {
    const medalClass = this.getMedalClass(entry.rank);

    return html/*html*/`
      <div class="lb__podium-item lb__podium-item--${entry.rank}"
           part="entry"
           tabindex="0"
           role="button"
           @click=${() => this.handleEntryClick(entry, index)}
           @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.handleEntryClick(entry, index); } }}>
        <div class="lb__podium-avatar">
          ${this.renderAvatar(entry)}
          <span class="lb__medal ${medalClass}">${entry.rank}</span>
        </div>
        <div class="lb__podium-name">${entry.name}</div>
        <div class="lb__podium-score">${entry.score}</div>
        <if ${entry.change !== undefined}>
          ${this.renderChangeIndicator(entry.change!)}
        </if>
      </div>
    `;
  }

  private renderListView(): unknown {
    return html/*html*/`
      <div class="lb__list" part="list">
        <div class="lb__header">
          <div class="lb__header-rank">Rank</div>
          <div class="lb__header-name">Name</div>
          <div class="lb__header-score">${this.metricLabel}</div>
          <div class="lb__header-change">Change</div>
        </div>
        ${this.entries.map((entry, i) => this.renderListEntry(entry, i))}
      </div>
    `;
  }

  private renderPodiumView(): unknown {
    const top3 = this.entries.filter(e => e.rank <= 3);
    const rest = this.entries.filter(e => e.rank > 3);

    // Reorder for podium: 2nd, 1st, 3rd
    const podiumOrder = [
      top3.find(e => e.rank === 2),
      top3.find(e => e.rank === 1),
      top3.find(e => e.rank === 3)
    ].filter(Boolean) as LeaderboardEntry[];

    return html/*html*/`
      <div class="lb__podium-wrapper">
        <div class="lb__podium" part="podium">
          ${podiumOrder.map((entry, i) => this.renderPodiumEntry(entry, this.entries.indexOf(entry)))}
        </div>
        <if ${rest.length > 0}>
          <div class="lb__list lb__list--below-podium" part="list">
            ${rest.map((entry, i) => this.renderListEntry(entry, this.entries.indexOf(entry)))}
          </div>
        </if>
      </div>
    `;
  }

  @render()
  renderContent() {
    const isPodium = this.variant === 'podium';

    return html/*html*/`
      <div class="lb" part="base">
        <if ${isPodium}>
          ${this.renderPodiumView()}
        </if>
        <if ${!isPodium}>
          ${this.renderListView()}
        </if>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}
